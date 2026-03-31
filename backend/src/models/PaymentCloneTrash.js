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

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "country",
      },

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

      tutorShare: {
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
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "status",
      },

      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "feedback",
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