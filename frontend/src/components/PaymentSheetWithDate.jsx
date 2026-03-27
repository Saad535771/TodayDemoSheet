import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";

const LIVE_REFRESH_MS = 3000;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

const styles = {
  page: {
    minHeight: "100vh",
    padding: "10px",
    overflowX: "hidden",
  
    background: "#ffffff",
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
    fontSize: "22px",
    fontWeight: "700",
    color: "#111111",
    margin: 0,
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
  zoomControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  zoomBtn: {
    width: "42px",
    height: "42px",
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
    overflow: "auto",
    borderRadius: "12px",
    border: "2px solid #000000",
    maxWidth: "100%",
    background: "#ffffff",
  },
  tableZoomWrap: {
    transformOrigin: "top left",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1900px",
    fontSize: "12px",
    background: "#ffffff",
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
    height: "42px",
    verticalAlign: "middle",
    background: "#fff",
  },
  input: {
    width: "100%",
    height: "42px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "12px",
    background: "transparent",
    boxSizing: "border-box",
    textAlign: "left",
    color: "inherit",
    fontWeight: "600",
  },
  select: {
    width: "100%",
    height: "42px",
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
    padding: "8px 10px",
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "cell",
    fontWeight: "600",
    color: "#111111",
  },
  textLeft: {
    justifyContent: "flex-start",
    textAlign: "left",
  },
  deleteBtn: {
    background: "#b00101",
    color: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  copyBtn: {
    background: "#ffffff",
    color: "#111111",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    flexWrap: "wrap",
    minHeight: "42px",
    padding: "6px",
  },
  moveBtn: {
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    padding: "2px 6px",
    color: "#111111",
    fontWeight: "700",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#107c41",
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
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
    zIndex: 3000,
    width: "220px",
  },
  emptyState: {
    padding: "28px",
    textAlign: "center",
    color: "#444444",
    fontWeight: "700",
  },
  loading: {
    padding: "20px",
    textAlign: "center",
    color: "#444444",
    fontWeight: "700",
  },
};

const statusOptions = [
  "",
  "Fees Receive",
  "Fee Pending",
  "Tuition Close",
  "Tuition Pending",
];

function getRowId(row) {
  return row?.id ?? row?.paymentId ?? row?._id ?? row?.rowId;
}

function rowsAreSame(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
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
  return col?.kind === "select" || col?.type === "date";
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

function getStatusStyle(status) {
  switch ((status || "").trim()) {
    case "Fees Receive":
      return {
        background: "#166534",
        color: "#ffffff",
        border: "1px solid #14532d",
      };
    case "Fee Pending":
      return {
        background: "#92400e",
        color: "#ffffff",
        border: "1px solid #78350f",
      };
    case "Tuition Close":
      return {
        background: "#1d4ed8",
        color: "#ffffff",
        border: "1px solid #1e40af",
      };
    case "Tuition Pending":
      return {
        background: "#b91c1c",
        color: "#ffffff",
        border: "1px solid #991b1b",
      };
    default:
      return {
        background: "#475569",
        color: "#ffffff",
        border: "1px solid #334155",
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
        fontWeight: "700",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {value || "--"}
    </span>
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
              marginBottom: "8px",
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
              marginBottom: "12px",
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


export default function PaymentSheetWithDate({ me }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  const [selectedCell, setSelectedCell] = useState(null);
  const [anchorCell, setAnchorCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [activeColorPicker, setActiveColorPicker] = useState(null);

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
  const localClipboardRef = useRef("");

  const canSeeTutorShare =
    me?.role === "admin" || me?.role === "hod" || !!me?.access_tutor_share;

  const canSeeLacasShare =
    me?.role === "admin" || me?.role === "hod" || !!me?.access_lacas_share;

  const canSeeTotalFees =
    me?.role === "admin" || me?.role === "hod" || !!me?.access_total_fees;

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
        label: "Date With Month",
        field: "dateWithMonth",
        editable: true,
        width: 160,
        align: "left",
      },
      {
        id: "tuitionName",
        label: "Tuition Name",
        field: "tuitionName",
        editable: true,
        width: 180,
        align: "left",
        kind: "tuitionName",
      },
      {
        id: "country",
        label: "Country",
        field: "country",
        editable: true,
        width: 120,
        align: "left",
      },
      {
        id: "className",
        label: "Class Name",
        field: "className",
        editable: true,
        width: 120,
        align: "left",
      },
      {
        id: "tutorName",
        label: "Tutor Name",
        field: "tutorName",
        editable: true,
        width: 150,
        align: "left",
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
        align: "left",
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
        align: "left",
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
        align: "left",
      });
    }

    cols.push(
      {
        id: "status",
        label: "Status",
        field: "status",
        editable: true,
        width: 150,
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
        align: "left",
      },
      {
        id: "otmName",
        label: "OTM Name",
        field: "otmName",
        editable: true,
        width: 150,
        align: "left",
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
  const visibleColumnCount = gridColumns.length + 4;

  useEffect(() => {
    mountedRef.current = true;

    loadRows({ initial: true });

    pollingRef.current = setInterval(() => {
      if (document.hidden) return;
      loadRows({ silent: true });
    }, LIVE_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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

      if (!rowsAreSame(itemsRef.current, rows)) {
        setItems(rows);
      }
    } catch (err) {
      console.error("Failed to load payment sheet rows:", err);
      if (!silent && mountedRef.current && initial) {
        setItems([]);
      }
    } finally {
      if (mountedRef.current && initial) setLoading(false);
    }
  }

  async function addRow() {
    try {
      setAdding(true);

      const nextOrderIndex =
        itemsRef.current.reduce((max, item, index) => {
          const currentOrder =
            typeof item?.orderIndex === "number" ? item.orderIndex : index;
          return Math.max(max, currentOrder);
        }, -1) + 1;

      const newRow = {
        tuitionId: `manual-${Date.now()}`,
        paymentDate: "",
        dateWithMonth: "",
        tuitionName: "",
        country: "",
        className: "",
        tutorName: "",
        tutorShare: "",
        lacasShare: "",
        totalFees: "",
        status: "Tuition Pending",
        feedback: "",
        otmName: "",
        syncFlag: "",
        assignedStaffId: null,
        isDeleted: false,
        deletedFromTodayDemo: false,
        assignedTo: "",
        orderIndex: nextOrderIndex,
        rowColor: "",
        tuitionNameColor: "",
      };

      const res = await api.post("/payments-clone", newRow);
      const created = res.data?.item || res.data;

      if (created && getRowId(created) !== undefined) {
        setItems((prev) => [
          ...prev,
          {
            ...created,
            orderIndex:
              typeof created?.orderIndex === "number"
                ? created.orderIndex
                : nextOrderIndex,
          },
        ]);
      } else {
        await loadRows({ silent: true });
      }
    } catch (err) {
      console.error("Failed to add row:", err);
      alert(err?.response?.data?.message || "Failed to create a new row.");
    } finally {
      setAdding(false);
    }
  }

  async function updateRowFields(row, patchFields) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID is missing.");
      return;
    }

    const oldItems = itemsRef.current;
    const updatedRow = { ...row, ...patchFields };

    setItems((prev) =>
      prev.map((item) => (getRowId(item) === rowId ? updatedRow : item))
    );

    try {
      await api.patch(`/payments-clone/${encodeURIComponent(rowId)}`, patchFields);
      await loadRows({ silent: true });
    } catch (err) {
      console.error("Failed to update row:", err);
      setItems(oldItems);
      alert(err?.response?.data?.message || "Failed to update the row.");
    }
  }

  async function updateRow(row, field, newValue) {
    await updateRowFields(row, { [field]: newValue });
  }

  async function moveRow(index, direction) {
    if (index < 0) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];

    const normalized = newItems.map((item, idx) => ({
      ...item,
      orderIndex: idx,
    }));

    setItems(normalized);

    try {
      const reorderPayload = normalized.map((item, idx) => ({
        id: getRowId(item),
        orderIndex: idx,
      }));

      await api.post("/payments-clone/reorder", { items: reorderPayload });
      await loadRows({ silent: true });
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

    const newItems = [...items];

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

    setItems(normalized);

    try {
      const reorderPayload = normalized.map((item, idx) => ({
        id: getRowId(item),
        orderIndex: idx,
      }));

      await api.post("/payments-clone/reorder", { items: reorderPayload });
      await loadRows({ silent: true });
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

    if (!window.confirm("Are you sure you want to delete this row?")) return;

    const oldItems = itemsRef.current;
    setItems((prev) => prev.filter((item) => getRowId(item) !== rowId));

    try {
      await api.delete(`/payments-clone/${encodeURIComponent(rowId)}`);
      await loadRows({ silent: true });
    } catch (err) {
      console.error("Failed to delete row:", err);
      setItems(oldItems);
      alert(err?.response?.data?.message || "Failed to delete the row.");
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const haystack = [
        item.tuitionId,
        item.paymentDate,
        item.dateWithMonth,
        item.tuitionName,
        item.country,
        item.className,
        item.tutorName,
        item.tutorShare,
        item.lacasShare,
        item.totalFees,
        item.status,
        item.feedback,
        item.otmName,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [items, search]);

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

          if (col.kind === "select") {
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

      setItems((prev) =>
        prev.map((item) => {
          const rowId = getRowId(item);
          const entry = updatesById.get(rowId);
          return entry ? { ...item, ...entry.patch } : item;
        })
      );

      await Promise.all(
        [...updatesById.values()].map((entry) => {
          const rowId = getRowId(entry.row);
          return api.patch(`/payments-clone/${encodeURIComponent(rowId)}`, entry.patch);
        })
      );

      await loadRows({ silent: true });

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

    setItems((prev) =>
      prev.map((row) => {
        const rowId = getRowId(row);
        const entry = updatesById.get(rowId);
        return entry ? { ...row, ...entry.patch } : row;
      })
    );

    clearEditingState();

    for (const [, entry] of updatesById.entries()) {
      await updateRowFields(entry.row, entry.patch);
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

    if (col?.kind !== "select" && e.key === "ArrowUp") {
      e.preventDefault();
      const nextRow = Math.max(0, rowIndex - 1);
      void commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = Math.min(filteredItems.length - 1, rowIndex + 1);
      void commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowLeft") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.max(0, currentColIndex - 1);
      const nextColId = gridColumnIds[nextColIndex];
      void commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowRight") {
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

  const renderGridCell = (row, rowIndex, col) => {
    const cellKey = getCellKey(rowIndex, col.id);
    const isSelected = selectedCells.has(cellKey);
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;

    const value = getCellValue(row, col);
    const rowId = getRowId(row);

    const commonTdStyle = {
      ...styles.td,
      minWidth: col.width,
      width: col.width,
      boxShadow: isSelected ? "inset 0 0 0 2px #107c41" : "none",
      backgroundColor:
        col.id === "tuitionName"
          ? row.tuitionNameColor || "#fff"
          : row.rowColor || "#fff",
      position: "relative",
      cursor: col.editable ? "cell" : "default",
    };

    if (isEditing && col.kind === "select") {
      return (
        <td key={cellKey} style={{ ...commonTdStyle, backgroundColor: "#fff" }}>
          <select
            ref={inputRef}
            autoFocus
            value={editValue}
            onChange={(e) => {
              editValueRef.current = e.target.value;
              setEditValue(e.target.value);
            }}
            onBlur={() => void commitEdit({ rowIndex, colId: col.id })}
            onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
            style={styles.select}
          >
            {col.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "--"}
              </option>
            ))}
          </select>
        </td>
      );
    }

    if (isEditing && col.kind === "tuitionName") {
      return (
        <td key={cellKey} style={{ ...commonTdStyle, backgroundColor: row.tuitionNameColor || "#fff" }}>
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
              onBlur={() => void commitEdit({ rowIndex, colId: col.id })}
              onKeyDown={(e) => handleEditInputKeyDown(e, rowIndex, col.id, col)}
              style={{ ...styles.input, flex: 1 }}
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
            <h2 style={styles.title}>Payment Sheet With Date</h2>
            <p style={styles.subtitle}>Independent CRUD sheet with Excel-style keyboard navigation</p>
          </div>

          <div style={styles.actions}>
            <div style={styles.liveBadge}>● Independent CRUD</div>

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
              placeholder="Search by date, tuition name, country, tutor, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <button onClick={() => void loadRows({ initial: true })} style={styles.refreshBtn}>
              Refresh
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
                <th style={{ ...styles.th, minWidth: "58px" }}>
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
                <th style={{ ...styles.th, minWidth: "70px" }}>Sort</th>
                <th style={{ ...styles.th, minWidth: "60px" }}>🎨</th>

                {gridColumns.map((col) => (
                  <th key={col.id} style={{ ...styles.th, minWidth: `${col.width}px` }}>
                    {col.label}
                  </th>
                ))}

                <th style={{ ...styles.th, minWidth: "140px" }}>Action</th>
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
                  const originalIndex = items.findIndex(
                    (item) => getRowId(item) === rowId
                  );

                  const canMoveUp = originalIndex > 0;
                  const canMoveDown =
                    originalIndex >= 0 && originalIndex < items.length - 1;

                  return (
                    <tr
                      key={rowId ?? visibleIndex}
                      style={{ backgroundColor: row.rowColor || "#fff" }}
                    >
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

                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "46px",
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
                            style={styles.copyBtn}
                            onClick={() => void copyRowToClipboard(row, visibleIndex)}
                            title="Copy full row"
                          >
                            Copy
                          </button>

                          <button
                            style={styles.deleteBtn}
                            onClick={() => void deleteRow(row)}
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
    </div>
  );
}