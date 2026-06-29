import { parseHourFromValue } from "./time.js";

// Reverse sync: TodayDemo -> MonthlySheet
export const REVERSE_SYNC_FIELDS = [
  "demoTime",
  "timeHour",
  "tuitionName",
  "source",
  "country",
  "parentsContact",
  "className",
  "subjects",
  "daysPerWeek",
  "tutorName",
  "tutorFee",
  "rejectedTutor",
  "status",
  "feedback",
  "demoDate",
  "demoRating",
  "syncFlag",
  "classTime", // Added: Taaky target update se wapas main table mein sync ho sake
];

// Monthly -> TodayDemo mein in fields ko overwrite nahi karna
// status aur feedback yahan se hata diye gaye hain
export const NO_SYNC_FROM_TUITION_FIELDS = [
  "tutorName",
  "demoRating",
  "tutorFee",
];

// Target-only editable fields
export const TARGET_ONLY_FIELDS = [
  "rowColor",
  "tuitionNameColor",
  "orderIndex",
];

function normalizeDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "invalid date") return null;
  return s;
}

function normalizeHour(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function buildTodayDemoPayloadFromTuition(
  item,
  { skipFields = [] } = {}
) {
  const parsedHour = parseHourFromValue(item.demoTime ?? null);
  const existingHour = normalizeHour(item.timeHour);

  // Demo time ko source of truth rakho
  const timeHour = parsedHour ?? existingHour ?? null;

  const payload = {
    originalTuitionId: item.originalTuitionId || item.tuitionId,
    tuitionId: item.tuitionId,
    demoTime: item.demoTime || null,
    timeHour,
    tuitionName: item.tuitionName || null,
    source: item.source || null,
    country: item.country || null,
    parentsContact: item.parentsContact || null,
    className: item.className || null,
    subjects: item.subjects || null,
    daysPerWeek: item.daysPerWeek ?? item.days_per_week ?? null,
    tutorName: item.tutorName || null,
    tutorFee: item.tutorFee || null,
    rejectedTutor: item.rejectedTutor || null,

    // ye dono ab sync honge
    status: normalizeText(item.status),
    feedback: normalizeText(item.feedback),

    demoDate: normalizeDate(item.demoDate),
    demoRating: item.demoRating || null,
    syncFlag: item.syncFlag || null,
    
    // Added: Dono variants handle kar diye taaky data load hotay waqt miss na ho
    classTime: item.classTime ?? item.class_time ?? null, 
  };

  for (const field of skipFields) {
    delete payload[field];
  }

  return payload;
}

export async function upsertTodayDemoFromTuition({
  TodayDemo,
  item,
  transaction,
}) {
  const existing = await TodayDemo.findOne({
    where: { tuitionId: item.tuitionId },
    transaction,
  });

  // Agar TodayDemo mein row exist nahi karti to create kar do
  if (!existing) {
    const payload = buildTodayDemoPayloadFromTuition(item);

    return TodayDemo.create(
      {
        ...payload,
        rowColor: item.rowColor || "#ffffff",
        tuitionNameColor: item.tuitionNameColor || "#ffffff",
        orderIndex: item.orderIndex ?? 0,
      },
      { transaction }
    );
  }

  // Existing row par Monthly -> TodayDemo update
  // Ab status aur feedback overwrite honge
  const payload = buildTodayDemoPayloadFromTuition(item, {
    skipFields: NO_SYNC_FROM_TUITION_FIELDS,
  });

  return existing.update(payload, { transaction });
}

export async function removeTodayDemoByTuitionId({
  TodayDemo,
  tuitionId,
  transaction,
}) {
  return TodayDemo.destroy({
    where: { tuitionId },
    transaction,
  });
}