import { buildPaymentAuditHistoryQuery } from "../utils/paymentAuditHistoryQuery.js";
import { Op } from "sequelize";

const REVIEW_ROLES = new Set(["admin"]);
const DEFAULT_MODULE_NAME = "payment_sheet_with_date";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isLast24HoursRequest(req) {
  const pathText = String(`${req?.path || ""} ${req?.originalUrl || ""}`).toLowerCase();
  const historyWindow = String(req?.query?.historyWindow || req?.query?.window || "").toLowerCase();
  const hours = Number(req?.query?.hours || req?.query?.lastHours || 0);

  return (
    pathText.includes("last-24") ||
    historyWindow.includes("last-24") ||
    hours === 24
  );
}

function getLast24HoursStartDate() {
  return new Date(Date.now() - ONE_DAY_MS);
}

function addLast24HoursFilterToWhere(where = {}, req) {
  if (!isLast24HoursRequest(req)) return where;

  const existingAnd = Array.isArray(where?.[Op.and]) ? where[Op.and] : [];

  return {
    ...where,
    [Op.and]: [
      ...existingAnd,
      {
        created_at: {
          [Op.gte]: getLast24HoursStartDate(),
        },
      },
    ],
  };
}

function filterLogsToLast24Hours(items = [], req) {
  if (!isLast24HoursRequest(req)) return items;

  const sinceMs = getLast24HoursStartDate().getTime();

  return items.filter((item) => {
    const value = item?.createdAt ?? item?.created_at ?? item?.updatedAt ?? item?.updated_at;
    const timeMs = new Date(value || 0).getTime();
    return Number.isFinite(timeMs) && timeMs >= sinceMs;
  });
}


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

function safeJsonParse(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
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

function resolveHistoryRowId(row) {
  const metadata = safeJsonParse(row?.metadata) || {};
  const beforeData = safeJsonParse(row?.beforeData) || {};
  const afterData = safeJsonParse(row?.afterData) || {};

  return (
    row?.paymentCloneId ??
    metadata?.historyRowId ??
    metadata?.originalPaymentCloneId ??
    beforeData?.id ??
    afterData?.id ??
    null
  );
}

function normalizeChangedColumns(value) {
  const parsed = safeJsonParse(value);
  if (Array.isArray(parsed)) return parsed;
  return [];
}

function normalizeLog(item) {
  const row = toPlain(item);
  const actor = normalizeActor(row);
  const metadata = safeJsonParse(row.metadata) || null;
  const beforeData = safeJsonParse(row.beforeData) || null;
  const afterData = safeJsonParse(row.afterData) || null;

  return {
    id: row.id,
    moduleName: row.moduleName,
    paymentCloneId: row.paymentCloneId,
    historyRowId: resolveHistoryRowId({
      paymentCloneId: row.paymentCloneId,
      metadata,
      beforeData,
      afterData,
    }),
    actionType: row.actionType,
    requestStatus: row.requestStatus,
    changedColumns: normalizeChangedColumns(row.changedColumns),
    beforeData,
    afterData,
    metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    actorUserId: row.actorUserId,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    actor,
  };
}

function filterByHistoryRowId(items = [], paymentCloneIdRaw) {
  if (
    paymentCloneIdRaw === undefined ||
    paymentCloneIdRaw === null ||
    paymentCloneIdRaw === ""
  ) {
    return items;
  }

  const wanted = String(paymentCloneIdRaw);

  return items.filter((item) => {
    const candidates = [
      item?.paymentCloneId,
      item?.historyRowId,
      item?.metadata?.historyRowId,
      item?.metadata?.originalPaymentCloneId,
      item?.beforeData?.id,
      item?.afterData?.id,
    ]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map((value) => String(value));

    return candidates.includes(wanted);
  });
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
        const { where, paymentCloneIdRaw, filters } = buildPaymentAuditHistoryQuery(
          req.query,
          {
            defaultLimit: 1000,
            maxLimit: 5000,
          }
        );

        const strictWhere = addLast24HoursFilterToWhere(where, req);
        const strictLast24 = isLast24HoursRequest(req);

        const rows = await PaymentChangeRequest.findAll({
          where: strictWhere,
          attributes: ["id", "paymentCloneId", "metadata", "beforeData", "afterData", "createdAt", "updatedAt"],
          order: [["created_at", "DESC"]],
          limit: strictLast24 ? 5000 : filters.today ? 5000 : 1000,
        });

        const items = filterLogsToLast24Hours(rows.map(normalizeLog), req);
        const filtered = filterByHistoryRowId(items, paymentCloneIdRaw);

        return res.json({ count: filtered.length, filters });
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
        const { where, limit, paymentCloneIdRaw, filters } = buildPaymentAuditHistoryQuery(
          req.query,
          {
            defaultLimit: 500,
            maxLimit: 5000,
          }
        );

        const strictWhere = addLast24HoursFilterToWhere(where, req);
        const strictLast24 = isLast24HoursRequest(req);

        const rows = await PaymentChangeRequest.findAll({
          where: strictWhere,
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
          limit: strictLast24 ? Math.max(limit, 5000) : limit,
        });

        const normalizedItems = filterLogsToLast24Hours(rows.map(normalizeLog), req);
        const items = filterByHistoryRowId(normalizedItems, paymentCloneIdRaw);

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
          filters,
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
