import { parseHourFromValue } from "./time.js";

// Reverse sync: TodayDemo -> MonthlySheet
export const REVERSE_SYNC_FIELDS = [
  "tutorName",
  "status",
  "rejectedTutor",
  "feedback",
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

export function buildTodayDemoPayloadFromTuition(item) {
  const parsedHour = parseHourFromValue(item.demoTime ?? null);
  const existingHour = normalizeHour(item.timeHour);

  // Demo time ko source of truth rakho
  // Agar demoTime parse ho jaye to usi ko prefer karo
  const timeHour = parsedHour ?? existingHour ?? null;

  return {
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
    tutorName: item.tutorName || null,
    tutorFee: item.tutorFee || null,
    rejectedTutor: item.rejectedTutor || null,
    status: item.status || null,
    feedback: item.feedback || null,
    demoDate: normalizeDate(item.demoDate),
    demoRating: item.demoRating || null,
    syncFlag: item.syncFlag || null,
  };
}

export async function upsertTodayDemoFromTuition({
  TodayDemo,
  item,
  transaction,
}) {
  const payload = buildTodayDemoPayloadFromTuition(item);

  const existing = await TodayDemo.findOne({
    where: { tuitionId: payload.tuitionId },
    transaction,
  });

  if (!existing) {
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

  // Target-only fields overwrite nahi karni
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