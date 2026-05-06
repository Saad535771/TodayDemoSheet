import { Op, Sequelize } from "sequelize";

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

function normalizeMode(query = {}) {
  const rawWindow = cleanString(
    query.historyWindow ?? query.window ?? query.mode ?? query.filter,
    ""
  ).toLowerCase();

  const hoursValue = Number(query.hours ?? query.hour ?? query.lastHours);

  const isLast24Hours =
    rawWindow === "last-24-hours" ||
    rawWindow === "last_24_hours" ||
    rawWindow === "24h" ||
    rawWindow === "last24" ||
    rawWindow === "last24hours" ||
    query.last24Hours === true ||
    String(query.last24Hours).toLowerCase() === "true" ||
    String(query.last24Hours) === "1" ||
    hoursValue === 24 ||
    String(query.strictLast24) === "1";

  if (isLast24Hours) return "last24";

  const isToday =
    rawWindow === "today" ||
    rawWindow === "today-history" ||
    query.today === true ||
    String(query.today).toLowerCase() === "true" ||
    String(query.today) === "1";

  if (isToday) return "today";
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
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { start, end };
}

function getLast24DisplayRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  return { from, to };
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
  const mode = normalizeMode(reqQuery);

  let range = { from: null, to: null };

  if (mode === "last24") {
    range = getLast24DisplayRange();

    // IMPORTANT:
    // Use MySQL server time, not JS/UTC Date objects.
    // Do NOT add Op.lte upper bound because DATETIME columns may be stored in local server time.
    // The upper bound was excluding freshly-created rows on live deployment.
    where.created_at = {
      [Op.gte]: Sequelize.literal("DATE_SUB(NOW(), INTERVAL 24 HOUR)"),
    };
  } else if (mode === "today") {
    const todayRange = getPakistanTodayRange();
    range = { from: todayRange.start, to: todayRange.end };

    where.created_at = {
      [Op.gte]: todayRange.start,
      [Op.lte]: todayRange.end,
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
      from: range.from?.toISOString?.() || null,
      to: range.to?.toISOString?.() || null,
    },
  };
}
