import { DataTypes } from "sequelize";

export function definePayment(sequelize) {
  const Payment = sequelize.define("Payment", {
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
    paymentDate: {
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
      type: DataTypes.ENUM("Fees Receive", "Fee Pending", "Tuition Close", "Tuition Pending"),
      allowNull: false,
      defaultValue: "Tuition Pending",
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    otmName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "otm_name",
    },
  }, {
    tableName: "payments",
    underscored: true,
  });

  return Payment;
}