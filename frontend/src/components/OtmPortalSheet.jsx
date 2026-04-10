import React, { useEffect, useMemo, useRef, useState } from "react";

const TEXT_COLUMNS = [
  { key: "tuitionName", label: "Tuition Name", width: 220 },
  { key: "tutorName", label: "Tutor Name", width: 190 },
  { key: "groupName", label: "Group Name", width: 220 },
  { key: "classStartTime", label: "Class Start", width: 150, readOnly: true },
  { key: "classEndTime", label: "Class End", width: 150, readOnly: true },
  { key: "notes", label: "Notes", width: 260 },
];

const COLOR_OPTIONS = [
  { value: "", label: "None" },
  { value: "#fee2e2", label: "Red" },
  { value: "#fef3c7", label: "Yellow" },
  { value: "#dcfce7", label: "Green" },
  { value: "#dbeafe", label: "Blue" },
  { value: "#ede9fe", label: "Purple" },
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
];

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
  }
  const text = String(value || "").trim();
  if (!text) return [];
  return [...new Set(text.split(",").map((item) => item.trim()).filter(Boolean))];
}

function toMinutes(timeLabel) {
  const match = String(timeLabel || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
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

function computeSchedule(row, durationOptions) {
  const days = normalizeArray(row.days ?? row.day);
  const timeSlots = normalizeArray(row.timeSlots ?? row.time);
  const durationMinutes = Number(row.durationMinutes || 60);

  return {
    ...row,
    days,
    day: days.join(", "),
    timeSlots,
    time: timeSlots.join(", "),
    durationMinutes,
    durationLabel: getDurationLabel(durationOptions, durationMinutes),
    classStartTimes: timeSlots,
    classStartTime: timeSlots.join(", "),
    classEndTimes: timeSlots.map((slot) => addMinutes(slot, durationMinutes)),
    classEndTime: timeSlots.map((slot) => addMinutes(slot, durationMinutes)).join(", "),
  };
}

function makeEmptyRow(durationOptions) {
  return computeSchedule(
    {
      days: [],
      timeSlots: [],
      durationMinutes: Number(durationOptions?.[0]?.value || 60),
      tuitionName: "",
      tutorName: "",
      groupName: "",
      status: "class pending",
      notes: "",
      newTuition: false,
    },
    durationOptions
  );
}

function getDisplayName(user) {
  if (user?.name) return user.name;
  const prefix = user?.email?.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

const styles = {
  page: { padding: 20 },
  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: 24,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },
  header: {
    padding: "20px 22px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
  },
  title: { margin: 0, fontSize: 26, fontWeight: 900, color: "#0f172a" },
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
    Height:'82vh',
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
  sheetWrap: {
    border: "1px solid #dbe4ee",
    borderRadius: 18,
    background: "#fff",
    overflow: "hidden",
  },
  sheetViewport:{
    overflow: "auto",
    background: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 2500,
    tableLayout: "fixed",
     Height: "82vh",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#f59e0b",
    color: "#111827",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    padding: "10px 8px",
    borderBottom: "1px solid #fbbf24",
    borderRight: "1px solid #fcd34d",
    textAlign: "center",
  },
  addRowCell: {
    position: "sticky",
    top: 41,
    zIndex: 9,
    background: "#fffbeb",
    borderBottom: "1px solid #fde68a",
    borderRight: "1px solid #fef3c7",
    padding: 4,
  },
  td: {
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    padding: 4,
    background: "#fff",
    verticalAlign: "top",
  },
  stickyIndexHead: {
    position: "sticky",
    left: 0,
    zIndex: 14,
    background: "#f59e0b",
    width: 60,
    minWidth: 60,
    maxWidth: 60,
  },
  stickyColorHead: {
    position: "sticky",
    left: 60,
    zIndex: 14,
    background: "#f59e0b",
    width: 100,
    minWidth: 100,
    maxWidth: 100,
  },
  stickyIndexCell: (isAdd = false) => ({
    position: "sticky",
    left: 0,
    zIndex: isAdd ? 13 : 8,
    background: isAdd ? "#fffbeb" : "#f8fafc",
    width: 60,
    minWidth: 60,
    maxWidth: 60,
    textAlign: "center",
    fontWeight: 900,
    color: "#0f172a",
  }),
  stickyColorCell: (isAdd = false, rowBg = "#fff") => ({
    position: "sticky",
    left: 60,
    zIndex: isAdd ? 13 : 8,
    background: isAdd ? "#fffbeb" : rowBg,
    width: 100,
    minWidth: 100,
    maxWidth: 100,
  }),
  cellInput: (active = false, readOnly = false) => ({
    width: "100%",
    minHeight: 40,
    border: active ? "2px solid #16a34a" : "1px solid #dbe4ee",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    background: readOnly ? "#f8fafc" : "#ffffff",
    color: "#0f172a",
    transition: "0.15s ease",
    boxSizing: "border-box",
    fontWeight: readOnly ? 700 : 500,
  }),
  select: {
    width: "100%",
    minHeight: 40,
    border: "1px solid #dbe4ee",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    background: "#fff",
    outline: "none",
  },
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
  empty: {
    padding: 28,
    textAlign: "center",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: 16,
    background: "#f8fafc",
  },
  multiWrap: { position: "relative" },
  multiButton: (active = false) => ({
    width: "100%",
    minHeight: 40,
    border: active ? "2px solid #16a34a" : "1px solid #dbe4ee",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 600,
  }),
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
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 4px",
    fontSize: 13,
    color: "#0f172a",
  },
  boolPill: (active) => ({
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    border: active ? "1px solid #86efac" : "1px solid #dbe4ee",
    background: active ? "#dcfce7" : "#fff",
    color: active ? "#166534" : "#475569",
    fontWeight: 800,
    cursor: "pointer",
  }),
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
  },
  reportTd: {
    border: "1px solid #e5e7eb",
    padding: 10,
    fontSize: 13,
    color: "#0f172a",
  },
};

function MultiSelectCell({ value = [], options = [], active, onChange, label = "Select" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = normalizeArray(value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = selected.length > 0 ? selected.join(", ") : label;

  return (
    <div style={styles.multiWrap} ref={wrapRef}>
      <button type="button" style={styles.multiButton(active)} onClick={() => setOpen((prev) => !prev)}>
        {displayValue}
      </button>

      {open && (
        <div style={styles.multiMenu}>
          {options.map((option) => {
            const optionValue = typeof option === "string" ? option : option.label || option.value;
            const checked = selected.includes(optionValue);

            return (
              <label key={optionValue} style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((item) => item !== optionValue)
                      : [...selected, optionValue];
                    onChange(next);
                  }}
                />
                <span>{optionValue}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  onDeleteEntry,
  onAdminUserChange,
}) {
  const dayOptions = meta.dayOptions?.length ? meta.dayOptions : DEFAULT_DAY_OPTIONS;
  const statusOptions = meta.statusOptions?.length ? meta.statusOptions : DEFAULT_STATUS_OPTIONS;
  const durationOptions = meta.durationOptions?.length ? meta.durationOptions : DEFAULT_DURATION_OPTIONS;
  const timeOptions = meta.classTimes?.length
    ? meta.classTimes.map((item) => item.label || item.startTime)
    : [];

  const [tab, setTab] = useState("tuitions");
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(() => makeEmptyRow(durationOptions));
  const [creating, setCreating] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [rowColors, setRowColors] = useState({});
  const [activeCell, setActiveCell] = useState(null);

  const displayName = useMemo(() => getDisplayName(portalUser || user), [portalUser, user]);
  const storageKey = useMemo(
    () => `otm-row-colors-${portalUser?.id || user?.id || "self"}`,
    [portalUser, user]
  );

  useEffect(() => {
    setEntries(
      (Array.isArray(initialEntries) ? initialEntries : []).map((row) =>
        computeSchedule(
          {
            ...row,
            days: row.days ?? row.day,
            timeSlots: row.timeSlots ?? row.time,
            durationMinutes: row.durationMinutes || 60,
            newTuition: Boolean(row.newTuition),
          },
          durationOptions
        )
      )
    );
  }, [initialEntries, durationOptions]);

  useEffect(() => {
    setDraft(makeEmptyRow(durationOptions));
  }, [durationOptions]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setRowColors(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load row colors", error);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(rowColors));
    } catch (error) {
      console.error("Failed to save row colors", error);
    }
  }, [rowColors, storageKey]);

  function updateDraft(field, value) {
    const next = computeSchedule({ ...draft, [field]: value }, durationOptions);
    setDraft(next);
  }

  function updateRow(rowId, field, value) {
    setEntries((prev) =>
      prev.map((row) =>
        row.id === rowId ? computeSchedule({ ...row, [field]: value }, durationOptions) : row
      )
    );
  }

  async function createRow() {
    if (!onCreateEntry) return;
    if (!draft.tuitionName || !draft.day) {
      alert("Day and Tuition Name are required");
      return;
    }

    try {
      setCreating(true);
      await onCreateEntry(draft);
      setDraft(makeEmptyRow(durationOptions));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to create row");
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
      await onUpdateEntry(rowId, row);
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

  function renderTextInput(row, field, width, isDraft = false, readOnly = false) {
    const value = row[field] || "";
    const id = `${isDraft ? "draft" : row.id}-${field}`;
    return (
      <input
        style={styles.cellInput(activeCell === id, readOnly)}
        value={value}
        readOnly={readOnly}
        onFocus={() => setActiveCell(id)}
        onChange={(event) => {
          if (readOnly) return;
          if (isDraft) updateDraft(field, event.target.value);
          else updateRow(row.id, field, event.target.value);
        }}
        onBlur={() => {
          if (!isDraft && !readOnly) saveRow(row.id);
        }}
      />
    );
  }

  function renderDayTimeDurationBlock(row, isDraft = false) {
    return (
      <>
        <td style={{ ...styles.td, width: 180, minWidth: 180, maxWidth: 180 }}>
          <MultiSelectCell
            value={row.days}
            options={dayOptions}
            active={activeCell === `${isDraft ? "draft" : row.id}-days`}
            label="Select days"
            onChange={(next) => {
              if (isDraft) updateDraft("days", next);
              else updateRow(row.id, "days", next);
            }}
          />
        </td>

        <td style={{ ...styles.td, width: 200, minWidth: 200, maxWidth: 200 }}>
          <MultiSelectCell
            value={row.timeSlots}
            options={timeOptions}
            active={activeCell === `${isDraft ? "draft" : row.id}-timeSlots`}
            label="Select time"
            onChange={(next) => {
              if (isDraft) updateDraft("timeSlots", next);
              else updateRow(row.id, "timeSlots", next);
            }}
          />
        </td>

        <td style={{ ...styles.td, width: 140, minWidth: 140, maxWidth: 140 }}>
          <select
            style={styles.select}
            value={row.durationMinutes || durationOptions[0]?.value || 60}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (isDraft) updateDraft("durationMinutes", value);
              else updateRow(row.id, "durationMinutes", value);
            }}
            onBlur={() => {
              if (!isDraft) saveRow(row.id);
            }}
          >
            {durationOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
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
              <select
                style={{ ...styles.select, maxWidth: 360 }}
                value={portalUser?.id || ""}
                onChange={(event) => onAdminUserChange?.(event.target.value)}
              >
                <option value="">Select OTM user</option>
                {(meta.otmUsers || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={styles.tabsWrap}>
          <button style={styles.tabBtn(tab === "tuitions")} onClick={() => setTab("tuitions")}>
            {displayName} Tuitions
          </button>
          <button style={styles.tabBtn(tab === "reports")} onClick={() => setTab("reports")}>
            Reports
          </button>
          <button style={styles.tabBtn(tab === "totalClass")} onClick={() => setTab("totalClass")}>
            Total Classes
          </button>
        </div>

        <div style={styles.body}>
          {tab === "tuitions" && (
            <div style={styles.sheetWrap} className="vh-100">
              <div style={styles.sheetViewport} className="vh-100">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.stickyIndexHead }}>#</th>
                      <th style={{ ...styles.th, ...styles.stickyColorHead }}>Color</th>
                      <th style={{ ...styles.th, width: 180 }}>Days</th>
                      <th style={{ ...styles.th, width: 200 }}>Time</th>
                      <th style={{ ...styles.th, width: 140 }}>Duration</th>
                      {TEXT_COLUMNS.map((column) => (
                        <th key={column.key} style={{ ...styles.th, width: column.width }}>
                          {column.label}
                        </th>
                      ))}
                      <th style={{ ...styles.th, width: 160 }}>Status</th>
                      <th style={{ ...styles.th, width: 130 }}>New Tuition</th>
                      <th style={{ ...styles.th, width: 120 }}>Action</th>
                    </tr>

                    <tr>
                      <td style={{ ...styles.addRowCell, ...styles.stickyIndexCell(true) }}>New</td>
                      <td style={{ ...styles.addRowCell, ...styles.stickyColorCell(true) }}>
                        <select style={styles.select} disabled>
                          <option>Draft</option>
                        </select>
                      </td>

                      {renderDayTimeDurationBlock(draft, true)}

                      {TEXT_COLUMNS.map((column) => (
                        <td key={column.key} style={{ ...styles.addRowCell, width: column.width }}>
                          {renderTextInput(draft, column.key, column.width, true, column.readOnly)}
                        </td>
                      ))}

                      <td style={{ ...styles.addRowCell, width: 160 }}>
                        <select
                          style={styles.select}
                          value={draft.status || "class pending"}
                          onChange={(event) => updateDraft("status", event.target.value)}
                        >
                          {statusOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ ...styles.addRowCell, width: 130 }}>
                        <button
                          type="button"
                          style={styles.boolPill(Boolean(draft.newTuition))}
                          onClick={() => updateDraft("newTuition", !draft.newTuition)}
                        >
                          {draft.newTuition ? "Yes" : "No"}
                        </button>
                      </td>

                      <td style={styles.addRowCell}>
                        <button type="button" style={styles.actionBtn} onClick={createRow}>
                          {creating ? "Adding..." : "Add Row"}
                        </button>
                      </td>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={14} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                          No entries found.
                        </td>
                      </tr>
                    ) : (
                      entries.map((row, index) => {
                        const rowBg = rowColors[row.id] || "#ffffff";
                        return (
                          <tr key={row.id} style={{ background: rowBg }}>
                            <td style={{ ...styles.td, ...styles.stickyIndexCell(false) }}>{index + 1}</td>

                            <td style={{ ...styles.td, ...styles.stickyColorCell(false, rowBg) }}>
                              <select
                                style={styles.select}
                                value={rowColors[row.id] || ""}
                                onChange={(event) =>
                                  setRowColors((prev) => ({ ...prev, [row.id]: event.target.value }))
                                }
                              >
                                {COLOR_OPTIONS.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {renderDayTimeDurationBlock(row)}

                            {TEXT_COLUMNS.map((column) => (
                              <td
                                key={column.key}
                                style={{
                                  ...styles.td,
                                  background: rowBg,
                                  width: column.width,
                                  minWidth: column.width,
                                  maxWidth: column.width,
                                }}
                              >
                                {renderTextInput(row, column.key, column.width, false, column.readOnly)}
                              </td>
                            ))}

                            <td style={{ ...styles.td, background: rowBg, width: 160 }}>
                              <select
                                style={styles.select}
                                value={row.status || "class pending"}
                                onChange={(event) => updateRow(row.id, "status", event.target.value)}
                                onBlur={() => saveRow(row.id)}
                              >
                                {statusOptions.map((item) => (
                                  <option key={item} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td style={{ ...styles.td, background: rowBg, width: 130 }}>
                              <button
                                type="button"
                                style={styles.boolPill(Boolean(row.newTuition))}
                                onClick={() => {
                                  updateRow(row.id, "newTuition", !row.newTuition);
                                  setTimeout(() => saveRow(row.id), 0);
                                }}
                              >
                                {row.newTuition ? "Yes" : "No"}
                              </button>
                            </td>

                            <td style={{ ...styles.td, background: rowBg }}>
                              <button type="button" style={styles.deleteBtn} onClick={() => deleteRow(row.id)}>
                                {savingRowId === row.id ? "Saving..." : "Delete"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <>
              <div style={styles.sectionGrid}>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Total Entries</h3>
                  <div style={styles.statValue}>{reportSummary?.totalEntries || 0}</div>
                </div>

                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Class Done</h3>
                  <div style={styles.statValue}>{reportSummary?.byStatus?.["class done"] || 0}</div>
                </div>

                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Class Pending</h3>
                  <div style={styles.statValue}>{reportSummary?.byStatus?.["class pending"] || 0}</div>
                </div>

                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Missed Total</h3>
                  <div style={styles.statValue}>
                    {(reportSummary?.byStatus?.["missed by teacher"] || 0) +
                      (reportSummary?.byStatus?.["missed by student"] || 0)}
                  </div>
                </div>
              </div>

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.reportTable}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh}>Teacher</th>
                        <th style={styles.reportTh}>Tuition</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>Class Done</th>
                        <th style={styles.reportTh}>Class Pending</th>
                        <th style={styles.reportTh}>Missed By Teacher</th>
                        <th style={styles.reportTh}>Missed By Student</th>
                        <th style={styles.reportTh}>New Tuition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={styles.reportTd}>No report rows found.</td>
                        </tr>
                      ) : (
                        reportRows.map((row, index) => (
                          <tr key={`${row.teacherName}-${row.tuitionName}-${index}`}>
                            <td style={styles.reportTd}>{row.teacherName}</td>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
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
            </>
          )}

          {tab === "totalClass" && (
            <>
              <div style={styles.sectionGrid}>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Total Classes</h3>
                  <div style={styles.statValue}>{totalClassSummary?.totalClasses || 0}</div>
                </div>
              </div>

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.reportTable}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh}>Tuition</th>
                        <th style={styles.reportTh}>Tutor</th>
                        <th style={styles.reportTh}>Days</th>
                        <th style={styles.reportTh}>Time</th>
                        <th style={styles.reportTh}>Duration</th>
                        <th style={styles.reportTh}>Status</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>New Tuition Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalClassRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={styles.reportTd}>No total class rows found.</td>
                        </tr>
                      ) : (
                        totalClassRows.map((row, index) => (
                          <tr key={`${row.tuitionName}-${row.tutorName}-${index}`}>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>{row.tutorName}</td>
                            <td style={styles.reportTd}>{row.days}</td>
                            <td style={styles.reportTd}>{row.time}</td>
                            <td style={styles.reportTd}>{row.duration}</td>
                            <td style={styles.reportTd}>{row.status}</td>
                            <td style={styles.reportTd}>{row.totalClasses}</td>
                            <td style={styles.reportTd}>{row.newTuitionCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
