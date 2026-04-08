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
      status: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: "class pending",
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
    }
  );

  return OtmTotalClass;
}
