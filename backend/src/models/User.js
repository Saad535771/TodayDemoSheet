import { DataTypes } from "sequelize";

export function defineUser(sequelize) {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(191), allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "staff", "hod"),
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
    }
  }, {
    tableName: "users",
    underscored: true
  });

  return User;
}