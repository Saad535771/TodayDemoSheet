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
  "class done",
  "class pending",
  "missed by teacher",
  "missed by student",
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

export function buildDefaultTimeSlots() {
  const slots = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
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

export function parseTimeToMinutes(timeLabel) {
  const cleaned = normalizeString(timeLabel);
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

  let hour24 = Math.floor(normalized / 60);
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

export function buildScheduleFields({ days, timeSlots, durationMinutes }) {
  const normalizedDays = normalizeArrayInput(days);
  const normalizedSlots = normalizeArrayInput(timeSlots);
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
