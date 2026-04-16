import React, { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_STATUS_OPTIONS = [
  "",
  "class done",
  "class pending",
  "missed by teacher",
  "missed by student",
  "tuition pause",
];

const DEFAULT_DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const NEW_TUITION_OPTIONS = [
  { value: "", label: "Select" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];
const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAY_INDEX = DEFAULT_DAY_OPTIONS.reduce((acc, day, index) => {
  acc[day.toLowerCase()] = index;
  return acc;
}, {});

function normalizeString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeString(item)).filter(Boolean))];
  }
  const text = normalizeString(value);
  if (!text) return [];
  return [...new Set(text.split(",").map((item) => item.trim()).filter(Boolean))];
}

function sortDays(days = []) {
  return normalizeArray(days).sort((a, b) => (DAY_INDEX[a.toLowerCase()] ?? 999) - (DAY_INDEX[b.toLowerCase()] ?? 999));
}

function normalizeTimeText(value) {
  const text = normalizeString(value).replace(/\s+/g, "");
  if (!text) return "";
  const match = text.match(/^(\d{1,2})(?::?(\d{1,2}))?(am|pm)$/i);
  if (!match) return normalizeString(value);
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const suffix = match[3].toUpperCase();
  if (!Number.isFinite(hour) || hour < 1 || hour > 12) return normalizeString(value);
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return normalizeString(value);
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function toMinutes(timeLabel) {
  const normalized = normalizeTimeText(timeLabel);
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3].toUpperCase();
  if (suffix === "AM" && hour === 12) hour = 0;
  if (suffix === "PM" && hour !== 12) hour += 12;
  return hour * 60 + minute;
}

function formatTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return "";
  let normalized = totalMinutes % (24 * 60);
  if (normalized < 0) normalized += 24 * 60;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function addMinutes(timeLabel, minutesToAdd) {
  const start = toMinutes(timeLabel);
  if (!Number.isFinite(start)) return "";
  return formatTime(start + Number(minutesToAdd || 0));
}

function normalizeMonthValue(value) {
  const text = normalizeString(value);
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.slice(0, 7);
  return "";
}

function normalizeDateValue(value) {
  const text = normalizeString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function getDurationLabel(options, value) {
  const found = options.find((item) => Number(item.value) === Number(value));
  return found?.label || `${value} min`;
}

function getWeekLabel(dateValue) {
  const normalized = normalizeDateValue(dateValue);
  if (!normalized) return "";
  const day = Number(normalized.slice(8, 10));
  if (day <= 7) return "Week1";
  if (day <= 14) return "Week2";
  if (day <= 21) return "Week3";
  return "Week4";
}

function addDays(dateValue, daysToAdd) {
  const normalized = normalizeDateValue(dateValue);
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + Number(daysToAdd || 0));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getStatusMeta(status) {
  const value = normalizeString(status).toLowerCase();
  if (!value) {
    return { label: "Select Status", background: "#ffffff", color: "#475569", border: "#cbd5e1" };
  }
  if (value === "class done") {
    return { label: "Class Done", background: "#dcfce7", color: "#166534", border: "#86efac" };
  }
  if (value === "class pending") {
    return { label: "Class Pending", background: "#fef3c7", color: "#92400e", border: "#fcd34d" };
  }
  if (value === "tuition pause") {
    return { label: "Tuition Pause", background: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" };
  }
  if (value === "missed by teacher") {
    return { label: "Missed by Teacher", background: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  }
  return { label: "Missed by Student", background: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
}

function deriveCalendar(dateValue, statusValue = "") {
  const tuitionStartDate = normalizeDateValue(dateValue);
  const tuitionStartWeek = getWeekLabel(tuitionStartDate);
  const tuitionStartMonth = normalizeMonthValue(tuitionStartDate);
  const tuitionEndMonth = normalizeString(statusValue).toLowerCase() === "tuition pause"
    ? tuitionStartMonth
    : normalizeMonthValue(addDays(tuitionStartDate, 30));
  return { tuitionStartDate, tuitionStartWeek, tuitionStartMonth, tuitionEndMonth };
}

function formatNewTuitionValue(value) {
  if (value === true || value === "true") return "true";
  if (value === false || value === "false") return "false";
  return "";
}

function parseNewTuitionValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function computeRow(row, durationOptions) {
  const day = normalizeString(row.day) || normalizeArray(row.days)[0] || "";
  const days = day ? [day] : normalizeArray(row.days);
  const time = normalizeTimeText(row.time || normalizeArray(row.timeSlots)[0] || "");
  const durationMinutes = Number(row.durationMinutes || 60);
  const classStartTime = time || normalizeString(row.classStartTime);
  const classEndTime = classStartTime ? addMinutes(classStartTime, durationMinutes) : normalizeString(row.classEndTime);
  const calendar = deriveCalendar(row.tuitionStartDate || row.tuitionStartMonth || "", row.status);

  return {
    ...row,
    day,
    days,
    time,
    durationMinutes,
    durationLabel: getDurationLabel(durationOptions, durationMinutes),
    classStartTime,
    classEndTime,
    notes: row.notes || "",
    newTuition: parseNewTuitionValue(formatNewTuitionValue(row.newTuition)),
    status: normalizeString(row.status).toLowerCase(),
    tuitionStartDate: calendar.tuitionStartDate || normalizeDateValue(row.tuitionStartDate),
    tuitionStartWeek: calendar.tuitionStartWeek || normalizeString(row.tuitionStartWeek),
    tuitionStartMonth: calendar.tuitionStartMonth || normalizeMonthValue(row.tuitionStartMonth),
    tuitionEndMonth: calendar.tuitionEndMonth || normalizeMonthValue(row.tuitionEndMonth),
  };
}

function makeEmptyDraft(durationOptions) {
  return {
    days: [],
    timeAssignments: {},
    durationMinutes: Number(durationOptions?.[0]?.value || 60),
    tuitionName: "",
    tutorName: "",
    groupName: "",
    classStartTime: "",
    classEndTime: "",
    status: "",
    notes: "",
    newTuition: null,
    tuitionStartDate: "",
    tuitionStartWeek: "",
    tuitionStartMonth: "",
    tuitionEndMonth: "",
  };
}

function getDisplayName(user) {
  if (user?.name) return user.name;
  const prefix = user?.email?.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function extractMonthYear(row) {
  const monthValue = normalizeMonthValue(row?.tuitionStartMonth) || normalizeMonthValue(row?.tuitionEndMonth);
  if (monthValue) {
    return { month: monthValue.slice(5, 7), year: monthValue.slice(0, 4) };
  }
  return { month: "", year: "" };
}

function matchesSearch(row, searchTerm) {
  const query = normalizeString(searchTerm).toLowerCase();
  if (!query) return true;
  return Object.values(row || {}).some((value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase().includes(query);
    if (value && typeof value === "object") return JSON.stringify(value).toLowerCase().includes(query);
    return String(value ?? "").toLowerCase().includes(query);
  });
}

function matchesFilters(row, filters) {
  const dayText = normalizeString(row.day || row.days || row.dayText);
  const status = normalizeString(row.status).toLowerCase();
  const { month, year } = extractMonthYear(row);

  if (filters.day && !dayText.toLowerCase().includes(filters.day.toLowerCase())) return false;
  if (filters.status && status !== filters.status.toLowerCase()) return false;
  if (filters.month && filters.month !== month) return false;
  if (filters.year && filters.year !== year) return false;
  return true;
}

function paginate(items, page, pageSize) {
  const safePage = Math.max(1, Number(page || 1));
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function Toolbar({
  search,
  onSearch,
  filters,
  onFiltersChange,
  pageSize,
  onPageSizeChange,
  selectedCount,
  onMoveUp,
  onMoveDown,
  dayOptions,
  yearOptions,
  statusOptions,
  zoomPercent,
  onZoomChange,
  onScrollLeft,
  onScrollRight,
}) {
  return (
    <div style={styles.toolbar}>
      <input
        style={styles.searchInput}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search across all fields"
      />

      <div style={styles.toolbarGroup}>
        <select style={styles.toolbarSelect} value={filters.day} onChange={(event) => onFiltersChange("day", event.target.value)}>
          <option value="">All days</option>
          {dayOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select style={styles.toolbarSelect} value={filters.month} onChange={(event) => onFiltersChange("month", event.target.value)}>
          <option value="">All months</option>
          {MONTH_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select style={styles.toolbarSelect} value={filters.year} onChange={(event) => onFiltersChange("year", event.target.value)}>
          <option value="">All years</option>
          {yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select style={styles.toolbarSelect} value={filters.status} onChange={(event) => onFiltersChange("status", event.target.value)}>
          <option value="">All status</option>
          {statusOptions.map((item) => (
            <option key={item || "blank"} value={item}>{getStatusMeta(item).label}</option>
          ))}
        </select>
        <select style={styles.toolbarSelect} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {PAGE_SIZE_OPTIONS.map((item) => <option key={item} value={item}>{item} / page</option>)}
        </select>
      </div>

      <div style={styles.toolbarGroup}>
        <button type="button" style={styles.toolbarBtn} onClick={onMoveUp} disabled={!selectedCount}>↑ Move</button>
        <button type="button" style={styles.toolbarBtn} onClick={onMoveDown} disabled={!selectedCount}>↓ Move</button>
        <button type="button" style={styles.toolbarBtn} onClick={onScrollLeft}>← Scroll</button>
        <button type="button" style={styles.toolbarBtn} onClick={onScrollRight}>→ Scroll</button>
        <div style={styles.zoomBox}>
          <button type="button" style={styles.zoomBtn} onClick={() => onZoomChange(-10)}>-</button>
          <span style={styles.zoomText}>{zoomPercent}%</span>
          <button type="button" style={styles.zoomBtn} onClick={() => onZoomChange(10)}>+</button>
        </div>
        <div style={styles.selectedPill}>{selectedCount} selected</div>
      </div>
    </div>
  );
}

function Pagination({ totalItems, page, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <div style={styles.pagination}>
      <span style={styles.paginationMeta}>Showing {totalItems} row(s)</span>
      <div style={styles.paginationBtns}>
        <button type="button" style={styles.pageBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span style={styles.pageText}>Page {page} of {totalPages}</span>
        <button type="button" style={styles.pageBtn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #dbe3ee",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  header: {
    padding: 18,
    borderBottom: "1px solid #e2e8f0",
    background: "#ffffff",
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: 14,
    fontWeight: 600,
  },
  adminBar: {
    marginTop: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: "#1d4ed8",
  },
  backBtn: {
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  select: {
    width: "100%",
    minHeight: 36,
    padding: "7px 9px",
    border: "1px solid #cbd5e1",
    borderRadius: 0,
    outline: "none",
    fontSize: 13,
    background: "#fff",
  },
  tabsWrap: {
    display: "flex",
    gap: 8,
    padding: "14px 18px 0",
    flexWrap: "wrap",
  },
  tabBtn: (active) => ({
    border: "none",
    borderBottom: active ? "3px solid #16a34a" : "3px solid transparent",
    background: "transparent",
    color: active ? "#16a34a" : "#334155",
    fontWeight: 900,
    padding: "10px 6px",
    cursor: "pointer",
    fontSize: 14,
  }),
  body: {
    padding: 18,
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toolbarGroup: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: "1 1 280px",
    minWidth: 260,
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    outline: "none",
    fontSize: 14,
  },
  toolbarSelect: {
    minHeight: 38,
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    outline: "none",
    fontSize: 13,
    background: "#fff",
  },
  toolbarBtn: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: 12,
    padding: "9px 12px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  zoomBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    padding: "4px 8px",
    background: "#fff",
  },
  zoomBtn: {
    border: "none",
    background: "transparent",
    fontWeight: 900,
    fontSize: 18,
    cursor: "pointer",
    lineHeight: 1,
  },
  zoomText: {
    minWidth: 48,
    textAlign: "center",
    fontWeight: 800,
    fontSize: 13,
    color: "#334155",
  },
  selectedPill: {
    padding: "9px 12px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontWeight: 800,
    fontSize: 13,
    color: "#475569",
  },
  sheetWrap: {
    border: "1px solid #dbe3ee",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
  },
  sheetViewport: {
    overflow: "auto",
    width: "100%",
    maxHeight: "70vh",
  },
  table: {
    width: "100%",
    minWidth: 1450,
    borderCollapse: "collapse",
    tableLayout: "fixed",
    background: "#fff",
  },
  th: {
    background: "#f59e0b",
    color: "#111827",
    border: "1px solid #f8c25d",
    padding: "8px 8px",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  td: {
    border: "1px solid #e2e8f0",
    padding: 0,
    fontSize: 13,
    color: "#0f172a",
    background: "#ffffff",
    verticalAlign: "top",
  },
  addRowCell: {
    border: "1px solid #e5e7eb",
    background: "#fffbea",
    padding: 0,
    verticalAlign: "top",
  },
  numberCell: {
    width: 52,
    textAlign: "center",
    fontWeight: 800,
    background: "#f8fafc",
  },
  checkCell: {
    width: 58,
    textAlign: "center",
    background: "#f8fafc",
  },
  cellInput: {
    width: "100%",
    minHeight: 36,
    padding: "7px 9px",
    border: "none",
    outline: "none",
    fontSize: 13,
    background: "transparent",
    boxSizing: "border-box",
  },
  cellTextArea: {
    width: "100%",
    minHeight: 52,
    padding: "7px 9px",
    border: "none",
    outline: "none",
    resize: "vertical",
    fontSize: 13,
    background: "transparent",
    boxSizing: "border-box",
  },
  multiSelect: {
    width: "100%",
    minHeight: 52,
    padding: 8,
    border: "none",
    outline: "none",
    fontSize: 13,
    background: "transparent",
  },
  timeEditor: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 6,
  },
  timeLine: {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    gap: 6,
    alignItems: "center",
  },
  dayTag: {
    fontSize: 12,
    fontWeight: 800,
    color: "#334155",
  },
  emptyTag: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
  },
  weekChip: {
    display: "inline-flex",
    margin: "0 8px 8px",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    fontSize: 11,
    fontWeight: 800,
  },
  readonlyBox: {
    width: "100%",
    minHeight: 36,
    padding: "7px 9px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    color: "#0f172a",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 700,
  },
  statusSelect: (status) => {
    const meta = getStatusMeta(status);
    return {
      width: "100%",
      minHeight: 36,
      padding: "7px 9px",
      border: "none",
      outline: "none",
      fontSize: 13,
      fontWeight: 700,
      background: meta.background,
      color: meta.color,
    };
  },
  actionBtn: {
    width: "100%",
    minHeight: 36,
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtn: {
    width: "100%",
    minHeight: 36,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  },
  statTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: "#334155" },
  statValue: { marginTop: 10, fontSize: 28, fontWeight: 900, color: "#16a34a" },
  reportTable: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    minWidth: 900,
  },
  reportTh: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 10,
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    color: "#334155",
    whiteSpace: "nowrap",
  },
  reportTd: {
    border: "1px solid #e5e7eb",
    padding: 10,
    fontSize: 13,
    color: "#0f172a",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    verticalAlign: "top",
  },
  pagination: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  paginationMeta: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  paginationBtns: { display: "flex", gap: 8, alignItems: "center" },
  pageBtn: {
    border: "1px solid #dbe4ee",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  pageText: {
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
  },
  empty: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
    margin: "20px",
  },
};

export default function OtmPortalSheet({
  user,
  portalUser,
  isAdmin = false,
  title = "OTM Portal",
  subtitle,
  initialEntries = [],
  loading = false,
  meta = {},
  reportRows = [],
  reportSummary = null,
  totalClassRows = [],
  totalClassSummary = null,
  onCreateEntry,
  onUpdateEntry,
  onReorderEntries,
  onDeleteEntry,
  onAdminUserChange,
  onBackToDirectory,
}) {
  const dayOptions = meta.dayOptions?.length ? meta.dayOptions : DEFAULT_DAY_OPTIONS;
  const statusOptions = meta.statusOptions?.length ? meta.statusOptions : DEFAULT_STATUS_OPTIONS;
  const durationOptions = meta.durationOptions?.length ? meta.durationOptions : DEFAULT_DURATION_OPTIONS;
  const timeOptions = meta.classTimes?.length ? meta.classTimes.map((item) => item.label || item.startTime) : [];
  const portalUsers = meta.portalUsers?.length ? meta.portalUsers : meta.otmUsers || [];
  const displayName = useMemo(() => getDisplayName(portalUser || user), [portalUser, user]);

  const [tab, setTab] = useState("tuitions");
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(() => makeEmptyDraft(durationOptions));
  const [creating, setCreating] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchByTab, setSearchByTab] = useState({ tuitions: "", reports: "", totalClass: "" });
  const [filtersByTab, setFiltersByTab] = useState({
    tuitions: { day: "", month: "", year: "", status: "" },
    reports: { day: "", month: "", year: "", status: "" },
    totalClass: { day: "", month: "", year: "", status: "" },
  });
  const [pageByTab, setPageByTab] = useState({ tuitions: 1, reports: 1, totalClass: 1 });
  const [pageSizeByTab, setPageSizeByTab] = useState({ tuitions: 20, reports: 20, totalClass: 20 });
  const [zoomPercent, setZoomPercent] = useState(100);

  const sheetViewportRef = useRef(null);

  useEffect(() => {
    setEntries((Array.isArray(initialEntries) ? initialEntries : []).map((row) => computeRow(row, durationOptions)));
    setSelectedIds([]);
  }, [initialEntries, durationOptions]);

  useEffect(() => {
    setDraft(makeEmptyDraft(durationOptions));
  }, [durationOptions]);

  const currentSearch = searchByTab[tab] || "";
  const currentFilters = filtersByTab[tab];
  const currentPage = pageByTab[tab] || 1;
  const currentPageSize = pageSizeByTab[tab] || 20;

  const yearOptions = useMemo(() => {
    const years = new Set();
    [...entries, ...reportRows, ...totalClassRows].forEach((row) => {
      const { year } = extractMonthYear(row);
      if (year) years.add(year);
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [entries, reportRows, totalClassRows]);

  const filteredEntries = useMemo(
    () => entries.filter((row) => matchesSearch(row, searchByTab.tuitions) && matchesFilters(row, filtersByTab.tuitions)),
    [entries, searchByTab.tuitions, filtersByTab.tuitions]
  );

  const filteredReportRows = useMemo(
    () => reportRows.filter((row) => matchesSearch(row, searchByTab.reports) && matchesFilters(row, filtersByTab.reports)),
    [reportRows, searchByTab.reports, filtersByTab.reports]
  );

  const filteredTotalClassRows = useMemo(
    () => totalClassRows.filter((row) => matchesSearch(row, searchByTab.totalClass) && matchesFilters(row, filtersByTab.totalClass)),
    [totalClassRows, searchByTab.totalClass, filtersByTab.totalClass]
  );

  const pagedEntries = useMemo(() => paginate(filteredEntries, pageByTab.tuitions, pageSizeByTab.tuitions), [filteredEntries, pageByTab.tuitions, pageSizeByTab.tuitions]);
  const pagedReportRows = useMemo(() => paginate(filteredReportRows, pageByTab.reports, pageSizeByTab.reports), [filteredReportRows, pageByTab.reports, pageSizeByTab.reports]);
  const pagedTotalClassRows = useMemo(() => paginate(filteredTotalClassRows, pageByTab.totalClass, pageSizeByTab.totalClass), [filteredTotalClassRows, pageByTab.totalClass, pageSizeByTab.totalClass]);

  function setSearchValue(value) {
    setSearchByTab((prev) => ({ ...prev, [tab]: value }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  function setFilterValue(field, value) {
    setFiltersByTab((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  function setPageSizeValue(size) {
    setPageSizeByTab((prev) => ({ ...prev, [tab]: size }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  function updateDraftField(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "days") {
        const sorted = sortDays(value);
        const assignments = {};
        sorted.forEach((day) => {
          assignments[day] = prev.timeAssignments?.[day] || "";
        });
        next.days = sorted;
        next.timeAssignments = assignments;
      }
      if (field === "durationMinutes") {
        next.durationMinutes = Number(value || 60);
      }
      if (field === "tuitionStartDate" || field === "status") {
        const calendar = deriveCalendar(field === "tuitionStartDate" ? value : prev.tuitionStartDate, field === "status" ? value : prev.status);
        next.tuitionStartDate = calendar.tuitionStartDate;
        next.tuitionStartWeek = calendar.tuitionStartWeek;
        next.tuitionStartMonth = calendar.tuitionStartMonth;
        next.tuitionEndMonth = calendar.tuitionEndMonth;
      }
      if (field === "newTuition") {
        next.newTuition = parseNewTuitionValue(value);
      }
      return next;
    });
  }

  function updateDraftTime(day, value) {
    setDraft((prev) => ({
      ...prev,
      timeAssignments: {
        ...(prev.timeAssignments || {}),
        [day]: value,
      },
    }));
  }

  function updateRow(rowId, field, value) {
    setEntries((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const updatedValue = field === "newTuition" ? parseNewTuitionValue(value) : value;
        const next = computeRow({ ...row, [field]: updatedValue }, durationOptions);
        if (field === "day") next.days = next.day ? [next.day] : [];
        if (field === "time") next.time = normalizeTimeText(value);
        return next;
      })
    );
  }

  async function createRow() {
    if (!onCreateEntry) return;
    const validDays = sortDays(draft.days);

    if (!draft.tuitionName || validDays.length === 0) {
      alert("Please add tuition name and select at least one day.");
      return;
    }

    const missingTimeDay = validDays.find((day) => !normalizeTimeText(draft.timeAssignments?.[day]));
    if (missingTimeDay) {
      alert(`Please add time for ${missingTimeDay}.`);
      return;
    }

    try {
      setCreating(true);
      await onCreateEntry({
        ...draft,
        days: validDays,
        timeAssignments: Object.fromEntries(validDays.map((day) => [day, normalizeTimeText(draft.timeAssignments?.[day])])),
        newTuition: draft.newTuition,
      });
      setDraft(makeEmptyDraft(durationOptions));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to create rows");
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(rowId) {
    if (!onUpdateEntry) return;
    const row = entries.find((item) => item.id === rowId);
    if (!row) return;

    try {
      setSavingRowId(rowId);
      await onUpdateEntry(rowId, {
        ...row,
        day: row.day,
        days: [row.day],
        time: normalizeTimeText(row.time),
        timeSlots: row.time ? [normalizeTimeText(row.time)] : [],
        newTuition: row.newTuition,
      });
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update row");
    } finally {
      setSavingRowId(null);
    }
  }

  async function deleteRow(rowId) {
    if (!onDeleteEntry) return;
    if (!window.confirm("Delete this row?")) return;

    try {
      await onDeleteEntry(rowId);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete row");
    }
  }

  function toggleSelectRow(rowId) {
    setSelectedIds((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]));
  }

  async function moveSelected(direction) {
    if (!onReorderEntries || selectedIds.length === 0) return;

    const next = [...entries];
    const selectedSet = new Set(selectedIds);

    if (direction === "up") {
      for (let index = 1; index < next.length; index += 1) {
        if (selectedSet.has(next[index].id) && !selectedSet.has(next[index - 1].id)) {
          [next[index - 1], next[index]] = [next[index], next[index - 1]];
        }
      }
    } else {
      for (let index = next.length - 2; index >= 0; index -= 1) {
        if (selectedSet.has(next[index].id) && !selectedSet.has(next[index + 1].id)) {
          [next[index], next[index + 1]] = [next[index + 1], next[index]];
        }
      }
    }

    setEntries(next);
    try {
      await onReorderEntries(next.map((item) => item.id));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to reorder rows");
    }
  }

  function scrollSheet(direction) {
    const node = sheetViewportRef.current;
    if (!node) return;
    node.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  }

  function focusCell(rowIndex, colIndex) {
    const selector = `[data-grid-row="${rowIndex}"][data-grid-col="${colIndex}"]`;
    const element = sheetViewportRef.current?.querySelector(selector) || document.querySelector(selector);
    if (element && typeof element.focus === "function") element.focus();
  }

  function handleGridKeyDown(rowIndex, colIndex) {
    return (event) => {
      let nextRow = rowIndex;
      let nextCol = colIndex;

      if (event.key === "ArrowRight") nextCol += 1;
      else if (event.key === "ArrowLeft") nextCol -= 1;
      else if (event.key === "ArrowDown") nextRow += 1;
      else if (event.key === "ArrowUp") nextRow -= 1;
      else return;

      event.preventDefault();
      focusCell(nextRow, nextCol);
    };
  }

  function renderCellInput({ rowIndex, colIndex, value, onChange, onBlur, type = "text", readOnly = false }) {
    return (
      <input
        data-grid-row={rowIndex}
        data-grid-col={colIndex}
        onKeyDown={handleGridKeyDown(rowIndex, colIndex)}
        type={type}
        readOnly={readOnly}
        style={styles.cellInput}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }

  if (loading) {
    return <div style={styles.empty}>Loading OTM portal...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>{subtitle || `Logged in as ${displayName}`}</p>

          {isAdmin && (
            <div style={styles.adminBar}>
              {onBackToDirectory && <button type="button" style={styles.backBtn} onClick={onBackToDirectory}>← Back to users</button>}
              <div style={styles.adminLabel}>Admin portal switcher</div>
              <select style={{ ...styles.select, maxWidth: 360 }} value={portalUser?.id || ""} onChange={(event) => onAdminUserChange?.(event.target.value)}>
                <option value="">Select user</option>
                {portalUsers.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} - {item.email}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={styles.tabsWrap}>
          <button style={styles.tabBtn(tab === "tuitions")} onClick={() => setTab("tuitions")}>{displayName} Tuitions</button>
          <button style={styles.tabBtn(tab === "reports")} onClick={() => setTab("reports")}>Reports</button>
          <button style={styles.tabBtn(tab === "totalClass")} onClick={() => setTab("totalClass")}>Total Classes</button>
        </div>

        <div style={styles.body}>
          {tab === "tuitions" && (
            <>
              <Toolbar
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={selectedIds.length}
                onMoveUp={() => moveSelected("up")}
                onMoveDown={() => moveSelected("down")}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
                zoomPercent={zoomPercent}
                onZoomChange={(delta) => setZoomPercent((prev) => Math.max(70, Math.min(140, prev + delta)))}
                onScrollLeft={() => scrollSheet("left")}
                onScrollRight={() => scrollSheet("right")}
              />

              <div style={styles.sheetWrap}>
                <div style={{ ...styles.sheetViewport, zoom: `${zoomPercent}%` }} ref={sheetViewportRef}>
                  <datalist id="otm-time-options">
                    {timeOptions.map((item) => <option key={item} value={item} />)}
                  </datalist>

                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, ...styles.checkCell }}>Sel</th>
                        <th style={{ ...styles.th, ...styles.numberCell }}>#</th>
                        <th style={{ ...styles.th, width: 140 }}>Days</th>
                        <th style={{ ...styles.th, width: 110 }}>Time</th>
                        <th style={{ ...styles.th, width: 160 }}>Tuition Name</th>
                        <th style={{ ...styles.th, width: 150 }}>Tutor Name</th>
                        <th style={{ ...styles.th, width: 150 }}>Group Name</th>
                        <th style={{ ...styles.th, width: 110 }}>Class Start</th>
                        <th style={{ ...styles.th, width: 110 }}>Class End</th>
                        <th style={{ ...styles.th, width: 140 }}>Status</th>
                        <th style={{ ...styles.th, width: 180 }}>Notes</th>
                        <th style={{ ...styles.th, width: 110 }}>New Tuition</th>
                        <th style={{ ...styles.th, width: 145 }}>Start Month</th>
                        <th style={{ ...styles.th, width: 110 }}>Duration</th>
                        <th style={{ ...styles.th, width: 90 }}>Action</th>
                      </tr>

                      <tr>
                        <td style={{ ...styles.addRowCell, ...styles.checkCell }}>New</td>
                        <td style={{ ...styles.addRowCell, ...styles.numberCell }}>+</td>
                        <td style={{ ...styles.addRowCell, width: 140 }}>
                          <select
                            multiple
                            style={styles.multiSelect}
                            value={draft.days}
                            onChange={(event) => updateDraftField("days", Array.from(event.target.selectedOptions).map((item) => item.value))}
                          >
                            {dayOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 110 }}>
                          {draft.days.length === 0 ? (
                            <div style={styles.emptyTag}>Select days</div>
                          ) : (
                            <div style={styles.timeEditor}>
                              {draft.days.map((day) => (
                                <div key={day} style={styles.timeLine}>
                                  <span style={styles.dayTag}>{day}</span>
                                  <input
                                    list="otm-time-options"
                                    style={styles.cellInput}
                                    value={draft.timeAssignments?.[day] || ""}
                                    onChange={(event) => updateDraftTime(day, event.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ ...styles.addRowCell, width: 160 }}>{renderCellInput({ rowIndex: 0, colIndex: 2, value: draft.tuitionName, onChange: (e) => updateDraftField("tuitionName", e.target.value) })}</td>
                        <td style={{ ...styles.addRowCell, width: 150 }}>{renderCellInput({ rowIndex: 0, colIndex: 3, value: draft.tutorName, onChange: (e) => updateDraftField("tutorName", e.target.value) })}</td>
                        <td style={{ ...styles.addRowCell, width: 150 }}>{renderCellInput({ rowIndex: 0, colIndex: 4, value: draft.groupName, onChange: (e) => updateDraftField("groupName", e.target.value) })}</td>
                        <td style={{ ...styles.addRowCell, width: 110 }}>{renderCellInput({ rowIndex: 0, colIndex: 5, value: draft.days[0] ? normalizeTimeText(draft.timeAssignments?.[draft.days[0]]) : "", readOnly: true })}</td>
                        <td style={{ ...styles.addRowCell, width: 110 }}>{renderCellInput({ rowIndex: 0, colIndex: 6, value: draft.days[0] ? addMinutes(normalizeTimeText(draft.timeAssignments?.[draft.days[0]]), draft.durationMinutes) : "", readOnly: true })}</td>
                        <td style={{ ...styles.addRowCell, width: 140 }}>
                          <select data-grid-row={0} data-grid-col={7} onKeyDown={handleGridKeyDown(0, 7)} style={styles.statusSelect(draft.status)} value={draft.status} onChange={(event) => updateDraftField("status", event.target.value)}>
                            {statusOptions.map((item) => <option key={item || "blank"} value={item}>{getStatusMeta(item).label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 180 }}>
                          <textarea data-grid-row={0} data-grid-col={8} onKeyDown={handleGridKeyDown(0, 8)} style={styles.cellTextArea} value={draft.notes} onChange={(event) => updateDraftField("notes", event.target.value)} />
                        </td>
                        <td style={{ ...styles.addRowCell, width: 110 }}>
                          <select data-grid-row={0} data-grid-col={9} onKeyDown={handleGridKeyDown(0, 9)} style={styles.select} value={formatNewTuitionValue(draft.newTuition)} onChange={(event) => updateDraftField("newTuition", event.target.value)}>
                            {NEW_TUITION_OPTIONS.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 145 }}>
                          {renderCellInput({ rowIndex: 0, colIndex: 10, value: draft.tuitionStartDate || "", type: "date", onChange: (e) => updateDraftField("tuitionStartDate", e.target.value) })}
                          {draft.tuitionStartWeek ? <span style={styles.weekChip}>{draft.tuitionStartWeek}</span> : null}
                        </td>
                        <td style={{ ...styles.addRowCell, width: 110 }}>
                          <select data-grid-row={0} data-grid-col={11} onKeyDown={handleGridKeyDown(0, 11)} style={styles.select} value={draft.durationMinutes} onChange={(event) => updateDraftField("durationMinutes", Number(event.target.value))}>
                            {durationOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 90 }}>
                          <button type="button" style={styles.actionBtn} onClick={createRow}>{creating ? "Adding" : "Add"}</button>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={15} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No entries found.</td>
                        </tr>
                      ) : (
                        pagedEntries.map((row, index) => {
                          const rowIndex = index + 1;
                          return (
                            <tr key={row.id}>
                              <td style={{ ...styles.td, ...styles.checkCell }}>
                                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelectRow(row.id)} />
                              </td>
                              <td style={{ ...styles.td, ...styles.numberCell }}>{(pageByTab.tuitions - 1) * pageSizeByTab.tuitions + index + 1}</td>
                              <td style={{ ...styles.td, width: 140 }}>
                                <select data-grid-row={rowIndex} data-grid-col={0} onKeyDown={handleGridKeyDown(rowIndex, 0)} style={styles.select} value={row.day || ""} onChange={(event) => updateRow(row.id, "day", event.target.value)} onBlur={() => saveRow(row.id)}>
                                  <option value="">Select day</option>
                                  {dayOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                              </td>
                              <td style={{ ...styles.td, width: 110 }}>
                                <input data-grid-row={rowIndex} data-grid-col={1} onKeyDown={handleGridKeyDown(rowIndex, 1)} list={`time-options-${row.id}`} style={styles.cellInput} value={row.time || ""} onChange={(event) => updateRow(row.id, "time", event.target.value)} onBlur={(event) => { updateRow(row.id, "time", normalizeTimeText(event.target.value)); setTimeout(() => saveRow(row.id), 0); }} />
                                <datalist id={`time-options-${row.id}`}>
                                  {timeOptions.map((item) => <option key={item} value={item} />)}
                                </datalist>
                              </td>
                              <td style={{ ...styles.td, width: 160 }}>{renderCellInput({ rowIndex, colIndex: 2, value: row.tuitionName || "", onChange: (e) => updateRow(row.id, "tuitionName", e.target.value), onBlur: () => saveRow(row.id) })}</td>
                              <td style={{ ...styles.td, width: 150 }}>{renderCellInput({ rowIndex, colIndex: 3, value: row.tutorName || "", onChange: (e) => updateRow(row.id, "tutorName", e.target.value), onBlur: () => saveRow(row.id) })}</td>
                              <td style={{ ...styles.td, width: 150 }}>{renderCellInput({ rowIndex, colIndex: 4, value: row.groupName || "", onChange: (e) => updateRow(row.id, "groupName", e.target.value), onBlur: () => saveRow(row.id) })}</td>
                              <td style={{ ...styles.td, width: 110 }}>{renderCellInput({ rowIndex, colIndex: 5, value: row.classStartTime || "", readOnly: true })}</td>
                              <td style={{ ...styles.td, width: 110 }}>{renderCellInput({ rowIndex, colIndex: 6, value: row.classEndTime || "", readOnly: true })}</td>
                              <td style={{ ...styles.td, width: 140 }}>
                                <select data-grid-row={rowIndex} data-grid-col={7} onKeyDown={handleGridKeyDown(rowIndex, 7)} style={styles.statusSelect(row.status)} value={row.status || ""} onChange={(event) => updateRow(row.id, "status", event.target.value)} onBlur={() => saveRow(row.id)}>
                                  {statusOptions.map((item) => <option key={item || "blank"} value={item}>{getStatusMeta(item).label}</option>)}
                                </select>
                              </td>
                              <td style={{ ...styles.td, width: 180 }}>
                                <textarea data-grid-row={rowIndex} data-grid-col={8} onKeyDown={handleGridKeyDown(rowIndex, 8)} style={styles.cellTextArea} value={row.notes || ""} onChange={(event) => updateRow(row.id, "notes", event.target.value)} onBlur={() => saveRow(row.id)} />
                              </td>
                              <td style={{ ...styles.td, width: 110 }}>
                                <select data-grid-row={rowIndex} data-grid-col={9} onKeyDown={handleGridKeyDown(rowIndex, 9)} style={styles.select} value={formatNewTuitionValue(row.newTuition)} onChange={(event) => updateRow(row.id, "newTuition", event.target.value)} onBlur={() => saveRow(row.id)}>
                                  {NEW_TUITION_OPTIONS.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
                                </select>
                              </td>
                              <td style={{ ...styles.td, width: 145 }}>
                                {renderCellInput({ rowIndex, colIndex: 10, value: row.tuitionStartDate || "", type: "date", onChange: (e) => updateRow(row.id, "tuitionStartDate", e.target.value), onBlur: () => saveRow(row.id) })}
                                {row.tuitionStartWeek ? <span style={styles.weekChip}>{row.tuitionStartWeek}</span> : null}
                              </td>
                              <td style={{ ...styles.td, width: 110 }}>
                                <select data-grid-row={rowIndex} data-grid-col={11} onKeyDown={handleGridKeyDown(rowIndex, 11)} style={styles.select} value={row.durationMinutes || durationOptions[0]?.value || 60} onChange={(event) => updateRow(row.id, "durationMinutes", Number(event.target.value))} onBlur={() => saveRow(row.id)}>
                                  {durationOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                              </td>
                              <td style={{ ...styles.td, width: 90 }}>
                                <button type="button" style={styles.deleteBtn} onClick={() => deleteRow(row.id)}>{savingRowId === row.id ? "Save" : "Delete"}</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination totalItems={filteredEntries.length} page={pageByTab.tuitions} pageSize={pageSizeByTab.tuitions} onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, tuitions: nextPage }))} />
            </>
          )}

          {tab === "reports" && (
            <>
              <div style={styles.sectionGrid}>
                <div style={styles.statCard}><h3 style={styles.statTitle}>Total Entries</h3><div style={styles.statValue}>{reportSummary?.totalEntries || 0}</div></div>
                <div style={styles.statCard}><h3 style={styles.statTitle}>Class Done</h3><div style={styles.statValue}>{reportSummary?.byStatus?.["class done"] || 0}</div></div>
                <div style={styles.statCard}><h3 style={styles.statTitle}>Class Pending</h3><div style={styles.statValue}>{reportSummary?.byStatus?.["class pending"] || 0}</div></div>
                <div style={styles.statCard}><h3 style={styles.statTitle}>Tuition Pause</h3><div style={styles.statValue}>{reportSummary?.byStatus?.["tuition pause"] || 0}</div></div>
              </div>

              <Toolbar
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={0}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
                zoomPercent={zoomPercent}
                onZoomChange={(delta) => setZoomPercent((prev) => Math.max(70, Math.min(140, prev + delta)))}
                onScrollLeft={() => {}}
                onScrollRight={() => {}}
              />

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.reportTable}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh}>Teacher</th>
                        <th style={styles.reportTh}>Tuition</th>
                        <th style={styles.reportTh}>Days</th>
                        <th style={styles.reportTh}>Start Month</th>
                        <th style={styles.reportTh}>Week</th>
                        <th style={styles.reportTh}>End Month</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>Class Done</th>
                        <th style={styles.reportTh}>Class Pending</th>
                        <th style={styles.reportTh}>Missed By Teacher</th>
                        <th style={styles.reportTh}>Missed By Student</th>
                        <th style={styles.reportTh}>New Tuition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedReportRows.length === 0 ? (
                        <tr><td colSpan={12} style={styles.reportTd}>No report rows found.</td></tr>
                      ) : (
                        pagedReportRows.map((row, index) => (
                          <tr key={`${row.teacherName}-${row.tuitionName}-${index}`}>
                            <td style={styles.reportTd}>{row.teacherName}</td>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>{Array.isArray(row.days) ? row.days.join(", ") : row.day || row.days || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionStartMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionStartWeek || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionEndMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.totalClasses}</td>
                            <td style={styles.reportTd}>{row.classDoneCount}</td>
                            <td style={styles.reportTd}>{row.classPendingCount}</td>
                            <td style={styles.reportTd}>{row.missedByTeacherCount}</td>
                            <td style={styles.reportTd}>{row.missedByStudentCount}</td>
                            <td style={styles.reportTd}>{row.newTuitionCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination totalItems={filteredReportRows.length} page={pageByTab.reports} pageSize={pageSizeByTab.reports} onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, reports: nextPage }))} />
            </>
          )}

          {tab === "totalClass" && (
            <>
              <div style={styles.sectionGrid}>
                <div style={styles.statCard}><h3 style={styles.statTitle}>Total Rows</h3><div style={styles.statValue}>{filteredTotalClassRows.length}</div></div>
                <div style={styles.statCard}><h3 style={styles.statTitle}>Paused</h3><div style={styles.statValue}>{totalClassSummary?.byStatus?.["tuition pause"] || 0}</div></div>
              </div>

              <Toolbar
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={0}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
                zoomPercent={zoomPercent}
                onZoomChange={(delta) => setZoomPercent((prev) => Math.max(70, Math.min(140, prev + delta)))}
                onScrollLeft={() => {}}
                onScrollRight={() => {}}
              />

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.reportTable}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh}>Tuition</th>
                        <th style={styles.reportTh}>Tutor</th>
                        <th style={styles.reportTh}>Day</th>
                        <th style={styles.reportTh}>Time</th>
                        <th style={styles.reportTh}>Duration</th>
                        <th style={styles.reportTh}>Week</th>
                        <th style={styles.reportTh}>Start Month</th>
                        <th style={styles.reportTh}>End Month</th>
                        <th style={styles.reportTh}>Status</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>New Tuition Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTotalClassRows.length === 0 ? (
                        <tr><td colSpan={11} style={styles.reportTd}>No total class rows found.</td></tr>
                      ) : (
                        pagedTotalClassRows.map((row, index) => (
                          <tr key={`${row.tuitionName}-${row.tutorName}-${index}`}>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>{row.tutorName}</td>
                            <td style={styles.reportTd}>{row.days}</td>
                            <td style={styles.reportTd}>{row.time}</td>
                            <td style={styles.reportTd}>{row.duration}</td>
                            <td style={styles.reportTd}>{row.tuitionStartWeek || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionStartMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionEndMonth || "--"}</td>
                            <td style={styles.reportTd}><span style={{ padding: "6px 10px", borderRadius: 999, display: "inline-block", border: `1px solid ${getStatusMeta(row.status).border}`, background: getStatusMeta(row.status).background, color: getStatusMeta(row.status).color }}>{getStatusMeta(row.status).label}</span></td>
                            <td style={styles.reportTd}>{row.totalClasses}</td>
                            <td style={styles.reportTd}>{row.newTuitionCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination totalItems={filteredTotalClassRows.length} page={pageByTab.totalClass} pageSize={pageSizeByTab.totalClass} onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, totalClass: nextPage }))} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
