import { DataTypes } from "sequelize";

export function defineOtmClassTime(sequelize) {
  const OtmClassTime = sequelize.define(
    "OtmClassTime",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      label: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      startTime: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: "start_time",
      },
      durationMinutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 60,
        field: "duration_minutes",
      },
      endTime: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: "end_time",
      },
      sortOrder: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "sort_order",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "otm_class_times",
      underscored: true,
    }
  );

  return OtmClassTime;
}
