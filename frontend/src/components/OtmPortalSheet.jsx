import React, { useEffect, useMemo, useRef, useState } from "react";

const COLOR_OPTIONS = [
  { value: "", label: "None" },
  { value: "#dadada", label: "White" },
  { value: "#debd01", label: "Yellow" },
  { value: "#00f000", label: "Green" },
  { value: "#0265e6", label: " Blue" },
  { value: "#db0404", label: " Red" },
  { value: "#3815d8", label: "Purple" },
  { value: "#ffc145", label: "Orange" },
];

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
  "class done",
  "class pending",
  "missed by teacher",
  "missed by student",
];

const DEFAULT_DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

const TEXT_COLUMNS = [
  { key: "tuitionName", label: "Tuition Name", width: 220 },
  { key: "tutorName", label: "Tutor Name", width: 180 },
  { key: "groupName", label: "Group Name", width: 200 },
  { key: "classStartTime", label: "Class Start", width: 140, readOnly: true },
  { key: "classEndTime", label: "Class End", width: 140, readOnly: true },
  { key: "notes", label: "Notes", width: 240, textarea: true },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
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

function getDurationLabel(options, value) {
  const found = options.find((item) => Number(item.value) === Number(value));
  return found?.label || `${value} min`;
}

function normalizeMonthValue(value) {
  const text = normalizeString(value);
  return /^\d{4}-\d{2}$/.test(text) ? text : "";
}

function extractMonthYear(row) {
  const monthValue = normalizeMonthValue(row?.tuitionStartMonth) || normalizeMonthValue(row?.tuitionEndMonth);
  if (monthValue) {
    return {
      month: monthValue.slice(5, 7),
      year: monthValue.slice(0, 4),
    };
  }
  const createdAt = normalizeString(row?.createdAt);
  if (createdAt) {
    const date = new Date(createdAt);
    if (!Number.isNaN(date.getTime())) {
      return {
        month: String(date.getMonth() + 1).padStart(2, "0"),
        year: String(date.getFullYear()),
      };
    }
  }
  return { month: "", year: "" };
}

function getStatusMeta(status) {
  const value = normalizeString(status).toLowerCase() || "class pending";
  if (value === "class done") {
    return { label: "Class Done", background: "#dcfce7", color: "#166534", border: "#86efac" };
  }
  if (value === "class pending") {
    return { label: "Class Pending", background: "#fef3c7", color: "#92400e", border: "#facc15" };
  }
  return { label: value === "missed by teacher" ? "Missed by Teacher" : "Missed by Student", background: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
}

function computeRow(row, durationOptions) {
  const day = normalizeString(row.day) || normalizeArray(row.days)[0] || "";
  const days = day ? [day] : normalizeArray(row.days);
  const time = normalizeTimeText(row.time || normalizeArray(row.timeSlots)[0] || "");
  const timeSlots = time ? [time] : normalizeArray(row.timeSlots).map(normalizeTimeText).filter(Boolean);
  const durationMinutes = Number(row.durationMinutes || 60);
  const classStartTime = time || normalizeString(row.classStartTime);
  const classEndTime = classStartTime ? addMinutes(classStartTime, durationMinutes) : normalizeString(row.classEndTime);

  return {
    ...row,
    day,
    days,
    time,
    timeSlots,
    durationMinutes,
    durationLabel: getDurationLabel(durationOptions, durationMinutes),
    classStartTime,
    classEndTime,
    classStartTimes: classStartTime ? [classStartTime] : [],
    classEndTimes: classEndTime ? [classEndTime] : [],
    rowColor: normalizeString(row.rowColor),
    tuitionStartMonth: normalizeMonthValue(row.tuitionStartMonth),
    tuitionEndMonth: normalizeMonthValue(row.tuitionEndMonth),
    notes: row.notes || "",
    newTuition: Boolean(row.newTuition),
    status: normalizeString(row.status).toLowerCase() || "class pending",
  };
}

function makeEmptyDraft(durationOptions) {
  return {
    days: [],
    timeAssignments: {},
    durationMinutes: Number(durationOptions?.[0]?.value || 60),
    tuitionStartMonth: "",
    tuitionEndMonth: "",
    tuitionName: "",
    tutorName: "",
    groupName: "",
    classStartTime: "",
    classEndTime: "",
    status: "class pending",
    notes: "",
    newTuition: false,
    rowColor: "",
  };
}

function getDisplayName(user) {
  if (user?.name) return user.name;
  const prefix = user?.email?.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
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

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function onClick(event) {
      if (!ref.current?.contains(event.target)) {
        handler();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [handler, ref]);
}

function MultiSelectCell({ value = [], options = [], placeholder = "Select days", onChange }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = sortDays(value);
  useOutsideClick(wrapRef, () => setOpen(false));

  return (
    <div style={styles.multiWrap} ref={wrapRef}>
      <button type="button" style={styles.multiButton} onClick={() => setOpen((prev) => !prev)}>
        {selected.length ? selected.join(", ") : placeholder}
      </button>
      {open && (
        <div style={styles.multiMenu}>
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label key={option} style={styles.multiOption}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((item) => item !== option)
                      : sortDays([...selected, option]);
                    onChange(next);
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayTimeAssignmentsEditor({ days = [], assignments = {}, timeOptions = [], onChange }) {
  const sortedDays = sortDays(days);
  if (sortedDays.length === 0) {
    return <div style={styles.placeholderCell}>Select days first</div>;
  }

  return (
    <div style={styles.dayTimeStack}>
      {sortedDays.map((day) => (
        <div key={day} style={styles.dayTimeRow}>
          <div style={styles.dayTimeLabel}>{day}</div>
          <div style={{ flex: 1 }}>
            <input
              list="otm-time-options"
              style={styles.compactInput}
              placeholder="9:15 PM"
              value={assignments?.[day] || ""}
              onChange={(event) => onChange(day, event.target.value)}
              onBlur={(event) => onChange(day, normalizeTimeText(event.target.value))}
            />
          </div>
        </div>
      ))}
      <datalist id="otm-time-options">
        {timeOptions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}

function Toolbar({
  title,
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
  showStatus = true,
}) {
  return (
    <div style={styles.toolbarWrap}>
      <div style={styles.toolbarLeft}>
        <div style={styles.toolbarTitle}>{title}</div>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search across all fields"
        />
      </div>

      <div style={styles.toolbarRight}>
        <select
          style={styles.filterSelect}
          value={filters.day}
          onChange={(event) => onFiltersChange({ ...filters, day: event.target.value })}
        >
          <option value="">All days</option>
          {dayOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select
          style={styles.filterSelect}
          value={filters.month}
          onChange={(event) => onFiltersChange({ ...filters, month: event.target.value })}
        >
          <option value="">All months</option>
          {MONTH_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select
          style={styles.filterSelect}
          value={filters.year}
          onChange={(event) => onFiltersChange({ ...filters, year: event.target.value })}
        >
          <option value="">All years</option>
          {yearOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        {showStatus && (
          <select
            style={styles.filterSelect}
            value={filters.status}
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
          >
            <option value="">All status</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        )}

        <select style={styles.filterSelect} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>

        <button type="button" style={styles.moveBtn} onClick={onMoveUp} disabled={!selectedCount}>
          ↑ Move
        </button>
        <button type="button" style={styles.moveBtn} onClick={onMoveDown} disabled={!selectedCount}>
          ↓ Move
        </button>
        <div style={styles.selectionPill}>{selectedCount} selected</div>
      </div>
    </div>
  );
}

function Pagination({ totalItems, page, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <div style={styles.paginationWrap}>
      <span style={styles.paginationMeta}>Page {page} of {totalPages} • {totalItems} record(s)</span>
      <div style={styles.paginationBtns}>
        <button type="button" style={styles.pageBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
        <button type="button" style={styles.pageBtn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 20 },
  card: {
    background: "#ffffff",
    borderRadius: 22,
    border: "1px solid #d9e1ea",
    overflow: "hidden",
    Height:'92vh',
    boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
  },
  header: {
    padding: "20px 22px",
    borderBottom: "1px solid #e5e7eb",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  },
  title: { margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" },
  subtitle: { margin: "8px 0 0", color: "#475569", fontSize: 14, fontWeight: 600 },
  adminBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  adminLabel: { fontSize: 13, fontWeight: 800, color: "#1d4ed8" },
  tabsWrap: {
    display: "flex",
    gap: 4,
    padding: "0 16px",
    borderBottom: "1px solid #e5e7eb",
    overflowX: "auto",
    background: "#fff",
  },
  tabBtn: (active) => ({
    border: "none",
    borderBottom: active ? "3px solid #16a34a" : "3px solid transparent",
    background: "transparent",
    color: active ? "#16a34a" : "#475569",
    padding: "14px 18px",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),
  body: { padding: 16 },
  toolbarWrap: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  toolbarLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  toolbarRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  toolbarTitle: { fontWeight: 900, color: "#0f172a", fontSize: 14 },
  searchInput: {
    minWidth: 260,
    border: "1px solid #dbe4ee",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
  },
  filterSelect: {
    border: "1px solid #dbe4ee",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
    background: "#fff",
  },
  moveBtn: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  selectionPill: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#334155",
    fontSize: 12,
    fontWeight: 800,
  },
  sheetWrap: {
    border: "1px solid #dbe4ee",
    borderRadius: 18,
    background: "#fff",
    Height:'90vh',
    overflow: "hidden",
  },
  sheetViewport: { overflow: "auto", background: "#fff", Height: "92vh" },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 2800,
    
    tableLayout: "fixed",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 8,
    background: "#f59e0b",
    color: "#111827",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    padding: "9px 8px",
    borderBottom: "1px solid #ce9e24",
    borderRight: "1px solid #fcd34d",
    textAlign: "center",
  },
  addRowCell: {
    position: "sticky",
    top: 39,
    zIndex: 99,
    background: "#fffbeb",
    borderBottom: "1px solid #fde68a",
    borderRight: "1px solid #fef3c7",
    padding: 5,
    verticalAlign: "top",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
    padding: 5,
    background: "#fff",
    verticalAlign: "top",
  },
  checkCell: { width: 52, minWidth: 52, maxWidth: 52, textAlign: "center" },
  numberCell: { width: 58, minWidth: 58, maxWidth: 58, textAlign: "center", fontWeight: 900 },
  colorCell: { width: 116, minWidth: 116, maxWidth: 116 },
  cellInput: {
    width: "100%",
    border: "1px solid #dbe4ee",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  cellTextArea: {
    width: "100%",
    minHeight: 56,
    border: "1px solid #dbe4ee",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.35,
  },
  readOnlyCell: {
    width: "100%",
    minHeight: 40,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    boxSizing: "border-box",
    background: "#f8fafc",
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "#0f172a",
    fontWeight: 700,
  },
  select: {
    width: "100%",
    minHeight: 40,
    border: "1px solid #dbe4ee",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  statusSelect: (status) => {
    const meta = getStatusMeta(status);
    return {
      width: "100%",
      minHeight: 40,
      border: `1px solid ${meta.border}`,
      borderRadius: 999,
      padding: "8px 12px",
      fontSize: 12,
      fontWeight: 900,
      color: meta.color,
      background: meta.background,
      outline: "none",
      boxSizing: "border-box",
      textTransform: "capitalize",
    };
  },
  boolBtn: (active) => ({
    width: "100%",
    minHeight: 40,
    borderRadius: 999,
    border: active ? "1px solid #86efac" : "1px solid #dbe4ee",
    background: active ? "#dcfce7" : "#fff",
    color: active ? "#166534" : "#475569",
    fontWeight: 800,
    cursor: "pointer",
  }),
  actionBtn: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 8px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtn: {
    width: "100%",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: 10,
    padding: "10px 8px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  saveNote: { fontSize: 11, color: "#64748b", marginTop: 6, textAlign: "center" },
  empty: {
    padding: 28,
    textAlign: "center",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: 16,
    background: "#f8fafc",
  },
  multiWrap: { position: "relative" },
  multiButton: {
    width: "100%",
    minHeight: 40,
    border: "1px solid #dbe4ee",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 600,
  },
  multiMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    width: "100%",
    minWidth: 180,
    maxHeight: 220,
    overflowY: "auto",
    background: "#fff",
    border: "1px solid #dbe4ee",
    borderRadius: 12,
    boxShadow: "0 16px 30px rgba(15,23,42,0.14)",
    zIndex: 30,
    padding: 8,
  },
  multiOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 4px",
    fontSize: 13,
    color: "#0f172a",
  },
  dayTimeStack: { display: "grid", gap: 6 },
  dayTimeRow: { display: "flex", gap: 8, alignItems: "center" },
  dayTimeLabel: {
    minWidth: 80,
    fontSize: 12,
    fontWeight: 800,
    color: "#334155",
    background: "#f8fafc",
    borderRadius: 8,
    padding: "8px 10px",
    textAlign: "center",
  },
  compactInput: {
    width: "100%",
    minHeight: 36,
    border: "1px solid #dbe4ee",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  placeholderCell: {
    minHeight: 40,
    borderRadius: 8,
    border: "1px dashed #cbd5e1",
    padding: "10px 12px",
    fontSize: 12,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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
  statValue: { marginTop: 10, fontSize: 32, fontWeight: 900, color: "#16a34a" },
  reportTable: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
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
  paginationWrap: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  paginationMeta: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  paginationBtns: { display: "flex", gap: 8 },
  pageBtn: {
    border: "1px solid #dbe4ee",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
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
}) {
  const dayOptions = meta.dayOptions?.length ? meta.dayOptions : DEFAULT_DAY_OPTIONS;
  const statusOptions = meta.statusOptions?.length ? meta.statusOptions : DEFAULT_STATUS_OPTIONS;
  const durationOptions = meta.durationOptions?.length ? meta.durationOptions : DEFAULT_DURATION_OPTIONS;
  const timeOptions = meta.classTimes?.length ? meta.classTimes.map((item) => item.label || item.startTime) : [];
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

  const filteredEntries = useMemo(() => {
    return entries.filter((row) => matchesSearch(row, searchByTab.tuitions) && matchesFilters(row, filtersByTab.tuitions));
  }, [entries, searchByTab.tuitions, filtersByTab.tuitions]);

  const filteredReportRows = useMemo(() => {
    return (reportRows || []).filter((row) => matchesSearch(row, searchByTab.reports) && matchesFilters(row, filtersByTab.reports));
  }, [reportRows, searchByTab.reports, filtersByTab.reports]);

  const filteredTotalClassRows = useMemo(() => {
    return (totalClassRows || []).filter((row) => matchesSearch(row, searchByTab.totalClass) && matchesFilters(row, filtersByTab.totalClass));
  }, [totalClassRows, searchByTab.totalClass, filtersByTab.totalClass]);

  const pagedEntries = useMemo(() => paginate(filteredEntries, pageByTab.tuitions, pageSizeByTab.tuitions), [filteredEntries, pageByTab.tuitions, pageSizeByTab.tuitions]);
  const pagedReportRows = useMemo(() => paginate(filteredReportRows, pageByTab.reports, pageSizeByTab.reports), [filteredReportRows, pageByTab.reports, pageSizeByTab.reports]);
  const pagedTotalClassRows = useMemo(() => paginate(filteredTotalClassRows, pageByTab.totalClass, pageSizeByTab.totalClass), [filteredTotalClassRows, pageByTab.totalClass, pageSizeByTab.totalClass]);

  function setSearchValue(value) {
    setSearchByTab((prev) => ({ ...prev, [tab]: value }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  function setFilterValue(nextFilters) {
    setFiltersByTab((prev) => ({ ...prev, [tab]: nextFilters }));
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
        const nextAssignments = {};
        sorted.forEach((day) => {
          nextAssignments[day] = prev.timeAssignments?.[day] || "";
        });
        next.days = sorted;
        next.timeAssignments = nextAssignments;
      }
      if (field === "durationMinutes") {
        next.durationMinutes = Number(value || 60);
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
        const next = computeRow({ ...row, [field]: value }, durationOptions);
        if (field === "day") {
          next.days = next.day ? [next.day] : [];
        }
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
        timeAssignments: Object.fromEntries(
          validDays.map((day) => [day, normalizeTimeText(draft.timeAssignments?.[day])])
        ),
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

  function renderTextInput(row, field, isDraft = false, readOnly = false, textarea = false) {
    const value = row[field] || "";

    if (readOnly) {
      return <div style={styles.readOnlyCell}>{value || "--"}</div>;
    }

    const commonProps = {
      value,
      onChange: (event) => {
        if (isDraft) updateDraftField(field, event.target.value);
        else updateRow(row.id, field, event.target.value);
      },
      onBlur: () => {
        if (!isDraft) saveRow(row.id);
      },
    };

    if (textarea) {
      return <textarea style={styles.cellTextArea} {...commonProps} />;
    }

    return <input style={styles.cellInput} {...commonProps} />;
  }

  function renderExistingRowDayTimeDuration(row) {
    return (
      <>
        <td style={{ ...styles.td, width: 150 }}>
          <select
            style={styles.select}
            value={row.day || ""}
            onChange={(event) => updateRow(row.id, "day", event.target.value)}
            onBlur={() => saveRow(row.id)}
          >
            <option value="">Select day</option>
            {dayOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </td>

        <td style={{ ...styles.td, width: 190 }}>
          <input
            list={`time-options-${row.id}`}
            style={styles.cellInput}
            value={row.time || ""}
            placeholder="9:15 PM"
            onChange={(event) => updateRow(row.id, "time", event.target.value)}
            onBlur={(event) => {
              updateRow(row.id, "time", normalizeTimeText(event.target.value));
              setTimeout(() => saveRow(row.id), 0);
            }}
          />
          <datalist id={`time-options-${row.id}`}>
            {timeOptions.map((item) => <option key={item} value={item} />)}
          </datalist>
        </td>

        <td style={{ ...styles.td, width: 120 }}>
          <select
            style={styles.select}
            value={row.durationMinutes || durationOptions[0]?.value || 60}
            onChange={(event) => updateRow(row.id, "durationMinutes", Number(event.target.value))}
            onBlur={() => saveRow(row.id)}
          >
            {durationOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </td>
      </>
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
              <div style={styles.adminLabel}>Admin portal switcher</div>
              <select style={{ ...styles.select, maxWidth: 360 }} value={portalUser?.id || ""} onChange={(event) => onAdminUserChange?.(event.target.value)}>
                <option value="">Select OTM user</option>
                {(meta.otmUsers || []).map((item) => (
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
              />

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport} className="custom-height">
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, ...styles.checkCell }}>Sel</th>
                        <th style={{ ...styles.th, ...styles.numberCell }}>#</th>
                        <th style={{ ...styles.th, width: 116 }}>Color</th>
                        <th style={{ ...styles.th, width: 150 }}>Day</th>
                        <th style={{ ...styles.th, width: 190 }}>Time</th>
                        <th style={{ ...styles.th, width: 120 }}>Duration</th>
                        <th style={{ ...styles.th, width: 140 }}>Start Month</th>
                        <th style={{ ...styles.th, width: 140 }}>End Month</th>
                        {TEXT_COLUMNS.map((column) => (
                          <th key={column.key} style={{ ...styles.th, width: column.width }}>{column.label}</th>
                        ))}
                        <th style={{ ...styles.th, width: 160 }}>Status</th>
                        <th style={{ ...styles.th, width: 120 }}>New Tuition</th>
                        <th style={{ ...styles.th, width: 130 }}>Action</th>
                      </tr>

                      <tr>
                        <td style={{ ...styles.addRowCell, ...styles.checkCell }}>New</td>
                        <td style={{ ...styles.addRowCell, ...styles.numberCell }}>+</td>
                        <td style={{ ...styles.addRowCell, ...styles.colorCell }}>
                          <select style={styles.select} value={draft.rowColor || ""} onChange={(event) => updateDraftField("rowColor", event.target.value)}>
                            {COLOR_OPTIONS.map((item) => (
                              <option key={item.value || "empty"} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 150 }}>
                          <MultiSelectCell value={draft.days} options={dayOptions} onChange={(next) => updateDraftField("days", next)} />
                        </td>
                        <td style={{ ...styles.addRowCell, width: 190 }}>
                          <DayTimeAssignmentsEditor days={draft.days} assignments={draft.timeAssignments} timeOptions={timeOptions} onChange={updateDraftTime} />
                        </td>
                        <td style={{ ...styles.addRowCell, width: 120 }}>
                          <select style={styles.select} value={draft.durationMinutes || durationOptions[0]?.value || 60} onChange={(event) => updateDraftField("durationMinutes", Number(event.target.value))}>
                            {durationOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 140 }}>
                          <input type="month" style={styles.cellInput} value={draft.tuitionStartMonth || ""} onChange={(event) => updateDraftField("tuitionStartMonth", event.target.value)} />
                        </td>
                        <td style={{ ...styles.addRowCell, width: 140 }}>
                          <input type="month" style={styles.cellInput} value={draft.tuitionEndMonth || ""} onChange={(event) => updateDraftField("tuitionEndMonth", event.target.value)} />
                        </td>
                        {TEXT_COLUMNS.map((column) => (
                          <td key={column.key} style={{ ...styles.addRowCell, width: column.width }}>
                            {renderTextInput(draft, column.key, true, column.readOnly, column.textarea)}
                          </td>
                        ))}
                        <td style={{ ...styles.addRowCell, width: 160 }}>
                          <select style={styles.statusSelect(draft.status)} value={draft.status || "class pending"} onChange={(event) => updateDraftField("status", event.target.value)}>
                            {statusOptions.map((item) => <option key={item} value={item}>{getStatusMeta(item).label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 120 }}>
                          <button type="button" style={styles.boolBtn(Boolean(draft.newTuition))} onClick={() => updateDraftField("newTuition", !draft.newTuition)}>{draft.newTuition ? "Yes" : "No"}</button>
                        </td>
                        <td style={{ ...styles.addRowCell, width: 130 }}>
                          <button type="button" style={styles.actionBtn} onClick={createRow}>{creating ? "Adding..." : "Add Row"}</button>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={11 + TEXT_COLUMNS.length} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No entries found.</td>
                        </tr>
                      ) : (
                        pagedEntries.map((row, index) => {
                          const rowBg = row.rowColor || "#ffffff";
                          return (
                            <tr key={row.id} style={{ background: rowBg }}>
                              <td style={{ ...styles.td, ...styles.checkCell, background: rowBg }}>
                                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelectRow(row.id)} />
                              </td>
                              <td style={{ ...styles.td, ...styles.numberCell, background: rowBg }}>{(pageByTab.tuitions - 1) * pageSizeByTab.tuitions + index + 1}</td>
                              <td style={{ ...styles.td, ...styles.colorCell, background: rowBg }}>
                                <select style={styles.select} value={row.rowColor || ""} onChange={(event) => updateRow(row.id, "rowColor", event.target.value)} onBlur={() => saveRow(row.id)}>
                                  {COLOR_OPTIONS.map((item) => <option key={item.value || "empty"} value={item.value}>{item.label}</option>)}
                                </select>
                              </td>

                              {renderExistingRowDayTimeDuration(row)}

                              <td style={{ ...styles.td, background: rowBg, width: 140 }}>
                                <input type="month" style={styles.cellInput} value={row.tuitionStartMonth || ""} onChange={(event) => updateRow(row.id, "tuitionStartMonth", event.target.value)} onBlur={() => saveRow(row.id)} />
                              </td>
                              <td style={{ ...styles.td, background: rowBg, width: 140 }}>
                                <input type="month" style={styles.cellInput} value={row.tuitionEndMonth || ""} onChange={(event) => updateRow(row.id, "tuitionEndMonth", event.target.value)} onBlur={() => saveRow(row.id)} />
                              </td>

                              {TEXT_COLUMNS.map((column) => (
                                <td key={column.key} style={{ ...styles.td, background: rowBg, width: column.width }}>
                                  {renderTextInput(row, column.key, false, column.readOnly, column.textarea)}
                                </td>
                              ))}

                              <td style={{ ...styles.td, background: rowBg, width: 160 }}>
                                <select style={styles.statusSelect(row.status)} value={row.status || "class pending"} onChange={(event) => updateRow(row.id, "status", event.target.value)} onBlur={() => saveRow(row.id)}>
                                  {statusOptions.map((item) => <option key={item} value={item}>{getStatusMeta(item).label}</option>)}
                                </select>
                              </td>

                              <td style={{ ...styles.td, background: rowBg, width: 120 }}>
                                <button type="button" style={styles.boolBtn(Boolean(row.newTuition))} onClick={() => { updateRow(row.id, "newTuition", !row.newTuition); setTimeout(() => saveRow(row.id), 0); }}>{row.newTuition ? "Yes" : "No"}</button>
                              </td>

                              <td style={{ ...styles.td, background: rowBg, width: 130 }}>
                                <button type="button" style={styles.deleteBtn} onClick={() => deleteRow(row.id)}>{savingRowId === row.id ? "Saving..." : "Delete"}</button>
                                <div style={styles.saveNote}>{savingRowId === row.id ? "Updating row" : "Auto save on blur"}</div>
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
                <div style={styles.statCard}><h3 style={styles.statTitle}>Missed Total</h3><div style={styles.statValue}>{(reportSummary?.byStatus?.["missed by teacher"] || 0) + (reportSummary?.byStatus?.["missed by student"] || 0)}</div></div>
              </div>

              <Toolbar
                title="Report Summary"
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
                        <tr><td colSpan={11} style={styles.reportTd}>No report rows found.</td></tr>
                      ) : (
                        pagedReportRows.map((row, index) => (
                          <tr key={`${row.teacherName}-${row.tuitionName}-${index}`} style={{ background: row.rowColor || "#fff" }}>
                            <td style={styles.reportTd}>{row.teacherName}</td>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>{Array.isArray(row.days) ? row.days.join(", ") : row.day || row.days || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionStartMonth || "--"}</td>
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
                <div style={styles.statCard}><h3 style={styles.statTitle}>Total Done Classes</h3><div style={styles.statValue}>{totalClassSummary?.totalClasses || 0}</div></div>
              </div>

              <Toolbar
                title="Done Classes Summary"
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
                        <th style={styles.reportTh}>Start Month</th>
                        <th style={styles.reportTh}>End Month</th>
                        <th style={styles.reportTh}>Status</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>New Tuition Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTotalClassRows.length === 0 ? (
                        <tr><td colSpan={10} style={styles.reportTd}>No total class rows found.</td></tr>
                      ) : (
                        pagedTotalClassRows.map((row, index) => (
                          <tr key={`${row.tuitionName}-${row.tutorName}-${index}`} style={{ background: row.rowColor || "#fff" }}>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>{row.tutorName}</td>
                            <td style={styles.reportTd}>{row.days}</td>
                            <td style={styles.reportTd}>{row.time}</td>
                            <td style={styles.reportTd}>{row.duration}</td>
                            <td style={styles.reportTd}>{row.tuitionStartMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionEndMonth || "--"}</td>
                            <td style={styles.reportTd}>{(() => { const statusMeta = getStatusMeta(row.status); return <span style={{ padding: "6px 10px", borderRadius: 999, display: "inline-block", border: `1px solid ${statusMeta.border}`, background: statusMeta.background, color: statusMeta.color }}>{statusMeta.label}</span>; })()}</td>
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