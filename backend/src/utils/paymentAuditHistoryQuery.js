import { Op } from "sequelize";

const DEFAULT_MODULE_NAME = "payment_sheet_with_date";

function toPositiveNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

export function buildPaymentAuditHistoryQuery(reqQuery = {}, options = {}) {
  const defaultLimit = options.defaultLimit || 500;
  const maxLimit = options.maxLimit || 5000;

  const moduleName =
    String(reqQuery.moduleName || DEFAULT_MODULE_NAME).trim() ||
    DEFAULT_MODULE_NAME;

  const paymentCloneIdRaw =
    reqQuery.paymentCloneId ?? reqQuery.payment_clone_id;

  const limit = Math.min(
    Math.max(toPositiveNumber(reqQuery.limit, defaultLimit), 1),
    maxLimit
  );

  const where = { moduleName };

  const hoursRaw = reqQuery.hours ?? reqQuery.lastHours ?? reqQuery.last_hours;
  const hours = toPositiveNumber(hoursRaw, 0);

  let fromDate = null;

  if (hours > 0) {
    fromDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    where.createdAt = {
      [Op.gte]: fromDate,
    };
  }

  return {
    where,
    limit,
    paymentCloneIdRaw,
    filters: {
      moduleName,
      hours: hours || null,
      from: fromDate ? fromDate.toISOString() : null,
      mode: hours ? `last_${hours}_hours` : "all",
    },
  };
}