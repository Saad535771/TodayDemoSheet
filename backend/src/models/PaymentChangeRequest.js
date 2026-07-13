import { DataTypes } from "sequelize";

export function definePaymentChangeRequest(sequelize) {
  const PaymentChangeRequest = sequelize.define(
    "PaymentChangeRequest",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      moduleName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "payment_sheet_with_date",
        field: "module_name",
      },

      paymentCloneId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "payment_clone_id",
      },
paymentCloneTeamBId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "payment_clone_team_b_id",
      },
      actionType: {
        type: DataTypes.ENUM("create", "update", "delete", "reorder"),
        allowNull: false,
        field: "action_type",
      },

      actorUserId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "actor_user_id",
      },

      actorRole: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: "actor_role",
      },

      actorName: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: "actor_name",
      },

      actorEmail: {
        type: DataTypes.STRING(191),
        allowNull: true,
        field: "actor_email",
      },

      requestStatus: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "expired"),
        allowNull: false,
        defaultValue: "pending",
        field: "request_status",
      },

      changedColumns: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "changed_columns",
      },

      beforeData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "before_data",
      },

      afterData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "after_data",
      },

      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "metadata",
      },

      reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "review_note",
      },

      approvedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "approved_by",
      },

      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "approved_at",
      },

      rejectedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "rejected_by",
      },
      notificationType: {
  type: DataTypes.STRING(80),
  allowNull: false,
  defaultValue: "payment_sheet_with_date",
  field: "notification_type",
},

notificationStatus: {
  type: DataTypes.STRING(20),
  allowNull: false,
  defaultValue: "unread",
  field: "notification_status",
},

notificationSeenAt: {
  type: DataTypes.DATE,
  allowNull: true,
  field: "notification_seen_at",
},


      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "rejected_at",
      },

      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
    },
    {
      tableName: "payment_change_requests",
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  return PaymentChangeRequest;
}