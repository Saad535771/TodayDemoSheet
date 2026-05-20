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
      totalClasses: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "total_classes",
      },
      classDoneCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "class_done_count",
      },
      classPendingCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "class_pending_count",
      },
      missedByTeacherCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "missed_by_teacher_count",
      },
      missedByStudentCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "missed_by_student_count",
      },
      newTuitionCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "new_tuition_count",
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
