import { DataTypes } from "sequelize";

export function defineOtmTuitionEntry(sequelize) {
  const OtmTuitionEntry = sequelize.define(
    "OtmTuitionEntry",
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
      day: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      days: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      time: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      timeSlots: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "time_slots",
      },
      durationLabel: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "1 hour",
        field: "duration_label",
      },
      durationMinutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 60,
        field: "duration_minutes",
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
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "class_start_time",
      },
      classStartTimes: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "class_start_times",
      },
      classEndTime: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "class_end_time",
      },
      classEndTimes: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: "class_end_times",
      },
      status: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: "",
      },
      reportStatus: {
        type: DataTypes.STRING(80),
        allowNull: true,
        field: "report_status",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newTuition: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "new_tuition",
      },
      newTuitionName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "new_tuition_name",
      },
      sourceTuitionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "source_tuition_id",
      },
      sortOrder: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "sort_order",
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "created_by",
      },
      updatedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "updated_by",
      },
    },
    {
      tableName: "otm_tuition_entries",
      underscored: true,
    }
  );

  return OtmTuitionEntry;
}
