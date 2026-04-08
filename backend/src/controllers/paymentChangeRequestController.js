const REVIEW_ROLES = new Set(["admin"]);
const DEFAULT_MODULE_NAME = "payment_sheet_with_date";

function canReview(role) {
  return REVIEW_ROLES.has(String(role || "").trim().toLowerCase());
}

function toPlain(item) {
  if (!item) return null;
  if (typeof item.get === "function") {
    return item.get({ plain: true });
  }
  return JSON.parse(JSON.stringify(item));
}

function normalizeActor(item) {
  const actorUser = item?.actorUser || null;

  return {
    id: actorUser?.id ?? item?.actorUserId ?? null,
    name:
      actorUser?.name ||
      item?.actorName ||
      actorUser?.email ||
      item?.actorEmail ||
      "Unknown User",
    email: actorUser?.email || item?.actorEmail || null,
    role: actorUser?.role || item?.actorRole || null,
  };
}

function normalizeLog(item) {
  const row = toPlain(item);
  const actor = normalizeActor(row);

  return {
    id: row.id,
    moduleName: row.moduleName,
    paymentCloneId: row.paymentCloneId,
    actionType: row.actionType,
    requestStatus: row.requestStatus,
    changedColumns: Array.isArray(row.changedColumns) ? row.changedColumns : [],
    beforeData: row.beforeData || null,
    afterData: row.afterData || null,
    metadata: row.metadata || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    actorUserId: row.actorUserId,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    actor,
  };
}

export function makePaymentChangeRequestController({
  PaymentChangeRequest,
  User,
}) {
  return {
    async summary(req, res) {
      if (!canReview(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const paymentCloneIdRaw =
          req.query?.paymentCloneId ?? req.query?.payment_clone_id;

        const where = {
          moduleName: DEFAULT_MODULE_NAME,
        };

        if (
          paymentCloneIdRaw !== undefined &&
          paymentCloneIdRaw !== null &&
          paymentCloneIdRaw !== ""
        ) {
          const parsedId = Number(paymentCloneIdRaw);
          where.paymentCloneId = Number.isFinite(parsedId)
            ? parsedId
            : paymentCloneIdRaw;
        }

        const count = await PaymentChangeRequest.count({ where });

        return res.json({ count });
      } catch (err) {
        console.error("PAYMENT AUDIT SUMMARY ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to fetch payment audit summary",
        });
      }
    },

    async listLogs(req, res) {
      if (!canReview(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const limit = Math.min(Math.max(Number(req.query?.limit || 200), 1), 500);
        const paymentCloneIdRaw =
          req.query?.paymentCloneId ?? req.query?.payment_clone_id;

        const where = {
          moduleName: DEFAULT_MODULE_NAME,
        };

        if (
          paymentCloneIdRaw !== undefined &&
          paymentCloneIdRaw !== null &&
          paymentCloneIdRaw !== ""
        ) {
          const parsedId = Number(paymentCloneIdRaw);
          where.paymentCloneId = Number.isFinite(parsedId)
            ? parsedId
            : paymentCloneIdRaw;
        }

        const rows = await PaymentChangeRequest.findAll({
          where,
          include: User
            ? [
                {
                  model: User,
                  as: "actorUser",
                  attributes: ["id", "name", "email", "role"],
                  required: false,
                },
              ]
            : [],
          order: [["created_at", "DESC"]],
          limit,
        });

        const items = rows.map(normalizeLog);

        const actors = [];
        const seenActorIds = new Set();

        for (const item of items) {
          const key = `${item.actor?.id ?? "x"}::${item.actorName}`;
          if (seenActorIds.has(key)) continue;
          seenActorIds.add(key);
          actors.push(item.actor);
        }

        return res.json({
          items,
          actors,
        });
      } catch (err) {
        console.error("PAYMENT AUDIT LOGS ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to fetch payment audit logs",
        });
      }
    },
  };
}