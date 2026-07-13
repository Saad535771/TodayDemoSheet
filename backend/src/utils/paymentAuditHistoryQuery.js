import { Op, literal } from "sequelize";

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

  const wantsLast24 =
    rawWindow === "last-24-hours" ||
    rawWindow === "last_24_hours" ||
    rawWindow === "24h" ||
    rawWindow === "last24" ||
    rawWindow === "last24hours" ||
    String(query.strictLast24) === "1" ||
    String(query.last24Hours).toLowerCase() === "true" ||
    String(query.hours) === "24";

  if (wantsLast24) return "last24";

  const wantsToday =
    rawWindow === "today" ||
    rawWindow === "today-history" ||
    query.today === true ||
    String(query.today).toLowerCase() === "true" ||
    String(query.today) === "1";

  if (wantsToday) return "today";

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

function addAndCondition(where, condition) {
  if (!where[Op.and]) where[Op.and] = [];
  where[Op.and].push(condition);
}

export function buildPaymentAuditHistoryQuery(reqQuery = {}, options = {}) {
  const maxLimit = toPositiveInteger(options.maxLimit, 5000);
  const defaultLimit = toPositiveInteger(options.defaultLimit, 500);

  const moduleName = cleanString(
    reqQuery.moduleName ?? reqQuery.module_name,
    DEFAULT_MODULE_NAME
  );

  const paymentCloneIdRaw =
    reqQuery.paymentCloneId ?? reqQuery.payment_clone_id ?? reqQuery.paymentCloneTeamBId ?? reqQuery.payment_clone_team_b_id ?? reqQuery.rowId ?? reqQuery.row_id;
  const requestedLimit = toPositiveInteger(reqQuery.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const page = Math.max(1, toPositiveInteger(reqQuery.page, 1));
  const offset = (page - 1) * limit;

  const where = { moduleName };
  const mode = resolveHistoryMode(reqQuery);
  let todayRange = null;

  if (mode === "last24") {
    // IMPORTANT:
    // Use MySQL server time directly. Do not send JS Date upper/lower bound,
    // because live server/database timezone can make fresh rows look outside the range.
    // No upper bound is used, so newly inserted rows are not excluded by UTC/local mismatch.
    addAndCondition(
      where,
      literal("`PaymentChangeRequest`.`created_at` >= DATE_SUB(NOW(), INTERVAL 24 HOUR)")
    );
  }

  if (mode === "today") {
    todayRange = getPakistanTodayRange();
    where.created_at = {
      [Op.gte]: todayRange.start,
      [Op.lte]: todayRange.end,
    };
  }

  return {
    where,
    limit,
    offset,
    page,
    paymentCloneIdRaw,
    filters: {
      moduleName,
      mode,
      today: mode === "today",
      last24Hours: mode === "last24",
      timezone: PAKISTAN_TIME_ZONE,
      mysqlNowBased: mode === "last24",
      from:
        mode === "last24"
          ? "DATE_SUB(NOW(), INTERVAL 24 HOUR)"
          : todayRange?.start?.toISOString?.() || null,
      to:
        mode === "last24"
          ? "NOW()"
          : todayRange?.end?.toISOString?.() || null,
    },
  };
}
