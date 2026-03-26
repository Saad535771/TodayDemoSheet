import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/api.js";

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #eef0f3",
  },
  title: { fontSize: "22px", fontWeight: "700", color: "#000000", marginBottom: 10 },
  tableWrapper: {
    overflowX: "auto",
    height: "100%",
    marginTop: "0px",
  },
  table: { width: "100%", height: "100%", fontSize: "12px" },
  th: {
    background: "#000000",
    color: "#fdfdfd",
    fontWeight: "600",
    padding: "8px 10px",
    textAlign: "center",
    border: "1px solid #000000",
    top: 0,
    height: "100%",
    zIndex: 10,
    position: "relative",
  },
  td: {
    padding: "0",
    border: "1px solid #000000",
    textAlign: "center",
    verticalAlign: "middle",
    height: "15px",
    width: "15px",
  },
  inlineInput: {
    width: "100%",
    height: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: "0",
    fontSize: "14px",
    background: "transparent",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Calibri', sans-serif",
  },
  inlineSelect: {
    width: "100%",
    height: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: "0",
    fontSize: "14px",
    background: "transparent",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Calibri', sans-serif",
    cursor: "pointer",
  },
  actionBtn: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    background: "#fee2e2",
    color: "#b91c1c",
    fontFamily: "'Calibri', sans-serif",
  },
  moveBtn: {
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    padding: "2px 6px",
    color: "#555",
  },
  colorSwatch: {
    width: "18px",
    height: "18px",
    border: "2px solid #000000",
    cursor: "pointer",
    borderRadius: "4px",
    overflow: "hidden",
    display: "inline-block",
  },
  pickerPopup: {
    position: "fixed",
    top: "130px",
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    margin: "0px",
    borderRadius: "6px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    zIndex: 3000,
    width: "220px",
  },
  fixedSearchContainer: {
    position: "fixed",
    top: "75px",
    right: 0,
    width: "80%",
    padding: "14px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    zIndex: 100,
  },
};

const searchColumns = [
  { key: "tuitionId", label: "Tuition Id" },
  { key: "date", label: "Date" },
  { key: "tuitionName", label: "Tuition Name" },
  { key: "tutorName", label: "Tutor Name" },
  { key: "rejectedTutor", label: "Rejected Tutor" },
  { key: "feedback", label: "Feedback" },
  { key: "country", label: "Country" },
  { key: "parentsContact", label: "Parent Contact" },
  { key: "className", label: "Class" },
  { key: "subjects", label: "Subject" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "demoRating", label: "Demo Rating" },
  { key: "syncFlag", label: "Sync" },
  { key: "estimatedFee", label: "Estimated Fee" },
  { key: "tutorFee", label: "Tutor Fee" },
  { key: "demoTime", label: "Demo Time" },
  { key: "demoDate", label: "Demo Date" },
];

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = [
  "",
  "1st Demo Done",
  "2nd Demo Done",
  "payment Process",
  "Tuition Done",
  "Tuition Cancelled",
  "irrelevant",
  "Not available",
  "Pending",
];

const gridColumns = [
  { id: "date", label: "Date", width: 130, editable: true, field: "date", type: "date" },
  { id: "demoTime", label: "Demo Time", width: 110, editable: true, field: "demoTime", type: "time" },
  { id: "tuitionName", label: "Tuition Name", width: 180, editable: true, field: "tuitionName", kind: "tuitionName" },
  { id: "status", label: "Status", width: 140, editable: true, field: "status", kind: "select", options: statusList, pill: "status" },
  { id: "estimatedFee", label: "Estimated Fee", width: 120, editable: true, field: "estimatedFee" },
  { id: "tutorName", label: "Tutor Name", width: 160, editable: true, field: "tutorName" },
  { id: "tutorFees", label: "Tutor Fees", width: 120, editable: true, field: "tutorFees" },
  { id: "rejectedTutor", label: "Rejected Tutor", width: 140, editable: true, field: "rejectedTutor" },
  { id: "feedback", label: "Feedback", width: 200, editable: true, field: "feedback" },
  { id: "country", label: "Country", width: 100, editable: true, field: "country" },
  { id: "parentsContact", label: "Parent Contact", width: 140, editable: true, field: "parentsContact" },
  { id: "className", label: "Class", width: 100, editable: true, field: "className" },
  { id: "subjects", label: "Subject", width: 140, editable: true, field: "subjects" },
  { id: "daysPerWeek", label: "Days per week", width: 100, editable: true, field: "daysPerWeek" },
  { id: "source", label: "Source", width: 120, editable: true, field: "source", kind: "select", options: sourcesList, pill: "source" },
  { id: "demoDate", label: "Demo Date", width: 120, editable: true, field: "demoDate", type: "date" },
  { id: "tuitionId", label: "Tuition Id", width: 100, editable: false, field: "tuitionId", kind: "readonly" },
  { id: "otmName", label: "OTM Name", width: 120, editable: true, field: "otmName" },
  { id: "demoRating", label: "Demo Rating", width: 140, editable: true, field: "demoRating", kind: "select", options: demoRatings, pill: "demoRating" },
  { id: "sync", label: "Sync", width: 80, editable: true, field: "sync" },
];

const gridColumnIds = gridColumns.map((c) => c.id);
const gridColumnMap = Object.fromEntries(gridColumns.map((c) => [c.id, c]));
const firstEditableColumnId = gridColumns[0]?.id || "demoTime";
const columnColors = { "Rejected Tutor": "#c00000" };

const getCellKey = (rowIndex, colId) => `${rowIndex}__${colId}`;

const parseCellKey = (key) => {
  const [rowIndex, ...rest] = key.split("__");
  return { rowIndex: Number(rowIndex), colId: rest.join("__") };
};

function format12Hour(time24) {
  if (!time24) return "";

  const clean = String(time24).trim();
  const parts = clean.split(":");
  if (parts.length < 2) return clean;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ?? "00";

  if (Number.isNaN(hours)) return clean;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${ampm}`;
}

const renderPill = (val, styleFn) => {
  if (!val) return "";
  const style = styleFn(val);
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "inline-block",
        ...style,
      }}
    >
      {val}
    </span>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case "1st Demo Done":
      return { backgroundColor: "black", color: "white", border: "1px solid black" };
    case "2nd Demo Done":
      return { backgroundColor: "#8B4513", color: "white", border: "1px solid #8B4513" };
    case "payment Process":
      return { backgroundColor: "#fef08a", color: "black", border: "1px solid #fef08a" };
    case "Tuition Done":
      return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" };
    case "Tuition Cancelled":
      return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" };
    case "irrelevant":
      return { backgroundColor: "white", color: "black", border: "1px solid #9ca3af" };
    case "Not available":
      return { backgroundColor: "#4c1d95", color: "white", border: "1px solid #4c1d95" };
    case "Pending":
      return { backgroundColor: "#3b82f6", color: "white", border: "1px solid #3b82f6" };
    default:
      return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};

const getDemoRatingStyle = (rating) => {
  switch (rating) {
    case "Average Demo":
      return { backgroundColor: "#ca8a04", color: "white", border: "1px solid #ca8a04" };
    case "Strong Demo":
      return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" };
    case "Weak Demo":
      return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" };
    default:
      return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};

const getSourceStyle = (source) => {
  switch (source) {
    case "mahad":
      return { backgroundColor: "#0ea5e9", color: "white", border: "1px solid #0ea5e9" };
    case "areeba":
      return { backgroundColor: "#ec4899", color: "white", border: "1px solid #ec4899" };
    case "sibgha":
      return { backgroundColor: "#14b8a6", color: "white", border: "1px solid #14b8a6" };
    default:
      return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};
const getFeedbackStyle = (feedback) => {
  const value = String(feedback || "").trim();

  if (!value) {
    return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }

  if (/\bsatisfied\b/i.test(value)) {
    return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" };
  }

  return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
};
const ColorSwatch = ({
  color = "#ffffff",
  onChange,
  pickerId,
  activeColorPicker,
  onOpen,
  onClose,
}) => {
  const swatchRef = useRef(null);

  const presets = [
    "#ffffff",
    "#f8f9fa",
    "#ffebee",
    "#fff3e0",
    "#f3e5f5",
    "#e8f5e9",
    "#e3f2fd",
    "#fff8e1",
    "#fce4ec",
    "#e0f2f1",
    "#f1f8e9",
    "#e8eaf6",
    "#ef5350",
    "#ff9800",
    "#fdd835",
    "#209024",
    "#2196f3",
    "#9c27b0",
    "#cf0e00",
    "#ff5722",
    "#ffc107",
    "#8bc34a",
    "#03a9f4",
    "#673ab7",
  ];

  const isOpen = activeColorPicker?.id === pickerId;

  const openPopup = () => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();

    if (isOpen) {
      onClose();
      return;
    }

    onOpen({
      id: pickerId,
      top: rect.top,
      left: rect.left,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e) => {
      if (swatchRef.current && !swatchRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={swatchRef} style={{ position: "relative", display: "inline-block" }}>
      <div
        onClick={openPopup}
        style={{ ...styles.colorSwatch, backgroundColor: color }}
        title="Click to change color (Excel style)"
      />

      {isOpen && (
        <div
          style={{
            ...styles.pickerPopup,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#444",
            }}
          >
            Default Colors
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 28px)",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            {presets.map((c, i) => (
              <div
                key={i}
                onClick={() => {
                  onChange(c);
                  onClose();
                }}
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: c,
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          <div style={{ borderTop: "1px solid #eee", paddingTop: "8px" }}>
            <div style={{ fontSize: "13px", marginBottom: "4px" }}>Custom Color</div>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: "100%", height: "32px", cursor: "pointer" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function MonthlyTuitionTable({ items, load, zoom, handleZoom }) {
  const [localItems, setLocalItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFields, setSelectedFields] = useState(searchColumns.map((c) => c.key));
  const [sortField, setSortField] = useState("orderIndex");
  const [sortDir, setSortDir] = useState("ASC");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [selectedCell, setSelectedCell] = useState(null);
  const [anchorCell, setAnchorCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [activeColorPicker, setActiveColorPicker] = useState(null);

  const tableWrapperRef = useRef(null);
  const localItemsRef = useRef(localItems);
  const editingCellRef = useRef(editingCell);
  const editValueRef = useRef(editValue);
  const inputRef = useRef(null);
  const shouldSelectAllOnFocusRef = useRef(true);
  const moveCaretToEndOnFocusRef = useRef(false);
  const isMouseSelectingRef = useRef(false);
  const dragAnchorCellRef = useRef(null);
  const undoStackRef = useRef([]);
  const isUndoRunningRef = useRef(false);
  const HORIZONTAL_TRACKPAD_MULTIPLIER = -1;

  useEffect(() => {
    localItemsRef.current = localItems;
  }, [localItems]);

  useEffect(() => {
    editingCellRef.current = editingCell;
  }, [editingCell]);

  useEffect(() => {
    editValueRef.current = editValue;
  }, [editValue]);

  useEffect(() => {
    const stopMouseSelection = () => {
      isMouseSelectingRef.current = false;
      dragAnchorCellRef.current = null;
    };

    document.addEventListener("mouseup", stopMouseSelection);
    return () => document.removeEventListener("mouseup", stopMouseSelection);
  }, []);
  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;
    const handleTrackpadHorizontalScroll = (e) => {
      const horizontalIntent = Math.abs(e.deltaX) > 0 && Math.abs(e.deltaX) >= Math.abs(e.deltaY);
      if (!horizontalIntent) return;
      e.preventDefault();
      wrapper.scrollRight += e.deltaX * HORIZONTAL_TRACKPAD_MULTIPLIER;
    };
    wrapper.addEventListener("wheel", handleTrackpadHorizontalScroll, { passive: false });
    return () => {
      wrapper.removeEventListener("wheel", handleTrackpadHorizontalScroll);
    };
  }, [HORIZONTAL_TRACKPAD_MULTIPLIER]);
  useEffect(() => {
    setLocalItems(items);
    setSelectedRows(new Set());

    if (items?.length) {
      const first = { rowIndex: 0, colId: firstEditableColumnId };
      setSelectedCell(first);
      setAnchorCell(first);
      setSelectedCells(new Set([getCellKey(0, firstEditableColumnId)]));
    } else {
      setSelectedCell(null);
      setAnchorCell(null);
      setSelectedCells(new Set());
    }

    setEditingCell(null);
    editingCellRef.current = null;
    setEditValue("");
    editValueRef.current = "";
  }, [items]);

  useEffect(() => {
    if (!localItems.length) {
      setSelectedCell(null);
      setAnchorCell(null);
      setSelectedCells(new Set());
      return;
    }
    if (!selectedCell || selectedCell.rowIndex >= localItems.length) {
      const first = { rowIndex: 0, colId: firstEditableColumnId };
      setSelectedCell(first);
      setAnchorCell(first);
      setSelectedCells(new Set([getCellKey(0, firstEditableColumnId)]));
    }
  }, [localItems.length, selectedCell]);
  useEffect(() => {
    if (!editingCell || !inputRef.current) return;
    const node = inputRef.current;
    const col = gridColumnMap[editingCell.colId];
    const tagName = String(node.tagName || "").toLowerCase();
    const inputType = String(node.type || "").toLowerCase();
    node.focus();
    const supportsSelectionRange =
      tagName === "textarea" ||
      (tagName === "input" &&
        ["text", "search", "url", "tel", "password"].includes(inputType || "text"));

    const supportsSelectAll =
      tagName === "textarea" ||
      (tagName === "input" &&
        ["text", "search", "url", "tel", "password"].includes(inputType || "text"));

    if (
      moveCaretToEndOnFocusRef.current &&
      supportsSelectionRange &&
      typeof node.setSelectionRange === "function"
    ) {
      const len = String(node.value || "").length;
      node.setSelectionRange(len, len);
    } else if (
      shouldSelectAllOnFocusRef.current &&
      supportsSelectAll &&
      typeof node.select === "function"
    ) {
      node.select();
    }

    if (col?.kind === "select" || col?.type === "date") {
      requestAnimationFrame(() => {
        try {
          if (typeof node.showPicker === "function") {
            node.showPicker();
            return;
          }
        } catch (err) {}

        try {
          node.click();
        } catch (err) {}
      });
    }
  }, [editingCell]);

  const pushUndoEntry = (changes) => {
    if (isUndoRunningRef.current || !Array.isArray(changes) || !changes.length) return;

    const normalized = changes
      .map((change) => {
        const beforePatch = {};
        const afterPatch = {};

        Object.keys(change.beforePatch || {}).forEach((key) => {
          const beforeVal = change.beforePatch[key] ?? "";
          const afterVal = change.afterPatch?.[key] ?? "";

          if (String(beforeVal) !== String(afterVal)) {
            beforePatch[key] = beforeVal;
            afterPatch[key] = afterVal;
          }
        });

        if (!Object.keys(beforePatch).length) return null;

        return {
          tuitionId: change.tuitionId,
          beforePatch,
          afterPatch,
        };
      })
      .filter(Boolean);

    if (!normalized.length) return;

    undoStackRef.current.push({
      changes: normalized,
      createdAt: Date.now(),
    });

    if (undoStackRef.current.length > 100) {
      undoStackRef.current.shift();
    }
  };

  const undoLastChange = async () => {
    if (editingCellRef.current) return;

    const lastEntry = undoStackRef.current.pop();
    if (!lastEntry?.changes?.length) return;

    const snapshot = [...localItemsRef.current];
    const revertMap = new Map(
      lastEntry.changes.map((change) => [change.tuitionId, change.beforePatch])
    );

    isUndoRunningRef.current = true;
    clearEditingState();

    setLocalItems((prev) =>
      prev.map((item) => {
        const patch = revertMap.get(item.tuitionId);
        return patch ? { ...item, ...patch } : item;
      })
    );

    try {
      for (const change of lastEntry.changes) {
        const currentItem = snapshot.find((x) => x.tuitionId === change.tuitionId);
        if (!currentItem) continue;

        const payload = {
          ...currentItem,
          ...change.beforePatch,
          _source: "main",
        };

        await api.patch(`/tuitions/${encodeURIComponent(change.tuitionId)}`, payload);
      }
    } catch (error) {
      console.error("Undo failed", error);
      load();
    } finally {
      isUndoRunningRef.current = false;
    }
  };

  useEffect(() => {
    const handleUndoHotkey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      if (String(e.key).toLowerCase() !== "z") return;

      const activeTag = String(document.activeElement?.tagName || "").toUpperCase();
      const isEditorFocused =
        editingCellRef.current &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);

      if (isEditorFocused) return;

      e.preventDefault();
      undoLastChange();
    };

    document.addEventListener("keydown", handleUndoHotkey);
    return () => document.removeEventListener("keydown", handleUndoHotkey);
  }, [load]);

  const performSearch = async (query) => {
    try {
      if (!query) {
        setLocalItems(items);
        return;
      }

      setIsSearching(true);

      const resp = await api.get("/tuitions/search", {
        params: {
          q: query,
          fields: searchColumns.map((c) => c.key).join(","),
          sortField,
          sortDir,
          assignedTo: assignedFilter || "",
        },
      });

      if (resp?.data?.items) {
        setLocalItems(resp.data.items);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => performSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm, sortField, sortDir, assignedFilter, items]);

  const getColumnIndex = (colId) => gridColumnIds.findIndex((id) => id === colId);

  const scrollCellIntoView = (rowIndex, colId, behavior = "smooth") => {
    requestAnimationFrame(() => {
      const root = tableWrapperRef.current;
      if (!root) return;

      const target = root.querySelector(
        `[data-grid-row="${rowIndex}"][data-grid-col="${colId}"]`
      );

      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({
          behavior,
          block: "nearest",
          inline: "nearest",
        });
      }
    });
  };

  const focusCell = (rowIndex, colId) => {
    requestAnimationFrame(() => {
      const root = tableWrapperRef.current;
      if (!root) return;

      const target = root.querySelector(
        `[data-grid-row="${rowIndex}"][data-grid-col="${colId}"]`
      );

      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }

      if (target && typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    });
  };

  const selectSingleCell = (rowIndex, colId, shouldFocus = true) => {
    const cell = { rowIndex, colId };
    setSelectedCell(cell);
    setAnchorCell(cell);
    setSelectedCells(new Set([getCellKey(rowIndex, colId)]));
    if (shouldFocus) focusCell(rowIndex, colId);
  };

  const getRangeCells = (start, end) => {
    if (!start || !end) return new Set();

    const startRow = Math.min(start.rowIndex, end.rowIndex);
    const endRow = Math.max(start.rowIndex, end.rowIndex);
    const startColIndex = getColumnIndex(start.colId);
    const endColIndex = getColumnIndex(end.colId);

    if (startColIndex < 0 || endColIndex < 0) return new Set();

    const minCol = Math.min(startColIndex, endColIndex);
    const maxCol = Math.max(startColIndex, endColIndex);

    const range = new Set();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        range.add(getCellKey(r, gridColumnIds[c]));
      }
    }

    return range;
  };

  const getCellValue = (item, col) => {
    if (!item || !col) return "";

    switch (col.id) {
      case "tutorFees":
        return item.tutorFees ?? item.tutorFee ?? "";
      case "sync":
        return item.sync ?? item.syncFlag ?? "";
      default:
        return item[col.field] ?? "";
    }
  };

  const buildPatchForColumn = (colId, value) => {
    switch (colId) {
      case "date":
        return { date: value };
      case "demoTime":
        return { demoTime: value };
      case "tuitionName":
        return { tuitionName: value };
      case "status":
        return { status: value };
      case "estimatedFee":
        return { estimatedFee: value };
      case "tutorName":
        return { tutorName: value };
      case "tutorFees":
        return { tutorFees: value, tutorFee: value };
      case "rejectedTutor":
        return { rejectedTutor: value };
      case "feedback":
        return { feedback: value };
      case "country":
        return { country: value };
      case "parentsContact":
        return { parentsContact: value };
      case "className":
        return { className: value };
      case "subjects":
        return { subjects: value };
      case "daysPerWeek":
        return { daysPerWeek: value };
      case "source":
        return { source: value };
      case "demoDate":
        return { demoDate: value };
      case "otmName":
        return { otmName: value };
      case "demoRating":
        return { demoRating: value };
      case "sync":
        return { sync: value, syncFlag: value };
      default:
        return {};
    }
  };

  const updateRecordFields = async (item, patchFields, options = {}) => {
    const { skipHistory = false } = options;

    try {
      const currentItem =
        localItemsRef.current.find((x) => x.tuitionId === item.tuitionId) || item;

      if (!skipHistory) {
        const beforePatch = {};
        const afterPatch = {};

        Object.keys(patchFields).forEach((key) => {
          const beforeVal = currentItem?.[key] ?? "";
          const afterVal = patchFields[key] ?? "";

          if (String(beforeVal) !== String(afterVal)) {
            beforePatch[key] = beforeVal;
            afterPatch[key] = afterVal;
          }
        });

        if (Object.keys(afterPatch).length) {
          pushUndoEntry([
            {
              tuitionId: item.tuitionId,
              beforePatch,
              afterPatch,
            },
          ]);
        }
      }

      setLocalItems((prev) =>
        prev.map((x) =>
          x.tuitionId === item.tuitionId
            ? {
                ...x,
                ...patchFields,
              }
            : x
        )
      );

      const payload = { ...currentItem, ...patchFields, _source: "main" };
      await api.patch(`/tuitions/${encodeURIComponent(item.tuitionId)}`, payload);
    } catch (e) {
      alert("Update failed.");
      load();
    }
  };

  const setEditingState = (cell, value, options = {}) => {
    const { selectAll = true, moveCaretToEnd = false } = options;
    shouldSelectAllOnFocusRef.current = selectAll;
    moveCaretToEndOnFocusRef.current = moveCaretToEnd;

    editingCellRef.current = cell;
    setEditingCell(cell);
    editValueRef.current = value;
    setEditValue(value);
  };

  const clearEditingState = () => {
    editingCellRef.current = null;
    setEditingCell(null);
    editValueRef.current = "";
    setEditValue("");
    shouldSelectAllOnFocusRef.current = true;
    moveCaretToEndOnFocusRef.current = false;
  };

  const getNextEditableCell = (rowIndex, colId, direction = 1) => {
    let row = rowIndex;
    let colIndex = getColumnIndex(colId);

    while (true) {
      colIndex += direction;

      while (colIndex >= 0 && colIndex < gridColumns.length) {
        const candidate = gridColumns[colIndex];
        if (candidate?.editable) {
          return { rowIndex: row, colId: candidate.id };
        }
        colIndex += direction;
      }

      row += direction > 0 ? 1 : -1;

      if (row < 0 || row >= localItemsRef.current.length) {
        return { rowIndex, colId };
      }

      colIndex = direction > 0 ? -1 : gridColumns.length;
    }
  };

  const startEditingCell = (rowIndex, colId, forcedValue = null, options = {}) => {
    const col = gridColumnMap[colId];
    const item = localItemsRef.current[rowIndex];

    if (!col?.editable || !item) return;

    const currentVal = getCellValue(item, col);
    const nextValue = forcedValue !== null ? forcedValue : String(currentVal ?? "");

    setSelectedCell({ rowIndex, colId });
    setAnchorCell({ rowIndex, colId });
    setSelectedCells(new Set([getCellKey(rowIndex, colId)]));
    setEditingState({ rowIndex, colId }, nextValue, options);
  };

  const cancelEdit = (focusTarget = null) => {
    clearEditingState();
    if (focusTarget) {
      focusCell(focusTarget.rowIndex, focusTarget.colId);
    }
  };

  const commitEdit = (focusTarget = null) => {
    const currentEditingCell = editingCellRef.current;
    if (!currentEditingCell) {
      if (focusTarget) focusCell(focusTarget.rowIndex, focusTarget.colId);
      return;
    }

    const { rowIndex, colId } = currentEditingCell;
    const col = gridColumnMap[colId];
    const item = localItemsRef.current[rowIndex];

    const newValue = String(editValueRef.current ?? "");
    clearEditingState();

    if (!item || !col?.editable) {
      if (focusTarget) focusCell(focusTarget.rowIndex, focusTarget.colId);
      return;
    }

    const oldValue = String(getCellValue(item, col) ?? "");

    if (newValue !== oldValue) {
      const patch = buildPatchForColumn(colId, newValue);
      if (Object.keys(patch).length > 0) {
        updateRecordFields(item, patch);
      }
    }

    if (focusTarget) {
      focusCell(focusTarget.rowIndex, focusTarget.colId);
    }
  };

  const clearSelectedCells = async () => {
    if (!selectedCells.size) return;

    const updatesByRow = new Map();
    const historyChanges = [];

    selectedCells.forEach((key) => {
      const { rowIndex, colId } = parseCellKey(key);
      const col = gridColumnMap[colId];

      if (!col?.editable) return;

      const patch = buildPatchForColumn(colId, "");
      if (!Object.keys(patch).length) return;

      const prevPatch = updatesByRow.get(rowIndex) || {};
      updatesByRow.set(rowIndex, { ...prevPatch, ...patch });
    });

    if (!updatesByRow.size) return;

    updatesByRow.forEach((patch, rowIndex) => {
      const currentItem = localItemsRef.current[rowIndex];
      if (!currentItem) return;

      const beforePatch = {};
      const afterPatch = {};

      Object.keys(patch).forEach((field) => {
        const beforeVal = currentItem?.[field] ?? "";
        const afterVal = patch[field] ?? "";

        if (String(beforeVal) !== String(afterVal)) {
          beforePatch[field] = beforeVal;
          afterPatch[field] = afterVal;
        }
      });

      if (Object.keys(afterPatch).length) {
        historyChanges.push({
          tuitionId: currentItem.tuitionId,
          beforePatch,
          afterPatch,
        });
      }
    });

    if (historyChanges.length) {
      pushUndoEntry(historyChanges);
    }

    setLocalItems((prev) =>
      prev.map((item, rowIndex) => {
        const patch = updatesByRow.get(rowIndex);
        return patch ? { ...item, ...patch } : item;
      })
    );

    clearEditingState();

    for (const [rowIndex, patch] of updatesByRow.entries()) {
      const item = localItemsRef.current[rowIndex];
      if (!item) continue;

      try {
        const payload = { ...item, ...patch, _source: "main" };
        await api.patch(`/tuitions/${encodeURIComponent(item.tuitionId)}`, payload);
      } catch (error) {
        console.error("Bulk clear update failed", error);
        load();
        break;
      }
    }
  };

  const moveSelection = (rowDelta, colDelta, extendRange = false) => {
    if (!localItems.length) return;

    const baseCell = selectedCell || { rowIndex: 0, colId: firstEditableColumnId };

    const currentColIndex = getColumnIndex(baseCell.colId);
    const nextRow = Math.max(
      0,
      Math.min(localItems.length - 1, baseCell.rowIndex + rowDelta)
    );
    const nextColIndex = Math.max(
      0,
      Math.min(gridColumns.length - 1, currentColIndex + colDelta)
    );
    const nextColId = gridColumnIds[nextColIndex];
    const nextCell = { rowIndex: nextRow, colId: nextColId };

    if (extendRange && anchorCell) {
      setSelectedCell(nextCell);
      setSelectedCells(getRangeCells(anchorCell, nextCell));
      focusCell(nextRow, nextColId);
      return;
    }

    selectSingleCell(nextRow, nextColId, true);
  };

  const handleCellMouseDown = (rowIndex, colId, e) => {
    if (
      editingCellRef.current &&
      (editingCellRef.current.rowIndex !== rowIndex ||
        editingCellRef.current.colId !== colId)
    ) {
      commitEdit({ rowIndex, colId });
    }

    const clickedCell = { rowIndex, colId };
    const clickedKey = getCellKey(rowIndex, colId);

    if (e.shiftKey && anchorCell) {
      setSelectedCell(clickedCell);
      setSelectedCells(getRangeCells(anchorCell, clickedCell));
      focusCell(rowIndex, colId);
      isMouseSelectingRef.current = false;
      dragAnchorCellRef.current = null;
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(clickedKey)) next.delete(clickedKey);
        else next.add(clickedKey);
        return next;
      });
      setSelectedCell(clickedCell);
      setAnchorCell(clickedCell);
      focusCell(rowIndex, colId);
      isMouseSelectingRef.current = false;
      dragAnchorCellRef.current = null;
      return;
    }

    isMouseSelectingRef.current = true;
    dragAnchorCellRef.current = clickedCell;

    setSelectedCell(clickedCell);
    setAnchorCell(clickedCell);
    setSelectedCells(new Set([clickedKey]));
    focusCell(rowIndex, colId);
  };

  const handleCellMouseEnter = (rowIndex, colId) => {
    if (!isMouseSelectingRef.current || !dragAnchorCellRef.current) return;

    const hoverCell = { rowIndex, colId };
    setSelectedCell(hoverCell);
    setSelectedCells(getRangeCells(dragAnchorCellRef.current, hoverCell));
  };

  const handleCellKeyDown = (e, rowIndex, colId) => {
    const col = gridColumnMap[colId];
    if (!col) return;

    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "z") {
      e.preventDefault();
      undoLastChange();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "a") {
      e.preventDefault();
      const all = new Set();
      for (let r = 0; r < localItems.length; r++) {
        for (const id of gridColumnIds) {
          all.add(getCellKey(r, id));
        }
      }
      setSelectedCells(all);
      setSelectedCell({ rowIndex, colId });
      setAnchorCell({ rowIndex, colId });
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      clearSelectedCells();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (col.editable) {
        startEditingCell(rowIndex, colId);
      }
      return;
    }

    if (e.key === "F2") {
      e.preventDefault();
      if (col.editable) {
        startEditingCell(rowIndex, colId);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1, 0, e.shiftKey);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1, 0, e.shiftKey);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(0, -1, e.shiftKey);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(0, 1, e.shiftKey);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      moveSelection(0, e.shiftKey ? -1 : 1, false);
      return;
    }

    if (
      col.editable &&
      col.kind !== "select" &&
      col.type !== "date" &&
      col.type !== "time" &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      const item = localItemsRef.current[rowIndex];
      const currentValue = String(getCellValue(item, col) ?? "");
      startEditingCell(rowIndex, colId, currentValue + e.key, {
        selectAll: false,
        moveCaretToEnd: true,
      });
    }
  };

  const handleEditInputKeyDown = (e, rowIndex, colId, col) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && String(e.key).toLowerCase() === "z") {
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (col?.kind === "select" || col?.type === "date") {
        const nextCell = getNextEditableCell(rowIndex, colId, 1);
        commitEdit(nextCell);
        selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
        return;
      }

      const nextRow = Math.min(rowIndex + 1, localItems.length - 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nextCell = getNextEditableCell(rowIndex, colId, e.shiftKey ? -1 : 1);
      commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (col?.kind !== "select" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowUp") {
      e.preventDefault();
      const nextRow = Math.max(0, rowIndex - 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = Math.min(localItems.length - 1, rowIndex + 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowLeft") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.max(0, currentColIndex - 1);
      const nextColId = gridColumnIds[nextColIndex];
      commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (col?.kind !== "select" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowRight") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.min(gridColumns.length - 1, currentColIndex + 1);
      const nextColId = gridColumnIds[nextColIndex];
      commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit({ rowIndex, colId });
    }
  };

  const toggleRowSelection = (tuitionId) => {
    const newSet = new Set(selectedRows);
    newSet.has(tuitionId) ? newSet.delete(tuitionId) : newSet.add(tuitionId);
    setSelectedRows(newSet);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    const startX = e.pageX;
    const th = e.currentTarget.parentElement;
    const startWidth = th.offsetWidth;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(60, startWidth + (moveEvent.pageX - startX));
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  async function removeItem(tuitionId) {
    if (!window.confirm("Delete this row?")) return;
    try {
      await api.delete(`/tuitions/${encodeURIComponent(tuitionId)}`);
      await load();
    } catch (e) {
      alert("Delete failed");
    }
  }

  const moveRow = async (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === localItems.length - 1) return;

    const newItems = [...localItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setLocalItems(newItems);
    scrollCellIntoView(targetIndex, firstEditableColumnId);

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        tuitionId: item.tuitionId,
        orderIndex: idx,
      }));
      await api.post("/tuitions/reorder", { items: reorderPayload });
    } catch (error) {
      console.error("Failed to save reorder", error);
      load();
    }
  };

  const moveSelected = async (direction) => {
    if (selectedRows.size === 0) return;

    const selectedSet = new Set(selectedRows);
    const newItems = [...localItems];

    if (direction === "up") {
      for (let i = 1; i < newItems.length; i++) {
        const currentSelected = selectedSet.has(newItems[i].tuitionId);
        const prevSelected = selectedSet.has(newItems[i - 1].tuitionId);

        if (currentSelected && !prevSelected) {
          [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
        }
      }
    } else {
      for (let i = newItems.length - 2; i >= 0; i--) {
        const currentSelected = selectedSet.has(newItems[i].tuitionId);
        const nextSelected = selectedSet.has(newItems[i + 1].tuitionId);

        if (currentSelected && !nextSelected) {
          [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
        }
      }
    }

    setLocalItems(newItems);

    const movedIndexes = newItems
      .map((item, idx) => (selectedSet.has(item.tuitionId) ? idx : -1))
      .filter((idx) => idx >= 0);

    if (movedIndexes.length) {
      const focusRowIndex =
        direction === "down" ? Math.max(...movedIndexes) : Math.min(...movedIndexes);
      scrollCellIntoView(focusRowIndex, firstEditableColumnId);
    }

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        tuitionId: item.tuitionId,
        orderIndex: idx,
      }));
      await api.post("/tuitions/reorder", { items: reorderPayload });
    } catch (error) {
      console.error("Failed to save reorder", error);
      load();
    }
  };

  const renderDisplayValue = (col, val) => {
    if (col.pill === "status") return renderPill(val, getStatusStyle);
    if (col.pill === "source") return renderPill(val, getSourceStyle);
    if (col.pill === "demoRating") return renderPill(val, getDemoRatingStyle);
    if (col.type === "time" && val) return format12Hour(val);
    return val || "";
  };

  const getCellBaseBackground = (item, col) => {
    if (col.id === "tuitionName") return item.tuitionNameColor || "inherit";
    if (col.id === "rejectedTutor") return columnColors["Rejected Tutor"];
    if (col.id === "feedback" && item.feedback?.toString().trim().toLowerCase() === "satisfied") {
      return "#16a34a";
    }
    return "inherit";
  };

  const getCellTextColor = (item, col) => {
    if (col.id === "rejectedTutor") return "#ffffff";
    if (col.id === "feedback" && item.feedback?.toString().trim().toLowerCase() === "satisfied") {
      return "#ffffff";
    }
    return "inherit";
  };

  const renderGridCell = (item, rowIndex, col) => {
    const cellKey = getCellKey(rowIndex, col.id);
    const isSelected = selectedCells.has(cellKey);
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;

    const value = getCellValue(item, col);
    const baseBackground = getCellBaseBackground(item, col);
    const cellTextColor = getCellTextColor(item, col);

    const commonTdStyle = {
      ...styles.td,
      minWidth: col.width,
      width: col.width,
      padding: col.kind === "tuitionName" ? "0 10px" : col.pill ? "0 5px" : "0 10px",
      height: "35px",
      cursor: col.editable ? "cell" : "default",
      backgroundColor: isEditing ? (col.id === "rejectedTutor" ? columnColors["Rejected Tutor"] : "#ffffff") : baseBackground,
      color: isEditing ? (col.id === "rejectedTutor" ? "#ffffff" : cellTextColor) : cellTextColor,
      border: "1px solid #000000",
      boxShadow: isSelected ? "inset 0 0 0 2px #107c41" : "none",
      position: "relative",
    };

    if (isEditing && col.kind === "select") {
      return (
        <td style={commonTdStyle}>
          <select
            ref={inputRef}
            autoFocus
            style={{ ...styles.inlineSelect, color: "inherit" }}
            value={editValue}
            onFocus={(e) => {
              try {
                if (typeof e.currentTarget.showPicker === "function") {
                  e.currentTarget.showPicker();
                }
              } catch (err) {
                try {
                  e.currentTarget.click();
                } catch (err2) {}
              }
            }}
            onChange={(e) => {
              editValueRef.current = e.target.value;
              setEditValue(e.target.value);
            }}
            onBlur={() => commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
          >
            {col.options.map((o) => (
              <option key={o} value={o}>
                {o || "--"}
              </option>
            ))}
          </select>
        </td>
      );
    }

    if (isEditing && col.kind === "tuitionName") {
      return (
        <td style={{ ...commonTdStyle, backgroundColor: item.tuitionNameColor || "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "8px" }}>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => {
                editValueRef.current = e.target.value;
                setEditValue(e.target.value);
              }}
              onBlur={() => commitEdit({ rowIndex, colId: col.id })}
              onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
              style={{ ...styles.inlineInput, flex: 1, color: "inherit" }}
            />

            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ColorSwatch
                color={item.tuitionNameColor || "#ffffff"}
                onChange={(c) => updateRecordFields(item, { tuitionNameColor: c })}
                pickerId={`tuitionNameColor-${item.tuitionId}`}
                activeColorPicker={activeColorPicker}
                onOpen={setActiveColorPicker}
                onClose={() => setActiveColorPicker(null)}
              />
            </div>
          </div>
        </td>
      );
    }

    if (isEditing) {
      return (
        <td style={commonTdStyle}>
          <input
            ref={inputRef}
            autoFocus
            type={col.type || "text"}
            style={{ ...styles.inlineInput, flex: 1, color: "inherit" }}
            value={editValue}
            onFocus={(e) => {
              if (col.type === "date") {
                try {
                  if (typeof e.currentTarget.showPicker === "function") {
                    e.currentTarget.showPicker();
                  }
                } catch (err) {}
              }
            }}
            onChange={(e) => {
              editValueRef.current = e.target.value;
              setEditValue(e.target.value);
            }}
            onBlur={() => commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
          />
        </td>
      );
    }

    if (col.kind === "tuitionName") {
      return (
        <td
          data-grid-row={rowIndex}
          data-grid-col={col.id}
          tabIndex={0}
          className="excel-cell"
          onMouseDown={(e) => handleCellMouseDown(rowIndex, col.id, e)}
          onMouseEnter={() => handleCellMouseEnter(rowIndex, col.id)}
          onDoubleClick={() => startEditingCell(rowIndex, col.id)}
          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, col.id)}
          style={commonTdStyle}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: "8px",
            }}
          >
            <span
              style={{
                flex: 1,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value || ""}
            </span>

            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ColorSwatch
                color={item.tuitionNameColor || "#ffffff"}
                onChange={(c) => updateRecordFields(item, { tuitionNameColor: c })}
                pickerId={`tuitionNameColor-${item.tuitionId}`}
                activeColorPicker={activeColorPicker}
                onOpen={setActiveColorPicker}
                onClose={() => setActiveColorPicker(null)}
              />
            </div>
          </div>
        </td>
      );
    }

    return (
      <td
        data-grid-row={rowIndex}
        data-grid-col={col.id}
        tabIndex={0}
        className="excel-cell"
        onMouseDown={(e) => handleCellMouseDown(rowIndex, col.id, e)}
        onMouseEnter={() => handleCellMouseEnter(rowIndex, col.id)}
        onDoubleClick={() => {
          if (col.editable) startEditingCell(rowIndex, col.id);
        }}
        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, col.id)}
        style={commonTdStyle}
      >
        {renderDisplayValue(col, value)}
      </td>
    );
  };

  return (
    <div style={styles.card}>
      <style>{`
        .excel-cell:focus {
          outline: 2px solid #107c41;
          outline-offset: -2px;
        }
      `}</style>

      <div style={styles.fixedSearchContainer}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "end",
            gap: 16,
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <input
            placeholder={isSearching ? "Searching..." : "Search across all columns..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #c8c6c4",
              fontSize: "15px",
              flex: 1,
              maxWidth: "520px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          />

          {selectedRows.size > 0 && (
            <>
              <button
                onClick={() => moveSelected("up")}
                style={{
                  padding: "8px 16px",
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ↑ Move Selected
              </button>

              <button
                onClick={() => moveSelected("down")}
                style={{
                  padding: "8px 16px",
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ↓ Move Selected
              </button>

              <span
                style={{
                  padding: "8px 12px",
                  background: "#f0f0f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                {selectedRows.size} rows selected
              </span>
            </>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f3f2f1",
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#666" }}>
              Zoom
            </span>
            <button
              onClick={() => handleZoom(-0.1)}
              style={{
                cursor: "pointer",
                fontSize: "18px",
                border: "none",
                background: "none",
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              style={{
                cursor: "pointer",
                fontSize: "16px",
                border: "none",
                background: "none",
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <h2 style={styles.title}>Monthly Tuitions (Excel View)</h2>

      <div style={{ display: "none" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            multiple
            value={selectedFields}
            onChange={(e) =>
              setSelectedFields(Array.from(e.target.selectedOptions).map((o) => o.value))
            }
          >
            {searchColumns.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.tableWrapper} ref={tableWrapperRef}>
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            transition: "transform 0.2s ease",
            width: `${100 / zoom}%`,
          }}
        >
          <table style={styles.table}>
            <thead>
              <tr>
                <TH style={{ width: "52px", textAlign: "center" }}>#</TH>
                <TH style={{ width: "42px", textAlign: "center" }}>✓</TH>
                <TH style={{ width: "40px", textAlign: "center" }}>Sort</TH>
                <TH style={{ width: "36px", textAlign: "center" }}>🎨</TH>

                {gridColumns.map((col) => (
                  <TH
                    key={col.id}
                    style={{
                      position: "relative",
                      minWidth: `${col.width}px`,
                      width: `${col.width}px`,
                    }}
                  >
                    {col.label}
                    <div
                      onMouseDown={handleResizeStart}
                      style={{
                        position: "absolute",
                        right: "-2px",
                        top: 0,
                        width: "4px",
                        height: "100%",
                        cursor: "col-resize",
                        zIndex: 20,
                      }}
                    />
                  </TH>
                ))}

                <TH style={{ textAlign: "center", minWidth: "80px", position: "relative" }}>
                  Action
                  <div
                    onMouseDown={handleResizeStart}
                    style={{
                      position: "absolute",
                      right: "-2px",
                      top: 0,
                      width: "4px",
                      height: "100%",
                      cursor: "col-resize",
                      zIndex: 20,
                    }}
                  />
                </TH>
              </tr>
            </thead>

            <tbody>
              {localItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={gridColumns.length + 5}
                    style={{ padding: 20, textAlign: "center", color: "#888" }}
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                localItems.map((it, index) => (
                  <tr
                    key={it.tuitionId}
                    style={{
                      backgroundColor: it.rowColor || "inherit",
                      transition: "background 0.2s",
                    }}
                  >
                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        backgroundColor: "inherit",
                        fontWeight: selectedRows.has(it.tuitionId) ? "700" : "600",
                        color: selectedRows.has(it.tuitionId) ? "#107c41" : "#444",
                      }}
                    >
                      {index + 1}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        backgroundColor: "inherit",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.has(it.tuitionId)}
                        onChange={() => toggleRowSelection(it.tuitionId)}
                        style={{ cursor: "pointer", width: "18px", height: "18px" }}
                      />
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        backgroundColor: "inherit",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => moveRow(index, "up")}
                          disabled={index === 0}
                          style={{ ...styles.moveBtn, opacity: index === 0 ? 0.3 : 1 }}
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveRow(index, "down")}
                          disabled={index === localItems.length - 1}
                          style={{
                            ...styles.moveBtn,
                            opacity: index === localItems.length - 1 ? 0.3 : 1,
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        backgroundColor: "inherit",
                      }}
                    >
                      <ColorSwatch
                        color={it.rowColor || "#ffffff"}
                        onChange={(c) => updateRecordFields(it, { rowColor: c })}
                        pickerId={`rowColor-${it.tuitionId}`}
                        activeColorPicker={activeColorPicker}
                        onOpen={setActiveColorPicker}
                        onClose={() => setActiveColorPicker(null)}
                      />
                    </td>

                    {gridColumns.map((col) => renderGridCell(it, index, col))}

                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        backgroundColor: "inherit",
                      }}
                    >
                      <button
                        style={styles.actionBtn}
                        onClick={() => removeItem(it.tuitionId)}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const TH = ({ children, style }) => <th style={{ ...styles.th, ...style }}>{children}</th>;