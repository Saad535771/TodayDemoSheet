import { DataTypes } from "sequelize";

export function defineChatGroupMember(sequelize) {
  return sequelize.define(
    "ChatGroupMember",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      groupId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "group_id" },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "user_id" },
      canSend: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1, field: "can_send" },
      isActive: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1, field: "is_active" },
      joinedAt: { type: DataTypes.DATE, allowNull: false, field: "joined_at" },
      lastReadMessageId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: "last_read_message_id" },
    },
    {
      tableName: "chat_group_members",
      underscored: true,
      timestamps: false,
    }
  );
}