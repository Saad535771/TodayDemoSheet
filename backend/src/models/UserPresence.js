import { DataTypes } from "sequelize";

export function defineUserPresence(sequelize) {
  const UserPresence = sequelize.define("UserPresence", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
    },
    sessionId: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      field: "session_id",
    },
    currentSheet: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "dashboard",
      field: "current_sheet",
    },
    isOnline: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      field: "is_online",
    },
    loginAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "login_at",
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "last_seen_at",
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "user_agent",
    },
    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "ip_address",
    },
  }, {
    tableName: "user_presence",
    underscored: true,
  });

  return UserPresence;
}

