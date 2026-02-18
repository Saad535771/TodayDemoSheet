import { DataTypes } from "sequelize";

export function defineTuition(sequelize) {
  const Tuition = sequelize.define("Tuition", {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    
    // "Tuition ID" (unique business key)
    tuitionId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "tuition_id" },

    // 👇 YEH MISSING THA (Isko add karein taake Code aur DB connect hon)
    assignedTo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "assigned_to" },
    isDeleted: { type: DataTypes.TINYINT, defaultValue: 0, field: "is_deleted" },
    // 👆 Yahan tak missing tha

    // From Main sheet
    date: { type: DataTypes.DATEONLY, allowNull: true },                  // "Date"
    timeHour: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, field: "time_hour" }, // 8..23
    tuitionName: { type: DataTypes.STRING(191), allowNull: true, field: "tuition_name" },
    source: { type: DataTypes.STRING(191), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    parentsContact: { type: DataTypes.STRING(191), allowNull: true, field: "parents_contact" },
    className: { type: DataTypes.STRING(100), allowNull: true, field: "class" },
    subjects: { type: DataTypes.STRING(255), allowNull: true },
    daysPerWeek: { type: DataTypes.STRING(50), allowNull: true, field: "days_per_week" },
    estimatedFee: { type: DataTypes.STRING(50), allowNull: true, field: "estimated_fee" },
    tutorName: { type: DataTypes.STRING(191), allowNull: true, field: "tutor_name" },
    tutorFee: { type: DataTypes.STRING(50), allowNull: true, field: "tutor_fee" },
    secondTutors: { type: DataTypes.STRING(191), allowNull: true, field: "second_tutors" },
    rejectedTutor: { type: DataTypes.STRING(191), allowNull: true, field: "rejected_tutor" },
    status: { type: DataTypes.STRING(191), allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    demoDate: { type: DataTypes.DATEONLY, allowNull: true, field: "demo_date" },
    satisfactionRating: { type: DataTypes.STRING(191), allowNull: true, field: "satisfaction_rating" },
    demoRating: { type: DataTypes.STRING(50), allowNull: true, field: "demo_rating" },

    syncFlag: { type: DataTypes.STRING(20), allowNull: true, field: "sync_flag" }
  }, {
    tableName: "tuitions",
    underscored: true,
    indexes: [
      { fields: ["time_hour"] },
      { fields: ["demo_date"] },
      { fields: ["assigned_to"] }, // Index for performance
      { fields: ["is_deleted"] }
    ]
  });

  return Tuition;
}