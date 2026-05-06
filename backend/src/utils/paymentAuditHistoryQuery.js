import { Op } from "sequelize";

const DEFAULT_MODULE_NAME = "payment_sheet_with_date";
const PAKISTAN_TIME_ZONE = "Asia/Karachi";

function cleanString(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toPositiveInteger(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function resolveHistoryMode(query = {}) {
  const rawWindow = cleanString(
    query.historyWindow ?? query.window ?? query.mode ?? query.filter,
    ""
  ).toLowerCase();

  const rawHours = Number(query.hours);
  const hasLast24Flag =
    query.last24Hours === true ||
    String(query.last24Hours).toLowerCase() === "true" ||
    String(query.last24Hours) === "1";

  if (
    rawWindow === "last-24-hours" ||
    rawWindow === "last_24_hours" ||
    rawWindow === "24h" ||
    rawWindow === "last24" ||
    rawWindow === "last24hours" ||
    rawHours === 24 ||
    hasLast24Flag
  ) {
    return "last24";
  }

  if (
    rawWindow === "today" ||
    rawWindow === "today-history" ||
    query.today === true ||
    String(query.today).toLowerCase() === "true" ||
    String(query.today) === "1"
  ) {
    return "today";
  }

  return "complete";
}

function getPakistanDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

export function getPakistanTodayRange(date = new Date()) {
  const { year, month, day } = getPakistanDateParts(date);

  // Pakistan is UTC+05:00 and has no DST. Midnight PKT = previous day 19:00 UTC.
  const start = new Date(Date.UTC(year, month - 1, day, -5, 0, 0, 0));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export function getRollingLastHoursRange(hours = 24, date = new Date()) {
  const safeHours = toPositiveInteger(hours, 24);
  const end = new Date(date);
  const start = new Date(end.getTime() - safeHours * 60 * 60 * 1000);

  return { start, end };
}

export function buildPaymentAuditHistoryQuery(reqQuery = {}, options = {}) {
  const maxLimit = toPositiveInteger(options.maxLimit, 5000);
  const defaultLimit = toPositiveInteger(options.defaultLimit, 500);

  const moduleName = cleanString(
    reqQuery.moduleName ?? reqQuery.module_name,
    DEFAULT_MODULE_NAME
  );

  const paymentCloneIdRaw =
    reqQuery.paymentCloneId ?? reqQuery.payment_clone_id ?? reqQuery.rowId ?? reqQuery.row_id;

  const requestedLimit = toPositiveInteger(reqQuery.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);

  const where = { moduleName };
  const mode = resolveHistoryMode(reqQuery);
  let range = null;

  if (mode === "last24") {
    range = getRollingLastHoursRange(reqQuery.hours || 24);
    where.created_at = {
      [Op.gte]: range.start,
      [Op.lt]: range.end,
    };
  }

  if (mode === "today") {
    range = getPakistanTodayRange();
    where.created_at = {
      [Op.gte]: range.start,
      [Op.lt]: range.end,
    };
  }

  return {
    where,
    limit,
    paymentCloneIdRaw,
    filters: {
      moduleName,
      mode,
      today: mode === "today",
      last24Hours: mode === "last24",
      timezone: PAKISTAN_TIME_ZONE,
      from: range?.start?.toISOString?.() || null,
      to: range?.end?.toISOString?.() || null,
    },
  };
}
