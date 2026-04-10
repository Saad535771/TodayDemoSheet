import { DataTypes } from "sequelize";

export function defineUser(sequelize) {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: true },
    passwordHash: { type: DataTypes.STRING(191), allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "staff", "hod", "otm"),
      allowNull: false,
      defaultValue: "admin"
    },

    accessMonthly: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      field: "access_monthly"
    },
    accessDemo: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      field: "access_demo"
    },
    accessTrash: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_trash"
    },

    accessPaymentSheet: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_payment_sheet"
    },
    accessTutorShare: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_tutor_share"
    },
    accessLacasShare: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_lacas_share"
    },
    accessTotalFees: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_total_fees"
    },
    accessHodApprovals: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_hod_approvals"
    },
    accessStaff: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_staff"
    },
    accessOtmManagement: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "access_otm_management"
    },
  }, {
    tableName: "users",
    underscored: true
  });

  return User;
}