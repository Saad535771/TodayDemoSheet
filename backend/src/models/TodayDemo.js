import { DataTypes } from "sequelize";

export default (sequelize) => {
  const TodayDemo = sequelize.define(
    "TodayDemo",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      originalTuitionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "original_tuition_id",
      },

      tuitionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "tuition_id",
      },

      demoTime: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "demo_time",
      },
      classTime: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "class_time",
      },
      timeHour: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        field: "time_hour",
      },
      daysPerWeek: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "days_per_week",
      },

      tuitionName: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "tuition_name",
      },

      source: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      parentsContact: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "parents_contact",
      },

      className: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "class",
      },

      subjects: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      tutorName: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "tutor_name",
      },

      tutorFee: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "tutor_fee",
      },

      rejectedTutor: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "rejected_tutor",
      },

      status: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },

      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      demoDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "demo_date",
      },

      demoRating: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "demo_rating",
      },

      syncFlag: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "sync_flag",
      },

      rowColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "#ffffff",
        field: "row_color",
      },

      tuitionNameColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "#ffffff",
        field: "tuition_name_color",
      },
      tutorNameColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "#ffffff",
        field: "tutor_name_color",
      },

      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "order_index",
      },
    },
    {
      tableName: "today_demo",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { unique: true, fields: ["tuition_id"] },
        { fields: ["time_hour"] },
        { fields: ["demo_date"] },
        { fields: ["status"] },
        { fields: ["time_hour", "order_index", "id"] },
      ],
    }
  );

  return TodayDemo;
};