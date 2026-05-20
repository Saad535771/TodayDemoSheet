import jwt from "jsonwebtoken";

export function registerChatSocket(io, deps) {
  const { User, ChatGroupMember, ChatMessage, ChatMessageSeen } = deps;

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Missing socket token"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const me = await User.findByPk(payload.id);

      if (!me) {
        return next(new Error("User not found"));
      }

      if (payload.role !== "admin" && Number(me.accessChat || 0) !== 1) {
        return next(new Error("Chat access denied"));
      }

      socket.user = {
        id: me.id,
        role: me.role,
        name: me.name || "",
        email: me.email || "",
        accessChat: Number(me.accessChat || 0),
        accessChatSend: Number(me.accessChatSend || 0),
      };

      next();
    } catch (error) {
      next(new Error("Socket auth failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user-${socket.user.id}`);
    console.log(`[SOCKET] User ${socket.user.email} joined private room user-${socket.user.id}`);

    socket.on("chat:join_group", async ({ groupId }) => {
      try {
        const groupIdNum = Number(groupId);
        if (!groupIdNum) return;

        const isAdmin = socket.user.role === "admin";
        const member = await ChatGroupMember.findOne({
          where: {
            groupId: groupIdNum,
            userId: socket.user.id,
            isActive: 1,
          },
        });

        if (!isAdmin && !member) {
          socket.emit("chat:error", { message: "Group access denied" });
          return;
        }

        // Auto join admin if not member
        if (isAdmin && !member) {
          await ChatGroupMember.create({
            groupId: groupIdNum,
            userId: socket.user.id,
            canSend: 1,
            isActive: 1,
            joinedAt: new Date(),
          }).catch(() => {});
        }

        socket.join(`chat-group-${groupIdNum}`);
        socket.emit("chat:joined_group", { groupId: groupIdNum });
      } catch (error) {
        socket.emit("chat:error", { message: "Failed to join group" });
      }
    });

    socket.on("chat:send_message", async ({ groupId, messageText, messageType }) => {
      try {
        const groupIdNum = Number(groupId);
        const text = String(messageText || "").trim();
        const type = messageType || "text";

        if (!groupIdNum || !text) return;

        const isAdmin = socket.user.role === "admin";

        let member = await ChatGroupMember.findOne({
          where: {
            groupId: groupIdNum,
            userId: socket.user.id,
            isActive: 1,
          },
        });

        if (!isAdmin && !member) {
          socket.emit("chat:error", { message: "Group access denied" });
          return;
        }

        // If admin but no membership, create one
        if (isAdmin && !member) {
          member = await ChatGroupMember.create({
            groupId: groupIdNum,
            userId: socket.user.id,
            canSend: 1,
            isActive: 1,
            joinedAt: new Date(),
          }).catch(e => console.error("AUTO JOIN ADMIN ERROR:", e));
        }

        const canSend =
          isAdmin ||
          (socket.user.accessChat === 1 &&
            socket.user.accessChatSend === 1 &&
            Number(member?.canSend || 0) === 1);

        if (!canSend) {
          socket.emit("chat:error", { message: "You can only view messages in this group" });
          return;
        }

        const row = await ChatMessage.create({
          groupId: groupIdNum,
          senderId: socket.user.id,
          messageType: type,
          messageText: text,
          isDeleted: 0,
        });

        await ChatMessageSeen.findOrCreate({
          where: { messageId: row.id, userId: socket.user.id },
          defaults: {
            messageId: row.id,
            userId: socket.user.id,
            seenAt: new Date(),
          },
        });

        io.to(`chat-group-${groupIdNum}`).emit("chat:new_message", {
          id: row.id,
          group_id: row.groupId,
          sender_id: row.senderId,
          message_type: row.messageType,
          message_text: row.messageText,
          is_deleted: false,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
          sender: {
            id: socket.user.id,
            name: socket.user.name,
            email: socket.user.email,
            role: socket.user.role,
          },
          seen_by: [{ user_id: socket.user.id, seen_at: new Date().toISOString() }],
        });
      } catch (error) {
        console.error("SOCKET SEND MESSAGE ERROR:", error);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    socket.on("chat:mark_seen", async ({ groupId, messageId }) => {
      try {
        const groupIdNum = Number(groupId);
        const messageIdNum = Number(messageId);
        if (!groupIdNum || !messageIdNum) return;

        await ChatMessageSeen.findOrCreate({
          where: { messageId: messageIdNum, userId: socket.user.id },
          defaults: { messageId: messageIdNum, userId: socket.user.id, seenAt: new Date() },
        });

        await ChatGroupMember.update(
          { lastReadMessageId: messageIdNum },
          { where: { groupId: groupIdNum, userId: socket.user.id } }
        );

        io.to(`chat-group-${groupIdNum}`).emit("chat:seen_update", {
          group_id: groupIdNum,
          message_id: messageIdNum,
          user_id: socket.user.id,
          seen_at: new Date(),
        });
      } catch (e) {
        console.error("MARK SEEN ERROR:", e);
      }
    });

    // WebRTC Signaling for Calls
    socket.on("chat:call_user", async ({ groupId, type }) => {
      try {
        const gid = Number(groupId);
        console.log(`[CALL] ${socket.user.email} is starting ${type} call in group ${gid}`);
        const members = await ChatGroupMember.findAll({
          where: { groupId: gid, isActive: 1 }
        });

        console.log(`[CALL] Found ${members.length} members in group ${groupId}`);

        members.forEach(m => {
          if (Number(m.userId) !== Number(socket.user.id)) {
            console.log(`[CALL] Sending incoming_call to user-${m.userId}`);
            // Temporarily also emit to everyone to debug
            io.emit("chat:incoming_call", {
              from: {
                id: socket.user.id,
                name: socket.user.name || socket.user.email,
              },
              groupId,
              type
            });
          }
        });
      } catch (err) {
        console.error("CALL USER ERROR:", err);
      }
    });

    socket.on("chat:accept_call", async ({ groupId }) => {
      const gid = Number(groupId);
      console.log(`[CALL] Call accepted by ${socket.user.email} in group ${gid}`);
      const members = await ChatGroupMember.findAll({ where: { groupId: gid, isActive: 1 } });
      members.forEach(m => {
        if (Number(m.userId) !== Number(socket.user.id)) {
          io.to(`user-${m.userId}`).emit("chat:call_accepted", { by: socket.user.id });
        }
      });
    });

    socket.on("chat:reject_call", async ({ groupId }) => {
      const gid = Number(groupId);
      console.log(`[CALL] Call rejected by ${socket.user.email} in group ${gid}`);
      const members = await ChatGroupMember.findAll({ where: { groupId: gid, isActive: 1 } });
      members.forEach(m => {
        if (Number(m.userId) !== Number(socket.user.id)) {
          io.to(`user-${m.userId}`).emit("chat:call_rejected", { by: socket.user.id });
        }
      });
    });

    socket.on("chat:webrtc_signal", async ({ groupId, signal }) => {
      const gid = Number(groupId);
      const members = await ChatGroupMember.findAll({ where: { groupId: gid, isActive: 1 } });
      members.forEach(m => {
        if (Number(m.userId) !== Number(socket.user.id)) {
          io.to(`user-${m.userId}`).emit("chat:webrtc_signal", { from: socket.user.id, signal });
        }
      });
    });

    socket.on("chat:end_call", async ({ groupId }) => {
      const gid = Number(groupId);
      console.log(`[CALL] Call ended by ${socket.user.email} in group ${gid}`);
      const members = await ChatGroupMember.findAll({ where: { groupId: gid, isActive: 1 } });
      members.forEach(m => {
        if (Number(m.userId) !== Number(socket.user.id)) {
          io.to(`user-${m.userId}`).emit("chat:call_ended");
        }
      });
     });
  });
}
