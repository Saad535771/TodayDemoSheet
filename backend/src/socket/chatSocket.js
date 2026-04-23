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

        socket.join(`chat-group-${groupIdNum}`);
        socket.emit("chat:joined_group", { groupId: groupIdNum });
      } catch (error) {
        socket.emit("chat:error", { message: "Failed to join group" });
      }
    });

    socket.on("chat:send_message", async ({ groupId, messageText }) => {
      try {
        const groupIdNum = Number(groupId);
        const text = String(messageText || "").trim();

        if (!groupIdNum || !text) return;

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
          messageType: "text",
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

        const isAdmin = socket.user.role === "admin";
        const member = await ChatGroupMember.findOne({
          where: {
            groupId: groupIdNum,
            userId: socket.user.id,
            isActive: 1,
          },
        });

        if (!isAdmin && !member) return;

        await ChatMessageSeen.findOrCreate({
          where: { messageId: messageIdNum, userId: socket.user.id },
          defaults: {
            messageId: messageIdNum,
            userId: socket.user.id,
            seenAt: new Date(),
          },
        });

        io.to(`chat-group-${groupIdNum}`).emit("chat:seen_update", {
          group_id: groupIdNum,
          message_id: messageIdNum,
          user_id: socket.user.id,
          seen_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("SOCKET MARK SEEN ERROR:", error);
      }
    });
  });
}
