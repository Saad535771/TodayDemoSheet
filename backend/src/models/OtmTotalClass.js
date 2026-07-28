import { DataTypes } from "sequelize";

export function defineOtmTotalClass(sequelize) {
  const OtmTotalClass = sequelize.define(
    "OtmTotalClass",
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
      sourceEntryId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        field: "source_entry_id",
      },
      day: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      days: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      time: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      duration: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "1 hour",
      },
      durationMinutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 60,
        field: "duration_minutes",
      },
      durationTime: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "1 hour",
        field: "duration_time",
      },
      tuitionName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "tuition_name",
      },
      tutorName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "tutor_name",
      },
      groupName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "group_name",
      },
      studentName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "student_name",
      },
      classStartTime: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "class_start_time",
      },
      classEndTime: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "class_end_time",
      },
      status: {
        type: DataTypes.STRING(80),
        allowNull: true,
        defaultValue: "",
      },
      reportStatus: {
        type: DataTypes.STRING(80),
        allowNull: true,
        field: "report_status",
      },
      decidedFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "decided_fee",
      },
      tutorFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "tutor_fee",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rowColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "row_color",
      },
      sourceTuitionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "source_tuition_id",
      },
      tuitionStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "tuition_start_date",
      },
      tuitionStartWeek: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: "tuition_start_week",
      },
      numberOfDecidedDays: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "number_of_decided_days",
      },
      classesInAMonth: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "classes_in_a_month",
      },
      totalDoneClasses: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "total_done_classes",
      },
      missedByStudentClasses: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "missed_by_student_classes",
      },
      missedByTeacherClass: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "missed_by_teacher_class",
      },
      totalFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "total_fee",
      },
      totalClasses: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "total_classes",
      },
      newTuitionCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "new_tuition_count",
      },
      pauseNextCycle: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "pause_next_cycle",
      },
      sortOrder: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "sort_order",
      },
      isManual: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_manual",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_deleted",
      },
      lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "last_synced_at",
      },
    },
    {
      tableName: "otm_total_classes",
      underscored: true,
      indexes: [
        { fields: ["user_id"] },
        { unique: true, fields: ["user_id", "source_entry_id"] },
        { fields: ["user_id", "sort_order"] },
      ],
    }
  );

  return OtmTotalClass;
}
