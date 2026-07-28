import { DataTypes } from "sequelize";

export function defineOtmPortalReport(sequelize) {
  const OtmPortalReport = sequelize.define(
    "OtmPortalReport",
    {
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
      teacherName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "teacher_name",
      },
      tuitionName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "tuition_name",
      },
      groupName: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "group_name",
      },
      reportStatus: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending report",
        field: "report_status",
      },
      lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "last_synced_at",
      },
    },
    {
      tableName: "otm_portal_reports",
      underscored: true,
    }
  );

  return OtmPortalReport;
}