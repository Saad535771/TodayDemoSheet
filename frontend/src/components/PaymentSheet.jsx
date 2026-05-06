import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";
import PaymentSheetWithDate from "./PaymentSheetWithDate.jsx";

const LIVE_REFRESH_MS = 13000;
const MIN_ZOOM = 30;
const MAX_ZOOM = 200;
const ZOOM_STEP = 20;
const MAX_UNDO_STACK = 20;
const DEFAULT_COLOR = "#ffffff";
const FEEDBACK_BG = "#166534";
const PRESET_COLORS = [
  "#ffffff",
  "#a58b20",
  "#9c0c0c",
  "#0063e4",
  "#08cf4e",
  "#300eca",
  "#b50c6c",
  "#0a86d8",
  "#d8b010",
  "#d10d0d",
];


const styles = {
  page: {
   
    
    overflowY: "hidden",
    overscrollBehaviorX: "none",
  },
  card: {
  
  
    padding: "10px",
   
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111111",
    margin: 0,
    textAlign:'center',
  },
  subtitle: {
    fontSize: "13px",
    color: "#444444",
    margin: 0,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: "300px",
    height: "42px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid #000000",
    outline: "none",
    fontSize: "14px",
    textAlign: "center",
    color: "#111111",
    background: "#ffffff",
  },
  addBtn: {
    background: "#000000",
    color: "white",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
  refreshBtn: {
    background: "#ffffff",
    color: "#111111",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  liveBadge: {
    background: "#dcfce7",
    color: "#065f46",
    border: "1.5px solid #000000",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  toolBtn: {
    background: "#ffffff",
    color: "#111111",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  disabledToolBtn: {
    background: "#f3f4f6",
    color: "#9ca3af",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "not-allowed",
    fontWeight: "700",
    fontSize: "13px",
  },
  dangerToolBtn: {
    background: "#b00101",
    color: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  mutedToolBtn: {
    background: "#e5e7eb",
    color: "#111111",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  colorToolWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "6px 10px",
    background: "#fff",
  },
  colorInputMini: {
    width: "32px",
    height: "32px",
    border: "1.5px solid #000000",
    borderRadius: "6px",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
  },
  colorToolLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111111",
    whiteSpace: "nowrap",
  },
  selectedCountBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1.5px solid #000000",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  zoomWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px",
    border: "1.5px solid #000000",
    borderRadius: "12px",
    background: "#fff",
  },
  zoomLabel: {
    minWidth: "52px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700",
    color: "#111111",
  },
  tableWrapper: {
    overflow: "auto",
    borderRadius: "12px",
    border: "2px solid #000000",
    maxWidth: "100%",
    position: "relative",
    overscrollBehaviorX: "contain",
  
    background: "#ffffff",
  },
  zoomedArea: {
    transformOrigin: "top left",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "10px",
    
  },
  th: {
    background: "#000000",
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
    padding: "12px 10px",
    borderBottom: "1.5px solid #000000",
    borderRight: "1.5px solid #000000",
    position: "sticky",
    top: 0,
    zIndex: 4,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1.5px solid #000000",
    borderRight: "1.5px solid #000000",
    padding: "0",
    textAlign: "center",
    height: "38px",
    width:"42px",
    verticalAlign: "middle",
    background: "#fff",
  
  },
  input: {
    width: "100%",
    height: "48px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "12px",
    background: "transparent",
    boxSizing: "border-box",
    textAlign: "center",
    color: "inherit",
    fontWeight: "600",
  },
  select: {
    width: "100%",
    height: "48px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "13px",
    background: "transparent",
    boxSizing: "border-box",
    cursor: "pointer",
    textAlign: "center",
    color: "inherit",
    fontWeight: "600",
  },
  readCell: {
    padding: "10px 12px",
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "cell",
    gap: "8px",
    textAlign: "center",
    color: "inherit",
    fontWeight: "600",
  },
  deleteBtn: {
    background: "#b10000",
    color: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  moveBtn: {
    cursor: "pointer",
    border: "1.5px solid #000000",
    background: "#ffffff",
    fontSize: "12px",
    padding: "2px 6px",
    color: "#111111",
    borderRadius: "6px",
    fontWeight: "700",
    minWidth: "28px",
  },
  emptyState: {
    padding: "28px",
    textAlign: "center",
    color: "#374151",
    fontWeight: "600",
  },
  loading: {
    padding: "20px",
    textAlign: "center",
    color: "#111111",
    fontWeight: "700",
  },
  colorSwatch: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    border: "1.5px solid #000000",
    flexShrink: 0,
  },
  colorValue: {
    fontSize: "11px",
    color: "inherit",
    fontWeight: "700",
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "48px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#000000",
  },
  numberCell: {
    fontWeight: "700",
    color: "#111111",
    fontSize: "12px",
  },
  paletteRoot: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paletteTrigger: {
    width: "26px",
    height: "26px",
    border: "1.5px solid #000000",
    borderRadius: "6px",
    background: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  palettePopover: {
    position: "absolute",
    top: "32px",
    right: 0,
    zIndex: 20,
    background: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "8px",
    width: "180px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
  },
  paletteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "6px",
  },
  paletteButton: {
    width: "28px",
    height: "28px",
    border: "1.5px solid #000000",
    borderRadius: "6px",
    cursor: "pointer",
    padding: 0,
  },
  paletteCustomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "8px",
  },
  paletteCustomLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#111111",
  },
  paletteCustomInput: {
    width: "40px",
    height: "28px",
    border: "1.5px solid #000000",
    borderRadius: "6px",
    cursor: "pointer",
    padding: 0,
    background: "#ffffff",
  },
  paletteInlineCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: "100%",
  },
  tuitionNameInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
  },
  tuitionNameText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    textAlign: "center",
  },
  feedbackReadCell: {
    color: "#ffffff",
  },
};

const statusOptions = [
  "",
  "Fees Receive",
  "Fee Pending",
  "Tuition Close",
  "Tuition Pending",
];

const booleanOptions = [
  { value: "0", label: "No" },
  { value: "1", label: "Yes" },
];

function getRowId(row) {
  return row?.id ?? row?.paymentId ?? row?._id ?? row?.rowId;
}

function rowsAreSame(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeBoolean(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE"
  );
}

function safeColor(value, fallback = "#ffffff") {
  const color = String(value || "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color;
  return fallback;
}

function getStatusStyle(status) {
  switch ((status || "").trim()) {
    case "Fees Receive":
      return {
        background: "#08752e",
        color: "#ffffff",
        border: "1px solid #ffffff",
      };
    case "Fee Pending":
      return {
        background: "#ad4500",
        color: "#ffffff",
        border: "1px solid #fcd34d",
      };
    case "Tuition Close":
      return {
        background: "#004aaa",
        color: "#ffffff",
        border: "1px solid #93c5fd",
      };
    case "Tuition Pending":
      return {
        background: "#d30000",
        color: "#ffffff",
        border: "1px solid #ffffff",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#475569",
        border: "1px solid #e2e8f0",
      };
  }
}

function StatusPill({ value }) {
  const style = getStatusStyle(value);
  return (
    <span
      style={{
        ...style,
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "500",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {value || "--"}
    </span>
  );
}



function getContrastTextColor(color) {
  const hex = safeColor(color, DEFAULT_COLOR).replace("#", "");
  const normalized =
    hex.length === 3
      ? hex.split("").map((char) => char + char).join("")
      : hex;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55 ? "#ffffff" : "#111111";
}

function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

const getCellKey = (rowIndex, colId) => `${rowIndex}__${colId}`;

const parseCellKey = (key) => {
  const [rowIndex, ...rest] = key.split("__");
  return { rowIndex: Number(rowIndex), colId: rest.join("__") };
};

function highlightText(text, term) {
  const value = text === null || text === undefined ? "" : String(text);
  const q = String(term || "").trim();

  if (!q) return value;

  const lowerQ = q.toLowerCase();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = value.split(regex);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === lowerQ;
    return isMatch ? (
      <mark
        key={`${part}-${index}`}
        style={{
          background: "#fff59d",
          color: "#111",
          padding: "0 1px",
          borderRadius: "2px",
        }}
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
}

function getOptionValue(option) {
  return typeof option === "object" ? option.value : option;
}

function getOptionLabel(option) {
  return typeof option === "object" ? option.label : option || "--";
}

function toNullableNumberInput(value) {
  if (value === "" || value === null || value === undefined) return null;

  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return null;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function roundMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildFeeValues(totalValue, tutorValue) {
  const total = toNullableNumberInput(totalValue);
  const tutor = toNullableNumberInput(tutorValue);

  if (total === null) {
    return {
      totalFee: null,
      totalFees: null,
      lacasShare: null,
    };
  }

  const safeTutor = tutor ?? 0;
  const lacas = roundMoney(total - safeTutor);

  return {
    totalFee: total,
    totalFees: total,
    tutorFee: tutor,
    tutorShare: tutor,
    lacasShare: lacas,
  };
}

function getPaymentFieldValue(row, field) {
  if (!row) return "";

  switch (field) {
    case "paymentDate":
      return row.paymentDate ?? row.date ?? "";
    case "tutorShare":
      return row.tutorShare ?? row.tutorFee ?? "";
    case "totalFees":
      return row.totalFees ?? row.totalFee ?? "";
    default:
      return row[field] ?? "";
  }
}

function isTextLikeSelectionInput(el) {
  if (!el) return false;

  const tag = String(el.tagName || "").toLowerCase();
  if (tag === "textarea") return true;
  if (tag !== "input") return false;

  const type = String(el.type || "text").toLowerCase();
  return ["text", "search", "url", "tel", "password"].includes(type);
}

function isPickerLikeColumn(col) {
  return (
    col?.kind === "select" ||
    col?.kind === "color" ||
    col?.type === "date" ||
    col?.type === "time"
  );
}

function tryOpenPicker(el, col) {
  if (!el || !col) return;

  requestAnimationFrame(() => {
    try {
      if (typeof el.focus === "function") el.focus();
    } catch (err) {
      console.error("Focus failed:", err);
    }

    if (!isPickerLikeColumn(col)) return;

    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch (err) {
      console.warn("showPicker not available:", err);
    }

    if (col.kind === "select") {
      try {
        el.click();
      } catch (err) {
        console.warn("Select click failed:", err);
      }

      try {
        el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      } catch (err) {
        console.warn("Select mousedown failed:", err);
      }
    }
  });
}

export default function PaymentSheet({ me, onCountChange, isActive = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkRowColor, setBulkRowColor] = useState("#fff8b3");
  const [bulkNameColor, setBulkNameColor] = useState("#dbeafe");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [undoCount, setUndoCount] = useState(0);

  const [selectedCell, setSelectedCell] = useState(null);
  const [anchorCell, setAnchorCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [openPalette, setOpenPalette] = useState(null);

  const mountedRef = useRef(true);
  const itemsRef = useRef([]);
  const filteredItemsRef = useRef([]);
  const pollingRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const inputRef = useRef(null);
  const editingCellRef = useRef(editingCell);
  const editValueRef = useRef(editValue);
  const shouldSelectAllOnFocusRef = useRef(true);
  const moveCaretToEndOnFocusRef = useRef(false);
  const isMouseSelectingRef = useRef(false);
  const dragAnchorCellRef = useRef(null);
  const rowSelectionAnchorRef = useRef(null);
  const undoStackRef = useRef([]);
  const paletteRootAttr = "data-color-palette-root";

  const currentRole = String(me?.role || me?.user?.role || "")
    .trim()
    .toLowerCase();

  const hasAccessFlag = (flagName) => {
    const directUser = {
      ...(me?.user || {}),
      ...(me || {}),
    };

    const value = directUser[flagName];
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true" ||
      value === "TRUE"
    );
  };

  const canSeeTutorShare =
    currentRole === "admin" || hasAccessFlag("access_tutor_share");

  const canSeeLacasShare =
    currentRole === "admin" || hasAccessFlag("access_lacas_share");

  const canSeeTotalFees =
    currentRole === "admin" || hasAccessFlag("access_total_fees");

const gridColumns = useMemo(() => {
  const cols = [
    {
      id: "paymentDate",
      label: "Date",
      field: "paymentDate",
      editable: true,
      width: '12px',
      type: "date",
      align: "center",
    },
    {
      id: "tuitionName",
      label: "Tuition Name",
      field: "tuitionName",
      editable: true,
      width: 10,
      align: "center",
    },
    {
      id: "country",
      label: "Country",
      field: "country",
      editable: true,
      width: 110,
      align: "center",
    },
    {
      id: "className",
      label: "Class Name",
      field: "className",
      editable: true,
      width: 120,
      align: "center",
    },
    {
      id: "daysPerWeek",
      label: "Days Per Week",
      field: "daysPerWeek",
      editable: true,
      width: 130,
      type: "number",
      align: "center",
    },
    {
      id: "tutorName",
      label: "Tutor Name",
      field: "tutorName",
      editable: true,
      width: 150,
      align: "center",
    },
  ];

  if (canSeeTutorShare) {
    cols.push({
      id: "tutorShare",
      label: "Tutor Fee",
      field: "tutorShare",
      editable: true,
      width: 120,
      type: "number",
      align: "center",
    });
  }

  if (canSeeLacasShare) {
    cols.push({
      id: "lacasShare",
      label: "Lacas Share",
      field: "lacasShare",
      editable: true,
      width: 120,
      type: "number",
      align: "center",
    });
  }

  if (canSeeTotalFees) {
    cols.push({
      id: "totalFees",
      label: "Total Fee",
      field: "totalFees",
      editable: true,
      width: 120,
      type: "number",
      align: "center",
    });
  }

  cols.push(
    {
      id: "status",
      label: "Status",
      field: "status",
      editable: true,
      width: 100,
      kind: "select",
      options: statusOptions,
      align: "center",
    },
    {
      id: "feedback",
      label: "Feedback",
      field: "feedback",
      editable: true,
      width: 220,
      align: "center",
    },
    {
      id: "otmName",
      label: "OTM Name",
      field: "otmName",
      editable: true,
      width: 150,
      align: "center",
    },
    {
      id: "notes",
      label: "Notes",
      field: "notes",
      editable: true,
      width: 240,
      align: "center",
    },

    // extra fields agar rakhne hain to sequence ke baad
    {
      id: "tuitionId",
      label: "Tuition Id",
      field: "tuitionId",
      editable: true,
      width: 140,
      align: "center",
    },
  );

  return cols;
}, [canSeeTutorShare, canSeeLacasShare, canSeeTotalFees]);

  const gridColumnIds = useMemo(() => gridColumns.map((c) => c.id), [gridColumns]);

  const gridColumnMap = useMemo(
    () => Object.fromEntries(gridColumns.map((c) => [c.id, c])),
    [gridColumns]
  );

  const firstEditableColumnId = gridColumns[0]?.id || "tuitionId";
  const visibleColumnCount = gridColumns.length + 5;

  useEffect(() => {
    mountedRef.current = true;

    if (!isActive) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return () => {
        mountedRef.current = false;
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }

    loadPayments({ initial: true });

    pollingRef.current = setInterval(() => {
      if (document.hidden) return;
      loadPayments({ silent: true });
    }, LIVE_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isActive]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (typeof onCountChange === "function") {
      onCountChange(items.length);
    }
  }, [items.length, onCountChange]);

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
  const handleDocPointer = (e) => {
    if (!e.target?.closest?.(`[${paletteRootAttr}="true"]`)) {
      setOpenPalette(null);
    }
  };

  document.addEventListener("mousedown", handleDocPointer);
  return () => document.removeEventListener("mousedown", handleDocPointer);
}, [paletteRootAttr]);

useEffect(() => {
  const html = document.documentElement;
  const body = document.body;

  const prevHtml = html.style.overscrollBehaviorX;
  const prevBody = body.style.overscrollBehaviorX;

  html.style.overscrollBehaviorX = "none";
  body.style.overscrollBehaviorX = "none";

  return () => {
    html.style.overscrollBehaviorX = prevHtml;
    body.style.overscrollBehaviorX = prevBody;
  };
}, []);

useEffect(() => {
  const wrapper = tableWrapperRef.current;
  if (!wrapper) return;

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    const atLeft = wrapper.scrollLeft <= 0;
    const atRight =
      wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1;

    if ((e.deltaX < 0 && atLeft) || (e.deltaX > 0 && atRight)) {
      e.preventDefault();
    }
  };

  wrapper.addEventListener("wheel", handleWheel, { passive: false });
  return () => wrapper.removeEventListener("wheel", handleWheel);
}, []);


  useEffect(() => {
    if (editingCell && inputRef.current) {
      const col = gridColumnMap[editingCell.colId];
      const el = inputRef.current;

      if (isPickerLikeColumn(col)) {
        tryOpenPicker(el, col);
        return;
      }

      try {
        if (typeof el.focus === "function") el.focus();
      } catch (err) {
        console.error("Focus failed:", err);
      }

      if (
        moveCaretToEndOnFocusRef.current &&
        isTextLikeSelectionInput(el) &&
        typeof el.setSelectionRange === "function"
      ) {
        const len = String(el.value || "").length;
        el.setSelectionRange(len, len);
      } else if (
        shouldSelectAllOnFocusRef.current &&
        isTextLikeSelectionInput(el) &&
        typeof el.select === "function"
      ) {
        el.select();
      }
    }
  }, [editingCell, gridColumnMap]);

  async function loadPayments({ initial = false, silent = false } = {}) {
    try {
      if (initial) setLoading(true);

      const res = await api.get("/payments");
      const rows = Array.isArray(res.data) ? res.data : res.data.items || [];

      if (!mountedRef.current) return;

      if (!rowsAreSame(itemsRef.current, rows)) {
        setItems(rows);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      if (!silent && mountedRef.current && initial) {
        setItems([]);
      }
    } finally {
      if (mountedRef.current && initial) {
        setLoading(false);
      }
    }
  }

  function adjustZoom(delta) {
    setZoomLevel((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  }

  function resetZoom() {
    setZoomLevel(100);
  }

  function pushUndoTransaction(changes) {
    if (!Array.isArray(changes) || !changes.length) return;
    const nextStack = [...undoStackRef.current, { changes }].slice(-MAX_UNDO_STACK);
    undoStackRef.current = nextStack;
    setUndoCount(nextStack.length);
  }

  async function undoLastAction() {
    const last = undoStackRef.current[undoStackRef.current.length - 1];
    if (!last) return;

    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setUndoCount(undoStackRef.current.length);

    const patchMap = new Map(
      last.changes.map((change) => [String(change.rowId), change.before])
    );

    setItems((prev) =>
      prev.map((row) => {
        const rowId = String(getRowId(row));
        return patchMap.has(rowId) ? { ...row, ...patchMap.get(rowId) } : row;
      })
    );

    clearEditingState();

    try {
      for (const change of last.changes) {
        const rowId = String(change.rowId);
        const res = await api.patch(`/payments/${encodeURIComponent(rowId)}`, change.before);
        const freshItem = res?.data?.item;

        if (freshItem) {
          setItems((prev) =>
            prev.map((item) =>
              String(getRowId(item)) === rowId ? freshItem : item
            )
          );
        }
      }
    } catch (err) {
      console.error("Undo failed:", err);
      alert("Undo failed.");
      await loadPayments({ silent: true });
    }
  }

  async function addRow() {
    try {
      setAdding(true);

      const newRow = {
  tuitionId: `manual-${Date.now()}`,
  paymentDate: "",
  tuitionName: "",
  country: "",
  className: "",
  daysPerWeek: "",
  tutorName: "",
  tutorShare: "",
  lacasShare: "",
  totalFees: "",
  status: "Tuition Pending",
  feedback: "",
  otmName: "",
  notes: "",
  syncFlag: false,
  assignedStaffId: "",
  isDeleted: false,
  deletedFromTodayDemo: false,
  assignedTo: "",
  orderIndex: itemsRef.current.length,
  rowColor: "#ffffff",
  tuitionNameColor: "#ffffff",
};

      const res = await api.post("/payments", newRow);
      const created = res.data?.item || res.data?.payment || res.data;

      if (created && getRowId(created) !== undefined) {
        setItems((prev) => [...prev, created]);
      } else {
        await loadPayments({ silent: true });
      }
    } catch (err) {
      console.error("Failed to add payment row:", err);
      alert("New payment row create nahi hui.");
    } finally {
      setAdding(false);
    }
  }


async function updateRowFields(row, patchFields, options = {}) {
  const { reloadAfter = false, skipUndo = false } = options;
  const rowId = getRowId(row);

  if (rowId === undefined || rowId === null) {
    alert("Row ID missing hai. Backend record identify nahi ho raha.");
    return null;
  }

  const oldItems = itemsRef.current;
  const updatedRow = { ...row, ...patchFields };

  if (!skipUndo) {
    const before = {};
    Object.keys(patchFields).forEach((field) => {
      before[field] = row[field];
    });

    pushUndoTransaction([
      {
        rowId: String(rowId),
        before,
        after: patchFields,
      },
    ]);
  }

  setItems((prev) =>
    prev.map((item) => (getRowId(item) === rowId ? updatedRow : item))
  );

  try {
    const res = await api.patch(`/payments/${encodeURIComponent(rowId)}`, patchFields);
    const freshItem = res?.data?.item;

    if (freshItem) {
      setItems((prev) =>
        prev.map((item) => (getRowId(item) === rowId ? freshItem : item))
      );
    }

    if (reloadAfter) {
      await loadPayments({ silent: true });
    }

    return freshItem || updatedRow;
  } catch (err) {
    console.error("Failed to update payment row:", err);
    setItems(oldItems);
    if (!skipUndo) {
      undoStackRef.current = undoStackRef.current.slice(0, -1);
      setUndoCount(undoStackRef.current.length);
    }
    alert("Update failed.");
    return null;
  }
}


const filteredItems = useMemo(() => {
  const q = search.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const haystack = [
      item.tuitionId,
      item.paymentDate ?? item.date,
      item.tuitionName,
      item.country,
      item.className,
      item.daysPerWeek,
      item.tutorName,
      item.tutorShare ?? item.tutorFee,
      item.lacasShare,
      item.totalFees ?? item.totalFee,
      item.status,
      item.feedback,
      item.otmName,
      item.notes,
      item.syncFlag,
      item.assignedStaffId,
      item.isDeleted,
      item.deletedFromTodayDemo,
      item.assignedTo,
      item.orderIndex,
      item.rowColor,
      item.tuitionNameColor,
    ]
      .map((v) => String(v ?? "").toLowerCase())
      .join(" ");

    return haystack.includes(q);
  });
}, [items, search]);

  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    const existingIds = new Set(
      items
        .map((row) => getRowId(row))
        .filter((id) => id !== undefined && id !== null)
        .map((id) => String(id))
    );

    setSelectedRowIds((prev) => {
      const next = new Set([...prev].filter((id) => existingIds.has(id)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [items]);
  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedCell(null);
      setAnchorCell(null);
      setSelectedCells(new Set());
      setSelectedRowIds(new Set());
      setEditingCell(null);
      editingCellRef.current = null;
      setEditValue("");
      editValueRef.current = "";
      return;
    }

    if (!selectedCell || selectedCell.rowIndex >= filteredItems.length) {
      const first = { rowIndex: 0, colId: firstEditableColumnId };
      setSelectedCell(first);
      setAnchorCell(first);
      setSelectedCells(new Set([getCellKey(0, firstEditableColumnId)]));
      setEditingCell(null);
      editingCellRef.current = null;
      setEditValue("");
      editValueRef.current = "";
    }
  }, [filteredItems.length, selectedCell, firstEditableColumnId]);

  const getColumnIndex = (colId) => gridColumnIds.findIndex((id) => id === colId);


const focusCell = (rowIndex, colId) => {
  requestAnimationFrame(() => {
    const root = tableWrapperRef.current;
    if (!root) return;

    const target = root.querySelector(
      `[data-grid-row="${rowIndex}"][data-grid-col="${colId}"]`
    );

    if (target) {
      try {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      } catch (err) {
        console.warn("scrollIntoView failed:", err);
      }
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

  const getCellValue = (row, col) => {
    if (!row || !col) return "";
    return getPaymentFieldValue(row, col.field);
  };

  const getEditReadyValue = (row, col) => {
    const raw = getCellValue(row, col);

    if (col.valueType === "boolean") {
      return normalizeBoolean(raw) ? "1" : "0";
    }

    if (col.kind === "color") {
      return safeColor(raw, "#ffffff");
    }

    return raw ?? "";
  };

 const buildPatchForColumn = (row, colId, value) => {
  const col = gridColumnMap[colId];
  if (!col?.field) return {};

  if (colId === "paymentDate") {
    return { paymentDate: value, date: value };
  }

  if (colId === "totalFees") {
    const currentTutor = toNullableNumberInput(row?.tutorShare ?? row?.tutorFee);
    return buildFeeValues(value, currentTutor);
  }

  if (colId === "tutorShare") {
    const tutorAmount = toNullableNumberInput(value);
    const currentTotal = toNullableNumberInput(row?.totalFees ?? row?.totalFee);

    return {
      tutorShare: tutorAmount,
      tutorFee: tutorAmount,
      lacasShare:
        currentTotal === null || tutorAmount === null
          ? null
          : roundMoney(currentTotal - tutorAmount),
    };
  }

  if (colId === "lacasShare") {
    return {
      lacasShare: toNullableNumberInput(value),
    };
  }

  if (col.valueType === "boolean") {
    return { [col.field]: value === "1" };
  }

  if (col.kind === "color") {
    return { [col.field]: safeColor(value, "#ffffff") };
  }

  if (col.type === "number") {
    return { [col.field]: toNullableNumberInput(value) };
  }

  return { [col.field]: value };
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

  const startEditingCell = (rowIndex, colId, forcedValue = null, options = {}) => {
    const col = gridColumnMap[colId];
    const row = filteredItemsRef.current[rowIndex];

    if (!col?.editable || !row) return;

    const currentVal = getEditReadyValue(row, col);
    const nextValue = forcedValue !== null ? forcedValue : String(currentVal ?? "");

    setSelectedRowIds(new Set());
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

  const getNextCell = (rowIndex, colId, direction = "down") => {
    const currentColIndex = getColumnIndex(colId);

    if (direction === "down") {
      return {
        rowIndex: Math.min(filteredItemsRef.current.length - 1, rowIndex + 1),
        colId,
      };
    }

    if (direction === "up") {
      return {
        rowIndex: Math.max(0, rowIndex - 1),
        colId,
      };
    }

    if (direction === "right") {
      return {
        rowIndex,
        colId: gridColumnIds[Math.min(gridColumnIds.length - 1, currentColIndex + 1)],
      };
    }

    if (direction === "left") {
      return {
        rowIndex,
        colId: gridColumnIds[Math.max(0, currentColIndex - 1)],
      };
    }

    return { rowIndex, colId };
  };

  const commitEdit = async (focusTarget = null) => {
    const currentEditingCell = editingCellRef.current;
    if (!currentEditingCell) {
      if (focusTarget) focusCell(focusTarget.rowIndex, focusTarget.colId);
      return;
    }

    const { rowIndex, colId } = currentEditingCell;
    const col = gridColumnMap[colId];
    const row = filteredItemsRef.current[rowIndex];

    const newValue = String(editValueRef.current ?? "");
    clearEditingState();

    if (!row || !col?.editable) {
      if (focusTarget) focusCell(focusTarget.rowIndex, focusTarget.colId);
      return;
    }

    const currentRawValue = getEditReadyValue(row, col);
    const oldValue = String(currentRawValue ?? "");

    if (newValue !== oldValue) {
     const patch = buildPatchForColumn(row, colId, newValue);
      if (Object.keys(patch).length > 0) {
        await updateRowFields(row, patch);
      }
    }

    if (focusTarget) {
      focusCell(focusTarget.rowIndex, focusTarget.colId);
    }
  };
  const getSelectedVisibleRowIndexesFromCells = () => {
    const rows = new Set();

    if (selectedCells.size) {
      selectedCells.forEach((key) => {
        const { rowIndex } = parseCellKey(key);
        if (Number.isFinite(rowIndex)) rows.add(rowIndex);
      });
    } else if (selectedCell?.rowIndex !== undefined) {
      rows.add(selectedCell.rowIndex);
    }

    return Array.from(rows)
      .filter((rowIndex) => rowIndex >= 0 && rowIndex < filteredItemsRef.current.length)
      .sort((a, b) => a - b);
  };

  const getSelectedRowIdsFromCells = () => {
    return getSelectedVisibleRowIndexesFromCells()
      .map((rowIndex) => filteredItemsRef.current[rowIndex])
      .map((row) => getRowId(row))
      .filter((id) => id !== undefined && id !== null)
      .map((id) => String(id));
  };

  const getEffectiveSelectedRowIds = (fallbackRowId = null) => {
    let ids =
      selectedRowIds.size > 0
        ? Array.from(selectedRowIds)
        : getSelectedRowIdsFromCells();

    if (fallbackRowId !== null && fallbackRowId !== undefined) {
      const fallbackStr = String(fallbackRowId);
      if (!ids.includes(fallbackStr)) {
        ids = [fallbackStr];
      }
    }

    return ids;
  };

  const getVisibleRowIds = () =>
    filteredItemsRef.current
      .map((row) => getRowId(row))
      .filter((id) => id !== undefined && id !== null)
      .map((id) => String(id));

  const isRowSelected = (rowId) => selectedRowIds.has(String(rowId));

  const allVisibleRowIds = useMemo(
    () =>
      filteredItems
        .map((row) => getRowId(row))
        .filter((id) => id !== undefined && id !== null)
        .map((id) => String(id)),
    [filteredItems]
  );

  const allVisibleSelected =
    allVisibleRowIds.length > 0 &&
    allVisibleRowIds.every((id) => selectedRowIds.has(id));

  const someVisibleSelected =
    allVisibleRowIds.some((id) => selectedRowIds.has(id)) && !allVisibleSelected;

  const buildUndoChangesFromMap = (updatesById) => {
    return Array.from(updatesById.values()).map((entry) => ({
      rowId: String(getRowId(entry.row)),
      before: entry.before,
      after: entry.after,
    }));
  };

  const clearSelectedCells = async () => {
    if (!selectedCells.size) return;

    const updatesById = new Map();

    selectedCells.forEach((key) => {
      const { rowIndex, colId } = parseCellKey(key);
      const col = gridColumnMap[colId];
      const row = filteredItemsRef.current[rowIndex];

      if (!row || !col?.editable) return;
      if (col.field === "orderIndex") return;

      const patch =
        col.kind === "color"
          ? { [col.field]: "#ffffff" }
          : col.valueType === "boolean"
          ? { [col.field]: false }
          : col.type === "number"
          ? { [col.field]: null }
          : { [col.field]: "" };

      if (!Object.keys(patch).length) return;

      const rowId = getRowId(row);
      if (rowId === undefined || rowId === null) return;

      const existing = updatesById.get(String(rowId)) || {
        row,
        before: {},
        after: {},
      };

      Object.keys(patch).forEach((field) => {
        if (!(field in existing.before)) {
          existing.before[field] = row[field];
        }
        existing.after[field] = patch[field];
      });

      updatesById.set(String(rowId), existing);
    });

    if (!updatesById.size) return;

    pushUndoTransaction(buildUndoChangesFromMap(updatesById));

    setItems((prev) =>
      prev.map((row) => {
        const entry = updatesById.get(String(getRowId(row)));
        return entry ? { ...row, ...entry.after } : row;
      })
    );

    clearEditingState();

    try {
      for (const [, entry] of updatesById.entries()) {
        await api.patch(
          `/payments/${encodeURIComponent(String(getRowId(entry.row)))}`,
          entry.after
        );
      }
      await loadPayments({ silent: true });
    } catch (err) {
      console.error("Failed to clear selected cells:", err);
      alert("Cells clear nahi hui.");
      await loadPayments({ silent: true });
    }
  };

  const buildRowClearPatch = () => {
    const patch = {};

    gridColumns.forEach((col) => {
      if (!col.editable || !col.field) return;
      if (col.field === "orderIndex") return;
      if (col.field === "tuitionId") return;

      if (col.kind === "color") {
        patch[col.field] = "#ffffff";
      } else if (col.valueType === "boolean") {
        patch[col.field] = false;
      } else if (col.type === "number") {
        patch[col.field] = null;
      } else {
        patch[col.field] = "";
      }
    });

    return patch;
  };

  const clearSelectedRowsData = async (fallbackRowId = null) => {
    const rowIds = getEffectiveSelectedRowIds(fallbackRowId);

    if (!rowIds.length) return;

    const idSet = new Set(rowIds);
    const patch = buildRowClearPatch();
    const targetRows = itemsRef.current.filter((row) =>
      idSet.has(String(getRowId(row)))
    );

    if (!targetRows.length) return;

    const changes = targetRows.map((row) => {
      const before = {};
      Object.keys(patch).forEach((field) => {
        before[field] = row[field];
      });
      return {
        rowId: String(getRowId(row)),
        before,
        after: patch,
      };
    });

    pushUndoTransaction(changes);

    setItems((prev) =>
      prev.map((row) =>
        idSet.has(String(getRowId(row))) ? { ...row, ...patch } : row
      )
    );

    clearEditingState();

    try {
      for (const row of targetRows) {
        await api.patch(
          `/payments/${encodeURIComponent(String(getRowId(row)))}`,
          patch
        );
      }
      await loadPayments({ silent: true });
    } catch (err) {
      console.error("Failed to clear selected rows data:", err);
      alert("Selected rows clear nahi hui.");
      await loadPayments({ silent: true });
    }
  };

  const moveSelection = (rowDelta, colDelta, extendRange = false) => {
    if (!filteredItems.length) return;

    const baseCell =
      selectedCell || { rowIndex: 0, colId: firstEditableColumnId };

    const currentColIndex = getColumnIndex(baseCell.colId);
    const nextRow = Math.max(
      0,
      Math.min(filteredItems.length - 1, baseCell.rowIndex + rowDelta)
    );
    const nextColIndex = Math.max(
      0,
      Math.min(gridColumns.length - 1, currentColIndex + colDelta)
    );
    const nextColId = gridColumnIds[nextColIndex];
    const nextCell = { rowIndex: nextRow, colId: nextColId };

    if (extendRange && anchorCell) {
      setSelectedRowIds(new Set());
      setSelectedCell(nextCell);
      setSelectedCells(getRangeCells(anchorCell, nextCell));
      focusCell(nextRow, nextColId);
      return;
    }

    setSelectedRowIds(new Set());
    selectSingleCell(nextRow, nextColId, true);
  };

  const reorderArrayByIds = (list, rowIds, direction) => {
    const arr = [...list];
    const idSet = new Set(rowIds.map((id) => String(id)));

    const selectedIndices = arr
      .map((row, index) => (idSet.has(String(getRowId(row))) ? index : -1))
      .filter((index) => index !== -1);

    if (!selectedIndices.length) return arr;

    if (direction === "up") {
      for (const index of selectedIndices) {
        if (index <= 0) continue;
        const prevId = getRowId(arr[index - 1]);
        if (!idSet.has(String(prevId))) {
          [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        }
      }
    } else {
      for (let i = selectedIndices.length - 1; i >= 0; i--) {
        const index = selectedIndices[i];
        if (index >= arr.length - 1) continue;
        const nextId = getRowId(arr[index + 1]);
        if (!idSet.has(String(nextId))) {
          [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        }
      }
    }

    return arr;
  };


async function persistReorder(nextItems) {
  const beforeRows = itemsRef.current;
  const withOrder = nextItems.map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));

  const changes = withOrder.map((item, idx) => {
    const existing = beforeRows.find(
      (row) => String(getRowId(row)) === String(getRowId(item))
    );

    return {
      rowId: String(getRowId(item)),
      before: { orderIndex: existing?.orderIndex ?? null },
      after: { orderIndex: idx },
    };
  });

  pushUndoTransaction(changes);
  setItems(withOrder);

  try {
    const reorderPayload = withOrder.map((item, idx) => ({
      id: getRowId(item),
      orderIndex: idx,
    }));

    await api.post("/payments/reorder", { items: reorderPayload });
    await loadPayments({ silent: true });
  } catch (err) {
    console.error("Failed to reorder payment rows:", err);
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setUndoCount(undoStackRef.current.length);
    alert("Row reorder save nahi hui.");
    await loadPayments({ silent: true });
  }
}


  async function moveRows(direction, fallbackRowId = null) {
    const rowIds = getEffectiveSelectedRowIds(fallbackRowId);

    if (!rowIds.length) {
      alert("Pehle row select karo.");
      return;
    }

    const currentItems = itemsRef.current;
    const currentIndexes = currentItems
      .map((item, index) => ({
        index,
        rowId: String(getRowId(item)),
      }))
      .filter((entry) => rowIds.includes(entry.rowId))
      .map((entry) => entry.index);

    if (!currentIndexes.length) return;

    if (direction === "up" && currentIndexes[0] === 0) return;
    if (
      direction === "down" &&
      currentIndexes[currentIndexes.length - 1] === currentItems.length - 1
    ) {
      return;
    }

    const nextItems = reorderArrayByIds(currentItems, rowIds, direction);
    await persistReorder(nextItems);
  }


async function applyColorToRowIds(rowIds, field, colorValue, options = {}) {
  const { showSelectionAlert = false } = options;
  const normalizedColor = safeColor(colorValue, DEFAULT_COLOR);
  const normalizedIds = rowIds
    .filter((id) => id !== undefined && id !== null)
    .map((id) => String(id));

  if (!normalizedIds.length) {
    if (showSelectionAlert) {
      alert("select row");
    }
    return;
  }

  const idSet = new Set(normalizedIds);
  const targetRows = itemsRef.current.filter((item) =>
    idSet.has(String(getRowId(item)))
  );

  if (!targetRows.length) return;

  pushUndoTransaction(
    targetRows.map((row) => ({
      rowId: String(getRowId(row)),
      before: { [field]: row[field] },
      after: { [field]: normalizedColor },
    }))
  );

  setItems((prev) =>
    prev.map((row) =>
      idSet.has(String(getRowId(row)))
        ? { ...row, [field]: normalizedColor }
        : row
    )
  );

  try {
    for (const row of targetRows) {
      await api.patch(`/payments/${encodeURIComponent(String(getRowId(row)))}`, {
        [field]: normalizedColor,
      });
    }
    await loadPayments({ silent: true });
  } catch (err) {
    console.error("Failed to apply color:", err);
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setUndoCount(undoStackRef.current.length);
    alert("Color apply nahi hua.");
    await loadPayments({ silent: true });
  }
}

async function applyColorToSelectedRows(field, colorValue) {
  const rowIds = getEffectiveSelectedRowIds();
  await applyColorToRowIds(rowIds, field, colorValue, { showSelectionAlert: true });
}


  async function deleteRow(row) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID missing hai.");
      return;
    }

    if (!window.confirm("Is payment row ko delete karna hai?")) return;

    const oldItems = itemsRef.current;
    setItems((prev) => prev.filter((item) => getRowId(item) !== rowId));

    try {
      await api.delete(`/payments/${encodeURIComponent(rowId)}`);
      await loadPayments({ silent: true });
    } catch (err) {
      console.error("Failed to delete payment row:", err);
      setItems(oldItems);
      alert("Delete failed.");
    }
  }

  async function deleteSelectedRows() {
    const rowIds = getEffectiveSelectedRowIds();

    if (!rowIds.length) {
      alert("Pehle rows select karo.");
      return;
    }

    if (!window.confirm(`${rowIds.length} selected row(s) delete karni hain?`)) return;

    const oldItems = itemsRef.current;
    const idSet = new Set(rowIds);

    setItems((prev) => prev.filter((row) => !idSet.has(String(getRowId(row)))));
    setSelectedRowIds(new Set());

    try {
      for (const rowId of rowIds) {
        await api.delete(`/payments/${encodeURIComponent(rowId)}`);
      }
      await loadPayments({ silent: true });
    } catch (err) {
      console.error("Failed to delete selected payment rows:", err);
      setItems(oldItems);
      alert("Bulk delete failed.");
    }
  }

  const toggleSelectAllVisibleRows = () => {
    const visibleIds = getVisibleRowIds();

    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      const areAllSelected =
        visibleIds.length > 0 && visibleIds.every((id) => next.has(id));

      if (areAllSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearRowSelections = () => {
    setSelectedRowIds(new Set());
  };

  const handleRowCheckboxChange = (row, visibleIndex, e) => {
    const rowId = String(getRowId(row));
    const checked = e.target.checked;

    setSelectedRowIds((prev) => {
      const next = new Set(prev);

      if (e.shiftKey && rowSelectionAnchorRef.current !== null) {
        const start = Math.min(rowSelectionAnchorRef.current, visibleIndex);
        const end = Math.max(rowSelectionAnchorRef.current, visibleIndex);
        const rangeRows = filteredItemsRef.current.slice(start, end + 1);

        rangeRows.forEach((item) => {
          const id = String(getRowId(item));
          if (checked) next.add(id);
          else next.delete(id);
        });
      } else {
        if (checked) next.add(rowId);
        else next.delete(rowId);
      }

      return next;
    });

    rowSelectionAnchorRef.current = visibleIndex;
  };

  const handleCheckboxKeyDown = async (e, rowId = null) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      await undoLastAction();
      return;
    }

    if ((e.altKey || e.ctrlKey || e.metaKey) && e.key === "ArrowUp") {
      e.preventDefault();
      await moveRows("up", rowId);
      return;
    }

    if ((e.altKey || e.ctrlKey || e.metaKey) && e.key === "ArrowDown") {
      e.preventDefault();
      await moveRows("down", rowId);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      await clearSelectedRowsData(rowId);
      return;
    }
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
      setSelectedRowIds(new Set());
      setSelectedCell(clickedCell);
      setSelectedCells(getRangeCells(anchorCell, clickedCell));
      focusCell(rowIndex, colId);
      isMouseSelectingRef.current = false;
      dragAnchorCellRef.current = null;
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedRowIds(new Set());
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

    setSelectedRowIds(new Set());
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

  const handleCellKeyDown = async (e, rowIndex, colId) => {
    const col = gridColumnMap[colId];
    if (!col) return;

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      await undoLastAction();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      adjustZoom(ZOOM_STEP);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      adjustZoom(-ZOOM_STEP);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      e.preventDefault();
      resetZoom();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();

      if (e.shiftKey) {
        const allRowIds = getVisibleRowIds();
        setSelectedRowIds(new Set(allRowIds));
        return;
      }

      const all = new Set();
      for (let r = 0; r < filteredItems.length; r++) {
        for (const id of gridColumnIds) {
          all.add(getCellKey(r, id));
        }
      }
      setSelectedRowIds(new Set());
      setSelectedCells(all);
      setSelectedCell({ rowIndex, colId });
      setAnchorCell({ rowIndex, colId });
      return;
    }

    if ((e.altKey || e.ctrlKey || e.metaKey) && e.key === "ArrowUp") {
      e.preventDefault();
      await moveRows("up");
      return;
    }

    if ((e.altKey || e.ctrlKey || e.metaKey) && e.key === "ArrowDown") {
      e.preventDefault();
      await moveRows("down");
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();

      if (selectedRowIds.size > 0) {
        await clearSelectedRowsData();
      } else {
        await clearSelectedCells();
      }
      return;
    }

    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      if (col.kind === "color") {
        const row = filteredItemsRef.current[rowIndex];
        if (row) {
          const rowId = String(getRowId(row));
          setOpenPalette((prev) =>
            prev?.key === `${rowId}__${col.id}`
              ? null
              : { key: `${rowId}__${col.id}`, rowId, field: col.field }
          );
        }
      } else if (col.editable) {
        startEditingCell(rowIndex, colId);
      }
      return;
    }

    if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      if (col.editable) startEditingCell(rowIndex, colId);
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        selectSingleCell(0, gridColumnIds[0], true);
      } else {
        selectSingleCell(rowIndex, gridColumnIds[0], true);
      }
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        selectSingleCell(
          Math.max(0, filteredItems.length - 1),
          gridColumnIds[gridColumnIds.length - 1],
          true
        );
      } else {
        selectSingleCell(rowIndex, gridColumnIds[gridColumnIds.length - 1], true);
      }
      return;
    }

    if (e.key === "PageDown") {
      e.preventDefault();
      moveSelection(10, 0, e.shiftKey);
      return;
    }

    if (e.key === "PageUp") {
      e.preventDefault();
      moveSelection(-10, 0, e.shiftKey);
      return;
    }

    if (e.shiftKey && e.key === " ") {
      e.preventDefault();
      const currentRow = filteredItemsRef.current[rowIndex];
      if (!currentRow) return;
      const rowId = String(getRowId(currentRow));
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        next.add(rowId);
        return next;
      });
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
      !isPickerLikeColumn(col) &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      const row = filteredItemsRef.current[rowIndex];
      const currentValue = String(getCellValue(row, col) ?? "");
      startEditingCell(rowIndex, colId, currentValue + e.key, {
        selectAll: false,
        moveCaretToEnd: true,
      });
    }
  };

  const handleEditInputKeyDown = async (e, rowIndex, colId, col) => {
    const pickerLike = isPickerLikeColumn(col);

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const nextCell = getNextCell(rowIndex, colId, "down");
      await commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nextCell = getNextCell(rowIndex, colId, e.shiftKey ? "left" : "right");
      await commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (!pickerLike && e.key === "ArrowUp") {
      e.preventDefault();
      const nextCell = getNextCell(rowIndex, colId, "up");
      await commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (!pickerLike && e.key === "ArrowDown") {
      e.preventDefault();
      const nextCell = getNextCell(rowIndex, colId, "down");
      await commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (!pickerLike && e.key === "ArrowLeft") {
      e.preventDefault();
      const nextCell = getNextCell(rowIndex, colId, "left");
      await commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (!pickerLike && e.key === "ArrowRight") {
      e.preventDefault();
      const nextCell = getNextCell(rowIndex, colId, "right");
      await commitEdit(nextCell);
      selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit({ rowIndex, colId });
    }
  };

  const handleWrapperKeyDownCapture = async (e) => {
    if (editingCellRef.current) return;

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      await undoLastAction();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      adjustZoom(ZOOM_STEP);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      adjustZoom(-ZOOM_STEP);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      e.preventDefault();
      resetZoom();
    }
  };


  const togglePalette = (key, rowId, field) => {
    setOpenPalette((prev) =>
      prev?.key === key ? null : { key, rowId: String(rowId), field }
    );
  };

  const renderColorPaletteControl = (row, field, paletteKey) => {
    const rowId = getRowId(row);
    const finalColor = safeColor(row?.[field], DEFAULT_COLOR);
    const isOpen = openPalette?.key === paletteKey;

    return (
      <div
        style={styles.paletteRoot}
        {...{ [paletteRootAttr]: "true" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={styles.paletteTrigger}
          onClick={(e) => {
            e.stopPropagation();
            togglePalette(paletteKey, rowId, field);
          }}
          title="Pick color"
        >
          <span style={{ ...styles.colorSwatch, background: finalColor }} />
        </button>

        {isOpen ? (
          <div
            style={styles.palettePopover}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.paletteGrid}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={`${paletteKey}-${color}`}
                  type="button"
                  style={{
                    ...styles.paletteButton,
                    background: color,
                    boxShadow:
                      safeColor(color) === finalColor
                        ? "inset 0 0 0 2px #111111"
                        : "none",
                  }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setOpenPalette(null);
                    await applyColorToRowIds([String(rowId)], field, color);
                  }}
                />
              ))}
            </div>

            <div style={styles.paletteCustomRow}>
              <span style={styles.paletteCustomLabel}>Custom</span>
              <input
                type="color"
                value={finalColor}
                style={styles.paletteCustomInput}
                onChange={async (e) => {
                  e.stopPropagation();
                  setOpenPalette(null);
                  await applyColorToRowIds([String(rowId)], field, e.target.value);
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderCellDisplay = (row, col, value) => {
    if (col.id === "status") {
      return <StatusPill value={value} />;
    }

    if (col.id === "tuitionName") {
      const rowId = String(getRowId(row));
      return (
        <div style={styles.tuitionNameInner}>
          <span style={styles.tuitionNameText}>{highlightText(value || "", search)}</span>
          {renderColorPaletteControl(row, "tuitionNameColor", `${rowId}__tuitionNameQuick`)}
        </div>
      );
    }

    if (col.valueType === "boolean") {
      return normalizeBoolean(value) ? "Yes" : "No";
    }

    if (col.kind === "color") {
      const finalColor = safeColor(value, DEFAULT_COLOR);
      return (
        <div style={styles.paletteInlineCell}>
          {renderColorPaletteControl(row, col.field, `${String(getRowId(row))}__${col.id}`)}
          <span style={styles.colorValue}>{finalColor}</span>
        </div>
      );
    }

    return highlightText(value || "", search);
  };

  const renderGridCell = (row, rowIndex, col) => {
    const rowId = getRowId(row);
    const rowChecked = isRowSelected(rowId);
    const cellKey = getCellKey(rowIndex, col.id);
    const isSelected = selectedCells.has(cellKey);
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;

    const value = getCellValue(row, col);
    const rowBg = row?.rowColor ? safeColor(row.rowColor, DEFAULT_COLOR) : DEFAULT_COLOR;
    const rowSelectedBg = rowChecked ? "#dbeafe" : rowBg;
    const tuitionNameBg =
      col.id === "tuitionName" && row?.tuitionNameColor
        ? safeColor(row.tuitionNameColor, rowSelectedBg)
        : rowSelectedBg;
    const isFeedbackCol = col.id === "feedback";
    const cellBackground = isFeedbackCol
      ? FEEDBACK_BG
      : col.id === "tuitionName"
      ? tuitionNameBg
      : rowSelectedBg;
    const cellTextColor = isFeedbackCol ? "#ffffff" : getContrastTextColor(cellBackground);

    const commonTdStyle = {
      ...styles.td,
      minWidth: col.width,
      width: col.width,
      boxShadow: isSelected
        ? "inset 0 0 0 2px #107c41"
        : rowChecked
        ? "inset 0 0 0 1.5px #2563eb"
        : "none",
      backgroundColor:
        col.kind === "color"
          ? isEditing
            ? cellBackground
            : cellBackground
          : isEditing
          ? isFeedbackCol
            ? FEEDBACK_BG
            : "#ffffff"
          : cellBackground,
      color: cellTextColor,
      position: "relative",
      cursor: col.editable ? "cell" : "default",
      zIndex: isSelected ? 1 : 0,
    };

    if (isEditing && col.kind === "select") {
      return (
        <td style={commonTdStyle}>
          <select
            ref={inputRef}
            autoFocus
            value={editValue}
            onChange={(e) => {
              editValueRef.current = e.target.value;
              setEditValue(e.target.value);
            }}
            onBlur={() => commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
            style={styles.select}
          >
            {col.options.map((opt) => (
              <option key={getOptionValue(opt)} value={getOptionValue(opt)}>
                {getOptionLabel(opt)}
              </option>
            ))}
          </select>
        </td>
      );
    }

    if (isEditing && col.kind !== "color") {
      return (
        <td style={commonTdStyle}>
          <input
            ref={inputRef}
            autoFocus
            type={col.type || "text"}
            value={editValue}
            onChange={(e) => {
              editValueRef.current = e.target.value;
              setEditValue(e.target.value);
            }}
            onBlur={() => commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
            style={styles.input}
          />
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
          if (col.kind === "color") {
            const rowIdStr = String(getRowId(row));
            togglePalette(`${rowIdStr}__${col.id}`, rowIdStr, col.field);
            return;
          }

          if (col.editable) startEditingCell(rowIndex, col.id);
        }}
        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, col.id)}
        style={commonTdStyle}
      >
        <div
          style={{
            ...styles.readCell,
            ...(isFeedbackCol ? styles.feedbackReadCell : {}),
          }}
        >
          {renderCellDisplay(row, col, value)}
        </div>
      </td>
    );
  };

  return (
    <div style={styles.page}>
      <style>{`
        .excel-cell:focus {
          outline: 2px solid #107c41;
          outline-offset: -2px;
        }
      `}</style>

      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div style={styles.titleWrap}>
  
          </div>
          <div style={styles.actions}>
            <div style={styles.selectedCountBadge}>
              Selected Rows: {selectedRowIds.size}
            </div>

            <div style={styles.zoomWrap}>
              <button type="button" onClick={() => adjustZoom(-ZOOM_STEP)} style={styles.toolBtn}>
                −
              </button>
              <span style={styles.zoomLabel}>{zoomLevel}%</span>
              <button type="button" onClick={() => adjustZoom(ZOOM_STEP)} style={styles.toolBtn}>
                +
              </button>
            </div>

            <button onClick={resetZoom} style={styles.mutedToolBtn}>
              Reset Zoom
            </button>

            <input
              type="text"
              placeholder="Search by date, tuition name, country, class, tutor, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <button onClick={toggleSelectAllVisibleRows} style={styles.toolBtn}>
              {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
            </button>

            <button onClick={clearRowSelections} style={styles.mutedToolBtn}>
              Clear Rows
            </button>

            <button
              onClick={undoLastAction}
              style={undoCount ? styles.toolBtn : styles.disabledToolBtn}
              disabled={!undoCount}
            >
              Undo ({undoCount})
            </button>

            <button onClick={() => moveRows("up")} style={styles.toolBtn}>
              ↑ Move Selected
            </button>

            <button onClick={() => moveRows("down")} style={styles.toolBtn}>
              ↓ Move Selected
            </button>

            <button onClick={deleteSelectedRows} style={styles.dangerToolBtn}>
              Delete Selected
            </button>

            <label style={styles.colorToolWrap}>
              <span style={styles.colorToolLabel}>Row Color</span>
              <input
                type="color"
                value={bulkRowColor}
                onChange={(e) => setBulkRowColor(e.target.value)}
                onBlur={(e) => applyColorToSelectedRows("rowColor", e.target.value)}
                style={styles.colorInputMini}
              />
            </label>

            <label style={styles.colorToolWrap}>
              <span style={styles.colorToolLabel}>Name Color</span>
              <input
                type="color"
                value={bulkNameColor}
                onChange={(e) => setBulkNameColor(e.target.value)}
                onBlur={(e) => applyColorToSelectedRows("tuitionNameColor", e.target.value)}
                style={styles.colorInputMini}
              />
            </label>

            <button onClick={() => loadPayments({ initial: true })} style={styles.refreshBtn}>
              Refresh
            </button>

            <button onClick={addRow} style={styles.addBtn} disabled={adding}>
              {adding ? "Adding..." : "+ Add Row"}
            </button>
          </div>
        </div>

        <div
          style={styles.tableWrapper}
          ref={tableWrapperRef}
          onKeyDownCapture={handleWrapperKeyDownCapture}
        >
          <div
            style={{
              ...styles.zoomedArea,
              zoom: zoomLevel / 100,
            }}
          >
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, minWidth: "55px" }}>
                    <div style={styles.checkboxWrap}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someVisibleSelected;
                        }}
                        onChange={toggleSelectAllVisibleRows}
                        onKeyDown={handleCheckboxKeyDown}
                      />
                    </div>
                  </th>

                  <th style={{ ...styles.th, minWidth: "60px" }}>#</th>
                  <th style={{ ...styles.th, minWidth: "72px" }}>Sort</th>
                  <th style={{ ...styles.th, minWidth: "88px" }}>Color</th>

                  {gridColumns.map((col) => (
                    <th
                      key={col.id}
                      style={{ ...styles.th, minWidth: `${col.width}px` }}
                    >
                      {col.label}
                    </th>
                  ))}

                  <th style={{ ...styles.th, minWidth: "90px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} style={styles.loading}>
                      Loading payment sheet...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} style={styles.emptyState}>
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row, visibleIndex) => {
                    const rowId = getRowId(row);
                    const rowIdStr = String(rowId);
                    const rowChecked = isRowSelected(rowId);
                    const originalIndex = items.findIndex(
                      (item) => getRowId(item) === rowId
                    );
                    const rowBg = row?.rowColor
                      ? safeColor(row.rowColor, DEFAULT_COLOR)
                      : DEFAULT_COLOR;
                    const effectiveRowBg = rowChecked ? "#dbeafe" : rowBg;
                    const rowTextColor = getContrastTextColor(effectiveRowBg);

                    const utilityCellStyle = {
                      ...styles.td,
                      backgroundColor: effectiveRowBg,
                      color: rowTextColor,
                      boxShadow: rowChecked
                        ? "inset 0 0 0 1.5px #2563eb"
                        : "none",
                    };

                    return (
                      <tr key={rowId ?? visibleIndex}>
                        <td style={utilityCellStyle}>
                          <div style={styles.checkboxWrap}>
                            <input
                              type="checkbox"
                              style={styles.checkbox}
                              checked={rowChecked}
                              onChange={(e) =>
                                handleRowCheckboxChange(row, visibleIndex, e)
                              }
                              onKeyDown={(e) => handleCheckboxKeyDown(e, rowIdStr)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </td>

                        <td style={utilityCellStyle}>
                          <div style={{ ...styles.readCell, ...styles.numberCell }}>
                            {visibleIndex + 1}
                          </div>
                        </td>

                        <td style={utilityCellStyle}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: "48px",
                              gap: "4px",
                            }}
                          >
                            <button
                              onClick={() => moveRows("up", rowIdStr)}
                              disabled={originalIndex === 0}
                              style={{
                                ...styles.moveBtn,
                                opacity: originalIndex === 0 ? 0.35 : 1,
                              }}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveRows("down", rowIdStr)}
                              disabled={originalIndex === items.length - 1}
                              style={{
                                ...styles.moveBtn,
                                opacity: originalIndex === items.length - 1 ? 0.35 : 1,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>

                        <td style={utilityCellStyle}>
                          <div style={styles.readCell}>
                            {renderColorPaletteControl(row, "rowColor", `${rowIdStr}__rowColorQuick`)}
                          </div>
                        </td>

                        {gridColumns.map((col) => renderGridCell(row, visibleIndex, col))}

                        <td style={utilityCellStyle}>
                          <div style={styles.readCell}>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => deleteRow(row)}
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <PaymentSheetWithDate me={me} isActive={isActive} /> 
    </div>
  );
}
