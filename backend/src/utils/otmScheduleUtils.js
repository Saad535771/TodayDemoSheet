export const OTM_DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const OTM_STATUS_OPTIONS = [
  "",
  "class done",
  "class pending",
  "missed by teacher",
  "missed by student",
  "tuition pause",
];

export const OTM_DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

export const DAY_ORDER_INDEX = OTM_DAY_OPTIONS.reduce((acc, day, index) => {
  acc[day.toLowerCase()] = index;
  return acc;
}, {});

export function getDayOrderIndex(day) {
  const cleaned = normalizeString(day);
  if (!cleaned) return Number.MAX_SAFE_INTEGER;
  return DAY_ORDER_INDEX[cleaned.toLowerCase()] ?? Number.MAX_SAFE_INTEGER;
}

export function sortDays(days = []) {
  return normalizeArrayInput(days).sort((a, b) => getDayOrderIndex(a) - getDayOrderIndex(b));
}

export function buildDefaultTimeSlots() {
  const slots = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      const h12 = ((hour + 11) % 12) + 1;
      const suffix = hour >= 12 ? "PM" : "AM";
      slots.push(`${h12}:${pad2(minute)} ${suffix}`);
    }
  }
  return slots;
}

export const OTM_TIME_OPTIONS = buildDefaultTimeSlots();

export function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim();
  return cleaned === "" ? null : cleaned;
}

export function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  const cleaned = String(value || "").trim().toLowerCase();
  return ["true", "yes", "y", "on"].includes(cleaned);
}

export function uniqueArray(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return uniqueArray(
      value
        .map((item) => normalizeString(item))
        .filter(Boolean)
    );
  }

  const cleaned = normalizeString(value);
  if (!cleaned) return [];

  return uniqueArray(
    cleaned
      .split(",")
      .map((item) => normalizeString(item))
      .filter(Boolean)
  );
}

export function parseDurationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  const cleaned = String(value || "").trim().toLowerCase();
  if (!cleaned) return 60;

  if (/^\d+$/.test(cleaned)) {
    return Number(cleaned);
  }

  if (cleaned.includes("1.5")) return 90;
  if (cleaned.includes("2.5")) return 150;
  if (cleaned.includes("3")) return 180;
  if (cleaned.includes("2")) return 120;
  return 60;
}

export function durationLabelFromMinutes(minutes) {
  const found = OTM_DURATION_OPTIONS.find((item) => item.value === Number(minutes));
  return found?.label || `${minutes} min`;
}

export function normalizeTimeLabel(timeLabel) {
  const cleaned = normalizeString(timeLabel);
  if (!cleaned) return null;

  const compact = cleaned.replace(/\s+/g, "");
  const match = compact.match(/^(\d{1,2})(?::?(\d{1,2}))?(am|pm)$/i);
  if (!match) return cleaned;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const suffix = match[3].toUpperCase();

  if (!Number.isFinite(hour) || hour < 1 || hour > 12) return cleaned;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return cleaned;

  return `${hour}:${pad2(minute)} ${suffix}`;
}

export function parseTimeToMinutes(timeLabel) {
  const cleaned = normalizeTimeLabel(timeLabel);
  if (!cleaned) return null;

  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3].toUpperCase();

  if (suffix === "AM" && hour === 12) hour = 0;
  if (suffix === "PM" && hour !== 12) hour += 12;

  return hour * 60 + minute;
}

export function formatMinutesToTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return null;

  let normalized = totalMinutes % (24 * 60);
  if (normalized < 0) normalized += 24 * 60;

  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;

  const suffix = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  return `${hour12}:${pad2(minute)} ${suffix}`;
}

export function addMinutesToTime(timeLabel, minutesToAdd) {
  const startMinutes = parseTimeToMinutes(timeLabel);
  if (!Number.isFinite(startMinutes)) return null;
  return formatMinutesToTime(startMinutes + Number(minutesToAdd || 0));
}

export function joinLabels(values = []) {
  return normalizeArrayInput(values).join(", ");
}

export function normalizeMonthValue(value) {
  const cleaned = normalizeString(value);
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

export function extractYearFromMonth(value) {
  const monthValue = normalizeMonthValue(value);
  return monthValue ? monthValue.slice(0, 4) : null;
}

export function extractMonthPart(value) {
  const monthValue = normalizeMonthValue(value);
  return monthValue ? monthValue.slice(5, 7) : null;
}

export function normalizeTimeAssignments(value = {}, days = []) {
  const output = {};

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const day of sortDays(days)) {
      output[day] = normalizeTimeLabel(value?.[day]);
    }
    return output;
  }

  const slots = normalizeArrayInput(value).map((slot) => normalizeTimeLabel(slot));
  const normalizedDays = sortDays(days);

  normalizedDays.forEach((day, index) => {
    output[day] = slots[index] || slots[0] || null;
  });

  return output;
}

export function buildScheduleFields({ days, timeSlots, durationMinutes }) {
  const normalizedDays = sortDays(days);
  const normalizedSlots = normalizeArrayInput(timeSlots).map((slot) => normalizeTimeLabel(slot));
  const minutes = parseDurationMinutes(durationMinutes);

  const classStartTimes = [...normalizedSlots];
  const classEndTimes = normalizedSlots
    .map((slot) => addMinutesToTime(slot, minutes))
    .filter(Boolean);

  return {
    days: normalizedDays,
    day: normalizedDays.join(", "),
    timeSlots: normalizedSlots,
    time: normalizedSlots.join(", "),
    durationMinutes: minutes,
    durationLabel: durationLabelFromMinutes(minutes),
    classStartTimes,
    classEndTimes,
    classStartTime: classStartTimes.join(", "),
    classEndTime: classEndTimes.join(", "),
  };
}

export function countBy(values = []) {
  return values.reduce((acc, value) => {
    const key = normalizeString(value) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function parseDecidedFee(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/* ==========================================================================
   ADDED / UPDATED SYNC & ROW BUILDER HELPER FUNCTIONS (UTILS)
   ========================================================================== */

export function toPlainEntries(entries = []) {
  return entries.map((item) => (typeof item.get === "function" ? item.get({ plain: true }) : item));
}

export function sortEntries(entries = []) {
  return [...entries].sort((a, b) => {
    const orderA = Number(a.sortOrder || 0);
    const orderB = Number(b.sortOrder || 0);
    if (orderA !== orderB) return orderA - orderB;
    const dayCompare = getDayOrderIndex(a.day) - getDayOrderIndex(b.day);
    if (dayCompare !== 0) return dayCompare;
    return Number(a.id || 0) - Number(b.id || 0);
  });
}

export function buildSummary(entries = []) {
  return {
    totalEntries: entries.length,
    byStatus: countBy(entries.map((item) => item.status)),
    byDay: countBy(entries.flatMap((item) => (Array.isArray(item.days) ? item.days : normalizeArrayInput(item.day)))),
    byTeacher: countBy(entries.map((item) => item.tutorName || "Unassigned")),
  };
}

export function buildReportRows(entries = []) {
  const map = new Map();
  for (const item of entries) {
    const teacherName = normalizeString(item.tutorName) || "Unassigned";
    const tuitionName = normalizeString(item.tuitionName) || "Untitled Tuition";
    const groupName = normalizeString(item.groupName) || null;
    const reportStatus = normalizeString(item.reportStatus) || "pending report";
    const key = `${teacherName}__${tuitionName}`;

    if (!map.has(key)) {
      map.set(key, {
        teacherName,
        tuitionName,
        groupName,
        reportStatus,
        totalClasses: 0,
        classDoneCount: 0,
        classPendingCount: 0,
        missedByTeacherCount: 0,
        missedByStudentCount: 0,
        days: [],
        rowColor: normalizeString(item.rowColor),
        sortOrder: Number(item.sortOrder || 0),
      });
    }

    const row = map.get(key);
    row.totalClasses += 1;
    row.rowColor = row.rowColor || normalizeString(item.rowColor);
    row.sortOrder = Math.min(row.sortOrder, Number(item.sortOrder || 0));

    if (item.status === "class done") row.classDoneCount += 1;
    if (item.status === "class pending") row.classPendingCount += 1;
    if (item.status === "missed by teacher") row.missedByTeacherCount += 1;
    if (item.status === "missed by student") row.missedByStudentCount += 1;
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      day: row.days.join(", "),
    }))
    .sort((a, b) => {
      if (a.teacherName === b.teacherName) {
        return a.tuitionName.localeCompare(b.tuitionName);
      }
      return a.teacherName.localeCompare(b.teacherName);
    });
}

export function buildTotalClassRows(entries = []) {
  const map = new Map();

  // Step 1: Group entries by Tuition and Tutor to aggregate schedule info
  for (const item of entries) {
    const tuitionName = normalizeString(item.tuitionName) || "Untitled Tuition";
    const tutorName = normalizeString(item.tutorName) || "Unassigned";
    const groupName = normalizeString(item.groupName) || null;
    const key = `${tuitionName}__${tutorName}`;

    if (!map.has(key)) {
      map.set(key, {
        tuitionName,
        tutorName,
        groupName,
        daysList: new Set(),
        duration: item.durationLabel || "1 hour",
        decidedFee: parseDecidedFee(item.decidedFee) || 0,
        totalEntriesCount: 0,
        classDoneCount: 0,
        classPendingCount: 0,
        missedByTeacherCount: 0,
        missedByStudentCount: 0,
        rowColor: normalizeString(item.rowColor),
        sortOrder: Number(item.sortOrder || 0),
      });
    }

    const row = map.get(key);
    row.totalEntriesCount += 1;
    row.rowColor = row.rowColor || normalizeString(item.rowColor);
    row.sortOrder = Math.min(row.sortOrder, Number(item.sortOrder || 0));

    // Collect individual days configured for this tuition
    const itemDays = Array.isArray(item.days) ? item.days : normalizeArrayInput(item.day);
    itemDays.forEach(d => row.daysList.add(d));

    // Count statuses across entries
    if (item.status === "class done") row.classDoneCount += 1;
    if (item.status === "class pending") row.classPendingCount += 1;
    if (item.status === "missed by teacher") row.missedByTeacherCount += 1;
    if (item.status === "missed by student") row.missedByStudentCount += 1;
  }

  // Step 2: Calculate Monthly Projections and Fee Logic
  return [...map.values()].map((row) => {
    const sortedDaysArray = sortDays([...row.daysList]);
    const numberOfDecidedDays = sortedDaysArray.length;
    
    // As requested: e.g. 3 days a week * 4 weeks = 12 classes in a month
    const classesInAMonth = numberOfDecidedDays * 4;

    const decidedFee = Number(row.decidedFee || 0);
    
    // Per day fee calculation (Decided Fee / Total Classes in a Month)
    const perDayFee = classesInAMonth > 0 ? decidedFee / classesInAMonth : 0;

    // Teacher missed classes deduct from total fee, student missed classes do NOT deduct
    const teacherMissedDeduction = row.missedByTeacherCount * perDayFee;
    let totalFee = decidedFee - teacherMissedDeduction;
    if (totalFee < 0) totalFee = 0;

    return {
      tuitionName: row.tuitionName,
      tutorName: row.tutorName,
      groupName: row.groupName,
      numberOfDecidedDays,
      durationTime: row.duration,
      classesInAMonth,
      decidedFee: decidedFee > 0 ? decidedFee : null,
      totalDoneClasses: row.classDoneCount,
      missedByStudentClasses: row.missedByStudentCount,
      missedByTeacherClass: row.missedByTeacherCount,
      totalFee: totalFee > 0 ? Number(totalFee.toFixed(2)) : null,
      days: sortedDaysArray.join(", "),
      time: "", // Can be mapped if needed based on slots
      duration: row.duration,
      status:
        row.classPendingCount > 0
          ? "class pending"
          : row.missedByTeacherCount > 0
          ? "missed by teacher"
          : row.missedByStudentCount > 0
          ? "missed by student"
          : row.classDoneCount > 0
          ? "class done"
          : "class pending",
      totalClasses: classesInAMonth,
      rowColor: row.rowColor,
      sortOrder: row.sortOrder,
    };
  }).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.tuitionName.localeCompare(b.tuitionName)
  );
}