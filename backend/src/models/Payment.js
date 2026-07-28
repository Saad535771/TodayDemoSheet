import { DataTypes } from "sequelize";

export function definePayment(sequelize) {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      // internal sync key
      tuitionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "tuition_id",
      },

      // required sheet fields
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "payment_date",
      },

      tuitionName: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "tuition_name",
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
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

      totalFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: "total_fees",
      },

      status: {
        type: DataTypes.ENUM(
          "Fees Receive",
          "Fee Pending",
          "Tuition Close",
          "Tuition Pending"
        ),
        allowNull: false,
        defaultValue: "Tuition Pending",
      },

      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
 daysPerWeek: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "days_per_week",
      },
      otmName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "otm_name",
      },

      // manual field only - sync se overwrite nahi hogi
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "notes",
      },

      // existing system fields
      syncFlag: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "sync_flag",
      },

      assignedStaffId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "assigned_staff_id",
      },

      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_deleted",
      },

      deletedFromTodayDemo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "deletedFromTodayDemo",
      },

      assignedTo: {
        type: DataTypes.STRING(255),
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
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "row_color",
      },

      tuitionNameColor: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "tuition_name_color",
      },
    },
    {
      tableName: "payments",
      underscored: true,
      timestamps: true,
    }
  );

  return Payment;
}