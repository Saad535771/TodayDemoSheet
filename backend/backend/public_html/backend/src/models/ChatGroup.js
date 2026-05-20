import { DataTypes } from "sequelize";

export function defineChatGroup(sequelize) {
  return sequelize.define(
    "ChatGroup",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "created_by" },
      isActive: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1, field: "is_active" },
    },
    {
      tableName: "chat_groups",
      underscored: true,
    }
  );
}
