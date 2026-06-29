import { DataTypes } from "sequelize";

export function defineChatMessage(sequelize) {
  return sequelize.define(
    "ChatMessage",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      groupId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "group_id" },
      senderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "sender_id" },
      messageType: {
        type: DataTypes.ENUM("text", "voice", "audio", "video", "image", "file"),
        allowNull: false,
        defaultValue: "text",
        field: "message_type",
      },
      messageText: { type: DataTypes.TEXT("long"), allowNull: false, field: "message_text" },
      isDeleted: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0, field: "is_deleted" },
    },
    {
      tableName: "chat_messages",
      underscored: true,
    }
  );
}
