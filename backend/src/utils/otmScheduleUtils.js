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

export function normalizeNullableBoolean(value) {
  if (value === undefined || value === null || value === "") return null;
  if (value === true || value === false) return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  const cleaned = String(value || "").trim().toLowerCase();
  if (["true", "yes", "y", "on"].includes(cleaned)) return true;
  if (["false", "no", "n", "off"].includes(cleaned)) return false;
  return null;
}

export function uniqueArray(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return uniqueArray(value.map((item) => normalizeString(item)).filter(Boolean));
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

  const monthMatch = cleaned.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return `${monthMatch[1]}-${monthMatch[2]}`;
  }

  const dateMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}`;
  }

  return null;
}

export function normalizeDateValue(value) {
  const cleaned = normalizeString(value);
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
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

export function getWeekLabelFromDate(dateValue) {
  const normalized = normalizeDateValue(dateValue);
  if (!normalized) return null;
  const dayOfMonth = Number(normalized.slice(8, 10));
  if (dayOfMonth <= 7) return "Week1";
  if (dayOfMonth <= 14) return "Week2";
  if (dayOfMonth <= 21) return "Week3";
  return "Week4";
}

export function addDaysToDateValue(dateValue, daysToAdd = 0) {
  const normalized = normalizeDateValue(dateValue);
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + Number(daysToAdd || 0));
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function deriveTuitionCalendarFields({
  tuitionStartDate,
  tuitionStartMonth,
  status,
}) {
  let startDate = normalizeDateValue(tuitionStartDate);

  if (!startDate) {
    const monthOnly = normalizeMonthValue(tuitionStartMonth);
    if (monthOnly) {
      startDate = `${monthOnly}-01`;
    }
  }

  const startMonth = normalizeMonthValue(startDate || tuitionStartMonth);
  const startWeek = getWeekLabelFromDate(startDate);
  const normalizedStatus = (normalizeString(status) || "").toLowerCase();
  const pauseNextCycle = normalizedStatus === "tuition pause";
  const endDate = startDate
    ? pauseNextCycle
      ? startDate
      : addDaysToDateValue(startDate, 30)
    : null;

  return {
    tuitionStartDate: startDate,
    tuitionStartWeek: startWeek,
    tuitionStartMonth: startMonth,
    tuitionEndMonth: normalizeMonthValue(endDate),
    pauseNextCycle,
  };
}

export function countBy(values = []) {
  return values.reduce((acc, value) => {
    const key = normalizeString(value) || "Blank";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
