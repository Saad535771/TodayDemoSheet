import { QueryTypes } from "sequelize";

const MODULE_LABELS = {
  hod_approvals: "HOD Approvals",
  main: "Monthly Tuitions",
  target: "Today Demo",
  payment: "Payment Sheet",
  trash: "Recycle Bin",
  staff: "Staff",
  otm_management: "Management Portal",
  chat: "Team Chat",
};

const ALLOWED_MODULE_KEYS = new Set(Object.keys(MODULE_LABELS));

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeModuleKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return ALLOWED_MODULE_KEYS.has(key) ? key : "system";
}

function getPath(req) {
  return String(req?.originalUrl || req?.url || "").split("?")[0];
}

function getActorLabel(req) {
  return normalizeText(req?.user?.name || req?.user?.email, "Someone");
}

function getModuleFromRequest(req) {
  const path = getPath(req);

  if (path.startsWith("/api/notifications")) return null;
  if (path.startsWith("/api/auth/presence")) return null;
  if (path.startsWith("/api/auth/login")) return null;
  if (path.startsWith("/api/auth/me")) return null;

  if (path.includes("/reorder")) return null;

  if (path.startsWith("/api/tuitions/payment-approvals")) return "hod_approvals";
  if (path.startsWith("/api/payment-change-requests")) return "hod_approvals";
  if (path.startsWith("/api/tuitions") && path.includes("payment-approval")) return "hod_approvals";

  if (path.startsWith("/api/tuitions/trash")) return "trash";
  if (path.startsWith("/api/payments-clone/trash")) return "trash";

  if (path.startsWith("/api/tuitions")) return "main";
  if (path.startsWith("/api/target")) return "target";
  if (path.startsWith("/api/payments")) return "payment";
  if (path.startsWith("/api/payments-clone")) return "payment";
  if (path.startsWith("/api/otm-management")) return "otm_management";

  if (path.startsWith("/api/auth/register")) return "staff";
  if (path.startsWith("/api/auth/users")) return "staff";

  return null;
}

function getActionFromRequest(req) {
  const method = String(req?.method || "").toUpperCase();
  const path = getPath(req);

  if (path.includes("/restore")) return "restore";
  if (path.includes("payment-approval") || path.startsWith("/api/payment-change-requests")) {
    return "approval";
  }

  if (method === "POST") return "create";
  if (method === "PATCH" || method === "PUT") return "update";
  if (method === "DELETE") return "delete";
  return "system";
}

function getEntityIdFromRequest(req) {
  const params = req?.params || {};
  const body = req?.body || {};
  return normalizeText(
    params.id ||
      params.tuitionId ||
      params.entryId ||
      params.userId ||
      body.id ||
      body.tuitionId ||
      body.entryId ||
      body.userId,
    ""
  );
}

function shouldWatchRequest(req) {
  const method = String(req?.method || "").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  return Boolean(getModuleFromRequest(req));
}

function buildTitle({ actorLabel, actionType, moduleKey }) {
  const moduleLabel = MODULE_LABELS[moduleKey] || moduleKey;
  const actionLabel =
    actionType === "create"
      ? "added new record in"
      : actionType === "update"
        ? "updated"
        : actionType === "delete"
          ? "deleted record from"
          : actionType === "restore"
            ? "restored record in"
            : actionType === "approval"
              ? "changed approval in"
              : "changed";

  return `${actorLabel} ${actionLabel} ${moduleLabel}`;
}

export function createNotificationService({ sequelize }) {
  let namespace = null;

  function emit(eventName, payload) {
    if (!namespace) return;

    if (payload?.target_user_id) {
      namespace.to(`notifications:user:${payload.target_user_id}`).emit(eventName, payload);
      return;
    }

    namespace.emit(eventName, payload);
  }

  async function createNotification(input = {}) {
    const moduleKey = normalizeModuleKey(input.moduleKey || input.module_key);
    if (moduleKey === "system" && !input.allowSystem) return null;

    const actionType = normalizeText(input.actionType || input.action_type, "system");
    const actorUserId = Number(input.actorUserId || input.actor_user_id || 0) || null;
    const targetUserId = Number(input.targetUserId || input.target_user_id || 0) || null;
    const entityType = normalizeText(input.entityType || input.entity_type || moduleKey, "");
    const entityId = normalizeText(input.entityId || input.entity_id, "");
    const title = normalizeText(input.title, "New update");
    const message = normalizeText(input.message, "");
    const payloadObject = input.payload && typeof input.payload === "object" ? input.payload : {};

    await sequelize.query(
      `INSERT INTO notifications
        (module_key, action_type, entity_type, entity_id, actor_user_id, target_user_id, title, message, payload)
       VALUES
(:moduleKey, :actionType, :entityType, :entityId, :actorUserId, :targetUserId, :title, :message, :payload)`,
      {
        replacements: {
          moduleKey,
          actionType,
          entityType: entityType || null,
          entityId: entityId || null,
          actorUserId,
          targetUserId,
          title,
          message: message || null,
          payload: JSON.stringify(payloadObject),
        },
        type: QueryTypes.INSERT,
      }
    );

    const notificationPayload = {
      module_key: moduleKey,
      action_type: actionType,
      entity_type: entityType || null,
      entity_id: entityId || null,
      actor_user_id: actorUserId,
      target_user_id: targetUserId,
      title,
      message: message || null,
      payload: payloadObject,
      created_at: new Date().toISOString(),
    };

    emit("notifications:new", notificationPayload);
    emit("notification:new", notificationPayload); // fallback old/new naming support

    return notificationPayload;
  }

  async function createFromRequest(req) {
    const moduleKey = getModuleFromRequest(req);
    if (!moduleKey) return null;

    const actionType = getActionFromRequest(req);
    const actorUserId = Number(req?.user?.id || 0) || null;
    const actorLabel = getActorLabel(req);
    const entityId = getEntityIdFromRequest(req);
    const title = buildTitle({ actorLabel, actionType, moduleKey });

    return createNotification({
      moduleKey,
      actionType,
      entityType: moduleKey,
      entityId,
      actorUserId,
      title,
      message: title,
      payload: {
        path: getPath(req),
        method: req?.method,
      },
    });
  }

  async function getUnreadSummary(userId) {
    const safeUserId = Number(userId || 0);
    if (!safeUserId) return { total_unread: 0, modules: {} };

    const rows = await sequelize.query(
      `SELECT n.module_key, COUNT(*) AS unread_count, MAX(n.created_at) AS latest_at
       FROM notifications n
       LEFT JOIN notification_reads nr
         ON nr.notification_id = n.id AND nr.user_id = :userId
       WHERE nr.id IS NULL
         AND (n.target_user_id IS NULL OR n.target_user_id = :userId)
         AND (n.actor_user_id IS NULL OR n.actor_user_id <> :userId)
       GROUP BY n.module_key`,
      {
        replacements: { userId: safeUserId },
        type: QueryTypes.SELECT,
      }
    );

    const modules = {};
    let totalUnread = 0;

    for (const row of rows) {
      const count = Number(row.unread_count || 0);
      modules[row.module_key] = {
        newCount: count,
        total: count,
        latestAt: row.latest_at || null,
      };
      totalUnread += count;
    }

    return {
      total_unread: totalUnread,
      modules,
    };
  }

  async function markSeen(userId, moduleKey = null) {
    const safeUserId = Number(userId || 0);
    if (!safeUserId) return { success: false, seen: 0 };

    const normalizedModuleKey = moduleKey ? normalizeModuleKey(moduleKey) : null;
    const moduleClause = normalizedModuleKey && normalizedModuleKey !== "system" ? "AND n.module_key = :moduleKey" : "";

    const [, metadata] = await sequelize.query(
      `INSERT IGNORE INTO notification_reads (notification_id, user_id, seen_at)
       SELECT n.id, :userId, NOW()
       FROM notifications n
       LEFT JOIN notification_reads nr
         ON nr.notification_id = n.id AND nr.user_id = :userId
       WHERE nr.id IS NULL
         AND (n.target_user_id IS NULL OR n.target_user_id = :userId)
         AND (n.actor_user_id IS NULL OR n.actor_user_id <> :userId)
         ${moduleClause}`,
      {
        replacements: {
          userId: safeUserId,
          moduleKey: normalizedModuleKey,
        },
      }
    );

    const affectedRows = Number(metadata?.affectedRows || metadata || 0);

    emit("notifications:seen", {
      user_id: safeUserId,
      module_key: normalizedModuleKey || null,
      seen: affectedRows,
    });

    return { success: true, seen: affectedRows };
  }

  function responseHook() {
    return (req, res, next) => {
      if (!shouldWatchRequest(req)) return next();

      res.on("finish", () => {
        const statusCode = Number(res.statusCode || 0);
        if (statusCode < 200 || statusCode >= 300) return;

        createFromRequest(req).catch((error) => {
          console.error("NOTIFICATION HOOK ERROR:", error?.message || error);
        });
      });

      return next();
    };
  }

  return {
    setNamespace(nextNamespace) {
      namespace = nextNamespace;
    },
    createNotification,
    createFromRequest,
    getUnreadSummary,
    markSeen,
    responseHook,
  };
}
