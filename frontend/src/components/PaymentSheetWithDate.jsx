import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";

const LIVE_REFRESH_MS = 3000;

const styles = {
  page: {
    padding: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    border: "1px solid #eef0f3",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
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
    color: "#1e3c72",
    margin: 0,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: "260px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d6dbe1",
    outline: "none",
    fontSize: "14px",
  },
  addBtn: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  refreshBtn: {
    background: "#f3f4f6",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  liveBadge: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "2000px",
    fontSize: "13px",
  },
  th: {
    background: "#f8fafc",
    color: "#334155",
    fontWeight: "700",
    textAlign: "center",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 2,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    padding: "0",
    textAlign: "center",
    height: "46px",
    verticalAlign: "middle",
    background: "#fff",
  },
  input: {
    width: "100%",
    height: "46px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "13px",
    background: "transparent",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: "46px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "13px",
    background: "transparent",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  readCell: {
    padding: "10px 12px",
    minHeight: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "cell",
  },
  textLeft: {
    justifyContent: "flex-start",
    textAlign: "left",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
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
    width: "20px",
    height: "20px",
    border: "2px solid #666",
    cursor: "pointer",
    borderRadius: "4px",
    overflow: "hidden",
    display: "inline-block",
  },
  pickerPopup: {
    position: "fixed",
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "6px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    zIndex: 3000,
    width: "220px",
  },
  emptyState: {
    padding: "28px",
    textAlign: "center",
    color: "#6b7280",
  },
  loading: {
    padding: "20px",
    textAlign: "center",
    color: "#666",
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

function getStatusStyle(status) {
  switch ((status || "").trim()) {
    case "Fees Receive":
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
      };
    case "Fee Pending":
      return {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fcd34d",
      };
    case "Tuition Close":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
      };
    case "Tuition Pending":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fca5a5",
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

  return parts.map((part, index) =>
    part.toLowerCase() === q.toLowerCase() ? (
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
          <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#444" }}>
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

export default function PaymentSheetWithDate({ me }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

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

  const canSeeTutorShare =
    me?.role === "admin" || me?.role === "hod" || !!me?.access_tutor_share;

  const canSeeLacasShare =
    me?.role === "admin" || me?.role === "hod" || !!me?.access_lacas_share;

  const canSeeTotalFees =
    me?.role === "admin" || me?.role === "hod" || !!me?.access_total_fees;

  const gridColumns = useMemo(() => {
    const cols = [
      {
        id: "tuitionId",
        label: "Tuition Id",
        field: "tuitionId",
        editable: true,
        width: 140,
        align: "left",
      },
      {
        id: "paymentDate",
        label: "Date",
        field: "paymentDate",
        editable: true,
        width: 120,
        type: "date",
        align: "left",
      },
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
        width: 110,
        align: "left",
      },
      {
        id: "className",
        label: "Class",
        field: "className",
        editable: true,
        width: 100,
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
        label: "Tutor Share",
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
        label: "Total Fees",
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
      }
    );

    return cols;
  }, [canSeeTutorShare, canSeeLacasShare, canSeeTotalFees]);

  const gridColumnIds = useMemo(() => gridColumns.map((c) => c.id), [gridColumns]);

  const gridColumnMap = useMemo(
    () => Object.fromEntries(gridColumns.map((c) => [c.id, c])),
    [gridColumns]
  );

  const firstEditableColumnId = gridColumns[0]?.id || "tuitionId";
  const visibleColumnCount = gridColumns.length + 3; // Sort + Color + Action

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
    if (editingCell && inputRef.current) {
      inputRef.current.focus();

      if (
        moveCaretToEndOnFocusRef.current &&
        typeof inputRef.current.setSelectionRange === "function"
      ) {
        const len = String(inputRef.current.value || "").length;
        inputRef.current.setSelectionRange(len, len);
      } else if (
        shouldSelectAllOnFocusRef.current &&
        typeof inputRef.current.select === "function"
      ) {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  async function loadRows({ initial = false, silent = false } = {}) {
    try {
      if (initial) setLoading(true);

      const res = await api.get("/payments-clone");
      const rows = Array.isArray(res.data) ? res.data : res.data.items || [];

      if (!mountedRef.current) return;

      if (!rowsAreSame(itemsRef.current, rows)) {
        setItems(rows);
      }
    } catch (err) {
      console.error("Failed to load payment clone rows:", err);
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
        orderIndex: 0,
        rowColor: "",
        tuitionNameColor: "",
      };

      const res = await api.post("/payments-clone", newRow);
      const created = res.data?.item || res.data;

      if (created && getRowId(created) !== undefined) {
        setItems((prev) => [...prev, created]);
      } else {
        await loadRows({ silent: true });
      }
    } catch (err) {
      console.error("Failed to add payment clone row:", err);
      alert("New row create nahi hui.");
    } finally {
      setAdding(false);
    }
  }

  async function updateRowFields(row, patchFields) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID missing hai.");
      return;
    }

    const oldItems = itemsRef.current;
    const updatedRow = { ...row, ...patchFields };

    setItems((prev) =>
      prev.map((item) => (getRowId(item) === rowId ? updatedRow : item))
    );

    try {
      await api.patch(`/payments-clone/${encodeURIComponent(rowId)}`, updatedRow);
      await loadRows({ silent: true });
    } catch (err) {
      console.error("Failed to update payment clone row:", err);
      setItems(oldItems);
      alert("Update failed.");
    }
  }

  async function updateRow(row, field, newValue) {
    await updateRowFields(row, { [field]: newValue });
  }

  async function moveRow(index, direction) {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        id: getRowId(item),
        paymentId: getRowId(item),
        rowId: getRowId(item),
        orderIndex: idx,
      }));

      await api.post("/payments-clone/reorder", { items: reorderPayload });
      await loadRows({ silent: true });
    } catch (err) {
      console.error("Failed to reorder payment clone rows:", err);
      alert("Row reorder save nahi hui.");
      await loadRows({ silent: true });
    }
  }

  async function deleteRow(row) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID missing hai.");
      return;
    }

    if (!window.confirm("Is row ko delete karna hai?")) return;

    const oldItems = itemsRef.current;
    setItems((prev) => prev.filter((item) => getRowId(item) !== rowId));

    try {
      await api.delete(`/payments-clone/${encodeURIComponent(rowId)}`);
      await loadRows({ silent: true });
    } catch (err) {
      console.error("Failed to delete payment clone row:", err);
      setItems(oldItems);
      alert("Delete failed.");
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

  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

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

      if (target && typeof target.focus === "function") {
        target.focus({ preventScroll: false });
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
    return row[col.field] ?? "";
  };

  const buildPatchForColumn = (colId, value) => {
    const col = gridColumnMap[colId];
    if (!col?.field) return {};
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

  const handleEditInputKeyDown = (e, rowIndex, colId, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = Math.min(rowIndex + 1, filteredItems.length - 1);
      commitEdit({ rowIndex: nextRow, colId });
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
      commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowUp") {
      e.preventDefault();
      const nextRow = Math.max(0, rowIndex - 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = Math.min(filteredItems.length - 1, rowIndex + 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowLeft") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.max(0, currentColIndex - 1);
      const nextColId = gridColumnIds[nextColIndex];
      commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (col?.kind !== "select" && e.key === "ArrowRight") {
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

  const renderGridCell = (row, rowIndex, col) => {
    const cellKey = getCellKey(rowIndex, col.id);
    const isSelected = selectedCells.has(cellKey);
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;

    const value = getCellValue(row, col);

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
        <td style={{ ...commonTdStyle, backgroundColor: "#fff" }}>
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
        <td style={{ ...commonTdStyle, backgroundColor: row.tuitionNameColor || "#fff" }}>
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
                onChange={(c) => updateRow(row, "tuitionNameColor", c)}
                pickerId={`tuitionNameColor-${row.id}`}
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
        <td style={{ ...commonTdStyle, backgroundColor: "#fff" }}>
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
                onChange={(c) => updateRow(row, "tuitionNameColor", c)}
                pickerId={`tuitionNameColor-${row.id}`}
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
            <h2 style={styles.title}>Payment Sheet Clone</h2>
          </div>

          <div style={styles.actions}>
            <div style={styles.liveBadge}>● Live Sync</div>

            <input
              type="text"
              placeholder="Search by tuition id, name, country, tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <button onClick={() => loadRows({ initial: true })} style={styles.refreshBtn}>
              Refresh
            </button>

            <button onClick={addRow} style={styles.addBtn} disabled={adding}>
              {adding ? "Adding..." : "+ Add Row"}
            </button>
          </div>
        </div>

        <div style={styles.tableWrapper} ref={tableWrapperRef}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, minWidth: "70px" }}>Sort</th>
                <th style={{ ...styles.th, minWidth: "60px" }}>🎨</th>

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
                    Loading payment clone sheet...
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

                  return (
                    <tr key={rowId ?? visibleIndex} style={{ backgroundColor: row.rowColor || "#fff" }}>
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
                            onClick={() => moveRow(originalIndex, "up")}
                            disabled={originalIndex === 0}
                            style={{
                              ...styles.moveBtn,
                              opacity: originalIndex === 0 ? 0.3 : 1,
                            }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveRow(originalIndex, "down")}
                            disabled={originalIndex === items.length - 1}
                            style={{
                              ...styles.moveBtn,
                              opacity: originalIndex === items.length - 1 ? 0.3 : 1,
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
                            onChange={(c) => updateRow(row, "rowColor", c)}
                            pickerId={`rowColor-${row.id}`}
                            activeColorPicker={activeColorPicker}
                            onOpen={setActiveColorPicker}
                            onClose={() => setActiveColorPicker(null)}
                          />
                        </div>
                      </td>

                      {gridColumns.map((col) => renderGridCell(row, visibleIndex, col))}

                      <td style={styles.td}>
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
  );
}