import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pagination, Toolbar, styles } from "./otmPortalShared.jsx";

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
  { key: "newTuitionCount", label: "New Tuition", width: 95, type: "number" },
  { key: "totalFee", label: "Total Fee", width: 100, type: "money" },
  { key: "pauseNextCycle", label: "Pause Next", width: 92, type: "boolean" },
  { key: "rowColor", label: "Row Color", width: 92, type: "color" },
];

function normalizeCellValue(column, value) {
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
    tutorName: "",
    groupName: "",
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
    newTuitionCount: 0,
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
  const [localRows, setLocalRows] = useState(Array.isArray(rows) ? rows : []);
  const [activeCell, setActiveCell] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [savingIds, setSavingIds] = useState([]);
  const editorRefs = useRef(new Map());
  const saveTimers = useRef(new Map());
  const rowsRef = useRef(localRows);

  useEffect(() => {
    setLocalRows(Array.isArray(rows) ? rows : []);
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

      const snapshot = { ...current, [column.key]: value };
      if (column.key === "duration") snapshot.durationTime = value;
      if (column.key === "classStartTime" && !snapshot.time) snapshot.time = value;

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
        changed.set(target.id, target);
      });

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
          style={cellInputStyle}
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
        onChange={(event) => updateCell(row.id, column, event.target.value)}
        style={cellInputStyle}
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
        .otm-drag-handle { cursor: grab; user-select: none; font-size: 18px; }
        .otm-drag-handle:active { cursor: grabbing; }
      `}</style>

      <div style={topBarStyle}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Total Classes Spreadsheet</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
            Arrow keys move focus. Excel/Google Sheets tab-separated rows can be pasted directly.
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

      {summary && (
        <div style={styles.sectionGrid}>
          <div style={styles.statCard}>
            <h4 style={styles.statTitle}>Total Classes</h4>
            <div style={styles.statValue}>{summary.totalScheduled ?? summary.totalClasses ?? 0}</div>
          </div>
          <div style={styles.statCard}>
            <h4 style={styles.statTitle}>Total Hours</h4>
            <div style={styles.statValue}>{Number(summary.totalHours || 0).toFixed(1)}</div>
          </div>
          <div style={styles.statCard}>
            <h4 style={styles.statTitle}>Completed</h4>
            <div style={styles.statValue}>{summary.completedClasses ?? 0}</div>
          </div>
        </div>
      )}

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