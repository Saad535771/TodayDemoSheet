import { DataTypes } from "sequelize";

export function definePaymentCloneTrash(sequelize) {
  const PaymentCloneTrash = sequelize.define(
    "PaymentCloneTrash",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      originalPaymentCloneId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "original_payment_clone_id",
      },

      tuitionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "tuition_id",
      },

      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "payment_date",
      },

      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "date",
      },

      dateWithMonth: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "date_with_month",
      },

      tuitionName: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "tuition_name",
      },

      totalStudents: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "total_students",
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "country",
      },

      subjects: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "subjects",
      },

      // legacy fallback
      className: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "class_name",
      },

      tutorName: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "tutor_name",
      },

      tutorFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "tutor_share",
      },

      lacasShare: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "lacas_share",
      },

      totalFees: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "total_fees",
      },

      status: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "status",
      },

      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "feedback",
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "notes",
      },

      otmName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "otm_name",
      },

      syncFlag: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "sync_flag",
      },

      assignedStaffId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "assigned_staff_id",
      },

      deletedFromTodayDemo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "deleted_from_today_demo",
      },

      assignedTo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "assigned_to",
      },

      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "order_index",
      },

      rowColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "row_color",
      },

      tuitionNameColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "tuition_name_color",
      },

      daysPerWeek: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: "days_per_week",
      },
    },
    {
      tableName: "payments_clone_trash",
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  return PaymentCloneTrash;
}