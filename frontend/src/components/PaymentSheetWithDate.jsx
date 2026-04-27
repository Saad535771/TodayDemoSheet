import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";
import PaymentSheetHistoryPanel from "../pages/PaymentSheetHistoryPanel.jsx";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
const MAX_HISTORY = 100;
const RECENT_MUTATION_PAUSE_MS = 1200;
const SILENT_RELOAD_DEBOUNCE_MS = 800;
const PAGE_TOP_OFFSET = 78;
const FIXED_TOOLBAR_HEIGHT = 118;
const STICKY_TOP = -40;
const styles = {
  page: {
    minHeight: "100vh",
    padding: "0px",
    overflowX: "hidden",
    background: "#ffffff",
  },
  card: {
    padding: "0px",
    position: "relative",
  },
  headerRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "0px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 200,
    background: "#ffffff",
    padding: "0px 0 0px",
    boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111111",
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: "13px",
    color: "#444444",
    margin: 0,
    textAlign: 'center',
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  zoomControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  zoomBtn: {
    width: "32px",
    height: "auto",
    borderRadius: "10px",
    border: "1.5px solid #000000",
    background: "#ffffff",
    color: "#111111",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "18px",
    lineHeight: 1,
  },
  zoomValue: {
    minWidth: "72px",
    height: "42px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#111111",
    background: "#ffffff",
    boxSizing: "border-box",
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
  tableWrapper: {
    overflowX: "auto",
    overflowY: "auto",
    position: "relative",
    borderRadius: "12px",
    border: "2px solid #000000",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 0px)",
    background: "#ffffff",
  },
  tableZoomWrap: {
    transformOrigin: "top left",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
    background: "#ffffff",
  },
  th: {
    background: "#000000",
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
    borderBottom: "1.5px solid #000000",
    borderRight: "1.5px solid #000000",
    position: "sticky",
    top: 0,
    zIndex: 1200,
    whiteSpace: "nowrap",
    boxShadow: "0 3px 0 rgba(0,0,0,0.08)",
  },
  td: {
    borderBottom: "1.5px solid #000000",
    borderRight: "1.5px solid #000000",
    padding: "0px",
    textAlign: "center",
    background: "#fff",
  },

  input: {
    width: "22px",
    height: "12px",
    border: "none",
    outline: "none",
    fontSize: "12px",
    background: "transparent",
    boxSizing: "border-box",
    textAlign: "center",
    color: "inherit",
    fontWeight: "600",
  },
  select: {
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "12px",
    background: "transparent",
    boxSizing: "border-box",
    cursor: "pointer",
    textAlign: "left",
    color: "inherit",
    fontWeight: "600",
  },
  readCell: {

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: "cell",
    fontWeight: "600",
    color: "#111111",
  },
  deleteBtn: {
    background: "#b00101",
    color: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "8px",

    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  copyBtn: {
    background: "#ffffff",
    color: "#111111",
    border: "1.5px solid #000000",
    borderRadius: "8px",

    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  inlineAddBtn: {
    background: "#111111",
    color: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  historyBtn: {
    background: "#dcfce7",
    color: "#166534",
    border: "1.5px solid #166534",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "10px",

    minWidth: "42px",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    flexWrap: "wrap",
    Height: "auto",

  },
  moveBtn: {
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "14px",

    color: "#111111",
    fontWeight: "700",
  },
  checkbox: {
    width: "12px",
    height: "12px",
    cursor: "pointer",
    accentColor: "#107c41",
    margin: '0px',
  },
  colorSwatch: {
    width: "22px",
    height: "22px",
    border: "2px solid #111111",
    cursor: "pointer",
    borderRadius: "4px",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    backgroundClip: "padding-box",
  },
  pickerPopup: {
    position: "fixed",
    background: "white",
    border: "1.5px solid #000000",

    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
    zIndex: 3000,
    width: "220px",
  },
  emptyState: {

    textAlign: "center",
    color: "#444444",
    fontWeight: "700",
  },
  loading: {
    textAlign: "center",
    color: "#444444",
    fontWeight: "700",
  },
};
const statusOptions = [
  "Invoice Share",
  "Fee Receive",
  "Half Fee Receive",
  "Tuition Pending",
  "Tuition Cancelled",
];
function parseStatusValue(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
  }
  return [...new Set(
    String(value || "")
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}
function serializeStatusValue(value) {
  return parseStatusValue(value).join(", ");
}
function isSelectLikeColumn(col) {
  return col?.kind === "select" || col?.kind === "multiSelect";
}
function getRowId(row) {
  return row?.id ?? row?.paymentId ?? row?._id ?? row?.rowId;
}
function rowsAreSame(a = [], b = []) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i] || {};
    const right = b[i] || {};
    if (getRowId(left) !== getRowId(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      if (!Object.is(left[key], right[key])) return false;
    }
  }
  return true;
}
function cloneRow(row) {
  if (row === null || row === undefined) return row;
  return JSON.parse(JSON.stringify(row));
}
function cloneRows(rows = []) {
  return rows.map((row) => cloneRow(row));
}
function getDateGroupDay(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return Number.MAX_SAFE_INTEGER;
  const match = raw.match(/^(\d{1,2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const day = Number(match[1]);
  if (!Number.isFinite(day)) return Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.min(31, day));
}
function sortRowsByDateGroup(rows = []) {
  return cloneRows(rows).sort((a, b) => {
    const aDay = getDateGroupDay(a?.dateWithMonth);
    const bDay = getDateGroupDay(b?.dateWithMonth);
    if (aDay !== bDay) return aDay - bDay;
    const aOrder =
      typeof a?.orderIndex === "number" ? a.orderIndex : Number.MAX_SAFE_INTEGER;
    const bOrder =
      typeof b?.orderIndex === "number" ? b.orderIndex : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a?.tuitionName || "").localeCompare(String(b?.tuitionName || ""));
  });
}
function buildMergedPatchEntries(updates = []) {
  const merged = new Map();
  updates.forEach(({ row, patch }) => {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) return;
    if (!patch || typeof patch !== "object") return;
    const patchKeys = Object.keys(patch);
    if (!patchKeys.length) return;
    const existing = merged.get(String(rowId)) || {
      rowId,
      beforePatch: {},
      afterPatch: {},
    };
    patchKeys.forEach((key) => {
      existing.beforePatch[key] = row?.[key];
      existing.afterPatch[key] = patch[key];
    });
    merged.set(String(rowId), existing);
  });
  return [...merged.values()].filter((entry) =>
    Object.keys(entry.afterPatch).some(
      (key) => !Object.is(entry.beforePatch[key], entry.afterPatch[key])
    )
  );
}
function applyPatchEntriesToRows(rows = [], entries = [], patchKey = "afterPatch") {
  if (!entries.length) return rows;
  const patchMap = new Map(
    entries.map((entry) => [String(entry.rowId), entry[patchKey] || {}])
  );
  return rows.map((row) => {
    const patch = patchMap.get(String(getRowId(row)));
    return patch ? { ...row, ...patch } : row;
  });
}
function buildReorderPayload(rows = []) {
  return rows
    .map((row, index) => {
      const id = getRowId(row);
      if (id === undefined || id === null) return null;
      return {
        id,
        orderIndex:
          typeof row?.orderIndex === "number" ? row.orderIndex : index,
      };
    })
    .filter(Boolean);
}
function applyReorderPayloadToRows(rows = [], payload = []) {
  if (!payload.length) return rows;
  const orderMap = new Map(
    payload.map((item, index) => [
      String(item.id),
      typeof item?.orderIndex === "number" ? item.orderIndex : index,
    ])
  );
  return cloneRows(rows)
    .map((row, index) => ({
      ...row,
      orderIndex: orderMap.has(String(getRowId(row)))
        ? orderMap.get(String(getRowId(row)))
        : typeof row?.orderIndex === "number"
          ? row.orderIndex
          : index,
    }))
    .sort((a, b) => {
      const aOrder = typeof a?.orderIndex === "number" ? a.orderIndex : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b?.orderIndex === "number" ? b.orderIndex : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
}
function insertRowByOrder(rows = [], row) {
  const next = cloneRows(rows).filter(
    (item) => String(getRowId(item)) !== String(getRowId(row))
  );
  if (!row) return next;
  const targetOrder = typeof row?.orderIndex === "number" ? row.orderIndex : next.length;
  const insertAt = Math.max(0, Math.min(next.length, targetOrder));
  next.splice(insertAt, 0, cloneRow(row));
  return next;
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
  return isSelectLikeColumn(col) || col?.type === "date";
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
    if (col.kind === "multiSelect") {
      return;
    }
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch (err) {
      console.warn("showPicker not available:", err);
    }
    if (isSelectLikeColumn(col)) {
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
function getStatusStyle(status) {
  switch ((status || "").trim()) {
    case "Invoice Share":
      return {
        background: "#7c3aed",
        color: "#ffffff",
        border: "1px solid #6d28d9",
      };
    case "Fee Receive":
      return {
        background: "#166534",
        color: "#ffffff",
        border: "1px solid #14532d",
      };
    case "Half Fee Receive":
      return {
        background: "#b45309",
        color: "#ffffff",
        border: "1px solid #92400e",
      };
    case "Tuition Pending":
      return {
        background: "#0059be",
        color: "#ffffff",
        border: "1px solid #08649d",
      };
    case "Tuition Cancelled":
      return {
        background: "#c50101",
        color: "#ffffff",
        border: "1px solid #c83200",
      };
    default:
      return {
        background: "#0f172a",
        color: "#ffffff",
        border: "1px solid #1e293b",
      };
  }
}
function StatusPill({ value }) {
  const statuses = parseStatusValue(value);
  if (!statuses.length) {
    return (
      <span
        style={{
          background: "#475569",
          color: "#ffffff",
          border: "1px solid #334155",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "700",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        --
      </span>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        flexWrap: "wrap",
      }}
    >
      {statuses.map((status) => {
        const style = getStatusStyle(status);
        return (
          <span
            key={status}
            style={{
              ...style,
              padding: "3px 6px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "700",

              whiteSpace: "nowrap",
            }}
          >
            {status}
          </span>
        );
      })}
    </div>
  );
}

function highlightText(text, term) {
  const value = text === null || text === undefined ? "" : String(text);
  const q = String(term || "").trim();

  if (!q) return value;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = value.split(regex);
  const normalizedQ = q.toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQ ? (
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
    )
  );
}

const getCellKey = (rowIndex, colId) => `${rowIndex}__${colId}`;

const parseCellKey = (key) => {
  const [rowIndex, ...rest] = key.split("__");
  return { rowIndex: Number(rowIndex), colId: rest.join("__") };
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
    "#4caf50",
    "#2196f3",
    "#9c27b0",
    "#f44336",
    "#ff5722",
    "#ffc107",
    "#8bc34a",
    "#03a9f4",
    "#673ab7",
  ];

  const isOpen = activeColorPicker?.id === pickerId;
  const popupPos = isOpen
    ? { top: activeColorPicker.top, left: activeColorPicker.left }
    : { top: 0, left: 0 };

  const openPopup = () => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();

    if (isOpen) {
      onClose();
      return;
    }

    onOpen({
      id: pickerId,
      top: Math.min(window.innerHeight - 260, rect.bottom + 8),
      left: Math.min(window.innerWidth - 240, rect.left),
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
        role="button"
        tabIndex={0}
        aria-label="Change color"
        onClick={openPopup}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPopup();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        style={{ ...styles.colorSwatch, backgroundColor: color }}
        title="Change color"
      />

      {isOpen && (
        <div
          style={{
            ...styles.pickerPopup,
            top: popupPos.top,
            left: popupPos.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{

              fontSize: "13px",
              fontWeight: "700",
              color: "#111111",
            }}
          >
            Default Colors
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 28px)",
              gap: "6px",

            }}
          >
            {presets.map((c, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onChange(c);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(c);
                    onClose();
                  }
                }}
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: c,
                  border: "1px solid #111111",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          <div style={{ borderTop: "1px solid #d1d5db", paddingTop: "8px" }}>
            <div style={{ fontSize: "13px", marginBottom: "4px", fontWeight: "700" }}>
              Custom Color
            </div>
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

function parseJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch (err) {
    console.error("JWT parse failed:", err);
    return null;
  }
}

function resolveCurrentUserRole(me) {
  try {
    const meRole = String(me?.role || me?.user?.role || "").trim().toLowerCase();
    if (meRole) return meRole;

    const storedUserRaw = localStorage.getItem("user");
    if (storedUserRaw) {
      const storedUser = JSON.parse(storedUserRaw);
      const storedUserRole = String(
        storedUser?.role || storedUser?.user?.role || ""
      )
        .trim()
        .toLowerCase();

      if (storedUserRole) return storedUserRole;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("tp_token") ||
      "";

    const payload = parseJwtPayload(token);
    const tokenRole = String(payload?.role || "").trim().toLowerCase();
    if (tokenRole) return tokenRole;

    return "";
  } catch (err) {
    console.error("Role resolve failed:", err);
    return "";
  }
}
export default function PaymentSheetWithDate({ me, isActive = true, onCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  const [selectedCell, setSelectedCell] = useState(null);
  const [anchorCell, setAnchorCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [historyMeta, setHistoryMeta] = useState({ canUndo: false, canRedo: false });
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const [headerMetrics, setHeaderMetrics] = useState({
    height: 0,
    left: 0,
    width: 0,
  });
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditRow, setAuditRow] = useState(null);
  const mountedRef = useRef(true);
  const itemsRef = useRef([]);
  const filteredItemsRef = useRef([]);
  const tableWrapperRef = useRef(null);
  const cardRef = useRef(null);
  const headerRowRef = useRef(null);
  const inputRef = useRef(null);
  const editingCellRef = useRef(editingCell);
  const editValueRef = useRef(editValue);
  const shouldSelectAllOnFocusRef = useRef(true);
  const moveCaretToEndOnFocusRef = useRef(false);
  const isMouseSelectingRef = useRef(false);
  const dragAnchorCellRef = useRef(null);
  const localClipboardRef = useRef("");
  const historyUndoRef = useRef([]);
  const historyRedoRef = useRef([]);
  const mutationInFlightRef = useRef(false);
  const isApplyingHistoryRef = useRef(false);
  const skipNextPollUntilRef = useRef(0);
  const silentReloadTimerRef = useRef(null);

  const currentRole = resolveCurrentUserRole(me);
  const canSeeAuditTrail = currentRole === "admin";
  const zoomPercent = `${Math.round(zoomLevel * 100)}%`;

  const changeZoom = (direction) => {
    setZoomLevel((prev) => {
      const next =
        direction === "in" ? prev + ZOOM_STEP : direction === "out" ? prev - ZOOM_STEP : prev;
      return Number(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)).toFixed(2));
    });
  };

  const gridColumns = useMemo(() => {
    const cols = [
      {
        id: "dateWithMonth",
        label: "Date",
        field: "dateWithMonth",
        editable: true,
        width: 60,
        align: "center",
      },
      {
        id: "tuitionName",
        label: "Tuition Name",
        field: "tuitionName",
        editable: true,
        width: 40,
        align: "center",
        // kind: "tuitionName",
      },
      {
        id: "totalStudents",
        label: "Total Students",
        field: "totalStudents",
        editable: true,
        width: 20,
        type: "number",
        align: "center",
      },
      {
        id: "country",
        label: "Country",
        field: "country",
        editable: true,
        width: 30,
        align: "center",
      },
      {
        id: "subjects",
        label: "Subjects",
        field: "subjects",
        editable: true,
        width: 60,
        align: "center",
      },
      {
        id: "tutorName",
        label: "Tutor Name",
        field: "tutorName",
        editable: true,
        width: 120,
        align: "center",
      },
    ];

    cols.push(
      {
        id: "tutorFee",
        label: "Tutor Fee",
        field: "tutorFee",
        editable: true,
        width: 35,
        type: "number",
        align: "center",
      },
      {
        id: "lacasShare",
        label: "Lacas Share",
        field: "lacasShare",
        editable: true,
        width: 35,
        type: "number",
        align: "center",
      },
      {
        id: "totalFees",
        label: "Total Fee",
        field: "totalFees",
        editable: true,
        width: 35,
        type: "number",
        align: "center",
      }
    );

    cols.push(
      {
        id: "status",
        label: "Status",
        field: "status",
        editable: true,
        width: 40,
        kind: "multiSelect",
        options: statusOptions,
        align: "center",
      },
      {
        id: "feedback",
        label: "Feedback",
        field: "feedback",
        editable: true,
        width: 120,
        align: "center",
      },
      {
        id: "otmName",
        label: "OTM Name",
        field: "otmName",
        editable: true,
        width: 70,
        align: "center",
      },
      {
        id: "notes",
        label: "Notes",
        field: "notes",
        editable: true,
        width: 40,
        align: "center",
      }
    );

    return cols;
  }, []);

  const gridColumnIds = useMemo(() => gridColumns.map((c) => c.id), [gridColumns]);

  const gridColumnMap = useMemo(
    () => Object.fromEntries(gridColumns.map((c) => [c.id, c])),
    [gridColumns]
  );

  const firstEditableColumnId = gridColumns[0]?.id || "tuitionId";
  const visibleColumnCount = gridColumns.length + 6;

  useEffect(() => {
    mountedRef.current = true;
    if (isActive) {
      loadRows({ initial: true });
    }

    return () => {
      mountedRef.current = false;
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
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => () => {
    if (silentReloadTimerRef.current) {
      window.clearTimeout(silentReloadTimerRef.current);
      silentReloadTimerRef.current = null;
    }
  }, []);

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
    const updateStickyHeader = () => {
      const cardEl = cardRef.current;
      const headerEl = headerRowRef.current;
      if (!cardEl || !headerEl) return;
      const cardRect = cardEl.getBoundingClientRect();
      const headerHeight = headerEl.offsetHeight || 0;
      const shouldPin =
        cardRect.top <= STICKY_TOP &&
        cardRect.bottom > STICKY_TOP + headerHeight + 8;
      setIsHeaderPinned(shouldPin);
      setHeaderMetrics({
        height: headerHeight,
        left: Math.max(cardRect.left, 0),
        width: Math.max(cardRect.width, 0),
      });
    };

    updateStickyHeader();
    window.addEventListener("scroll", updateStickyHeader, { passive: true });
    window.addEventListener("resize", updateStickyHeader);
    return () => {
      window.removeEventListener("scroll", updateStickyHeader);
      window.removeEventListener("resize", updateStickyHeader);
    };
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


  const openAuditPanel = () => {
    if (!canSeeAuditTrail) return;
    setAuditRow(null);
    setAuditOpen(true);
  };

  const syncHistoryMeta = () => {
    setHistoryMeta({
      canUndo: historyUndoRef.current.length > 0,
      canRedo: historyRedoRef.current.length > 0,
    });
  };

  const rememberHistoryEntry = (entry) => {
    historyUndoRef.current.push(entry);
    if (historyUndoRef.current.length > MAX_HISTORY) {
      historyUndoRef.current.shift();
    }
    historyRedoRef.current = [];
    syncHistoryMeta();
  };

  const markMutationSettled = () => {
    skipNextPollUntilRef.current = Date.now() + RECENT_MUTATION_PAUSE_MS;
  };

  const setItemsImmediate = (nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  const queueSilentReload = (delay = SILENT_RELOAD_DEBOUNCE_MS) => {
    if (silentReloadTimerRef.current) {
      window.clearTimeout(silentReloadTimerRef.current);
    }

    silentReloadTimerRef.current = window.setTimeout(() => {
      silentReloadTimerRef.current = null;
      void loadRows({ silent: true });
    }, delay);
  };

  const syncRowsWithServer = (rows = []) => {
    if (!mountedRef.current) return;
    if (!rowsAreSame(itemsRef.current, rows)) {
      setItemsImmediate(rows);
    }
  };

  const applyUpdateEntries = async (updates, { historyLabel = "Edit", recordHistory = true } = {}) => {
    const updatesWithAutoTotal = updates.map(({ row, patch }) => ({
      row,
      patch: withAutoTotalFee(row, patch),
    }));

    const normalized = buildMergedPatchEntries(updatesWithAutoTotal);
    if (!normalized.length) return false;

    const previousItems = cloneRows(itemsRef.current);
    const nextItems = applyPatchEntriesToRows(previousItems, normalized, "afterPatch");

    setItemsImmediate(nextItems);
    mutationInFlightRef.current = true;

    try {
      await Promise.all(
        normalized.map((entry) =>
          api.patch(`/payments-clone/${encodeURIComponent(entry.rowId)}`, entry.afterPatch)
        )
      );

      if (recordHistory) {
        rememberHistoryEntry({
          type: "updateMany",
          label: historyLabel,
          updates: normalized.map((entry) => ({
            rowId: entry.rowId,
            beforePatch: cloneRow(entry.beforePatch),
            afterPatch: cloneRow(entry.afterPatch),
          })),
        });
      }

      markMutationSettled();
      queueSilentReload();
      return true;
    } catch (err) {
      setItemsImmediate(previousItems);
      throw err;
    } finally {
      mutationInFlightRef.current = false;
    }
  };

  const applyReorderChange = async (nextRows, historyLabel = "Reorder Rows") => {
    const beforeOrder = buildReorderPayload(itemsRef.current);
    const afterOrder = buildReorderPayload(nextRows);

    if (!afterOrder.length) return false;
    if (JSON.stringify(beforeOrder) === JSON.stringify(afterOrder)) return false;

    const previousItems = cloneRows(itemsRef.current);
    setItemsImmediate(cloneRows(nextRows));
    mutationInFlightRef.current = true;

    try {
      await api.post("/payments-clone/reorder", { items: afterOrder });
      rememberHistoryEntry({
        type: "reorder",
        label: historyLabel,
        beforeOrder: cloneRow(beforeOrder),
        afterOrder: cloneRow(afterOrder),
      });
      markMutationSettled();
      queueSilentReload();
      return true;
    } catch (err) {
      setItemsImmediate(previousItems);
      throw err;
    } finally {
      mutationInFlightRef.current = false;
    }
  };

  const undoLastAction = async () => {
    if (!historyUndoRef.current.length || mutationInFlightRef.current) return;

    const entry = historyUndoRef.current.pop();
    syncHistoryMeta();

    const previousItems = cloneRows(itemsRef.current);
    mutationInFlightRef.current = true;
    isApplyingHistoryRef.current = true;

    try {
      if (entry.type === "updateMany") {
        const undoEntries = entry.updates.map((item) => ({
          rowId: item.rowId,
          beforePatch: cloneRow(item.beforePatch),
          afterPatch: cloneRow(item.beforePatch),
        }));

        setItemsImmediate(applyPatchEntriesToRows(previousItems, undoEntries, "afterPatch"));

        await Promise.all(
          entry.updates.map((item) =>
            api.patch(`/payments-clone/${encodeURIComponent(item.rowId)}`, item.beforePatch)
          )
        );
      } else if (entry.type === "reorder") {
        setItemsImmediate(applyReorderPayloadToRows(previousItems, entry.beforeOrder));
        await api.post("/payments-clone/reorder", { items: entry.beforeOrder });
      } else if (entry.type === "deleteRow") {
        setItemsImmediate(insertRowByOrder(previousItems, entry.row));
        const res = await api.post("/payments-clone", entry.row);
        entry.row = cloneRow(res.data?.item || res.data || entry.row);
      } else if (entry.type === "addRow") {
        const currentRowId = getRowId(entry.row);
        setItemsImmediate(
          previousItems.filter((item) => String(getRowId(item)) !== String(currentRowId))
        );
        await api.delete(`/payments-clone/${encodeURIComponent(currentRowId)}`);
      }

      historyRedoRef.current.push(entry);
      markMutationSettled();
      queueSilentReload();
    } catch (err) {
      setItemsImmediate(previousItems);
      historyUndoRef.current.push(entry);
      alert(err?.response?.data?.message || "Undo failed.");
      console.error("Undo failed:", err);
    } finally {
      mutationInFlightRef.current = false;
      isApplyingHistoryRef.current = false;
      syncHistoryMeta();
    }
  };

  const redoLastAction = async () => {
    if (!historyRedoRef.current.length || mutationInFlightRef.current) return;

    const entry = historyRedoRef.current.pop();
    syncHistoryMeta();

    const previousItems = cloneRows(itemsRef.current);
    mutationInFlightRef.current = true;
    isApplyingHistoryRef.current = true;

    try {
      if (entry.type === "updateMany") {
        const redoEntries = entry.updates.map((item) => ({
          rowId: item.rowId,
          beforePatch: cloneRow(item.afterPatch),
          afterPatch: cloneRow(item.afterPatch),
        }));
        setItemsImmediate(applyPatchEntriesToRows(previousItems, redoEntries, "afterPatch"));
        await Promise.all(
          entry.updates.map((item) =>
            api.patch(`/payments-clone/${encodeURIComponent(item.rowId)}`, item.afterPatch)
          )
        );
      } else if (entry.type === "reorder") {
        setItemsImmediate(applyReorderPayloadToRows(previousItems, entry.afterOrder));
        await api.post("/payments-clone/reorder", { items: entry.afterOrder });
      } else if (entry.type === "deleteRow") {
        const currentRowId = getRowId(entry.row);
        setItemsImmediate(
          previousItems.filter((item) => String(getRowId(item)) !== String(currentRowId))
        );
        await api.delete(`/payments-clone/${encodeURIComponent(currentRowId)}`);
      } else if (entry.type === "addRow") {
        setItemsImmediate(insertRowByOrder(previousItems, entry.row));
        const res = await api.post("/payments-clone", entry.row);
        entry.row = cloneRow(res.data?.item || res.data || entry.row);
      }
      historyUndoRef.current.push(entry);
      markMutationSettled();
      queueSilentReload();
    } catch (err) {
      setItemsImmediate(previousItems);
      historyRedoRef.current.push(entry);
      alert(err?.response?.data?.message || "Redo failed.");
      console.error("Redo failed:", err);
    } finally {
      mutationInFlightRef.current = false;
      isApplyingHistoryRef.current = false;
      syncHistoryMeta();
    }
  };
  useEffect(() => {
    const handleUndoRedoShortcuts = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const activeEl = document.activeElement;
      const activeTag = String(activeEl?.tagName || "").toLowerCase();
      if (editingCellRef.current) return;
      if (isTextLikeSelectionInput(activeEl)) return;
      if (activeTag === "textarea" || activeTag === "select") return;
      const key = String(e.key || "").toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        void undoLastAction();
        return;
      }
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        void redoLastAction();
      }
    };
    document.addEventListener("keydown", handleUndoRedoShortcuts);
    return () => document.removeEventListener("keydown", handleUndoRedoShortcuts);
  }, []);
  async function loadRows({ initial = false, silent = false } = {}) {
    try {
      if (initial) setLoading(true);
      const res = await api.get("/payments-clone");
      const rows = Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data)
          ? res.data
          : [];
      if (!mountedRef.current) return;
      syncRowsWithServer(rows);
    } catch (err) {
      console.error("Failed to load payment sheet rows:", err);
      if (!silent && mountedRef.current && initial) {
        setItems([]);
      }
    } finally {
      if (mountedRef.current && initial) setLoading(false);
    }
  }
  async function addRow(referenceRow = null) {
    try {
      setAdding(true);
      mutationInFlightRef.current = true;

      const nextOrderIndex =
        itemsRef.current.reduce((max, item, index) => {
          const currentOrder =
            typeof item?.orderIndex === "number" ? item.orderIndex : index;
          return Math.max(max, currentOrder);
        }, -1) + 1;

      const inheritedDateText = String(
        referenceRow?.dateWithMonth || referenceRow?.date || referenceRow?.paymentDate || ""
      ).trim();

      const newRow = {
        tuitionId: `manual-${Date.now()}`,
        paymentDate: "",
        date: "",
        dateWithMonth: inheritedDateText,
        tuitionName: "",
        totalStudents: "",
        country: "",
        subjects: "",
        className: "",
        tutorName: "",
        tutorFee: "",
        lacasShare: "",
        totalFees: "",
        status: "",
        feedback: "",
        notes: "",
        syncFlag: "",
        assignedStaffId: null,
        isDeleted: false,
        deletedFromTodayDemo: false,
        assignedTo: "",
        orderIndex: nextOrderIndex,
        rowColor: referenceRow?.rowColor || "",
        tuitionNameColor: "",
      };

      const res = await api.post("/payments-clone", newRow);
      const created = res.data?.item || res.data;

      if (created && getRowId(created) !== undefined && getRowId(created) !== null) {
        const createdRow = {
          ...created,
          orderIndex:
            typeof created?.orderIndex === "number"
              ? created.orderIndex
              : nextOrderIndex,
        };
        let nextItems = [...itemsRef.current, createdRow];
        if (referenceRow) {
          const referenceId = getRowId(referenceRow);
          const referenceIndex = itemsRef.current.findIndex(
            (item) => String(getRowId(item)) === String(referenceId));
          if (referenceIndex >= 0) {
            nextItems = cloneRows(itemsRef.current);
            nextItems.splice(referenceIndex + 1, 0, createdRow);
            nextItems = nextItems.map((item, idx) => ({
              ...item,
              orderIndex: idx,
            }));
            setItemsImmediate(nextItems);
            await api.post(`/payments-clone/reorder`, { items: buildReorderPayload(nextItems) });
          } else {
            setItemsImmediate(nextItems);
          }
        } else {
          setItemsImmediate(nextItems);
        }
        rememberHistoryEntry({
          type: "addRow",
          label: referenceRow ? "Add Row After" : "Add Row",
          row: cloneRow(createdRow),
        });
        markMutationSettled();
        queueSilentReload();
      } else {
        queueSilentReload();
      }
    } catch (err) {
      console.error("Failed to add row:", err);
      alert(err?.response?.data?.message || "Failed to create a new row.");
    } finally {
      mutationInFlightRef.current = false;
      setAdding(false);
    }
  }
  async function updateRowFields(row, patchFields, options = {}) {
    try {
      await applyUpdateEntries([{ row, patch: patchFields }], {
        historyLabel: options.historyLabel || "Edit Cell",
        recordHistory: options.recordHistory !== false,
      });
    } catch (err) {
      console.error("Failed to update row:", err);
      alert(err?.response?.data?.message || "Failed to update the row.");
    }
  }
  async function updateRow(row, field, newValue, options = {}) {
    await updateRowFields(row, { [field]: newValue }, options);
  }
  async function moveRow(index, direction) {
    if (index < 0) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;
    const newItems = cloneRows(itemsRef.current);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    const normalized = newItems.map((item, idx) => ({
      ...item,
      orderIndex: idx,
    }));

    try {
      await applyReorderChange(normalized, `Move Row ${direction === "up" ? "Up" : "Down"}`);
    } catch (err) {
      console.error("Failed to reorder rows:", err);
      alert(err?.response?.data?.message || "Failed to save row order.");
      await loadRows({ silent: true });
    }
  }

  async function moveSelectedRows(direction) {
    if (!selectedRowIds.size) return;

    const selectedSet = new Set(
      [...selectedRowIds].filter((id) => id !== undefined && id !== null)
    );
    if (!selectedSet.size) return;

    const newItems = cloneRows(itemsRef.current);

    if (direction === "up") {
      for (let i = 1; i < newItems.length; i += 1) {
        const currentId = getRowId(newItems[i]);
        const prevId = getRowId(newItems[i - 1]);

        if (selectedSet.has(currentId) && !selectedSet.has(prevId)) {
          [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
        }
      }
    } else {
      for (let i = newItems.length - 2; i >= 0; i -= 1) {
        const currentId = getRowId(newItems[i]);
        const nextId = getRowId(newItems[i + 1]);

        if (selectedSet.has(currentId) && !selectedSet.has(nextId)) {
          [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
        }
      }
    }

    const normalized = newItems.map((item, idx) => ({
      ...item,
      orderIndex: idx,
    }));

    try {
      await applyReorderChange(
        normalized,
        `Move Selected Rows ${direction === "up" ? "Up" : "Down"}`
      );
    } catch (err) {
      console.error("Failed to move selected rows:", err);
      alert(err?.response?.data?.message || "Failed to save selected row order.");
      await loadRows({ silent: true });
    }
  }

  async function deleteRow(row) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID is missing.");
      return;
    }



    const previousItems = cloneRows(itemsRef.current);
    setItemsImmediate(
      previousItems.filter((item) => String(getRowId(item)) !== String(rowId))
    );
    mutationInFlightRef.current = true;
    try {
      await api.delete(`/payments-clone/${encodeURIComponent(rowId)}`);
      rememberHistoryEntry({
        type: "deleteRow",
        label: "Delete Row",
        row: cloneRow(row),
      });
      markMutationSettled();
      queueSilentReload();
    } catch (err) {
      console.error("Failed to delete row:", err);
      setItemsImmediate(previousItems);
      alert(err?.response?.data?.message || "Failed to delete the row.");
    } finally {
      mutationInFlightRef.current = false;
    }
  }
  // cloneRows ke baad yeh helpers add kar do

  function parseFeeInput(value) {
    if (value === null || value === undefined) return null;

    const cleaned = String(value).replace(/,/g, "").trim();
    if (cleaned === "") return null;

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  function calculateAutoTotalFees(tutorFee, lacasShare) {
    const tutor = parseFeeInput(tutorFee);
    const lacas = parseFeeInput(lacasShare);

    if (tutor === null && lacas === null) return "";
    return String((tutor ?? 0) + (lacas ?? 0));
  }

  function withAutoTotalFee(row, patch = {}) {
    const hasTutorFee = Object.prototype.hasOwnProperty.call(patch, "tutorFee");
    const hasLacasShare = Object.prototype.hasOwnProperty.call(patch, "lacasShare");

    if (!hasTutorFee && !hasLacasShare) return patch;

    const nextTutorFee = hasTutorFee ? patch.tutorFee : row?.tutorFee;
    const nextLacasShare = hasLacasShare ? patch.lacasShare : row?.lacasShare;

    return {
      ...patch,
      totalFees: calculateAutoTotalFees(nextTutorFee, nextLacasShare),
    };
  }
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const baseRows = !q
      ? items
      : items.filter((item) => {
        const haystack = [
          item.tuitionId,
          item.dateWithMonth,
          item.date,
          item.paymentDate,
          item.tuitionName,
          item.totalStudents,
          item.country,
          item.subjects,
          item.className,
          item.tutorName,
          item.tutorFee,
          item.lacasShare,
          item.totalFees,
          item.status,
          item.otmName,
          item.feedback,
          item.notes,
        ]
          .map((v) => String(v ?? "").toLowerCase())
          .join(" ");

        return haystack.includes(q);
      });

    return sortRowsByDateGroup(baseRows);
  }, [items, search]);

  const itemIndexMap = useMemo(() => {
    const next = new Map();

    items.forEach((item, index) => {
      const rowId = getRowId(item);
      if (rowId !== undefined && rowId !== null) {
        next.set(String(rowId), index);
      }
    });

    return next;
  }, [items]);

  const visibleRowIds = useMemo(
    () =>
      filteredItems
        .map((row) => getRowId(row))
        .filter((id) => id !== undefined && id !== null),
    [filteredItems]
  );

  const allVisibleRowsSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((id) => selectedRowIds.has(id));

  const someVisibleRowsSelected =
    visibleRowIds.some((id) => selectedRowIds.has(id)) && !allVisibleRowsSelected;

  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    const currentIds = new Set(items.map((item) => getRowId(item)).filter((id) => id !== undefined && id !== null));
    setSelectedRowIds((prev) => {
      const next = new Set([...prev].filter((id) => currentIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedCell(null);
      setAnchorCell(null);
      setSelectedCells(new Set());
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

  const selectEntireRow = (rowIndex, shouldFocus = true) => {
    if (rowIndex < 0 || !gridColumnIds.length) return;

    const firstColId = gridColumnIds[0];
    const lastColId = gridColumnIds[gridColumnIds.length - 1];

    const start = { rowIndex, colId: firstColId };
    const end = { rowIndex, colId: lastColId };

    setSelectedCell(start);
    setAnchorCell(start);
    setSelectedCells(getRangeCells(start, end));

    if (shouldFocus) {
      focusCell(rowIndex, firstColId);
    }
  };

  const getSelectionBounds = () => {
    if (selectedCells.size > 0) {
      const parsed = [...selectedCells].map(parseCellKey);
      const rowIndexes = parsed.map((x) => x.rowIndex).filter((x) => x >= 0);
      const colIndexes = parsed
        .map((x) => getColumnIndex(x.colId))
        .filter((x) => x >= 0);

      if (!rowIndexes.length || !colIndexes.length) return null;

      return {
        minRow: Math.min(...rowIndexes),
        maxRow: Math.max(...rowIndexes),
        minCol: Math.min(...colIndexes),
        maxCol: Math.max(...colIndexes),
      };
    }

    if (selectedCell) {
      const colIndex = getColumnIndex(selectedCell.colId);
      if (colIndex < 0) return null;

      return {
        minRow: selectedCell.rowIndex,
        maxRow: selectedCell.rowIndex,
        minCol: colIndex,
        maxCol: colIndex,
      };
    }

    return null;
  };

  const getCellValue = (row, col) => {
    if (!row || !col) return "";
    return row[col.field] ?? "";
  };

  const buildPatchForColumn = (colId, value) => {
    const col = gridColumnMap[colId];
    if (!col?.field) return {};
    return { [col.field]: value };
  };

  const getSelectedTextForClipboard = () => {
    const bounds = getSelectionBounds();
    if (!bounds) return "";

    const lines = [];

    for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
      const row = filteredItemsRef.current[r];
      if (!row) continue;

      const cells = [];

      for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
        const colId = gridColumnIds[c];
        const col = gridColumnMap[colId];
        if (!col) {
          cells.push("");
          continue;
        }

        const key = getCellKey(r, colId);
        const isIncluded = selectedCells.size <= 1 ? true : selectedCells.has(key);
        const value = isIncluded ? String(getCellValue(row, col) ?? "") : "";
        cells.push(value);
      }

      lines.push(cells.join("\t"));
    }

    return lines.join("\n");
  };

  const getRowTextForClipboard = (row) => {
    if (!row) return "";
    return gridColumns.map((col) => String(getCellValue(row, col) ?? "")).join("\t");
  };

  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    localClipboardRef.current = text;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch (err) {
      console.error("Copy failed:", err);
      return true;
    }
  };

  const copySelectedCellsToClipboard = async () => {
    const text = getSelectedTextForClipboard();
    return copyTextToClipboard(text);
  };

  const copyRowToClipboard = async (row, rowIndex) => {
    if (typeof rowIndex === "number") {
      selectEntireRow(rowIndex, false);
    }

    const text = getRowTextForClipboard(row);
    const copied = await copyTextToClipboard(text);

    if (!copied) {
      alert("Failed to copy row data.");
    }
  };

  const parseClipboardText = (text) => {
    const cleaned = String(text || "").replace(/\r/g, "");
    const rows = cleaned.split("\n");

    if (rows.length && rows[rows.length - 1] === "") {
      rows.pop();
    }

    return rows.map((line) => line.split("\t"));
  };

  const pasteClipboardIntoSelection = async () => {
    if (!selectedCell) return;

    let clipboardText = "";

    try {
      if (navigator?.clipboard?.readText) {
        clipboardText = await navigator.clipboard.readText();
      }
    } catch (err) {
      console.error("Clipboard read failed, using local clipboard fallback:", err);
    }

    if (!clipboardText) {
      clipboardText = localClipboardRef.current || "";
    }

    if (!clipboardText) {
      alert("Nothing to paste.");
      return;
    }

    try {
      const matrix = parseClipboardText(clipboardText);
      if (!matrix.length) return;

      const startRow = selectedCell.rowIndex;
      const startCol = getColumnIndex(selectedCell.colId);
      if (startCol < 0) return;

      const updatesById = new Map();
      let maxWidth = 0;

      for (let r = 0; r < matrix.length; r++) {
        const targetRowIndex = startRow + r;
        const targetRow = filteredItemsRef.current[targetRowIndex];
        if (!targetRow) break;

        maxWidth = Math.max(maxWidth, matrix[r].length);

        for (let c = 0; c < matrix[r].length; c++) {
          const targetColIndex = startCol + c;
          if (targetColIndex >= gridColumnIds.length) break;

          const targetColId = gridColumnIds[targetColIndex];
          const col = gridColumnMap[targetColId];
          if (!col?.editable) continue;

          let nextValue = matrix[r][c] ?? "";

          if (isSelectLikeColumn(col)) {
            nextValue = nextValue.trim();
            if (!statusOptions.includes(nextValue)) continue;
          }

          const rowId = getRowId(targetRow);
          if (rowId === undefined || rowId === null) continue;

          const prev = updatesById.get(rowId) || { row: targetRow, patch: {} };
          prev.patch[col.field] = nextValue;
          updatesById.set(rowId, prev);
        }
      }

      if (!updatesById.size) return;

      await applyUpdateEntries(
        [...updatesById.values()].map((entry) => ({
          row: entry.row,
          patch: entry.patch,
        })),
        { historyLabel: "Paste Cells" }
      );

      const endRow = Math.min(
        filteredItemsRef.current.length - 1,
        startRow + matrix.length - 1
      );
      const endColIndex = Math.min(
        gridColumnIds.length - 1,
        startCol + Math.max(maxWidth, 1) - 1
      );

      const startCellObj = { rowIndex: startRow, colId: gridColumnIds[startCol] };
      const endCellObj = { rowIndex: endRow, colId: gridColumnIds[endColIndex] };

      setSelectedCell(startCellObj);
      setAnchorCell(startCellObj);
      setSelectedCells(getRangeCells(startCellObj, endCellObj));
      focusCell(startRow, gridColumnIds[startCol]);
    } catch (err) {
      console.error("Paste failed:", err);
      alert(err?.response?.data?.message || "Failed to paste clipboard data.");
      await loadRows({ silent: true });
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

  const startEditingCell = (rowIndex, colId, forcedValue = null, options = {}) => {
    const col = gridColumnMap[colId];
    const row = filteredItemsRef.current[rowIndex];

    if (!col?.editable || !row) return;

    const currentVal = getCellValue(row, col);
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

    const oldValue = String(getCellValue(row, col) ?? "");

    if (newValue !== oldValue) {
      const patch = buildPatchForColumn(colId, newValue);
      if (Object.keys(patch).length > 0) {
        await updateRowFields(row, patch);
      }
    }

    if (focusTarget) {
      focusCell(focusTarget.rowIndex, focusTarget.colId);
    }
  };

  const clearSelectedCells = async () => {
    if (!selectedCells.size) return;

    const updatesById = new Map();

    selectedCells.forEach((key) => {
      const { rowIndex, colId } = parseCellKey(key);
      const col = gridColumnMap[colId];
      const row = filteredItemsRef.current[rowIndex];

      if (!row || !col?.editable) return;

      const patch = buildPatchForColumn(colId, "");
      if (!Object.keys(patch).length) return;

      const rowId = getRowId(row);
      if (rowId === undefined || rowId === null) return;

      const prevPatch = updatesById.get(rowId)?.patch || {};
      updatesById.set(rowId, { row, patch: { ...prevPatch, ...patch } });
    });

    if (!updatesById.size) return;

    clearEditingState();

    try {
      await applyUpdateEntries(
        [...updatesById.values()].map((entry) => ({
          row: entry.row,
          patch: entry.patch,
        })),
        { historyLabel: "Clear Cells" }
      );
    } catch (err) {
      console.error("Failed to clear selected cells:", err);
      alert(err?.response?.data?.message || "Failed to clear selected cells.");
    }
  };

  const cutSelectedCellsToClipboard = async () => {
    const copied = await copySelectedCellsToClipboard();
    if (!copied) {
      alert("Failed to cut selected cells.");
      return;
    }
    await clearSelectedCells();
  };

  const moveSelection = (rowDelta, colDelta, extendRange = false) => {
    if (!filteredItems.length) return;

    const baseCell = selectedCell || { rowIndex: 0, colId: firstEditableColumnId };

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

    const root = tableWrapperRef.current;
    const target = root?.querySelector(
      `[data-grid-row="${rowIndex}"][data-grid-col="${colId}"]`
    );

    if (target) {
      try {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      } catch (err) {
        console.warn("scrollIntoView failed:", err);
      }
    }
  };

  const handleCellKeyDown = (e, rowIndex, colId) => {
    const col = gridColumnMap[colId];
    if (!col) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      e.preventDefault();
      void copySelectedCellsToClipboard();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      e.preventDefault();
      void pasteClipboardIntoSelection();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
      e.preventDefault();
      void cutSelectedCellsToClipboard();
      return;
    }

    if (e.shiftKey && e.code === "Space") {
      e.preventDefault();
      selectEntireRow(rowIndex, true);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      const all = new Set();
      for (let r = 0; r < filteredItems.length; r++) {
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
      void clearSelectedCells();
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

  const toggleRowSelection = (rowId, checked) => {
    if (rowId === undefined || rowId === null) return;
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const toggleAllVisibleRows = (checked) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      visibleRowIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleEditInputKeyDown = (e, rowIndex, colId, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = Math.min(rowIndex + 1, filteredItems.length - 1);
      void commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.max(
        0,
        Math.min(gridColumns.length - 1, currentColIndex + (e.shiftKey ? -1 : 1))
      );
      const nextColId = gridColumnIds[nextColIndex];
      void commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (!isSelectLikeColumn(col) && e.key === "ArrowUp") {
      e.preventDefault();
      const nextRow = Math.max(0, rowIndex - 1);
      void commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }
    if (!isSelectLikeColumn(col) && e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = Math.min(filteredItems.length - 1, rowIndex + 1);
      void commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }
    if (!isSelectLikeColumn(col) && e.key === "ArrowLeft") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.max(0, currentColIndex - 1);
      const nextColId = gridColumnIds[nextColIndex];
      void commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }
    if (!isSelectLikeColumn(col) && e.key === "ArrowRight") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.min(gridColumns.length - 1, currentColIndex + 1);
      const nextColId = gridColumnIds[nextColIndex];
      void commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit({ rowIndex, colId });
    }
  };
  const getLiveTotalFeeValue = (row, rowIndex) => {
    if (editingCell?.rowIndex !== rowIndex) {
      return row?.totalFees ?? "";
    }
    if (
      editingCell?.colId !== "tutorFee" &&
      editingCell?.colId !== "lacasShare"
    ) {
      return row?.totalFees ?? "";
    }
    const tutorFee = editingCell.colId === "tutorFee" ? editValue : row?.tutorFee;
    const lacasShare =
      editingCell.colId === "lacasShare" ? editValue : row?.lacasShare;
    return calculateAutoTotalFees(tutorFee, lacasShare);
  };
  const renderGridCell = (row, rowIndex, col) => {
    const cellKey = getCellKey(rowIndex, col.id);
    const isSelected = selectedCells.has(cellKey);
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;
    const rawValue = getCellValue(row, col);
    const value = col.id === "totalFees"
      ? getLiveTotalFeeValue(row, rowIndex)
      : col.id === "dateWithMonth"
        ? (String(rawValue || "").trim() === "0000-00-00" ? "" : rawValue)
        : rawValue;
    const rowId = getRowId(row);
    const commonTdStyle = {
      ...styles.td,
      minWidth: col.width,
      width: col.width,
      boxShadow: isSelected ? "inset 0 0 0 2px #107c41" : "none",
      backgroundColor:
        col.id === "tuitionName"
          ? row.tuitionNameColor || "#ffffff02"
          : row.rowColor || "#ffffff04",
      position: "relative",
      cursor: col.editable ? "cell" : "default",
    };

    if (isEditing && col.kind === "multiSelect") {
      return (
        <td key={cellKey} style={{ ...commonTdStyle, backgroundColor: "#fff" }}>
          <select
            ref={inputRef}
            autoFocus
            multiple
            size={Math.min(col.options.length, 5)}
            value={parseStatusValue(editValue)}
            onChange={(e) => {
              const nextValues = [...e.target.selectedOptions].map((opt) => opt.value);
              const serialized = serializeStatusValue(nextValues);
              editValueRef.current = serialized;
              setEditValue(serialized);
            }}
            onBlur={() => void commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
            style={{
              ...styles.select,
              height: "132px",
              padding: "4px",
              textAlign: "center",
              background: "#ffffff",
            }}>
            {col.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </td>
      );
    }

    if (isEditing && col.kind === "tuitionName") {
      return (
        <td key={cellKey} style={{ ...commonTdStyle, backgroundColor: row.tuitionNameColor || "#fff" }}>
          <div style={{ height: "100%", gap: "8px" }}>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => {
                editValueRef.current = e.target.value;
                setEditValue(e.target.value);
              }}
              onBlur={() => void commitEdit({ rowIndex, colId: col.id })}
              onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
              style={{ ...styles.input, }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ColorSwatch
                color={row.tuitionNameColor || "#ffffff"}
                onChange={(c) => void updateRow(row, "tuitionNameColor", c)}
                pickerId={`tuitionNameColor-${rowId}`}
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
        <td key={cellKey} style={{ ...commonTdStyle, backgroundColor: "#fff" }}>
          <input
            ref={inputRef}
            autoFocus
            type={col.type || "text"}
            value={editValue}
            onChange={(e) => {
              editValueRef.current = e.target.value;
              setEditValue(e.target.value);
            }}
            onBlur={() => void commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
            style={styles.input}
          />
        </td>
      );
    }

    if (col.kind === "tuitionName") {
      return (
        <td
          key={cellKey}
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
              ...styles.readCell,
              ...styles.textLeft,
              gap: "8px",
            }}
          >
            <span style={{ flex: 1 }}>{highlightText(value || "", search)}</span>
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ColorSwatch
                color={row.tuitionNameColor || "#ffffff"}
                onChange={(c) => void updateRow(row, "tuitionNameColor", c)}
                pickerId={`tuitionNameColor-${rowId}`}
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
        key={cellKey}
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
        <div
          style={{
            ...styles.readCell,
            ...(col.align === "left" ? styles.textLeft : {}),
          }}
        >
          {col.id === "status" ? (
            <StatusPill value={value} />
          ) : (
            highlightText(value || "", search)
          )}
        </div>
      </td>
    );
  };
  const tableHeadTop = isHeaderPinned
    ? `${STICKY_TOP + headerMetrics.height + 8}px`
    : "0px";
  return (
    <div style={styles.page}>
      <style>{`
        .excel-cell:focus {
          outline: 2px solid #107c41;
          outline-offset: -2px;
        }
      `}</style>

      <div style={styles.card} ref={cardRef}>
        {isHeaderPinned ? (
          <div style={{ height: `${headerMetrics.height + 4}px` }} />
        ) : null}

        <div
          ref={headerRowRef}
          style={{
            ...styles.headerRow,
            ...(isHeaderPinned
              ? {
                position: "fixed",
                top: `${STICKY_TOP}px`,
                left: `${headerMetrics.left}px`,
                width: `${headerMetrics.width}px`,
                zIndex: 2000,
                marginBottom: 0,
                borderRadius: "12px",
                boxSizing: "border-box",
                padding: "10px 14px",
                border: "2px solid #000000",
              }
              : {}),
          }}
        >
          <div style={styles.titleWrap}>
            <h2 style={styles.title}>Payment Sheet With Date</h2>
          </div>

          <div style={styles.actions}>


            <div style={styles.zoomControls}>
              <button
                type="button"
                onClick={() => changeZoom("out")}
                style={styles.zoomBtn}
                disabled={zoomLevel <= MIN_ZOOM}
                title="Zoom out"
                aria-label="Zoom out"
              >
                -
              </button>

              <div style={styles.zoomValue}>{zoomPercent}</div>

              <button
                type="button"
                onClick={() => changeZoom("in")}
                style={styles.zoomBtn}
                disabled={zoomLevel >= MAX_ZOOM}
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by date text, tuition name, tutor fee, lacas share, total fee, status..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.searchInput}
            />

            <button onClick={() => void loadRows({ initial: true })} style={styles.refreshBtn}>
              Refresh
            </button>

            {canSeeAuditTrail ? (
              <button
                onClick={openAuditPanel}
                style={styles.refreshBtn}
                disabled={!items.length}
                title="Open history panel"
              >
                Sheet History
              </button>
            ) : null}

            <button
              onClick={() => void undoLastAction()}
              style={styles.refreshBtn}
              disabled={!historyMeta.canUndo || mutationInFlightRef.current}
              title="Undo last change"
            >
              Undo (Ctrl+Z)
            </button>

            <button
              onClick={() => void redoLastAction()}
              style={styles.refreshBtn}
              disabled={!historyMeta.canRedo || mutationInFlightRef.current}
              title="Redo last undone change"
            >
              Redo (Ctrl+Y)
            </button>

            <button
              onClick={() => void moveSelectedRows("up")}
              style={styles.refreshBtn}
              disabled={!selectedRowIds.size}
            >
              Move Selected ↑
            </button>

            <button
              onClick={() => void moveSelectedRows("down")}
              style={styles.refreshBtn}
              disabled={!selectedRowIds.size}
            >
              Move Selected ↓
            </button>

            <button onClick={() => void addRow()} style={styles.addBtn} disabled={adding}>
              {adding ? "Adding..." : "+ Add Row"}
            </button>
          </div>
        </div>

        <div style={styles.tableWrapper} ref={tableWrapperRef}>
          <div style={{ ...styles.tableZoomWrap, zoom: zoomLevel }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, top: tableHeadTop, Width: "10px" }}>Sort</th>
                  <th style={{ ...styles.th, top: tableHeadTop, minWidth: "8px" }}>#</th>
                  <th style={{ ...styles.th, top: tableHeadTop, minWidth: "8px" }}>
                    <input
                      type="checkbox"
                      checked={allVisibleRowsSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleRowsSelected;
                      }}
                      onChange={(e) => toggleAllVisibleRows(e.target.checked)}
                      style={styles.checkbox}
                      aria-label="Select all visible rows"
                    />
                  </th>
                  <th style={{ ...styles.th, top: tableHeadTop, minWidth: "10px" }}>🎨</th>
                  {gridColumns.map((col) => (
                    <th key={col.id} style={{ ...styles.th, top: tableHeadTop, minWidth: `${col.width}px` }}>
                      {col.label}
                    </th>
                  ))}
                  <th style={{ ...styles.th, top: tableHeadTop, minWidth: "60px" }}>Add Row</th>
                  <th style={{ ...styles.th, top: tableHeadTop, minWidth: "100px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} style={styles.loading}>
                      Loading independent payment sheet...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} style={styles.emptyState}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row, visibleIndex) => {
                    const rowId = getRowId(row);
                    const originalIndex = itemIndexMap.get(String(rowId)) ?? -1;

                    const canMoveUp = originalIndex > 0;
                    const canMoveDown =
                      originalIndex >= 0 && originalIndex < items.length - 1;

                    return (
                      <tr
                        key={rowId ?? visibleIndex}
                        style={{ backgroundColor: row.rowColor || "#ffffff04" }}
                      >
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <div className="d-flex justify-content-center align-items-center flex-column"
                            style={{
                              minHeight: "6px",
                              minWidth: "8px",
                            }}
                          >
                            <button
                              onClick={() => void moveRow(originalIndex, "up")}
                              disabled={!canMoveUp}
                              style={{
                                ...styles.moveBtn,
                                opacity: canMoveUp ? 1 : 0.3,
                              }}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => void moveRow(originalIndex, "down")}
                              disabled={!canMoveDown}
                              style={{
                                ...styles.moveBtn,
                                opacity: canMoveDown ? 1 : 0.3,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <div
                            style={{
                              ...styles.readCell,
                              justifyContent: "center",
                              fontWeight: "700",
                              minWidth: "8px",
                            }}
                            aria-label={`Row number ${visibleIndex + 1}`}
                          >
                            {visibleIndex + 1}
                          </div>
                        </td>

                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <div style={styles.readCell}>
                            <input
                              type="checkbox"
                              checked={selectedRowIds.has(rowId)}
                              onChange={(e) => toggleRowSelection(rowId, e.target.checked)}
                              style={styles.checkbox}
                              aria-label={`Select row ${visibleIndex + 1}`}
                            />
                          </div>
                        </td>



                        <td style={styles.td}>
                          <div style={styles.readCell}>
                            <ColorSwatch
                              color={row.rowColor || "#ffffff"}
                              onChange={(c) => void updateRow(row, "rowColor", c)}
                              pickerId={`rowColor-${rowId}`}
                              activeColorPicker={activeColorPicker}
                              onOpen={setActiveColorPicker}
                              onClose={() => setActiveColorPicker(null)}
                            />
                          </div>
                        </td>

                        {gridColumns.map((col) => renderGridCell(row, visibleIndex, col))}

                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            <button
                              type="button"
                              style={styles.inlineAddBtn}
                              onClick={() => void addRow(row)}
                              title="Add a new row after this row"
                            >
                              + Row
                            </button>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.actionGroup}>

                            <button
                              type="button"
                              style={styles.copyBtn}
                              onClick={() => void copyRowToClipboard(row, visibleIndex)}
                              title="Copy row"
                            >
                              Copy
                            </button>

                            <button
                              type="button"
                              style={styles.deleteBtn}
                              onClick={() => void deleteRow(row)}
                              title="Delete row"
                            >
                              Delete
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
      <PaymentSheetHistoryPanel
        open={auditOpen}
        onClose={() => {
          setAuditOpen(false);
          setAuditRow(null);
        }}
        scope="sheet"
        moduleName="payment_sheet_with_date"
      />
    </div>
  );
}