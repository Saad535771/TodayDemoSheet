import { movePaymentCloneWithDateToTrash } from "../utils/syncPaymentClonewithdateToTrash.js";

function toPlain(instanceOrObject) {
  if (!instanceOrObject) return null;
  if (typeof instanceOrObject.get === "function") {
    return instanceOrObject.get({ plain: true });
  }
  return JSON.parse(JSON.stringify(instanceOrObject));
}

function valuesAreSame(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function normalizeStatusValue(value) {
  if (Array.isArray(value)) {
    const clean = [...new Set(value.map((v) => String(v || "").trim()).filter(Boolean))];
    return clean.length ? clean.join(", ") : null;
  }

  const clean = [
    ...new Set(
      String(value || "")
        .split(/[|,]/)
        .map((v) => v.trim())
        .filter(Boolean)
    ),
  ];

  return clean.length ? clean.join(", ") : null;
}

const PAKISTAN_TIME_ZONE = "Asia/Karachi";

function getPakistanDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value || String(new Date().getFullYear()),
    month:
      parts.find((part) => part.type === "month")?.value ||
      String(new Date().getMonth() + 1).padStart(2, "0"),
    day: parts.find((part) => part.type === "day")?.value || "01",
  };
}

function getPakistanMonthStartDateString(date = new Date()) {
  const { year, month } = getPakistanDateParts(date);
  return `${year}-${month}-01`;
}

function getPakistanPreviousMonthStartDateString(date = new Date()) {
  const { year, month } = getPakistanDateParts(date);
  let y = Number(year);
  let m = Number(month) - 1;

  if (m < 1) {
    m = 12;
    y -= 1;
  }

  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function getPakistanMonthStartUtcDate(date = new Date()) {
  const { year, month } = getPakistanDateParts(date);

  // Pakistan is UTC+05:00. 1st day 00:00 PKT == previous UTC day 19:00.
  return new Date(Date.UTC(Number(year), Number(month) - 1, 0, 19, 0, 0, 0));
}

function wasRowUpdatedBeforeCurrentPakistanCycle(row = {}, date = new Date()) {
  const cycleStartUtc = getPakistanMonthStartUtcDate(date);
  const rawUpdatedAt = row?.updatedAt ?? row?.updated_at ?? row?.createdAt ?? row?.created_at;

  if (!rawUpdatedAt) return true;

  const updatedAt = rawUpdatedAt instanceof Date ? rawUpdatedAt : new Date(rawUpdatedAt);
  if (Number.isNaN(updatedAt.getTime())) return true;

  return updatedAt < cycleStartUtc;
}

function isInvalidDateInput(value) {
  if (value === null || value === undefined || value === "") return true;

  const raw = String(value).trim();
  if (!raw) return true;

  const lower = raw.toLowerCase();
  if (
    lower === "invalid date" ||
    lower === "nan" ||
    lower.includes("invalid date") ||
    lower.includes("nan")
  ) {
    return true;
  }

  if (/^0{4}[-/]0{1,2}(?:[-/]0{1,2})?$/.test(raw)) return true;
  if (/^0000[-/]00[-/]01$/.test(raw)) return true;

  return false;
}

function isValidYearMonthDay(year, month, day = 1) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 2200) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  const test = new Date(Date.UTC(y, m - 1, d));
  return (
    test.getUTCFullYear() === y &&
    test.getUTCMonth() === m - 1 &&
    test.getUTCDate() === d
  );
}

function normalizeDateOnly(value, fallback = null) {
  if (isInvalidDateInput(value)) return fallback;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    const { year, month, day } = getPakistanDateParts(value);
    return `${year}-${month}-${day}`;
  }

  const raw = String(value).trim();

  const isoMatch = raw.match(/^\s*(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = String(Number(isoMatch[2])).padStart(2, "0");
    const day = String(Number(isoMatch[3] || 1)).padStart(2, "0");

    if (!isValidYearMonthDay(year, month, day)) return fallback;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const { year, month, day } = getPakistanDateParts(parsed);
    if (!isValidYearMonthDay(year, month, day)) return fallback;
    return `${year}-${month}-${day}`;
  }

  return fallback;
}

function toMonthStartDateString(value, fallback = getPakistanMonthStartDateString()) {
  const normalized = normalizeDateOnly(value, null);
  if (!normalized) return fallback;

  const [year, month] = normalized.split("-");
  if (!isValidYearMonthDay(year, month, 1)) return fallback;

  return `${year}-${month}-01`;
}

function sanitizePaymentCloneDates(data = {}) {
  const hasPaymentDate = Object.prototype.hasOwnProperty.call(data, "paymentDate");
  const hasDate = Object.prototype.hasOwnProperty.call(data, "date");

  if (hasPaymentDate) {
    data.paymentDate = normalizeDateOnly(data.paymentDate, null);
  }

  if (hasDate) {
    data.date = normalizeDateOnly(data.date, null);
  }

  // Important:
  // paymentDate aur date ko copy nahi karna.
  // paymentDate manual hai, date month cycle hai.

  return data;
}

function statusHasTuitionCancelled(value) {
  return String(normalizeStatusValue(value) || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .includes("tuition cancelled");
}

function isManualMonthLockedRow(row = {}) {
  const tuitionId = String(row?.tuitionId ?? row?.tuition_id ?? "")
    .trim()
    .toLowerCase();
  const syncFlag = String(row?.syncFlag ?? row?.sync_flag ?? "")
    .trim()
    .toLowerCase();

  return tuitionId.startsWith("manual-") || syncFlag === "manual-month-locked";
}

function normalizeMonthKey(value) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return "";
  return String(month).padStart(2, "0");
}

function normalizeYearKey(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return "";
  return String(year);
}

function buildTargetCycleDate(targetMonth, targetYear) {
  const month = normalizeMonthKey(targetMonth);
  const year = normalizeYearKey(targetYear);

  if (!month || !year) return null;
  return `${year}-${month}-01`;
}

function applyPaymentCycleFields(payload = {}, beforeData = null, options = {}) {
  const currentCycleDate = getPakistanMonthStartDateString();
  const previousCycleDate = getPakistanPreviousMonthStartDateString();
  const targetCycleDate = buildTargetCycleDate(options?.targetMonth, options?.targetYear);

  const hasPaymentDatePatch = Object.prototype.hasOwnProperty.call(payload, "paymentDate");
  const hasDatePatch = Object.prototype.hasOwnProperty.call(payload, "date");

  // paymentDate manual Payment Date column hai.
  // Isay kabhi bhi month cycle/date ke sath auto-copy nahi karna.
  if (hasPaymentDatePatch) {
    payload.paymentDate = normalizeDateOnly(payload.paymentDate, null);
  }

  // date hidden/backend month-cycle field hai.
  if (hasDatePatch) {
    payload.date = normalizeDateOnly(payload.date, targetCycleDate || null);
  }

  // Create row agar specific month tab se aa rahi ho aur date missing ho,
  // to us selected tab/month ki cycle date set hogi. Payment Date blank rahegi.
  if (!beforeData && targetCycleDate && !hasDatePatch) {
    payload.date = targetCycleDate;
  }

  const hasStatusPatch = Object.prototype.hasOwnProperty.call(payload, "status");
  const beforeStatus = beforeData?.status;
  const nextStatus = hasStatusPatch ? payload.status : beforeStatus;

  const beforeCancelled = statusHasTuitionCancelled(beforeStatus);
  const nextCancelled = statusHasTuitionCancelled(nextStatus);

  if (beforeData && isManualMonthLockedRow(beforeData) && !hasDatePatch && !targetCycleDate) {
    // Manual rows created inside a selected month tab must stay in that same tab.
    // Normal monthly rollover should not pull them into the current month on edit/refresh.
    payload.date = toMonthStartDateString(
      beforeData?.date || beforeData?.createdAt || beforeData?.created_at,
      currentCycleDate
    );
    return payload;
  }

  if (nextCancelled && !beforeCancelled) {
    // New cancellation current Pakistan cycle/month mein lock hogi.
    if (!hasDatePatch && !targetCycleDate) {
      payload.date = currentCycleDate;
    }
    return payload;
  }

  if (nextCancelled && beforeCancelled) {
    // Old cancelled rows previous/current locked cycle mein rahengi.
    const fallbackLockedCycleDate = wasRowUpdatedBeforeCurrentPakistanCycle(beforeData)
      ? previousCycleDate
      : currentCycleDate;

    const lockedCycleDate = toMonthStartDateString(
      beforeData?.date ||
        beforeData?.createdAt ||
        beforeData?.created_at,
      fallbackLockedCycleDate
    );

    if (!hasDatePatch && !targetCycleDate) {
      payload.date = lockedCycleDate;
    }
    return payload;
  }

  // Sirf manual Payment Date update ho to month cycle disturb nahi karna.
  if (hasPaymentDatePatch && !hasStatusPatch && !hasDatePatch) {
    return payload;
  }

  // Active/non-cancelled existing rows current Pakistan month cycle mein move hongi.
  // Create row ke waqt selected month tab ki date already above set ho chuki hoti hai.
 if (beforeData && !hasDatePatch && !targetCycleDate) {
    const beforeDate = normalizeDateOnly(beforeData?.date ?? null, null);
    
    // ONLY push to the current cycle if the row previously belonged to the immediate previous cycle
    if (beforeDate === previousCycleDate) {
      payload.date = currentCycleDate;
    }
  }

  return payload;
}

const FIELD_ALIASES = {
  paymentDate: "dateWithMonth",
  date: "dateWithMonth",
  dateWithMonth: "dateWithMonth",
  className: "subjects",
  subjects: "subjects",
  tutorShare: "tutorFee",
  tutorFee: "tutorFee",
  lacasShare: "lacasShare",
  totalFees: "totalFees",
  tuitionName: "tuitionName",
  totalStudents: "totalStudents",
  country: "country",
  tutorName: "tutorName",
  status: "status",
  feedback: "feedback",
  contactNumber: "contactNumber",
  contactNo: "contactNumber",
  contact: "contactNumber",
  contact_number: "contactNumber",
  notes: "notes",
  otmName: "otmName",
  tuitionId: "tuitionId",
  rowColor: "rowColor",
  tuitionNameColor: "tuitionNameColor",
  daysPerWeek: "daysPerWeek",
  orderIndex: "orderIndex",
};

function normalizeFieldKey(field) {
  return FIELD_ALIASES[String(field || "").trim()] || String(field || "").trim();
}

function readCellValue(row, key) {
  if (!row || !key) return null;
  switch (key) {
    case "dateWithMonth":
      return row.dateWithMonth ?? row.paymentDate ?? row.date ?? null;
    case "subjects":
      return row.subjects ?? row.className ?? null;
    case "tutorFee":
      return row.tutorFee ?? row.tutorShare ?? null;
    case "contactNumber":
      return row.contactNumber ?? row.contact_number ?? row.contactNo ?? row.contact ?? null;
    default:
      return row[key] ?? null;
  }
}

function buildRowSnapshot(actionType, beforeData = null, afterData = null) {
  const action = String(actionType || "update").toLowerCase();

  if (action === "delete") {
    return beforeData ? { ...beforeData } : {};
  }

  if (action === "create") {
    return afterData ? { ...afterData } : {};
  }

  return {
    ...(beforeData || {}),
    ...(afterData || {}),
  };
}

function buildChangedCellDetails(beforeData = null, afterData = null, changedColumns = []) {
  const details = {};

  for (const rawKey of changedColumns) {
    const key = normalizeFieldKey(rawKey);
    if (!key || details[key]) continue;

    details[key] = {
      key,
      before: readCellValue(beforeData, key),
      after: readCellValue(afterData, key),
    };
  }

  return details;
}

export function makePaymentCloneController({
  PaymentClone,
  PaymentCloneTrash,
  PaymentChangeRequest,
  User,
}) {
  const allowedFields = [
    "tuitionId",
    "paymentDate",
    "date",
    "dateWithMonth",
    "tuitionName",
    "totalStudents",
    "country",
    "subjects",
    "className",
    "tutorName",
    "tutorFee",
    "tutorShare",
    "lacasShare",
    "totalFees",
    "status",
    "feedback",
    "contactNumber",
    "contactNo",
    "contact",
    "contact_number",
    "notes",
    "otmName",
    "syncFlag",
    "assignedStaffId",
    "isDeleted",
    "deletedFromTodayDemo",
    "assignedTo",
    "orderIndex",
    "rowColor",
    "tuitionNameColor",
    "daysPerWeek",
  ];

  function pickAllowed(body = {}) {
    const out = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        out[key] = body[key];
      }
    }
    return out;
  }

  function normalizePayload(body = {}) {
    const data = { ...body };

    if (
      Object.prototype.hasOwnProperty.call(data, "tutorShare") &&
      !Object.prototype.hasOwnProperty.call(data, "tutorFee")
    ) {
      data.tutorFee = data.tutorShare;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "className") &&
      !Object.prototype.hasOwnProperty.call(data, "subjects")
    ) {
      data.subjects = data.className;
    }

    if (Object.prototype.hasOwnProperty.call(data, "subjects")) {
      data.className = data.subjects;
    }


    if (Object.prototype.hasOwnProperty.call(data, "status")) {
      data.status = normalizeStatusValue(data.status);
    }

    if (
      !Object.prototype.hasOwnProperty.call(data, "contactNumber") &&
      Object.prototype.hasOwnProperty.call(data, "contact_number")
    ) {
      data.contactNumber = data.contact_number;
    }

    if (
      !Object.prototype.hasOwnProperty.call(data, "contactNumber") &&
      Object.prototype.hasOwnProperty.call(data, "contactNo")
    ) {
      data.contactNumber = data.contactNo;
    }

    if (
      !Object.prototype.hasOwnProperty.call(data, "contactNumber") &&
      Object.prototype.hasOwnProperty.call(data, "contact")
    ) {
      data.contactNumber = data.contact;
    }

    const nullIfEmpty = [
      "paymentDate",
      "date",
      "dateWithMonth",
      "tuitionName",
      "country",
      "subjects",
      "className",
      "tutorName",
      "feedback",
      "contactNumber",
      "notes",
      "otmName",
      "syncFlag",
      "assignedTo",
      "rowColor",
      "tuitionNameColor",
    ];

    const numberNullIfEmpty = [
      "totalStudents",
      "tutorFee",
      "lacasShare",
      "totalFees",
      "assignedStaffId",
      "orderIndex",
      "daysPerWeek",
    ];

    for (const key of nullIfEmpty) {
      if (data[key] === "") data[key] = null;
    }

    for (const key of numberNullIfEmpty) {
      if (data[key] === "") data[key] = null;
      if (data[key] !== null && data[key] !== undefined && data[key] !== "") {
        data[key] = Number(data[key]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "isDeleted")) {
      data.isDeleted = !!data.isDeleted;
    }

    if (Object.prototype.hasOwnProperty.call(data, "deletedFromTodayDemo")) {
      data.deletedFromTodayDemo = !!data.deletedFromTodayDemo;
    }

    sanitizePaymentCloneDates(data);

    delete data.tutorShare;
    delete data.contactNo;
    delete data.contact;
    delete data.contact_number;

    return data;
  }

  function serializeRow(row) {
    const raw = toPlain(row);
    if (!raw) return null;

    const subjects = raw.subjects ?? raw.className ?? null;
    const tutorFee = raw.tutorFee ?? raw.tutorShare ?? null;
    // date = backend/month-cycle field; paymentDate = manual Payment Date column.
    // Dono ko fallback/copy nahi karna, warna Payment Date default 1st-of-month show karegi.
    const date = normalizeDateOnly(raw.date ?? null, null);
    const paymentDate = normalizeDateOnly(raw.paymentDate ?? null, null);
    const status = normalizeStatusValue(raw.status);
    const contactNumber =
      raw.contactNumber ?? raw.contact_number ?? raw.contactNo ?? raw.contact ?? null;

    return {
      id: raw.id ?? null,
      tuitionId: raw.tuitionId ?? null,
      paymentDate,
      date,
      dateWithMonth: raw.dateWithMonth ?? null,
      tuitionName: raw.tuitionName ?? null,
      totalStudents: raw.totalStudents ?? null,
      country: raw.country ?? null,
      subjects,
      className: subjects,
      tutorName: raw.tutorName ?? null,
      tutorFee,
      tutorShare: tutorFee,
      lacasShare: raw.lacasShare ?? null,
      totalFees: raw.totalFees ?? null,
      status,
      feedback: raw.feedback ?? null,
      contactNumber,
      contactNo: contactNumber,
      contact: contactNumber,
      notes: raw.notes ?? null,
      otmName: raw.otmName ?? null,
      syncFlag: raw.syncFlag ?? null,
      assignedStaffId: raw.assignedStaffId ?? null,
      isDeleted: !!raw.isDeleted,
      deletedFromTodayDemo: !!raw.deletedFromTodayDemo,
      assignedTo: raw.assignedTo ?? null,
      orderIndex: raw.orderIndex ?? 0,
      rowColor: raw.rowColor ?? null,
      tuitionNameColor: raw.tuitionNameColor ?? null,
      daysPerWeek: raw.daysPerWeek ?? null,
      createdAt: raw.createdAt ?? raw.created_at ?? null,
      updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    };
  }

  function getChangedColumns(beforeData = null, afterData = null, explicitKeys = []) {
    const keys = new Set([
      ...allowedFields,
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {}),
      ...explicitKeys,
    ]);

    return [...keys]
      .filter((key) => key !== "id")
      .filter((key) => !valuesAreSame(beforeData?.[key], afterData?.[key]))
      .map((key) => normalizeFieldKey(key));
  }

  async function resolveActor(req) {
    const actor = {
      id: req.user?.id ?? null,
      role: req.user?.role ?? null,
      name: req.user?.name ?? null,
      email: req.user?.email ?? null,
    };

    if (!actor.id) return actor;
    if (actor.name && actor.email) return actor;
    if (!User) return actor;

    try {
      const dbUser = await User.findByPk(actor.id);
      if (dbUser) {
        actor.name = actor.name || dbUser.name || null;
        actor.email = actor.email || dbUser.email || null;
        actor.role = actor.role || dbUser.role || null;
      }
    } catch (err) {
      console.error("AUDIT ACTOR RESOLVE ERROR:", err);
    }

    return actor;
  }

  async function createAuditLog({
    req,
    actionType,
    paymentCloneId = null,
    changedColumns = [],
    beforeData = null,
    afterData = null,
    metadata = null,
  }) {
    if (!PaymentChangeRequest) return;

    const actor = await resolveActor(req);
    if (!actor.id) return;

    try {
      await PaymentChangeRequest.create({
        moduleName: "payment_sheet_with_date",
        paymentCloneId,
        actionType,
        actorUserId: actor.id,
        actorRole: actor.role || "staff",
        actorName: actor.name || actor.email || `User-${actor.id}`,
        actorEmail: actor.email || null,
        requestStatus: "approved",
        notificationType: "payment_sheet_with_date",
        notificationStatus: "unread",
        notificationSeenAt: null,
        changedColumns,
        beforeData,
        afterData,
        metadata,
        expiresAt: new Date("2099-12-31T23:59:59.000Z"),
      });
    } catch (err) {
      console.error("PAYMENT AUDIT LOG ERROR:", err);
    }
  }

  function buildAuditMetadata({
    actionType,
    rowId = null,
    beforeData = null,
    afterData = null,
    message,
  }) {
    const snapshot = buildRowSnapshot(actionType, beforeData, afterData);
    const changedColumns = getChangedColumns(beforeData, afterData, []);

    return {
      historyLabel:
        actionType === "create"
          ? "Create Row"
          : actionType === "delete"
            ? "Delete Row"
            : actionType === "restore"
              ? "Restore Row"
              : actionType === "reorder"
                ? "Reorder Rows"
                : "Update Row",
      message,
      historyRowId: rowId,
      originalPaymentCloneId: rowId,
      tuitionId: snapshot?.tuitionId ?? beforeData?.tuitionId ?? afterData?.tuitionId ?? null,
      tuitionName:
        snapshot?.tuitionName ?? beforeData?.tuitionName ?? afterData?.tuitionName ?? null,
      dateWithMonth:
        snapshot?.dateWithMonth ??
        snapshot?.paymentDate ??
        beforeData?.dateWithMonth ??
        beforeData?.paymentDate ??
        afterData?.dateWithMonth ??
        afterData?.paymentDate ??
        null,
      rowSnapshot: snapshot,
      changedCellDetails: buildChangedCellDetails(beforeData, afterData, changedColumns),
    };
  }

  async function syncCurrentPakistanPaymentCycle({ source = "auto" } = {}) {
    const rows = await PaymentClone.findAll();
    const currentCycleDate = getPakistanMonthStartDateString();
    const previousCycleDate = getPakistanPreviousMonthStartDateString();

    const summary = {
      source,
      currentCycleDate,
      previousCycleDate,
      activeMovedToCurrentMonth: 0,
      cancelledLockedToPreviousMonth: 0,
      cancelledKept: 0,
      unchanged: 0,
      total: rows.length,
    };

for (const row of rows) {
  const raw = toPlain(row);
  const cancelled = statusHasTuitionCancelled(raw?.status);
  const currentDate = normalizeDateOnly(raw?.date ?? null, null);

  if (isManualMonthLockedRow(raw)) {
    summary.unchanged += 1;
    continue;
  }

  // 1. Handle Blank Dates: Immediately lock them to March 2026
  if (!currentDate) {
    await row.update({ date: "2026-03-01" }, { silent: true });
    summary.unchanged += 1; 
    continue; // Stop further processing to keep it securely in March
  }

  // 2. Handle Cancelled Tuitions: Keep them in their locked month
  if (cancelled) {
    const rowIsOldCancellation = wasRowUpdatedBeforeCurrentPakistanCycle(raw);
    const lockedCycleDate =
      (currentDate === currentCycleDate && rowIsOldCancellation)
        ? previousCycleDate
        : toMonthStartDateString(currentDate, previousCycleDate);

    if (currentDate !== lockedCycleDate) {
      await row.update({ date: lockedCycleDate }, { silent: true });
      summary.cancelledLockedToPreviousMonth += 1;
    } else {
      summary.cancelledKept += 1;
    }
    continue;
  }

  // 3. Handle Active Tuitions: ONLY roll over from the immediate previous month
  if (currentDate === previousCycleDate) {
    await row.update({ date: currentCycleDate }, { silent: true });
    summary.activeMovedToCurrentMonth += 1;
  } else {
    // Older active months (May, April, March) will remain untouched
    summary.unchanged += 1;
  }
}
    if (summary.activeMovedToCurrentMonth || summary.cancelledLockedToPreviousMonth) {
      console.log("[PaymentCycleSync]", summary);
    }

    return summary;
  }


  return {
    async syncCurrentPakistanPaymentCycle(options = {}) {
      return syncCurrentPakistanPaymentCycle(options);
    },

    async list(req, res) {
      try {
        // Idempotent safety net: agar cron miss ho jaye ya server late start ho,
        // list/load par bhi Pakistan timezone ke current month cycle me rows sync ho jati hain.
        await syncCurrentPakistanPaymentCycle({ source: "list" });

        const rows = await PaymentClone.findAll({
          order: [
            ["orderIndex", "ASC"],
            ["updated_at", "DESC"],
          ],
        });

        return res.json({ items: rows.map(serializeRow) });
      } catch (err) {
        console.error("PAYMENT CLONE LIST ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error fetching payment clone rows",
        });
      }
    },

    async create(req, res) {
      try {
        const payload = applyPaymentCycleFields(
          normalizePayload(pickAllowed(req.body)),
          null,
          {
            targetMonth: req.body?.targetMonth,
            targetYear: req.body?.targetYear,
          }
        );

        let orderIndex = payload.orderIndex;
        if (orderIndex === undefined || orderIndex === null || orderIndex === "") {
          const lastRow = await PaymentClone.findOne({
            order: [["orderIndex", "DESC"]],
          });
          orderIndex = lastRow ? Number(lastRow.orderIndex || 0) + 1 : 0;
        }

        payload.orderIndex = orderIndex;

        if (!payload.tuitionId) {
          payload.tuitionId = `manual-${Date.now()}`;
        }

        const item = await PaymentClone.create(payload);
        const afterData = serializeRow(item);

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: item.id,
          changedColumns: getChangedColumns(null, afterData, Object.keys(payload)),
          beforeData: null,
          afterData,
          metadata: buildAuditMetadata({
            actionType: "create",
            rowId: item.id,
            beforeData: null,
            afterData,
            message: "Row created directly in payment sheet",
          }),
        });

        return res.json({ item: afterData });
      } catch (err) {
        console.error("PAYMENT CLONE CREATE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error creating payment clone row",
        });
      }
    },

    async update(req, res) {
      try {
        const { id } = req.params;
        const row = await PaymentClone.findByPk(id);

        if (!row) {
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        const beforeData = serializeRow(row);
        const payload = applyPaymentCycleFields(
          normalizePayload(pickAllowed(req.body)),
          beforeData,
          {
            targetMonth: req.body?.targetMonth,
            targetYear: req.body?.targetYear,
          }
        );

        await row.update(payload);

        const afterData = serializeRow(row);
        const changedColumns = getChangedColumns(beforeData, afterData, Object.keys(payload));
        try {
            const fieldsToTrack = [
                "paymentDate", "dateWithMonth", "tuitionName", "totalStudents", "country",
                "subjects", "className", "tutorName", "tutorFee", "lacasShare", "totalFees",
                "status", "feedback", "contactNumber", "notes", "otmName", "assignedStaffId",
                "rowColor", "tuitionNameColor", "daysPerWeek"
            ];
            const changes = [];

            fieldsToTrack.forEach((field) => {
                const oldVal = String(beforeData[field] || "");
                const newVal = String(afterData[field] || "");

                if (oldVal !== newVal) {
                    changes.push([
                        row.id, 
                        req.user?.id || null,
                        "UPDATE",
                        field,
                        oldVal,
                        newVal
                    ]);
                }
            });

            if (changes.length > 0) {
                const placeholders = changes.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
                const flatValues = changes.flat();
                await PaymentClone.sequelize.query(
                    `INSERT INTO payment_clone_histories (payment_clone_id, user_id, action_type, field_name, old_value, new_value) VALUES ${placeholders}`,
                    { replacements: flatValues }
                );
            }
        } catch (historyErr) {
            console.error("PAYMENT CLONE HISTORY SAVE ERROR:", historyErr);
        }
        if (changedColumns.length) {
          await createAuditLog({
            req,
            actionType: "update",
            paymentCloneId: row.id,
            changedColumns,
            beforeData,
            afterData,
            metadata: buildAuditMetadata({
              actionType: "update",
              rowId: row.id,
              beforeData,
              afterData,
              message: "Row updated directly in payment sheet",
            }),
          });
        }

        return res.json({ success: true, item: afterData });
      } catch (err) {
        console.error("PAYMENT CLONE UPDATE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error updating payment clone row",
        });
      }
    },

    async remove(req, res) {
      const transaction = await PaymentClone.sequelize.transaction();

      try {
        const { id } = req.params;

        const row = await PaymentClone.findByPk(id, { transaction });
        if (!row) {
          await transaction.rollback();
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        const beforeData = serializeRow(row);

        const moved = await movePaymentCloneWithDateToTrash({
          PaymentClone,
          PaymentCloneTrash,
          id,
          transaction,
        });

        if (!moved) {
          await transaction.rollback();
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        await transaction.commit();

        await createAuditLog({
          req,
          actionType: "delete",
          paymentCloneId: null,
          changedColumns: getChangedColumns(beforeData, null, Object.keys(beforeData || {})),
          beforeData,
          afterData: null,
          metadata: buildAuditMetadata({
            actionType: "delete",
            rowId: row.id,
            beforeData,
            afterData: null,
            message: "Row deleted from payment sheet and moved to trash",
          }),
        });

        return res.json({
          success: true,
          message: "Payment clone row moved to trash",
        });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE DELETE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error deleting payment clone row",
        });
      }
    },

    async reorder(req, res) {
      try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        const currentRows = await PaymentClone.findAll({
          attributes: ["id", "orderIndex"],
          order: [["orderIndex", "ASC"]],
        });

        const beforeOrder = currentRows.map((row) => ({
          id: row.id,
          orderIndex: Number(row.orderIndex) || 0,
        }));

        for (const entry of items) {
          const id = entry.id ?? entry.paymentId ?? entry.rowId;
          if (id === undefined || id === null) continue;

          await PaymentClone.update(
            { orderIndex: Number(entry.orderIndex) || 0 },
            { where: { id } }
          );
        }

        const updatedRows = await PaymentClone.findAll({
          attributes: ["id", "orderIndex"],
          order: [["orderIndex", "ASC"]],
        });

        const afterOrder = updatedRows.map((row) => ({
          id: row.id,
          orderIndex: Number(row.orderIndex) || 0,
        }));

        if (!valuesAreSame(beforeOrder, afterOrder)) {
          await createAuditLog({
            req,
            actionType: "reorder",
            paymentCloneId: null,
            changedColumns: ["orderIndex"],
            beforeData: null,
            afterData: null,
            metadata: {
              historyLabel: "Reorder Rows",
              beforeOrder,
              afterOrder,
              message: "Rows reordered in payment sheet",
            },
          });
        }

        return res.json({ success: true, message: "Reordered successfully" });
      } catch (err) {
        console.error("PAYMENT CLONE REORDER ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error reordering payment clone rows",
        });
      }
    },

    async listTrash(req, res) {
      try {
        const rows = await PaymentCloneTrash.findAll({
          order: [["updated_at", "DESC"]],
        });

        return res.json({ items: rows.map(serializeRow) });
      } catch (err) {
        console.error("PAYMENT CLONE TRASH LIST ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error fetching payment clone trash rows",
        });
      }
    },

    async restoreTrash(req, res) {
      const transaction = await PaymentClone.sequelize.transaction();

      try {
        const { id } = req.params;

        const trashRow = await PaymentCloneTrash.findByPk(id, { transaction });
        if (!trashRow) {
          await transaction.rollback();
          return res.status(404).json({ message: "Trash row not found" });
        }

        const payload = normalizePayload({
          tuitionId: trashRow.tuitionId || `restored-${Date.now()}-${trashRow.id}`,
          paymentDate: trashRow.paymentDate ?? null,
          date: trashRow.date ?? null,
          dateWithMonth: trashRow.dateWithMonth ?? null,
          tuitionName: trashRow.tuitionName ?? null,
          totalStudents: trashRow.totalStudents ?? null,
          country: trashRow.country ?? null,
          subjects: trashRow.subjects ?? trashRow.className ?? null,
          className: trashRow.subjects ?? trashRow.className ?? null,
          tutorName: trashRow.tutorName ?? null,
          tutorFee: trashRow.tutorFee ?? trashRow.tutorShare ?? null,
          lacasShare: trashRow.lacasShare ?? null,
          totalFees: trashRow.totalFees ?? null,
          status: trashRow.status ?? null,
          feedback: trashRow.feedback ?? null,
          contactNumber:
            trashRow.contactNumber ??
            trashRow.contact_number ??
            trashRow.contactNo ??
            trashRow.contact ??
            null,
          notes: trashRow.notes ?? null,
          otmName: trashRow.otmName ?? null,
          syncFlag: trashRow.syncFlag ?? null,
          assignedStaffId: trashRow.assignedStaffId ?? null,
          deletedFromTodayDemo: !!trashRow.deletedFromTodayDemo,
          assignedTo: trashRow.assignedTo ?? null,
          orderIndex: trashRow.orderIndex ?? 0,
          rowColor: trashRow.rowColor ?? null,
          tuitionNameColor: trashRow.tuitionNameColor ?? null,
          daysPerWeek: trashRow.daysPerWeek ?? 0,
        });

        const restored = await PaymentClone.create(payload, { transaction });
        await trashRow.destroy({ transaction });
        await transaction.commit();

        const afterData = serializeRow(restored);

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: restored.id,
          changedColumns: getChangedColumns(null, afterData, Object.keys(payload)),
          beforeData: null,
          afterData,
          metadata: {
            ...buildAuditMetadata({
              actionType: "restore",
              rowId: restored.id,
              beforeData: null,
              afterData,
              message: "Row restored from trash to payment sheet",
            }),
            restoredFromTrashId: trashRow.id,
          },
        });

        return res.json({
          success: true,
          item: afterData,
          message: "Trash row restored successfully",
        });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE RESTORE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error restoring trash row",
        });
      }
    },

    async notificationCount(req, res) {
      try {
        if (!PaymentChangeRequest) {
          return res.json({ count: 0 });
        }

        const count = await PaymentChangeRequest.count({
          where: {
            moduleName: "payment_sheet_with_date",
            notificationStatus: "unread",
          },
        });

        return res.json({ count });
      } catch (err) {
        console.error("PAYMENT NOTIFICATION COUNT ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error fetching payment notification count",
        });
      }
    },

    async markNotificationsRead(req, res) {
      try {
        if (!PaymentChangeRequest) {
          return res.json({ success: true });
        }

        await PaymentChangeRequest.update(
          {
            notificationStatus: "read",
            notificationSeenAt: new Date(),
          },
          {
            where: {
              moduleName: "payment_sheet_with_date",
              notificationStatus: "unread",
            },
          }
        );

        return res.json({ success: true });
      } catch (err) {
        console.error("PAYMENT NOTIFICATION READ ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error marking payment notifications as read",
        });
      }
    },
// --- NEW ADMIN HISTORY FETCH API (TEAM A) ---
  // --- NEW ADMIN HISTORY FETCH API (TEAM A) ---
    async getPaymentHistory(req, res) {
      try {
        // req.query se directly generic 'rowId' get kar rahy hain
        const { search, startDate, endDate, sort = "DESC", page = 1, limit = 50, rowId, fieldName } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
          SELECT ph.*, u.name as edited_by 
          FROM payment_clone_histories ph
          LEFT JOIN users u ON ph.user_id = u.id
          WHERE 1=1
        `;
        const replacements = [];

        if (rowId) {
          query += ` AND ph.payment_clone_id = ?`;
          replacements.push(Number(rowId));
        }
        if (fieldName) {
          query += ` AND ph.field_name = ?`;
          replacements.push(fieldName);
        }

        if (!startDate && !endDate && !rowId) {
          query += ` AND ph.created_at >= NOW() - INTERVAL 24 HOUR`;
        } else {
          if (startDate) {
            query += ` AND ph.created_at >= ?`;
            replacements.push(`${startDate} 00:00:00`);
          }
          if (endDate) {
            query += ` AND ph.created_at <= ?`;
            replacements.push(`${endDate} 23:59:59`);
          }
        }

        if (search) {
          query += ` AND (ph.field_name LIKE ? OR u.name LIKE ? OR ph.old_value LIKE ? OR ph.new_value LIKE ?)`;
          const searchPattern = `%${search}%`;
          replacements.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const sortOrder = sort.toUpperCase() === "ASC" ? "ASC" : "DESC";
        query += ` ORDER BY ph.created_at ${sortOrder} LIMIT ? OFFSET ?`;
        replacements.push(Number(limit), Number(offset));

        // Use standard "SELECT" string to prevent undefined QueryTypes errors
        const historyData = await PaymentClone.sequelize.query(query, {
          replacements,
          type: "SELECT"
        });

        res.json({ success: true, data: historyData });
      } catch (error) {
        console.error("Fetch Payment History Error:", error);
        // Error details response mein bhej rahy hain taa k debugging aasaan ho
        res.status(500).json({ message: "Error fetching history", error: error.message });
      }
    },

    
    async forceDeleteTrash(req, res) {
      try {
        const { id } = req.params;
        const row = await PaymentCloneTrash.findByPk(id);

        if (!row) {
          return res.status(404).json({ message: "Trash row not found" });
        }

        await row.destroy();

        return res.json({
          success: true,
          message: "Trash row permanently deleted",
        });
      } catch (err) {
        console.error("PAYMENT CLONE FORCE DELETE TRASH ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error deleting trash row permanently",
        });
      }
    },
  };
}