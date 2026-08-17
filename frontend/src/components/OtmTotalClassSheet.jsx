import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pagination, Toolbar, styles } from "./otmPortalShared.jsx";
import CellHistoryPopup from "./CellHistoryPopup.jsx";

const REPORT_STATUS_OPTIONS = ["pending report", "report pending", "report shared"];

const COLUMNS = [
  { key: "days", label: "Days", width: 150 },
  { key: "time", label: "Time", width: 110 },
  { key: "duration", label: "Duration", width: 100 },
  { key: "durationMinutes", label: "Minutes", width: 82, type: "number" },
  { key: "tuitionName", label: "Tuition Name", width: 180 },
  { key: "tutorName", label: "Tutor Name", width: 150 },
  { key: "groupName", label: "Group Name", width: 170 },
  { key: "studentName", label: "Student Name", width: 150 },
  { key: "classStartTime", label: "Class Start", width: 110 },
  { key: "classEndTime", label: "Class End", width: 110 },
  { key: "status", label: "Status", width: 145, type: "status" },
  { key: "reportStatus", label: "Report Status", width: 145, type: "reportStatus" },
  { key: "decidedFee", label: "Decided Fee", width: 105, type: "money" },
  { key: "tutorFee", label: "Tutor Fee", width: 100, type: "money" },
  { key: "notes", label: "Notes", width: 210 },
  { key: "sourceTuitionId", label: "Source Tuition ID", width: 125 },
  { key: "tuitionStartDate", label: "Start Date", width: 125, type: "date" },
  { key: "tuitionStartWeek", label: "Start Week", width: 100 },
  { key: "numberOfDecidedDays", label: "Decided Days", width: 105, type: "number" },
  { key: "classesInAMonth", label: "Classes / Month", width: 115, type: "number" },
  { key: "totalDoneClasses", label: "Done", width: 80, type: "number" },
  { key: "missedByStudentClasses", label: "Missed Student", width: 110, type: "number" },
  { key: "missedByTeacherClass", label: "Missed Teacher", width: 110, type: "number" },
  { key: "totalClasses", label: "Total Classes", width: 100, type: "number" },
  { key: "totalFee", label: "Total Fee", width: 100, type: "money" },
  { key: "pauseNextCycle", label: "Pause Next", width: 92, type: "boolean" },
  { key: "rowColor", label: "Row Color", width: 92, type: "color" },
];


function normalizeBadgeValues(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => normalizeBadgeValues(item, depth + 1)).filter(Boolean))];
  }

  if (typeof value === "object") {
    return normalizeBadgeValues(Object.values(value), depth + 1);
  }

  const text = String(value).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (parsed !== text) return normalizeBadgeValues(parsed, depth + 1);
  } catch {
    // Plain comma-separated values are handled below.
  }

  const cleaned = text
    .replace(/\\"/g, '"')
    .replace(/^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g, "")
    .trim();

  if (!cleaned) return [];

  return [...new Set(
    cleaned
      .split(/[,|\n]+/)
      .map((item) => item.replace(/\\"/g, '"').replace(/^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g, "").trim())
      .filter(Boolean)
  )];
}

const DERIVED_COLUMNS = new Set([
  "numberOfDecidedDays",
  "classesInAMonth",
  "totalClasses",
  "totalFee",
]);

function parseNonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.trunc(number)
    : fallback;
}

function applyAutomaticClassTotals(row = {}) {
  const days = normalizeBadgeValues(row.days);
  const decidedDays = days.length
    ? days.length
    : parseNonNegativeInteger(row.numberOfDecidedDays, 0);

  const explicitClasses = parseNonNegativeInteger(row.classesInAMonth, 0);
  const classesInAMonth = decidedDays > 0 ? decidedDays * 4 : explicitClasses;

  let totalDoneClasses = parseNonNegativeInteger(row.totalDoneClasses, 0);
  let missedByStudentClasses = parseNonNegativeInteger(
    row.missedByStudentClasses,
    0
  );
  let missedByTeacherClass = parseNonNegativeInteger(
    row.missedByTeacherClass,
    0
  );

  const status = String(row.status || "").trim().toLowerCase();
  if (status === "class done") totalDoneClasses = Math.max(totalDoneClasses, 1);
  if (status === "missed by student") {
    missedByStudentClasses = Math.max(missedByStudentClasses, 1);
  }
  if (status === "missed by teacher") {
    missedByTeacherClass = Math.max(missedByTeacherClass, 1);
  }

  if (classesInAMonth > 0) {
    totalDoneClasses = Math.min(totalDoneClasses, classesInAMonth);
    missedByStudentClasses = Math.min(missedByStudentClasses, classesInAMonth);
    missedByTeacherClass = Math.min(missedByTeacherClass, classesInAMonth);
  }

  const next = {
    ...row,
    numberOfDecidedDays: decidedDays,
    classesInAMonth,
    totalDoneClasses,
    missedByStudentClasses,
    missedByTeacherClass,
    totalClasses: classesInAMonth,
  };

  const rawDecidedFee = row.decidedFee;
  const hasDecidedFee =
    rawDecidedFee !== null &&
    rawDecidedFee !== undefined &&
    String(rawDecidedFee).trim() !== "";
  const decidedFee = Number(String(rawDecidedFee ?? "").replace(/,/g, ""));
  if (
    hasDecidedFee &&
    Number.isFinite(decidedFee) &&
    decidedFee >= 0 &&
    classesInAMonth > 0
  ) {
    const perClassFee = decidedFee / classesInAMonth;
    next.totalFee = Number(
      Math.max(0, decidedFee - missedByTeacherClass * perClassFee).toFixed(2)
    );
  }

  return next;
}

function normalizeRowForUi(row = {}) {
  return applyAutomaticClassTotals({
    ...row,
    tutorName: normalizeBadgeValues(row.tutorName),
    groupName: normalizeBadgeValues(row.groupName),
  });
}

function getClassStatusStyle(status = "") {
  const value = String(status || "").trim().toLowerCase();

  if (value === "class done") {
    return { background: "#dcfce7", color: "#166534", border: "#86efac" };
  }
  if (value === "class pending") {
    return { background: "#fef3c7", color: "#92400e", border: "#fde68a" };
  }
  if (value === "missed by teacher") {
    return { background: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  }
  if (value === "missed by student") {
    return { background: "#ffedd5", color: "#c2410c", border: "#fdba74" };
  }
  if (value === "tuition pause") {
    return { background: "#e0e7ff", color: "#3730a3", border: "#a5b4fc" };
  }

  return { background: "#f8fafc", color: "#475569", border: "#cbd5e1" };
}

function BadgeEditor({ value, variant, placeholder, common, onChange }) {
  const values = normalizeBadgeValues(value);
  const [draft, setDraft] = useState("");

  const commit = (rawValue = draft) => {
    const incoming = normalizeBadgeValues(rawValue);
    if (!incoming.length) return false;
    onChange([...new Set([...values, ...incoming])]);
    setDraft("");
    return true;
  };

  const remove = (item) => {
    onChange(values.filter((current) => current !== item));
  };

  return (
    <div className="otm-badge-editor">
      {values.map((item, index) => (
        <span key={`${item}-${index}`} className={`otm-value-badge otm-value-badge--${variant}`}>
          <span>{item}</span>
          <button
            type="button"
            tabIndex={-1}
            className="otm-value-badge__remove"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => remove(item)}
            aria-label={`Remove ${item}`}
          >
            ×
          </button>
        </span>
      ))}

      <input
        {...common}
        type="text"
        value={draft}
        placeholder={values.length ? "+ add" : placeholder}
        className="otm-total-editor otm-badge-editor__input"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
            event.preventDefault();
            event.stopPropagation();
            commit();
            return;
          }

          if (event.key === "Backspace" && !draft && values.length) {
            event.preventDefault();
            remove(values[values.length - 1]);
            return;
          }

          common.onKeyDown?.(event);
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData?.getData("text/plain") || "";
          if (/[,|\n]/.test(pasted)) {
            event.preventDefault();
            commit(pasted);
            return;
          }
          common.onPaste?.(event);
        }}
        onBlur={(event) => {
          if (draft.trim()) commit();
          common.onBlur?.(event);
        }}
      />
    </div>
  );
}

function normalizeCellValue(column, value) {
  if (column.key === "tutorName" || column.key === "groupName") {
    return normalizeBadgeValues(value);
  }
  if (column.type === "number") {
    if (value === "") return "";
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
  }
  if (column.type === "money") {
    if (value === "") return "";
    const number = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(number) ? number : "";
  }
  if (column.type === "boolean") {
    const normalized = String(value).trim().toLowerCase();
    return ["1", "true", "yes", "y", "on"].includes(normalized);
  }
  return value;
}

function emptyRow() {
  return {
    days: "",
    time: "",
    duration: "1 hour",
    durationMinutes: 60,
    tuitionName: "New Tuition",
    tutorName: [],
    groupName: [],
    studentName: "",
    classStartTime: "",
    classEndTime: "",
    status: "class pending",
    reportStatus: "pending report",
    decidedFee: "",
    tutorFee: "",
    notes: "",
    sourceTuitionId: "",
    tuitionStartDate: "",
    tuitionStartWeek: "",
    numberOfDecidedDays: 0,
    classesInAMonth: 0,
    totalDoneClasses: 0,
    missedByStudentClasses: 0,
    missedByTeacherClass: 0,
    totalClasses: 0,
    totalFee: "",
    pauseNextCycle: false,
    rowColor: "#ffffff",
  };
}

export default function OtmTotalClassSheet({
  rows = [],
  summary = null,
  search = "",
  onSearch,
  filters,
  onFiltersChange,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  dayOptions = [],
  yearOptions = [],
  statusOptions = [],
  onCreateRow,
  onUpdateRow,
  onBulkUpdateRows,
  onDeleteRow,
  onReorderRows,
}) {
  const [localRows, setLocalRows] = useState(
    (Array.isArray(rows) ? rows : []).map(normalizeRowForUi)
  );
  const [activeCell, setActiveCell] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [savingIds, setSavingIds] = useState([]);
  const [historyConfig, setHistoryConfig] = useState({
    isOpen: false,
    recordId: null,
    field: "",
    type: "totalClasses",
    x: 0,
    y: 0,
  });
  const editorRefs = useRef(new Map());
  const saveTimers = useRef(new Map());
  const rowsRef = useRef(localRows);

  useEffect(() => {
    setLocalRows((Array.isArray(rows) ? rows : []).map(normalizeRowForUi));
  }, [rows]);

  useEffect(() => {
    rowsRef.current = localRows;
  }, [localRows]);

  useEffect(
    () => () => {
      saveTimers.current.forEach((timer) => window.clearTimeout(timer));
      saveTimers.current.clear();
    },
    []
  );

  const totalPages = Math.max(1, Math.ceil(localRows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return localRows.slice(start, start + pageSize);
  }, [localRows, pageSize, safePage]);

  const registerEditor = useCallback((rowId, columnKey, node) => {
    const key = `${rowId}::${columnKey}`;
    if (node) editorRefs.current.set(key, node);
    else editorRefs.current.delete(key);
  }, []);

  const focusCell = useCallback((rowId, columnKey) => {
    const node = editorRefs.current.get(`${rowId}::${columnKey}`);
    if (!node?.focus) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  const flushRow = useCallback(
    async (rowId, overrideRow = null) => {
      const timer = saveTimers.current.get(rowId);
      if (timer) window.clearTimeout(timer);
      saveTimers.current.delete(rowId);

      const row = overrideRow || rowsRef.current.find((item) => item.id === rowId);
      if (!row || !onUpdateRow) return;

      setSavingIds((prev) => (prev.includes(rowId) ? prev : [...prev, rowId]));
      try {
        await onUpdateRow(rowId, row);
      } finally {
        setSavingIds((prev) => prev.filter((id) => id !== rowId));
      }
    },
    [onUpdateRow]
  );

  const scheduleSave = useCallback(
    (rowId, row, delay = 450) => {
      if (!rowId || !onUpdateRow) return;
      const previous = saveTimers.current.get(rowId);
      if (previous) window.clearTimeout(previous);
      const timer = window.setTimeout(() => void flushRow(rowId, row), delay);
      saveTimers.current.set(rowId, timer);
    },
    [flushRow, onUpdateRow]
  );

  const updateCell = useCallback(
    (rowId, column, rawValue, { save = true } = {}) => {
      const value = normalizeCellValue(column, rawValue);
      const current = rowsRef.current.find((row) => row.id === rowId);
      if (!current) return;

      let snapshot = { ...current, [column.key]: value };
      if (column.key === "duration") snapshot.durationTime = value;
      if (column.key === "classStartTime" && !snapshot.time) snapshot.time = value;
      if (column.key === "days") {
        snapshot.numberOfDecidedDays = normalizeBadgeValues(value).length;
      }
      snapshot = applyAutomaticClassTotals(snapshot);

      const nextRows = rowsRef.current.map((row) => (row.id === rowId ? snapshot : row));
      rowsRef.current = nextRows;
      setLocalRows(nextRows);

      if (save) scheduleSave(rowId, snapshot);
    },
    [scheduleSave]
  );

  const moveFocus = useCallback(
    (rowId, columnKey, rowDelta, columnDelta) => {
      const rowIndex = pageRows.findIndex((row) => row.id === rowId);
      const columnIndex = COLUMNS.findIndex((column) => column.key === columnKey);
      if (rowIndex < 0 || columnIndex < 0) return;

      const nextRow = pageRows[rowIndex + rowDelta];
      const nextColumn = COLUMNS[columnIndex + columnDelta];
      if (nextRow && nextColumn) focusCell(nextRow.id, nextColumn.key);
    },
    [focusCell, pageRows]
  );

  const handleKeyDown = useCallback(
    (event, rowId, columnKey) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveFocus(rowId, columnKey, 0, -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveFocus(rowId, columnKey, 0, 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(rowId, columnKey, -1, 0);
      } else if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        void flushRow(rowId);
        moveFocus(rowId, columnKey, event.shiftKey ? -1 : 1, 0);
      }
    },
    [flushRow, moveFocus]
  );

  const handlePaste = useCallback(
    async (event, startRowId, startColumnKey) => {
      const text = event.clipboardData?.getData("text/plain") || "";
      if (!text.includes("\t") && !text.includes("\n") && !text.includes("\r")) return;

      event.preventDefault();
      const matrix = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line, index, list) => line.length > 0 || index < list.length - 1)
        .map((line) => line.split("\t"));

      const startRowIndex = localRows.findIndex((row) => row.id === startRowId);
      const startColumnIndex = COLUMNS.findIndex((column) => column.key === startColumnKey);
      if (startRowIndex < 0 || startColumnIndex < 0) return;

      const changed = new Map();
      const nextRows = localRows.map((row) => ({ ...row }));

      matrix.forEach((cells, rowOffset) => {
        const target = nextRows[startRowIndex + rowOffset];
        if (!target) return;

        cells.forEach((cell, columnOffset) => {
          const column = COLUMNS[startColumnIndex + columnOffset];
          if (!column) return;
          target[column.key] = normalizeCellValue(column, cell);
          if (column.key === "duration") target.durationTime = target.duration;
          if (column.key === "classStartTime" && !target.time) target.time = target.classStartTime;
        });
        const recalculated = applyAutomaticClassTotals(target);
        Object.assign(target, recalculated);
        changed.set(target.id, target);
      });

      rowsRef.current = nextRows;
      setLocalRows(nextRows);
      const changedRows = [...changed.values()];
      if (changedRows.length === 0) return;

      if (onBulkUpdateRows) {
        setSavingIds((prev) => [...new Set([...prev, ...changedRows.map((row) => row.id)])]);
        try {
          await onBulkUpdateRows(changedRows);
        } finally {
          setSavingIds((prev) => prev.filter((id) => !changed.has(id)));
        }
      } else {
        await Promise.all(changedRows.map((row) => onUpdateRow?.(row.id, row)));
      }
    },
    [localRows, onBulkUpdateRows, onUpdateRow]
  );

  const addRow = useCallback(async () => {
    if (!onCreateRow) return;
    await onCreateRow(emptyRow());
  }, [onCreateRow]);

  const deleteRow = useCallback(
    async (row) => {
      if (!onDeleteRow) return;
      const linkedMessage = row.sourceEntryId
        ? "This is synced from Tuition Entry. It will be hidden from Total Classes but the Tuition Entry will remain."
        : "Delete this Total Classes row?";
      if (!window.confirm(linkedMessage)) return;
      await onDeleteRow(row.id);
    },
    [onDeleteRow]
  );

  const dropRow = useCallback(
    async (targetId) => {
      if (!draggedId || draggedId === targetId) return;
      const next = [...localRows];
      const from = next.findIndex((row) => row.id === draggedId);
      const to = next.findIndex((row) => row.id === targetId);
      if (from < 0 || to < 0) return;

      const [dragged] = next.splice(from, 1);
      next.splice(to, 0, dragged);
      setLocalRows(next);
      setDraggedId(null);
      await onReorderRows?.(next.map((row) => row.id));
    },
    [draggedId, localRows, onReorderRows]
  );

  const openCellHistory = useCallback((event, rowId, field) => {
    event.preventDefault();
    event.stopPropagation();
    setHistoryConfig({
      isOpen: true,
      recordId: rowId,
      field,
      type: "totalClasses",
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  function editorProps(row, column) {
    return {
      ref: (node) => registerEditor(row.id, column.key, node),
      className: "otm-total-editor",
      onFocus: () => setActiveCell(`${row.id}::${column.key}`),
      onKeyDown: (event) => handleKeyDown(event, row.id, column.key),
      onPaste: (event) => void handlePaste(event, row.id, column.key),
      onBlur: () => void flushRow(row.id),
      "data-row-id": row.id,
      "data-column-key": column.key,
    };
  }

  function renderEditor(row, column) {
    const value = row[column.key] ?? "";
    const common = editorProps(row, column);

    if (column.key === "tutorName" || column.key === "groupName") {
      return (
        <BadgeEditor
          value={value}
          variant={column.key === "groupName" ? "group" : "tutor"}
          placeholder={column.key === "groupName" ? "Add group" : "Add tutor"}
          common={common}
          onChange={(nextValues) => updateCell(row.id, column, nextValues)}
        />
      );
    }

    if (column.type === "boolean") {
      return (
        <input
          {...common}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => updateCell(row.id, column, event.target.checked)}
          style={{ width: 16, height: 16, cursor: "pointer" }}
        />
      );
    }

    if (column.type === "status") {
      return (
        <select
          {...common}
          value={value}
          onChange={(event) => updateCell(row.id, column, event.target.value)}
          style={{
            ...cellInputStyle,
            ...getClassStatusStyle(value),
            width: "calc(100% - 10px)",
            minHeight: 28,
            margin: 5,
            padding: "4px 10px",
            border: `1px solid ${getClassStatusStyle(value).border}`,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            textAlign: "center",
            textAlignLast: "center",
            cursor: "pointer",
          }}
        >
          <option value="">--</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      );
    }

    if (column.type === "reportStatus") {
      return (
        <select
          {...common}
          value={value}
          onChange={(event) => updateCell(row.id, column, event.target.value)}
          style={cellInputStyle}
        >
          {REPORT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      );
    }

    if (column.type === "color") {
      return (
        <input
          {...common}
          type="color"
          value={value || "#ffffff"}
          onChange={(event) => updateCell(row.id, column, event.target.value)}
          style={{ width: "100%", height: 30, border: 0, background: "transparent" }}
        />
      );
    }

    return (
      <input
        {...common}
        type={
          column.type === "number" || column.type === "money"
            ? "number"
            : column.type === "date"
              ? "date"
              : "text"
        }
        step={column.type === "money" ? "0.01" : undefined}
        min={column.type === "number" ? "0" : undefined}
        value={value}
        readOnly={DERIVED_COLUMNS.has(column.key)}
        title={
          DERIVED_COLUMNS.has(column.key)
            ? "Calculated automatically by the system"
            : undefined
        }
        onChange={(event) => updateCell(row.id, column, event.target.value)}
        style={{
          ...cellInputStyle,
          ...(DERIVED_COLUMNS.has(column.key)
            ? { background: "#f8fafc", color: "#334155", fontWeight: 700 }
            : {}),
        }}
      />
    );
  }

  return (
    <div>
      <style>{`
        .otm-total-row:hover td { background: #f8fafc; }
        .otm-total-cell { position: relative; padding: 0 !important; }
        .otm-total-cell--active { box-shadow: inset 0 0 0 2px #16a34a; z-index: 3; }
        .otm-total-editor { width: 100%; min-height: 34px; border: 0; border-radius: 0; padding: 7px 8px; background: transparent; font: inherit; }
        .otm-total-editor:focus { outline: none; background: #ecfdf5; }
        .otm-badge-editor {
          width: 100%;
          min-height: 34px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 3px 5px;
          box-sizing: border-box;
          background: transparent;
        }
        .otm-badge-editor:focus-within { background: #ecfdf5; }
        .otm-badge-editor__input {
          flex: 1 1 64px;
          min-width: 58px;
          width: auto !important;
          min-height: 24px !important;
          padding: 2px 4px !important;
        }
        .otm-value-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          max-width: 100%;
          padding: 2px 4px 2px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.35;
          white-space: nowrap;
        }
        .otm-value-badge--group {
          background: #dbeafe;
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        }
        .otm-value-badge--tutor {
          background: #ede9fe;
          color: #6d28d9;
          border: 1px solid #c4b5fd;
        }
        .otm-value-badge__remove {
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 999px;
          padding: 0;
          background: rgba(15, 23, 42, 0.09);
          color: inherit;
          cursor: pointer;
          line-height: 1;
        }
        .otm-drag-handle { cursor: grab; user-select: none; font-size: 18px; }
        .otm-drag-handle:active { cursor: grabbing; }
      `}</style>

      <div style={topBarStyle}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Total Classes Spreadsheet</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
            Arrow keys move focus. Paste works like Excel/Google Sheets. Scheduled classes and payable fee recalculate automatically.
          </div>
        </div>
        <button type="button" onClick={() => void addRow()} style={addButtonStyle}>
          + Add Row
        </button>
      </div>

      <Toolbar
        title="Search and Filters"
        search={search}
        onSearch={onSearch}
        filters={filters}
        onFiltersChange={onFiltersChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        selectedCount={0}
        dayOptions={dayOptions}
        yearOptions={yearOptions}
        statusOptions={statusOptions}
        showStatus
      />

     

      <div style={{ ...styles.sheetWrap, overflow: "hidden" }}>
        <div style={{ ...styles.sheetViewport, overflow: "auto", maxHeight: "70vh" }}>
          <table style={{ ...styles.table, minWidth: 3300 }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 42, position: "sticky", left: 0, zIndex: 6 }}>↕</th>
                <th style={{ ...styles.th, width: 55, position: "sticky", left: 42, zIndex: 6 }}>#</th>
                {COLUMNS.map((column) => (
                  <th key={column.key} style={{ ...styles.th, width: column.width, minWidth: column.width }}>
                    {column.label}
                  </th>
                ))}
                <th style={{ ...styles.th, width: 100 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 3} style={{ padding: 28, textAlign: "center", color: "#64748b" }}>
                    No total class records found.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="otm-total-row"
                    draggable
                    onDragStart={() => setDraggedId(row.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => void dropRow(row.id)}
                    style={{ background: row.rowColor || undefined }}
                  >
                    <td style={{ ...styles.td, textAlign: "center", position: "sticky", left: 0, zIndex: 4, background: "inherit" }}>
                      <span className="otm-drag-handle" title="Drag row">⋮⋮</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center", position: "sticky", left: 42, zIndex: 4, background: "inherit" }}>
                      {(safePage - 1) * pageSize + index + 1}
                      {savingIds.includes(row.id) ? <span title="Saving..."> •</span> : null}
                    </td>
                    {COLUMNS.map((column) => {
                      const key = `${row.id}::${column.key}`;
                      return (
                        <td
                          key={column.key}
                          className={`otm-total-cell ${activeCell === key ? "otm-total-cell--active" : ""}`}
                          style={{ ...styles.td, width: column.width, minWidth: column.width }}
                          onContextMenu={(event) =>
                            openCellHistory(event, row.id, column.key)
                          }
                        >
                          {renderEditor(row, column)}
                        </td>
                      );
                    })}
                    <td style={{ ...styles.td, padding: 6 }}>
                      <button type="button" style={styles.deleteBtn} onClick={() => void deleteRow(row)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        totalItems={localRows.length}
        page={safePage}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />

      <CellHistoryPopup
        config={historyConfig}
        onClose={() =>
          setHistoryConfig((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
      />
    </div>
  );
}

const cellInputStyle = {
  width: "100%",
  minHeight: 34,
  border: 0,
  borderRadius: 0,
  padding: "7px 8px",
  background: "transparent",
  fontSize: 13,
};

const topBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "12px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#ffffff",
  marginBottom: 10,
};

const addButtonStyle = {
  border: "1px solid #15803d",
  background: "#16a34a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "9px 14px",
  fontWeight: 800,
  cursor: "pointer",
};