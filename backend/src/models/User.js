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

    accessMonthly: { type: DataTypes.TINYINT, defaultValue: 1, field: "access_monthly" },
    accessDemo: { type: DataTypes.TINYINT, defaultValue: 1, field: "access_demo" },
    accessTrash: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_trash" },

    // Team A Permissions
    accessPaymentSheet: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_payment_sheet" },
    accessTutorShare: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_tutor_share" },
    accessLacasShare: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_lacas_share" },
    accessTotalFees: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_total_fees" },
    accessPaymentActions: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_payment_actions" },
    
    // Team B Permissions
    accessPaymentSheetCloneTeamB: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_payment_sheet_clone_team_b" },
    accessTutorShareCloneTeamB: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_tutor_share_clone_team_b" },
    accessLacasShareCloneTeamB: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_lacas_share_clone_team_b" },
    accessTotalFeesCloneTeamB: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_total_fees_clone_team_b" },
    accessPaymentActionsCloneTeamB: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_payment_actions_clone_team_b" },
    accessTrashCloneTeamB: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_trash_clone_team_b" },

    accessHodApprovals: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_hod_approvals" },
    accessStaff: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_staff" },
    accessOtmManagement: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_otm_management" },
    
    accessChat: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_chat" },
    accessChatSend: { type: DataTypes.TINYINT, defaultValue: 0, field: "access_chat_send" },
  }, {
    tableName: "users",
    underscored: true
  });

  return User;
}