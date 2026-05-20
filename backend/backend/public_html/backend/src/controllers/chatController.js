import { Op } from "sequelize";

export function makeChatController({
  sequelize,
  User,
  UserPresence,
  ChatGroup,
  ChatGroupMember,
  ChatMessage,
  ChatMessageSeen,
}) {
  const q = sequelize;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  async function requireChatAccess(req, res, next) {
    if (req.user?.role === "admin") return next();

    const me = await User.findByPk(req.user.id);
    if (!me || Number(me.accessChat || 0) !== 1) {
      return res.status(403).json({ message: "Chat access denied" });
    }

    req.meDb = me;
    return next();
  }

  async function getMembership(userId, groupId) {
    return ChatGroupMember.findOne({
      where: {
        userId,
        groupId,
        isActive: 1,
      },
    });
  }

  function formatMessage(row) {
    return {
      id: row.id,
      group_id: row.groupId,
      sender_id: row.senderId,
      message_type: row.messageType,
      message_text: row.messageText,
      is_deleted: !!row.isDeleted,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      sender: row.sender
        ? {
            id: row.sender.id,
            name: row.sender.name || "",
            email: row.sender.email || "",
            role: row.sender.role || "",
          }
        : null,
      seen_by: Array.isArray(row.seenBy)
        ? row.seenBy.map((item) => ({
            user_id: item.userId,
            seen_at: item.seenAt,
          }))
        : [],
    };
  }

  return {
    requireChatAccess,

    async listGroups(req, res) {
      try {
        const where = { isActive: 1 };

        const groups = await ChatGroup.findAll({
          where,
          include: [
            {
              model: ChatGroupMember,
              as: "members",
              required: req.user.role !== "admin",
              where: req.user.role === "admin" ? undefined : { userId: req.user.id, isActive: 1 },
              include: [
                {
                  model: User,
                  as: "memberUser",
                  attributes: ["id", "name", "email", "role"],
                },
              ],
            },
          ],
          order: [["updatedAt", "DESC"]],
        });

        const enriched = await Promise.all(
          groups.map(async (group) => {
            const totalMembers = await ChatGroupMember.count({
              where: { groupId: group.id, isActive: 1 },
            });

            const unreadCount = await ChatMessage.count({
              where: {
                groupId: group.id,
                senderId: { [Op.ne]: req.user.id },
                id: {
                  [Op.gt]: q.literal(
                    `(SELECT COALESCE(last_read_message_id, 0) FROM chat_group_members WHERE group_id = ${group.id} AND user_id = ${req.user.id} LIMIT 1)`
                  ),
                },
              },
            });

            const myMember = group.members?.find((m) => Number(m.userId) === Number(req.user.id)) || null;

            return {
              id: group.id,
              name: group.name,
              description: group.description,
              is_active: !!group.isActive,
              total_members: totalMembers,
              unread_count: unreadCount,
              can_send:
                req.user.role === "admin"
                  ? true
                  : !!(myMember && Number(myMember.canSend) === 1),
            };
          })
        );

        return res.json({ groups: enriched });
      } catch (error) {
        console.error("LIST CHAT GROUPS ERROR:", error);
        return res.status(500).json({ message: "Failed to load chat groups" });
      }
    },

    async createGroup(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can create groups" });
      }

      try {
        const name = normalizeText(req.body.name);
        const description = normalizeText(req.body.description);
        const memberIds = Array.isArray(req.body.member_ids) ? req.body.member_ids : [];

        if (!name) {
          return res.status(400).json({ message: "Group name is required" });
        }

        const group = await ChatGroup.create({
          name,
          description: description || null,
          createdBy: req.user.id,
          isActive: 1,
        });

        const uniqueIds = [...new Set(memberIds.map(Number).filter(Boolean))];

        if (!uniqueIds.includes(req.user.id)) {
          uniqueIds.push(req.user.id);
        }

        if (uniqueIds.length) {
          await ChatGroupMember.bulkCreate(
            uniqueIds.map((userId) => ({
              groupId: group.id,
              userId,
              canSend: 1,
              isActive: 1,
              joinedAt: new Date(),
            }))
          );
        }

        return res.json({ success: true, group });
      } catch (error) {
        console.error("CREATE CHAT GROUP ERROR:", error);
        return res.status(500).json({ message: "Failed to create group" });
      }
    },

    async groupMembers(req, res) {
      try {
        const groupId = Number(req.params.groupId);
        const membership = await getMembership(req.user.id, groupId);

        if (req.user.role !== "admin" && !membership) {
          return res.status(403).json({ message: "Group access denied" });
        }

        const members = await ChatGroupMember.findAll({
          where: { groupId, isActive: 1 },
          include: [
            {
              model: User,
              as: "memberUser",
              attributes: ["id", "name", "email", "role", "accessChat", "accessChatSend"],
            },
          ],
          order: [["joinedAt", "ASC"]],
        });

        return res.json({
          members: members.map((row) => ({
            id: row.id,
            group_id: row.groupId,
            user_id: row.userId,
            can_send: !!row.canSend,
            is_active: !!row.isActive,
            joined_at: row.joinedAt,
            user: row.memberUser
              ? {
                  id: row.memberUser.id,
                  name: row.memberUser.name || "",
                  email: row.memberUser.email || "",
                  role: row.memberUser.role || "",
                  access_chat: !!row.memberUser.accessChat,
                  access_chat_send: !!row.memberUser.accessChatSend,
                }
              : null,
          })),
        });
      } catch (error) {
        console.error("GROUP MEMBERS ERROR:", error);
        return res.status(500).json({ message: "Failed to load members" });
      }
    },

    async upsertGroupMember(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can update members" });
      }

      try {
        const groupId = Number(req.params.groupId);
        const userId = Number(req.body.user_id);
        const canSend = req.body.can_send ? 1 : 0;
        const isActive = req.body.is_active === false || req.body.is_active === 0 ? 0 : 1;

        if (!userId) {
          return res.status(400).json({ message: "user_id is required" });
        }

        const [member] = await ChatGroupMember.findOrCreate({
          where: { groupId, userId },
          defaults: {
            groupId,
            userId,
            canSend,
            isActive,
            joinedAt: new Date(),
          },
        });

        await member.update({
          canSend,
          isActive,
        });

        return res.json({ success: true, member });
      } catch (error) {
        console.error("UPSERT GROUP MEMBER ERROR:", error);
        return res.status(500).json({ message: "Failed to update group member" });
      }
    },

    async listMessages(req, res) {
      try {
        const groupId = Number(req.params.groupId);
        const membership = await getMembership(req.user.id, groupId);

        if (req.user.role !== "admin" && !membership) {
          return res.status(403).json({ message: "Group access denied" });
        }

        const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);

        const rows = await ChatMessage.findAll({
          where: {
            groupId,
            isDeleted: 0,
          },
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "name", "email", "role"],
            },
            {
              model: ChatMessageSeen,
              as: "seenBy",
              required: false,
            },
          ],
          order: [["createdAt", "ASC"]],
          limit,
        });

        return res.json({ messages: rows.map(formatMessage) });
      } catch (error) {
        console.error("LIST MESSAGES ERROR:", error);
        return res.status(500).json({ message: "Failed to load messages" });
      }
    },

    async sendMessage(req, res) {
      const tx = await sequelize.transaction();

      try {
        const groupId = Number(req.params.groupId);
        const text = normalizeText(req.body.message_text);

        if (!text) {
          await tx.rollback();
          return res.status(400).json({ message: "Message text is required" });
        }

        const me = req.meDb || (await User.findByPk(req.user.id, { transaction: tx }));
        let membership = await getMembership(req.user.id, groupId);

        if (req.user.role !== "admin" && !membership) {
          await tx.rollback();
          return res.status(403).json({ message: "Group access denied" });
        }

        // If admin but no membership, create one on the fly
        if (req.user.role === "admin" && !membership) {
          membership = await ChatGroupMember.create({
            groupId,
            userId: req.user.id,
            canSend: 1,
            isActive: 1,
            joinedAt: new Date(),
          }, { transaction: tx });
        }

        const canSendByFlag =
          req.user.role === "admin"
            ? true
            : Number(me?.accessChat || 0) === 1 && Number(me?.accessChatSend || 0) === 1;

        const canSendByMember = req.user.role === "admin" ? true : Number(membership?.canSend || 0) === 1;

        if (!canSendByFlag || !canSendByMember) {
          await tx.rollback();
          return res.status(403).json({ message: "You can view only. Sending is disabled." });
        }

        const row = await ChatMessage.create(
          {
            groupId,
            senderId: req.user.id,
            messageType: "text",
            messageText: text,
            isDeleted: 0,
          },
          { transaction: tx }
        );

        await ChatMessageSeen.findOrCreate({
          where: { messageId: row.id, userId: req.user.id },
          defaults: {
            messageId: row.id,
            userId: req.user.id,
            seenAt: new Date(),
          },
          transaction: tx,
        });

        if (membership) {
          await ChatGroupMember.update(
            { lastReadMessageId: row.id },
            {
              where: { groupId, userId: req.user.id },
              transaction: tx,
            }
          ).catch(e => console.error("UPDATE LAST READ ERROR:", e));
        }

        await tx.commit();

        const fullRow = await ChatMessage.findByPk(row.id, {
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "name", "email", "role"],
            },
            {
              model: ChatMessageSeen,
              as: "seenBy",
              required: false,
            },
          ],
        });

        return res.json({ success: true, message: formatMessage(fullRow) });
      } catch (error) {
        if (tx) await tx.rollback().catch(() => {});
        console.error("SEND MESSAGE ERROR DETAILS:", {
          error: error.message,
          stack: error.stack,
          groupId: req.params.groupId,
          userId: req.user.id
        });
        return res.status(500).json({ 
          message: "Failed to send message", 
          error: error.message 
        });
      }
    },

    async markSeen(req, res) {
      try {
        const groupId = Number(req.params.groupId);
        const messageId = Number(req.body.message_id);
        const membership = await getMembership(req.user.id, groupId);

        if (req.user.role !== "admin" && !membership) {
          return res.status(403).json({ message: "Group access denied" });
        }

        if (!messageId) {
          return res.status(400).json({ message: "message_id is required" });
        }

        await ChatMessageSeen.findOrCreate({
          where: { messageId, userId: req.user.id },
          defaults: {
            messageId,
            userId: req.user.id,
            seenAt: new Date(),
          },
        });

        await ChatGroupMember.update(
          { lastReadMessageId: messageId },
          {
            where: { groupId, userId: req.user.id },
          }
        );

        return res.json({ success: true });
      } catch (error) {
        console.error("MARK CHAT SEEN ERROR:", error);
        return res.status(500).json({ message: "Failed to mark seen" });
      }
    },

    async uploadFile(req, res) {
      const tx = await sequelize.transaction();
      try {
        const groupId = Number(req.params.groupId);
        const type = req.body.type || "file"; // voice, image, etc.
        
        if (!req.file) {
          await tx.rollback();
          return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;

        const row = await ChatMessage.create({
          groupId,
          senderId: req.user.id,
          messageType: type,
          messageText: fileUrl,
          isDeleted: 0,
        }, { transaction: tx });

        await ChatMessageSeen.create({
          messageId: row.id,
          userId: req.user.id,
          seenAt: new Date(),
        }, { transaction: tx });

        await tx.commit();

        const fullRow = await ChatMessage.findByPk(row.id, {
          include: [{ model: User, as: "sender", attributes: ["id", "name", "email", "role"] }]
        });

        return res.json({ success: true, message: formatMessage(fullRow) });
      } catch (error) {
        if (tx) await tx.rollback().catch(() => {});
        console.error("UPLOAD FILE ERROR:", error);
        return res.status(500).json({ message: "Failed to upload file" });
      }
    },

    async findOrCreateDM(req, res) {
      try {
        const targetUserId = Number(req.params.userId);
        const myId = req.user.id;

        if (targetUserId === myId) {
          return res.status(400).json({ message: "Cannot chat with yourself" });
        }

        // Find a group that has exactly these two members
        const groups = await ChatGroup.findAll({
          where: { isActive: 1 },
          include: [
            {
              model: ChatGroupMember,
              as: "members",
              where: { userId: [myId, targetUserId], isActive: 1 },
            },
          ],
        });

        let dmGroup = null;

        for (const group of groups) {
          const members = await ChatGroupMember.findAll({
            where: { groupId: group.id, isActive: 1 },
          });
          if (members.length === 2) {
            const memberIds = members.map((m) => m.userId);
            if (memberIds.includes(myId) && memberIds.includes(targetUserId)) {
              dmGroup = group;
              break;
            }
          }
        }

        if (!dmGroup) {
          // Create new DM group
          const targetUser = await User.findByPk(targetUserId);
          if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
          }

          dmGroup = await ChatGroup.create({
            name: `DM: ${req.user.name || req.user.email} & ${targetUser.name || targetUser.email}`,
            description: "Private 1-to-1 chat",
            createdBy: myId,
            isActive: 1,
          });

          await ChatGroupMember.bulkCreate([
            { groupId: dmGroup.id, userId: myId, canSend: 1, isActive: 1, joinedAt: new Date() },
            {
              groupId: dmGroup.id,
              userId: targetUserId,
              canSend: 1,
              isActive: 1,
              joinedAt: new Date(),
            },
          ]);
        }

        return res.json({ success: true, groupId: dmGroup.id });
      } catch (error) {
        console.error("FIND OR CREATE DM ERROR:", error);
        return res.status(500).json({ message: "Failed to start private chat" });
      }
    },

    async getTotalUnread(req, res) {
      try {
        const myId = req.user.id;
        
        // Count unread messages across all groups the user is a member of
        const groups = await ChatGroupMember.findAll({
          where: { userId: myId, isActive: 1 },
          attributes: ['groupId', 'lastReadMessageId']
        });

        let total = 0;
        for (const m of groups) {
          const count = await ChatMessage.count({
            where: {
              groupId: m.groupId,
              senderId: { [Op.ne]: myId },
              id: { [Op.gt]: m.lastReadMessageId || 0 }
            }
          });
          total += count;
        }

        return res.json({ total_unread: total });
      } catch (error) {
        console.error("GET TOTAL UNREAD ERROR:", error);
        return res.status(500).json({ message: "Error counting unread messages" });
      }
    }
  };
}
