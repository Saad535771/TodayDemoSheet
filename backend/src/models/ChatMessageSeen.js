import { DataTypes } from "sequelize";

export function defineChatMessageSeen(sequelize) {
  return sequelize.define(
    "ChatMessageSeen",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      messageId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "message_id" },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "user_id" },
      seenAt: { type: DataTypes.DATE, allowNull: false, field: "seen_at" },
    },
    {
      tableName: "chat_message_seen",
      underscored: true,
      timestamps: false,
    }
  );
}