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
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      time: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      tuitionName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "tuition_name",
      },
      groupName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "group_name",
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
        allowNull: false,
        defaultValue: "Pending",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "otm_tuition_entries",
      underscored: true,
    }
  );

  return OtmTuitionEntry;
}