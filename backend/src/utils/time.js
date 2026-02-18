/**
 * Parse hour from values like:
 *  - "10am", "10:00 AM", "13:00"
 *  - Date object (if client sends ISO string, handle separately)
 *  - number like 0.5 (Google sheets time fraction) or 13
 */
export function parseHourFromValue(value) {
  if (value === null || value === undefined || value === "") return null;

  // If it's already a number
  if (typeof value === "number") {
    if (value > 0 && value < 1) return Math.floor(value * 24);
    if (Number.isInteger(value) && value >= 0 && value <= 24) return value === 24 ? 0 : value;
    const frac = value % 1;
    if (frac !== 0) return Math.floor(frac * 24);
    return Math.floor(value % 24);
  }

  // If it's a Date instance
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getHours();

  // ISO date-time string
  if (typeof value === "string") {
    const s = value.trim().toLowerCase().replace(/[\s\.]+/g, "");
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?(a|p)m?$/);
    if (m) {
      let hh = parseInt(m[1], 10);
      const ap = m[3];
      if (ap === "p" && hh < 12) hh += 12;
      if (ap === "a" && hh === 12) hh = 0;
      if (hh >= 0 && hh <= 23) return hh;
    }

    const m24 = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      const hh = parseInt(m24[1], 10);
      if (hh >= 0 && hh <= 23) return hh;
    }

    // try Date parse
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt.getHours();
  }

  return null;
}

export function hourToSlotHeader(hour) {
  const fmt = (h) => {
    let hh = h % 12; if (hh === 0) hh = 12;
    const ap = h >= 12 ? "pm" : "am";
    return `${hh}${ap}`;
  };
  return `time${fmt(hour)}to${fmt((hour + 1) % 24)}`;
}

export function hourToDisplayRange(hour) {
  const toLabel = (h) => {
    const d = new Date(Date.UTC(2000, 0, 1, h, 0, 0));
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  };
  return `${toLabel(hour)} - ${toLabel((hour + 1) % 24)}`;
}

export function hourToPrettyTime(hour) {
  const d = new Date(Date.UTC(2000, 0, 1, hour, 0, 0));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

export const FILTER_VALUES = ["Followup", "Today Demo", "Future Demo"];
export const DEMO_RATING_VALUES = ["Average Demo", "Strong Demo", "Weak Demo"];

export function computeFilterStatus(demoDate, now = new Date(), tz = "Asia/Karachi") {
  if (!demoDate) return { status: "", color: "#ffffff", fontColor: "#000000" };

  // Convert now and demoDate into tz-midnight dates by using Intl.DateTimeFormat parts.
  const toMidnight = (d) => {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = fmt.formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    // Parts are YYYY-MM-DD in en-CA
    return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00`);
  };

  const today = toMidnight(now);
  const dd = toMidnight(new Date(demoDate));

  const diffDays = Math.round((dd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: "Followup", color: "#000000", fontColor: "#ffffff" };
  if (diffDays >= 0 && diffDays < 2) return { status: "Today Demo", color: "#34a853", fontColor: "#ffffff" };
  return { status: "Future Demo", color: "#4285f4", fontColor: "#ffffff" };
}
