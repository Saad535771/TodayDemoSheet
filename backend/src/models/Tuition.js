import { DataTypes } from "sequelize";

export function defineTuition(sequelize) {
  const Tuition = sequelize.define(
    "Tuition",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      tuitionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "tuition_id",
      },

      assignedTo: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "assigned_to",
      },

      isDeleted: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: "is_deleted",
      },

      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "order_index",
      },

      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      timeHour: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        field: "time_hour",
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

      tuitionName: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "tuition_name",
      },

      source: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },

      otmName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "otm_name",
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

      daysPerWeek: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "days_per_week",
      },

      estimatedFee: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "estimated_fee",
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

      secondTutors: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "second_tutors",
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

      satisfactionRating: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "satisfaction_rating",
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
        field: "row_color",
      },

      tuitionNameColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "tuition_name_color",
      },
      tutorNameColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'tutor_name_color',
      },
      paymentApprovalStatus: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: true,
        field: "payment_approval_status",
      },

      paymentApprovalRequestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "payment_approval_requested_at",
      },

      paymentApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "payment_approved_at",
      },

      paymentApprovedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "payment_approved_by",
      },

      paymentRejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "payment_rejection_reason",
      },
    },
    {
      tableName: "tuitions",
      underscored: true,
      indexes: [
        { fields: ["time_hour"] },
        { fields: ["demo_date"] },
        { fields: ["assigned_to"] },
        { fields: ["is_deleted"] },
        { fields: ["payment_approval_status"] },
      ],
    }
  );

  return Tuition;
}