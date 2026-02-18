import { DataTypes } from "sequelize";

export function defineUser(sequelize) {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(191), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "admin" },
    
    // 👇 YEH FIELDS MISSING THI - INHE ADD KIYA HAI
    accessMonthly: { 
      type: DataTypes.TINYINT, 
      defaultValue: 1, 
      field: "access_monthly" // Database ke column se link karta hai
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
    }
    // 👆 YAHAN TAK

  }, {
    tableName: "users",
    underscored: true
  });

  return User;
}