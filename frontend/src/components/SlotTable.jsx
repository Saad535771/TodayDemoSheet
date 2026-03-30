import React, { useState, useEffect, useRef, useMemo } from "react";
import { api } from "../api/api.js";

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    marginBottom: "24px",
    border: "1px solid #eef0f3",
    fontFamily: "'Calibri', sans-serif",
    zIndex: 1,
  },
  header: (isOpen, roleColor) => ({
    background: isOpen
      ? `linear-gradient(135deg, ${roleColor} 0%, ${adjustColor(roleColor, -20)} 100%)`
      : "#ffffff",
    color: isOpen ? "#ffffff" : "#333",
    padding: "16px 24px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
    borderBottom: isOpen ? "none" : "1px solid #eee",
  }),
  headerTitle: { fontSize: "18px", fontWeight: "700", margin: 0 },
  headerMeta: {
    fontSize: "13px",
    opacity: 0.85,
    marginTop: "4px",
    display: "block",
  },
  tableWrapper: {
    width: "100%",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorX: "auto",
    overscrollBehaviorY: "auto",
    background: "#ffffff",
    maxHeight: "500px",
 
  },
  table: {
    width: "max-content",
    minWidth: "100%",
    height: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    tableLayout: "auto",
  },
  th: {
    background: "#e1bb00",
    color: "#000000",
    fontWeight: "600",
    padding: "8px 10px",
    textAlign: "center",
    border: "1px solid #000000",
   
    top: 0,
    zIndex: 10,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "0",
    textAlign: "center",
    border: "1px solid #000000",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
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
  inlineTextarea: {
    width: "100%",
    minHeight: "70px",
    padding: "8px 10px",
    border: "none",
    borderRadius: "0",
    fontSize: "14px",
    background: "transparent",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Calibri', sans-serif",
    resize: "vertical",
    lineHeight: 1.4,
  },
  statusEditorSurface: {
    width: "100%",
    minHeight: "76px",
    padding: "8px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "#ffffff",
  },
  statusEditorValueBox: {
    minHeight: "40px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "6px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    background: "#ffffff",
  },
  statusEditorSearchInput: {
    flex: 1,
    minWidth: "90px",
    border: "none",
    outline: "none",
    fontSize: "13px",
    padding: "4px 2px",
    background: "transparent",
    fontFamily: "'Calibri', sans-serif",
  },
  statusEditorList: {
    maxHeight: "180px",
    overflowY: "auto",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  },
  statusEditorOption: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #eef2f7",
    background: "#ffffff",
    textalign: "center",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: "'Calibri', sans-serif",
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
    width: "24px",
    height: "24px",
    border: "2px solid #666",
    cursor: "pointer",
    borderRadius: "4px",
    // overflow: "hidden",
    display: "inline-block",
  },
  pickerPopup: {
    position: "fixed",
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "6px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    zIndex: 999,
    width: "220px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  },
  lockIcon: { fontSize: "40px", marginBottom: "15px", display: "block" },
  lockedPlaceholder: {
    padding: "40px",
    textAlign: "center",
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "pointer",
  },
  btn: (loading) => ({
    padding: "6px 16px",
    background: loading ? "#ccc" : "#10b981",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "transform 0.1s",
    fontFamily: "'Calibri', sans-serif",
  }),
};

function adjustColor(color, amount) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (c) =>
        ("0" + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).slice(-2)
      )
  );
}

/* =========================
   GLOBAL SEARCH MANAGER
   ========================= */
function createGlobalSearchManager() {
  let term = "";
  let hostId = null;
  const listeners = new Set();
  const activeSlots = new Set();

  const getState = () => ({
    term,
    visible: activeSlots.size > 0,
    hostId,
  });

  const notify = () => {
    const snapshot = getState();
    listeners.forEach((fn) => fn(snapshot));
  };

  return {
    getState,
    subscribe(fn) {
      listeners.add(fn);
      fn(getState());
      return () => listeners.delete(fn);
    },
    setTerm(nextTerm) {
      term = String(nextTerm || "");
      notify();
    },
    clear() {
      term = "";
      notify();
    },
    setActive(slotId, active) {
      if (!slotId) return;
      if (active) activeSlots.add(slotId);
      else activeSlots.delete(slotId);
      notify();
    },
    claimHost(id) {
      if (!hostId) hostId = id;
      notify();
      return hostId === id;
    },
    releaseHost(id) {
      if (hostId === id) hostId = null;
      notify();
    },
    isHost(id) {
      return hostId === id;
    },
  };
}

function getGlobalSearchManager() {
  if (typeof window === "undefined") return createGlobalSearchManager();
  if (!window.__SLOT_GLOBAL_SEARCH) {
    window.__SLOT_GLOBAL_SEARCH = createGlobalSearchManager();
  }
  return window.__SLOT_GLOBAL_SEARCH;
}

/* =========================
   Search helpers
   ========================= */
const SEARCH_KEYS = [
  "demoTime",
  "tuitionName",
  "source",
  "country",
  "parentsContact",
  "parentContact",
  "className",
  "class",
  "subjects",
  "subject",
  "tutorName",
  "tutorFees",
  "tutorFee",
  "rejectedTutor",
  "status",
  "feedback",
  "demoDate",
  "tuitionId",
  "demoRating",
  "syncFlag",
  "sync",
];

function useDebouncedValue(value, delay = 850) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase().trim();
}

function getItemSearchString(item) {
  return SEARCH_KEYS.map((key) => normalizeValue(item[key])).join(" ");
}

function itemMatchesSearch(item, term) {
  const q = normalizeValue(term);
  if (!q) return true;
  return getItemSearchString(item).includes(q);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text, term) {
  const value = text === null || text === undefined ? "" : String(text);
  const q = String(term || "").trim();

  if (!q) return value;

  const regex = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = value.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
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

/* =========================
   Global Search Host
   ========================= */
function GlobalSearchHost() {
  const hostIdRef = useRef(`slot-search-host-${Math.random().toString(36).slice(2, 9)}`);
  const inputRef = useRef(null);
  const manager = getGlobalSearchManager();

  const [state, setState] = useState(manager.getState());
  const [draftTerm, setDraftTerm] = useState(manager.getState().term || "");
  const debouncedTerm = useDebouncedValue(draftTerm, 350);
  const draftTermRef = useRef(draftTerm);

  useEffect(() => {
    draftTermRef.current = draftTerm;
  }, [draftTerm]);

  useEffect(() => {
    const mgr = getGlobalSearchManager();
    mgr.claimHost(hostIdRef.current);

    const unsub = mgr.subscribe((nextState) => {
      setState((prev) => {
        if (
          prev.term === nextState.term &&
          prev.visible === nextState.visible &&
          prev.hostId === nextState.hostId
        ) {
          return prev;
        }
        return nextState;
      });

      const isFocused = document.activeElement === inputRef.current;
      if (!isFocused && (nextState.term || "") !== draftTermRef.current) {
        setDraftTerm(nextState.term || "");
      }
    });

    return () => {
      unsub();
      mgr.releaseHost(hostIdRef.current);
    };
  }, []);

  useEffect(() => {
    const mgr = getGlobalSearchManager();
    if (debouncedTerm !== mgr.getState().term) {
      mgr.setTerm(debouncedTerm);
    }
  }, [debouncedTerm]);

  if (!state.visible || !manager.isHost(hostIdRef.current)) return null;

  return (
    <div style={{ zIndex: 99999 }}>
      <div
        style={{
          position: "fixed",
          top: "85px",
          right: "0%",
          left: "60%",
          transform: "translateX(-50%)",
          zIndex: 99999,
        }}
      >
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={draftTerm}
            onChange={(e) => setDraftTerm(e.target.value)}
            placeholder="Search in all tables on this page..."
            style={{
              flex: 1,
              border: "1px solid #000000",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "12px",
              outline: "none",
            
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraftTerm("");
                manager.clear();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ==================== constants & helpers ==================== */
function format12Hour(time24) {
  if (!time24) return "";
  const clean = String(time24).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return clean;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];

  if (Number.isNaN(hours)) return clean;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

const DEMO_RATING_VALUES = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const SOURCES_LIST = ["", "mahad", "areeba", "sibgha"];
const STATUS_LIST = [
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
const columnColors = { "Rejected Tutor": "#ffebee" };
const PASSWORD_SECRET = "admin123456789";
const AUTO_REFRESH_INTERVAL = 14000;
function areItemListsEqual(left = [], right = []) {
  return JSON.stringify(left || []) === JSON.stringify(right || []);
}
const gridColumns = [
  { id: "demoTime", label: "Demo Time", width: 100, editable: true, field: "demoTime", type: "time" },
  { id: "tuitionName", label: "Tuition Name", width: 100, editable: true, field: "tuitionName", kind: "tuitionName" },
  { id: "source", label: "Source", width: 110, editable: true, field: "source", kind: "select", options: SOURCES_LIST, pill: "source" },
  { id: "country", label: "Country", width: 100, editable: true, field: "country" },
  { id: "parentsContact", label: "Parent Contact", width: 130, editable: true, field: "parentsContact" },
  { id: "className", label: "Class", width: 100, editable: true, field: "className" },
  { id: "subjects", label: "Subject", width: 120, editable: true, field: "subjects" },
  { id: "tutorName", label: "Tutor Name", width: 140, editable: true, field: "tutorName" },
  { id: "tutorFees", label: "Tutor Fees", width: 100, editable: true, field: "tutorFees" },
  { id: "rejectedTutor", label: "Rejected Tutor", width: 120, editable: true, field: "rejectedTutor" },
  { id: "status", label: "Status", width: 280, editable: true, field: "status", kind: "multiselect", options: STATUS_LIST, pill: "status" },
  { id: "feedback", label: "Feedback", width: 240, editable: true, field: "feedback", kind: "textarea" },
  { id: "demoDate", label: "Demo Date", width: 120, editable: true, field: "demoDate", type: "date" },
  { id: "tuitionId", label: "Tuition Id", width: 120, editable: false, field: "tuitionId", kind: "readonly" },
  { id: "demoRating", label: "Demo Rating", width: 130, editable: true, field: "demoRating", kind: "select", options: DEMO_RATING_VALUES, pill: "demoRating" },
  { id: "syncFlag", label: "Sync", width: 80, editable: true, field: "syncFlag" },
];

const gridColumnIds = gridColumns.map((c) => c.id);
const gridColumnMap = Object.fromEntries(gridColumns.map((c) => [c.id, c]));
const firstEditableColumnId = gridColumns[0]?.id || "demoTime";

const getCellKey = (rowIndex, colId) => `${rowIndex}__${colId}`;

const parseCellKey = (key) => {
  const [rowIndex, ...rest] = key.split("__");
  return { rowIndex: Number(rowIndex), colId: rest.join("__") };
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

const renderPill = (val, styleFn, searchTerm = "") => {
  if (!val) return "";
  const style = styleFn(val);
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {highlightText(val, searchTerm)}
    </span>
  );
};

const normalizeMultiStatus = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );
  }

  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const stringifyMultiStatus = (value) => normalizeMultiStatus(value).join(", ");

const renderPillList = (val, styleFn, searchTerm = "") => {
  const statuses = normalizeMultiStatus(val);
  if (!statuses.length) return "";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      {statuses.map((status) => (
        <React.Fragment key={status}>{renderPill(status, styleFn, searchTerm)}</React.Fragment>
      ))}
    </div>
  );
};

const feedbackContainsSatisfied = (value) => /\bsatisfied\b/i.test(String(value || ""));

function StatusMultiEditor({
  value,
  options,
  onChange,
  onCommit,
  onCancel,
  onImmediatePersist,
  inputRef,
}) {
  const rootRef = useRef(null);
  const [filter, setFilter] = useState("");

  const selected = useMemo(() => normalizeMultiStatus(value), [value]);
  const filteredOptions = useMemo(() => {
    const q = String(filter || "").trim().toLowerCase();
    return options.filter((option) => {
      if (!option) return false;
      if (!q) return true;
      return option.toLowerCase().includes(q);
    });
  }, [filter, options]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      const input = node.querySelector("input");
      if (input && typeof input.focus === "function") input.focus();
    });
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target)) return;
      onCommit?.();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onCommit]);

  const applyNext = (nextStatuses) => {
    const nextValue = stringifyMultiStatus(nextStatuses);
    onChange(nextValue);
    onImmediatePersist?.(nextValue);
  };

  const toggleOption = (option) => {
    if (!option) return;
    const nextStatuses = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    applyNext(nextStatuses);
    setFilter("");
  };

  const removeStatus = (status) => {
    applyNext(selected.filter((item) => item !== status));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && !filter) {
      if (!selected.length) return;
      e.preventDefault();
      removeStatus(selected[selected.length - 1]);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const exactMatch = options.find(
        (option) => option && option.toLowerCase() === String(filter || "").trim().toLowerCase()
      );

      if (exactMatch) {
        toggleOption(exactMatch);
        return;
      }

      onCommit?.();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
      return;
    }

    if (e.key === "Tab") {
      onCommit?.();
    }
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      style={styles.statusEditorSurface}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.statusEditorValueBox}>
        {selected.map((status) => (
          <span
            key={status}
            style={{
              ...getStatusStyle(status),
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "999px",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            <span>{status}</span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => removeStatus(status)}
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                padding: 0,
                fontSize: "14px",
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length ? "Add more..." : "Select status"}
          style={styles.statusEditorSearchInput}
        />
      </div>

      <div style={styles.statusEditorList}>
        {filteredOptions.length ? (
          filteredOptions.map((option, index) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                style={{
                  ...styles.statusEditorOption,
                  borderBottom:
                    index === filteredOptions.length - 1 ? "none" : styles.statusEditorOption.borderBottom,
                  background: active ? "#f0fdf4" : "#ffffff",
                  fontWeight: active ? 700 : 500,
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleOption(option)}
              >
                <span>{option}</span>
                <span style={{ color: active ? "#16a34a" : "#9ca3af" }}>{active ? "✓" : ""}</span>
              </button>
            );
          })
        ) : (
          <div style={{ padding: "10px 12px", fontSize: "13px", color: "#6b7280" }}>
            No matching status
          </div>
        )}
      </div>
    </div>
  );
}

export const handleGridKeyDown = (e) => {
  const td = e.currentTarget;

  if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
    e.preventDefault();
    let target = null;

    if (e.key === "ArrowRight") target = td.nextElementSibling;
    else if (e.key === "ArrowLeft") target = td.previousElementSibling;
    else if (e.key === "ArrowDown") {
      const nextTr = td.parentElement.nextElementSibling;
      if (nextTr) target = nextTr.children[td.cellIndex];
    } else if (e.key === "ArrowUp") {
      const prevTr = td.parentElement.previousElementSibling;
      if (prevTr) target = prevTr.children[td.cellIndex];
    }

    if (target && target.tagName === "TD") target.focus();
  }
};

const TableSkeleton = () => {
  const rows = Array.from({ length: 3 });
  const cols = Array.from({ length: 20 });

  return (
    <>
      {rows.map((_, rIdx) => (
        <tr key={rIdx}>
          {cols.map((__, cIdx) => (
            <td key={cIdx} style={{ ...styles.td, padding: "8px" }}>
              <div className="skeleton-box"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
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
        title="Click to change color (Excel style)"
      />

      {isOpen && (
        <div
          style={{
            ...styles.pickerPopup,
            left: popupPos.left,
          }}
          onClick={(e) => e.stopPropagation()} >
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

/* =========================
   SlotTable component
   ========================= */
export default function SlotTable({ slot, onChanged, isProtected, isLoadingData,globalZoom = 1 }) {
 const [open, setOpen] = useState(true);
  const [localZoom, setLocalZoom] = useState(1);
  const [localItems, setLocalItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());

  const [selectedCell, setSelectedCell] = useState(null);
  const [anchorCell, setAnchorCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  const role = "admin";
  const themeColor = role === "admin" ? "#000000" : "#7b4397";

  const [isUnlocked, setIsUnlocked] = useState(!isProtected);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const managerRef = useRef(null);
  const instanceKey = useRef(
    sanitizeKey(slot.slotHeader || `slot-${Math.random().toString(36).slice(2, 8)}`)
  ).current;

  const tableWrapperRef = useRef(null);
  const localItemsRef = useRef(localItems);
  const filteredItemsRef = useRef([]);
  const editingCellRef = useRef(editingCell);
  const editValueRef = useRef(editValue);
  const inputRef = useRef(null);
  const shouldSelectAllOnFocusRef = useRef(true);
  const moveCaretToEndOnFocusRef = useRef(false);
  const isMouseSelectingRef = useRef(false);
  const dragAnchorCellRef = useRef(null);
  const undoStackRef = useRef([]);
  const isUndoRunningRef = useRef(false);
  const openRef = useRef(open);
  const isUnlockedRef = useRef(isUnlocked);
  const isUpdatingRef = useRef(isUpdating);
  const refreshInFlightRef = useRef(false);
const effectiveZoom = useMemo(() => {
  let next = globalZoom * localZoom;
  if (next < 0.4) next = 0.4;
  if (next > 2.5) next = 2.5;
  return Number(next.toFixed(2));
}, [globalZoom, localZoom]);
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
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  useEffect(() => {
    isUpdatingRef.current = isUpdating;
  }, [isUpdating]);

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
    if (!wrapper || !open) return;

    const handleTrackpadHorizontalScroll = (e) => {
      const targetTag = String(e.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select", "option"].includes(targetTag)) return;

      const canScrollHorizontally = wrapper.scrollWidth > wrapper.clientWidth + 1;
      if (!canScrollHorizontally) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const previousLeft = wrapper.scrollLeft;

      if (absX > 0) {
        wrapper.scrollLeft += e.deltaX;
      } else if (absY > 0) {
        wrapper.scrollLeft += e.deltaY;
      }

      if (wrapper.scrollLeft !== previousLeft) {
        e.preventDefault();
      }
    };

    wrapper.addEventListener("wheel", handleTrackpadHorizontalScroll, { passive: false });

    return () => {
      wrapper.removeEventListener("wheel", handleTrackpadHorizontalScroll);
    };
 }, [open, effectiveZoom, localItems.length]);

  useEffect(() => {
    const nextItems = slot.items || [];

    if (areItemListsEqual(localItemsRef.current, nextItems)) {
      return;
    }

    setLocalItems(nextItems);

    setSelectedRows((prev) => {
      if (!prev.size) return prev;

      const nextIds = new Set(nextItems.map((item) => item.tuitionId));
      const filtered = new Set([...prev].filter((id) => nextIds.has(id)));

      return filtered.size === prev.size ? prev : filtered;
    });
  }, [slot.items]);

  useEffect(() => {
    const mgr = getGlobalSearchManager();
    managerRef.current = mgr;

    const unsubscribe = mgr.subscribe((state) => {
      setSearchTerm(state.term || "");
    });

    return () => {
      unsubscribe();
      mgr.setActive(instanceKey, false);
    };
  }, [instanceKey]);

  useEffect(() => {
    const mgr = managerRef.current;
    if (!mgr) return;
    mgr.setActive(instanceKey, open && isUnlocked);

    return () => {
      mgr.setActive(instanceKey, false);
    };
  }, [open, isUnlocked, instanceKey]);

  useEffect(() => {
    if (typeof onChanged !== "function") return;

    const maybeRefresh = async () => {
      if (refreshInFlightRef.current) return;
      if (!openRef.current) return;
      if (!isUnlockedRef.current) return;
      if (isUpdatingRef.current) return;
      if (editingCellRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      refreshInFlightRef.current = true;

      try {
        await onChanged();
      } catch (error) {
        console.error("Auto refresh failed", error);
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(maybeRefresh, AUTO_REFRESH_INTERVAL);

    const handleWindowFocus = () => {
      maybeRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        maybeRefresh();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    maybeRefresh();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onChanged]);

  const filteredItems = useMemo(() => {
    return localItems.filter((item) => itemMatchesSearch(item, searchTerm));
  }, [localItems, searchTerm]);

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
  }, [filteredItems.length, selectedCell]);

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
          node.focus();
          node.click();
          node.dispatchEvent(
            new MouseEvent("mousedown", {
              view: window,
              bubbles: true,
              cancelable: true,
            })
          );
        } catch (err) {}

        if (col?.kind === "select") {
          try {
            node.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "ArrowDown",
                code: "ArrowDown",
                bubbles: true,
              })
            );
          } catch (err) {}
        }
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
          _source: "target",
        };

        await api.patch(`/target/${encodeURIComponent(change.tuitionId)}`, payload);
      }
    } catch (error) {
      console.error("Undo failed", error);
      if (onChanged) await onChanged();
    } finally {
      isUndoRunningRef.current = false;
    }
  };

  useEffect(() => {
    const handleUndoHotkey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      if (String(e.key).toLowerCase() !== "z") return;

      const activeEl = document.activeElement;
      const insideThisTable = !!tableWrapperRef.current?.contains(activeEl);

      if (!insideThisTable) return;

      const activeTag = String(activeEl?.tagName || "").toUpperCase();
      const isEditorFocused =
        editingCellRef.current &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);

      if (isEditorFocused) return;

      e.preventDefault();
      undoLastChange();
    };

    document.addEventListener("keydown", handleUndoHotkey);
    return () => document.removeEventListener("keydown", handleUndoHotkey);
  }, [onChanged]);

  const firstMatchRowId =
    searchTerm && filteredItems[0]?.tuitionId
      ? `row-${instanceKey}-${sanitizeKey(String(filteredItems[0].tuitionId))}`
      : null;

  useEffect(() => {
    if (!firstMatchRowId) return;
    if (!open) setOpen(true);

    const timer = setTimeout(() => {
      const el = document.getElementById(firstMatchRowId);
      if (!el) return;

      try {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

        const prevOutline = el.style.outline;
        const prevTransition = el.style.transition;
        const prevBoxShadow = el.style.boxShadow;

        el.style.outline = "3px solid rgba(255, 193, 7, 0.95)";
        el.style.boxShadow = "inset 0 0 0 9999px rgba(255, 245, 157, 0.35)";
        el.style.transition = "outline 0.25s ease, box-shadow 0.25s ease";

        const clearTimer = setTimeout(() => {
          el.style.outline = prevOutline || "";
          el.style.transition = prevTransition || "";
          el.style.boxShadow = prevBoxShadow || "";
        }, 1800);

        return () => clearTimeout(clearTimer);
      } catch (e) {
        // ignore
      }
    }, open ? 80 : 260);

    return () => clearTimeout(timer);
  }, [firstMatchRowId, open]);

  const getColumnIndex = (colId) => gridColumnIds.findIndex((id) => id === colId);

  const openEditorPicker = (element, col) => {
    if (!element || !(col?.kind === "select" || col?.type === "date")) return;

    requestAnimationFrame(() => {
      try {
        if (typeof element.showPicker === "function") {
          element.showPicker();
          return;
        }
      } catch (err) {}

      try {
        element.focus();
        element.click();
        element.dispatchEvent(
          new MouseEvent("mousedown", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      } catch (err) {}

      if (col?.kind === "select") {
        try {
          element.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "ArrowDown",
              code: "ArrowDown",
              bubbles: true,
            })
          );
        } catch (err) {}
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
      case "parentsContact":
        return item.parentsContact ?? item.parentContact ?? "";
      case "className":
        return item.className ?? item.class ?? "";
      case "subjects":
        return item.subjects ?? item.subject ?? "";
      case "tutorFees":
        return item.tutorFees ?? item.tutorFee ?? "";
      case "syncFlag":
        return item.syncFlag ?? item.sync ?? "";
      default:
        return item[col.field] ?? "";
    }
  };

  const buildPatchForColumn = (colId, value) => {
    switch (colId) {
      case "demoTime":
        return { demoTime: value };
      case "tuitionName":
        return { tuitionName: value };
      case "source":
        return { source: value };
      case "country":
        return { country: value };
      case "parentsContact":
        return { parentsContact: value, parentContact: value };
      case "className":
        return { className: value, class: value };
      case "subjects":
        return { subjects: value, subject: value };
      case "tutorName":
        return { tutorName: value };
      case "tutorFees":
        return { tutorFees: value, tutorFee: value };
      case "rejectedTutor":
        return { rejectedTutor: value };
      case "status":
        return { status: stringifyMultiStatus(value) };
      case "feedback":
        return { feedback: value };
      case "demoDate":
        return { demoDate: value };
      case "demoRating":
        return { demoRating: value };
      case "syncFlag":
        return { syncFlag: value, sync: value };
      default:
        return {};
    }
  };

  const updateRecordFields = async (item, patchFields, options = {}) => {
    const { refreshAfter = true, skipHistory = false } = options;

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

      const payload = { ...currentItem, ...patchFields, _source: "target" };

      await api.patch(`/target/${encodeURIComponent(item.tuitionId)}`, payload);

      if (onChanged && refreshAfter) {
        onChanged();
      }
    } catch (e) {
      alert("Update failed.");
      if (onChanged) await onChanged();
    }
  };

  const updateRecord = async (item, field, newValue, options = {}) => {
    await updateRecordFields(item, { [field]: newValue }, options);
  };

  const persistStatusEditorValue = async (item, nextValue) => {
    const normalizedValue = stringifyMultiStatus(nextValue);
    const currentValue = stringifyMultiStatus(getCellValue(item, gridColumnMap.status));

    if (normalizedValue === currentValue) return;
    await updateRecordFields(item, buildPatchForColumn("status", normalizedValue), {
      refreshAfter: false,
    });
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

      if (row < 0 || row >= filteredItemsRef.current.length) {
        return { rowIndex, colId };
      }

      colIndex = direction > 0 ? -1 : gridColumns.length;
    }
  };

  const startEditingCell = (rowIndex, colId, forcedValue = null, options = {}) => {
    const col = gridColumnMap[colId];
    const item = filteredItemsRef.current[rowIndex];

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
    const item = filteredItemsRef.current[rowIndex];

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

    const updatesById = new Map();
    const historyChanges = [];

    selectedCells.forEach((key) => {
      const { rowIndex, colId } = parseCellKey(key);
      const col = gridColumnMap[colId];
      const item = filteredItemsRef.current[rowIndex];

      if (!item || !col?.editable) return;

      const patch = buildPatchForColumn(colId, "");
      if (!Object.keys(patch).length) return;

      const prevPatch = updatesById.get(item.tuitionId)?.patch || {};
      updatesById.set(item.tuitionId, { item, patch: { ...prevPatch, ...patch } });
    });

    if (!updatesById.size) return;

    updatesById.forEach((entry) => {
      const currentItem =
        localItemsRef.current.find((x) => x.tuitionId === entry.item.tuitionId) || entry.item;

      const beforePatch = {};
      const afterPatch = {};

      Object.keys(entry.patch).forEach((field) => {
        const beforeVal = currentItem?.[field] ?? "";
        const afterVal = entry.patch[field] ?? "";

        if (String(beforeVal) !== String(afterVal)) {
          beforePatch[field] = beforeVal;
          afterPatch[field] = afterVal;
        }
      });

      if (Object.keys(afterPatch).length) {
        historyChanges.push({
          tuitionId: entry.item.tuitionId,
          beforePatch,
          afterPatch,
        });
      }
    });

    if (historyChanges.length) {
      pushUndoEntry(historyChanges);
    }

    setLocalItems((prev) =>
      prev.map((item) => {
        const entry = updatesById.get(item.tuitionId);
        return entry ? { ...item, ...entry.patch } : item;
      })
    );

    clearEditingState();

    for (const [, entry] of updatesById.entries()) {
      try {
        const currentItem =
          localItemsRef.current.find((x) => x.tuitionId === entry.item.tuitionId) || entry.item;
        const payload = { ...currentItem, ...entry.patch, _source: "target" };
        await api.patch(`/target/${encodeURIComponent(entry.item.tuitionId)}`, payload);
      } catch (error) {
        console.error("Bulk clear update failed", error);
      }
    }

    if (onChanged) onChanged();
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

    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "z") {
      e.preventDefault();
      undoLastChange();
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
      col.kind !== "multiselect" &&
      col.type !== "date" &&
      col.type !== "time" &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      const item = filteredItemsRef.current[rowIndex];
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

    const isFeedbackEditor = colId === "feedback";
    const isStatusEditor = col?.kind === "multiselect";
    const isFreeCursorEditor = isFeedbackEditor;

    if (e.key === "Enter") {
      if (isFeedbackEditor && e.shiftKey) {
        return;
      }

      e.preventDefault();

      if (isStatusEditor) {
        commitEdit({ rowIndex, colId });
        selectSingleCell(rowIndex, colId, true);
        return;
      }

      if (col?.kind === "select" || col?.type === "date") {
        const nextCell = getNextEditableCell(rowIndex, colId, 1);
        commitEdit(nextCell);
        selectSingleCell(nextCell.rowIndex, nextCell.colId, true);
        return;
      }

      if (isFeedbackEditor) {
        commitEdit({ rowIndex, colId });
        selectSingleCell(rowIndex, colId, true);
        return;
      }

      const nextRow = Math.min(rowIndex + 1, filteredItems.length - 1);
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

    if (isFreeCursorEditor) {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit({ rowIndex, colId });
      }
      return;
    }

    if (col?.kind !== "select" && col?.kind !== "multiselect" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowUp") {
      e.preventDefault();
      const nextRow = Math.max(0, rowIndex - 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && col?.kind !== "multiselect" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = Math.min(filteredItems.length - 1, rowIndex + 1);
      commitEdit({ rowIndex: nextRow, colId });
      selectSingleCell(nextRow, colId, true);
      return;
    }

    if (col?.kind !== "select" && col?.kind !== "multiselect" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowLeft") {
      e.preventDefault();
      const currentColIndex = getColumnIndex(colId);
      const nextColIndex = Math.max(0, currentColIndex - 1);
      const nextColId = gridColumnIds[nextColIndex];
      commitEdit({ rowIndex, colId: nextColId });
      selectSingleCell(rowIndex, nextColId, true);
      return;
    }

    if (col?.kind !== "select" && col?.kind !== "multiselect" && col?.type !== "date" && col?.type !== "time" && e.key === "ArrowRight") {
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

  const moveRow = async (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === localItems.length - 1) return;

    const newItems = [...localItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setLocalItems(newItems);

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        tuitionId: item.tuitionId,
        orderIndex: idx,
      }));
      await api.post("/target/reorder", { items: reorderPayload });
    } catch (error) {
      alert("Nayi tarteeb save nahi ho saki. Backend check karein.");
      if (onChanged) await onChanged();
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

    const mgr = managerRef.current;
    if (mgr) mgr.setTerm("");

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        tuitionId: item.tuitionId,
        orderIndex: idx,
      }));
      await api.post("/target/reorder", { items: reorderPayload });
    } catch (error) {
      alert("Nayi tarteeb save nahi ho saki. Backend check karein.");
      if (onChanged) await onChanged();
    }
  };

  const toggleRowSelection = (tuitionId) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(tuitionId)) newSet.delete(tuitionId);
    else newSet.add(tuitionId);
    setSelectedRows(newSet);
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD_SECRET) {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      setOpen(true);
    } else {
      setPasswordError("Incorrect Password");
    }
  };

  const handleHeaderClick = () => {
    if (isProtected && !isUnlocked) {
      setShowPasswordModal(true);
    } else {
      setOpen(true);
    }
  };

 const handleZoom = (e, factor) => {
  e.stopPropagation();
  setLocalZoom((prev) => {
    let newZoom = prev + factor;
    if (newZoom < 0.5) newZoom = 0.5;
    if (newZoom > 2) newZoom = 2;
    return Number(newZoom.toFixed(2));
  });
};

const resetLocalZoom = (e) => {
  e.stopPropagation();
  setLocalZoom(1);
};
  async function removeItem(tuitionId) {
    if (
      !window.confirm(
        "Kya aap is row ko TODAY DEMO se delete karna chahte hain?\n\n(Monthly Sheet mein record safe rahega)"
      )
    ) {
      return;
    }

    try {
      setIsUpdating(true);
      await api.delete(`/target/${encodeURIComponent(tuitionId)}`);
      if (onChanged) await onChanged();
    } catch (error) {
      const msg = error.response?.data?.message || "Delete failed";
      alert("Delete failed: " + msg);
    } finally {
      setIsUpdating(false);
    }
  }

  const renderDisplayValue = (col, val) => {
    if (col.pill === "status") return renderPillList(val, getStatusStyle, searchTerm);
    if (col.pill === "source") return renderPill(val, getSourceStyle, searchTerm);
    if (col.pill === "demoRating") return renderPill(val, getDemoRatingStyle, searchTerm);
    if (col.type === "time" && val) return highlightText(format12Hour(val), searchTerm);
    return highlightText(val || "", searchTerm);
  };

  const getCellBaseBackground = (item, col) => {
    const value = getCellValue(item, col);

    if (col.id === "tuitionName") return item.tuitionNameColor || "inherit";
    if (col.id === "rejectedTutor") return columnColors["Rejected Tutor"];
    if (col.id === "feedback" && feedbackContainsSatisfied(value)) return "#16a34a";
    return "inherit";
  };

  const renderGridCell = (item, rowIndex, col) => {
    const cellKey = getCellKey(rowIndex, col.id);
    const isSelected = selectedCells.has(cellKey);
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;

    const value = getCellValue(item, col);
    const baseBackground = getCellBaseBackground(item, col);

    const commonTdStyle = {
      ...styles.td,
      padding:
        col.kind === "tuitionName"
          ? "0 10px"
          : col.id === "status"
          ? "6px 8px"
          : col.id === "feedback"
          ? "6px 10px"
          : col.pill
          ? "0 5px"
          : "0 10px",
      height: col.id === "status" ? "auto" : "35px",
      minHeight: col.id === "status" ? "52px" : "35px",
      cursor: col.editable ? "cell" : "default",
      backgroundColor: isEditing ? "#ffffff" : baseBackground,
      color: !isEditing && col.id === "feedback" && feedbackContainsSatisfied(value) ? "#ffffff" : "inherit",
      boxShadow: isSelected ? "inset 0 0 0 2px #107c41" : "none",
      position: "relative",
      textAlign: col.pill ? "center" : "center",
      whiteSpace: col.id === "feedback" ? "normal" : "nowrap",
    };

    if (isEditing && col.kind === "multiselect") {
      return (
        <td style={{ ...commonTdStyle, verticalAlign: "top" }}>
          <StatusMultiEditor
            inputRef={inputRef}
            value={editValue}
            options={col.options}
            onChange={(nextValue) => {
              editValueRef.current = nextValue;
              setEditValue(nextValue);
            }}
            onImmediatePersist={(nextValue) => {
              persistStatusEditorValue(item, nextValue);
            }}
            onCommit={() => commitEdit({ rowIndex, colId: col.id })}
            onCancel={() => cancelEdit({ rowIndex, colId: col.id })}
          />
        </td>
      );
    }

    if (isEditing && col.kind === "select") {
      return (
        <td style={commonTdStyle}>
          <select
            ref={inputRef}
            autoFocus
            style={styles.inlineSelect}
            value={editValue}
            onFocus={(e) => openEditorPicker(e.currentTarget, col)}
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
              style={{ ...styles.inlineInput, flex: 1 }}
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
                onChange={(c) => updateRecord(item, "tuitionNameColor", c)}
                pickerId={`tuitionNameColor-${instanceKey}-${item.tuitionId}`}
                activeColorPicker={activeColorPicker}
                onOpen={setActiveColorPicker}
                onClose={() => setActiveColorPicker(null)}
              />
            </div>
          </div>
        </td>
      );
    }

    if (isEditing && col.id === "feedback") {
      return (
        <td style={{ ...commonTdStyle, verticalAlign: "top" }}>
          <textarea
            ref={inputRef}
            autoFocus
            style={styles.inlineTextarea}
            value={editValue}
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

    if (isEditing) {
      return (
        <td style={commonTdStyle}>
          <input
            ref={inputRef}
            autoFocus
            type={col.type || "text"}
            style={{ ...styles.inlineInput, flex: 1 }}
            value={editValue}
            onFocus={(e) => openEditorPicker(e.currentTarget, col)}
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
          <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "8px" }}>
            <span
              style={{
                flex: 1,
              
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {highlightText(value || "", searchTerm)}
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
                onChange={(c) => updateRecord(item, "tuitionNameColor", c)}
                pickerId={`tuitionNameColor-${instanceKey}-${item.tuitionId}`}
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

  const showSkeleton = isLoadingData || isUpdating;

  return (
    <>
      <style>{`
        .excel-cell:focus { outline: 2px solid #107c41; outline-offset: -2px; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
        .skeleton-box {
          height: 20px;
          width: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .match-row {
          box-shadow: inset 0 0 0 9999px rgba(255, 248, 196, 0.22);
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <GlobalSearchHost />

      <div style={styles.card}>
        <div style={styles.header(open, themeColor)} onClick={handleHeaderClick}>
          <div>
            <h3 style={styles.headerTitle}>
              {isProtected && !isUnlocked ? "🔒 " : ""} {slot.slotHeader}
            </h3>
            <span style={styles.headerMeta}>
              {slot.displayRange} • {filteredItems.length} records
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>{open ? "▲ Collapse" : "▼ Expand"}</div>
          </div>
        </div>

        {open && isUnlocked ? (
          <div style={styles.tableWrapper} ref={tableWrapperRef}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "8px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedRows.size > 0 && (
                  <>
                    <button
                      onClick={() => moveSelected("up")}
                      style={{
                        padding: "8px 12px",
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
                        padding: "8px 12px",
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
                        padding: "6px 10px",
                        background: "#f0f0f0",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      {selectedRows.size} rows selected
                    </span>

                    <button
                      onClick={() => setSelectedRows(new Set())}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Clear Sel
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={(e) => handleZoom(e, -0.1)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  -
                </button>

                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                 Local {Math.round(localZoom * 100)}% | Final {Math.round(effectiveZoom * 100)}%
                </span>

                <button
                  onClick={(e) => handleZoom(e, 0.1)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div
              style={{
                zoom: effectiveZoom,
                width: "max-content",
                minWidth: "100%",
              }}
            >
              <table style={styles.table}>
                <thead>
                  <tr>
                    <TH style={{ width: "42px", minWidth: "42px", textAlign: "center", background: "#e5e7eb" }}>✓</TH>
                    <TH style={{ width: "40px", minWidth: "40px", textAlign: "center", background: "#e5e7eb" }}>Sort</TH>
                    <TH style={{ width: "30px", minWidth: "30px", textAlign: "center", background: "#e5e7eb" }}>🎨</TH>

                    {gridColumns.map((col) => (
                      <TH
                        key={col.id}
                        style={{
                          minWidth: col.width,
                          width: col.width,
                          color: col.id === "rejectedTutor" ? "#c10000" : undefined,
                        }}
                      >
                        {col.label}
                      </TH>
                    ))}

                    <TH style={{ width: "88px", minWidth: "88px", textAlign: "center", background: "#e5e7eb" }}>Action</TH>
                  </tr>
                </thead>

                <tbody>
                  {showSkeleton ? (
                    <TableSkeleton />
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={gridColumns.length + 4}
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: "#999",
                          padding: "15px",
                        }}
                      >
                        No records in this slot
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((it, visibleIndex) => {
                      const originalIndex = localItems.findIndex((item) => item.tuitionId === it.tuitionId);
                      const rowId = `row-${instanceKey}-${sanitizeKey(String(it.tuitionId))}`;
                      const rowMatched = !!searchTerm && itemMatchesSearch(it, searchTerm);

                      return (
                        <tr
                          id={rowId}
                          key={it.tuitionId}
                          className={rowMatched ? "match-row" : ""}
                          style={{
                            backgroundColor: it.rowColor || "inherit",
                            transition: "background 0.2s, box-shadow 0.2s",
                          }}
                          tabIndex={-1}
                        >
                          <td style={{ ...styles.td, textAlign: "center", backgroundColor: "inherit" }}>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(it.tuitionId)}
                              onChange={() => toggleRowSelection(it.tuitionId)}
                              style={{ cursor: "pointer", width: "18px", height: "18px" }}
                            />
                          </td>

                          <td style={{ ...styles.td, textAlign: "center", backgroundColor: "inherit" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
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
                                disabled={originalIndex === localItems.length - 1}
                                style={{
                                  ...styles.moveBtn,
                                  opacity: originalIndex === localItems.length - 1 ? 0.3 : 1,
                                }}
                              >
                                ▼
                              </button>
                            </div>
                          </td>

                          <td style={{ ...styles.td, textAlign: "center", backgroundColor: "inherit" }}>
                            <ColorSwatch
                              color={it.rowColor || "#ffffff"}
                              onChange={(c) => updateRecord(it, "rowColor", c)}
                              pickerId={`rowColor-${instanceKey}-${it.tuitionId}`}
                              activeColorPicker={activeColorPicker}
                              onOpen={setActiveColorPicker}
                              onClose={() => setActiveColorPicker(null)}
                            />
                          </td>

                          {gridColumns.map((col) => renderGridCell(it, visibleIndex, col))}

                          <td
                            tabIndex={0}
                            onKeyDown={handleGridKeyDown}
                            className="excel-cell"
                            style={{ ...styles.td, textAlign: "center", backgroundColor: "inherit" }}
                          >
                            <button style={styles.actionBtn} onClick={() => removeItem(it.tuitionId)}>
                              Del
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
        ) : null}

        {open && !isUnlocked && isProtected ? (
          <div style={styles.lockedPlaceholder} onClick={() => setShowPasswordModal(true)}>
            <span style={{ fontSize: "24px" }}>🔒</span>
            <p>This content is password protected.</p>
            <button style={styles.btn(false)}>Enter Password</button>
          </div>
        ) : null}
      </div>

      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <span style={styles.lockIcon}>🔐</span>
            <h3 style={{ marginTop: 0, color: "#333" }}>Restricted Access</h3>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: 20 }}>
              Please enter the password to view Monthly Tuitions.
            </p>

            <form onSubmit={handleUnlock}>
              <input
                type="password"
                autoFocus
                placeholder="Enter Password"
                style={{
                  ...styles.inlineInput,
                  textAlign: "center",
                  fontSize: "16px",
                  padding: "12px",
                  marginBottom: "10px",
                  border: "1px solid #ccc",
                }}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
              />

              {passwordError && (
                <div style={{ color: "red", fontSize: "12px", marginBottom: "10px" }}>
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                style={{ ...styles.btn(false), width: "100%", padding: "12px", fontSize: "14px" }}
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* -----------------------
   Subcomponents
   ----------------------- */
const TH = ({ children, style }) => <th style={{ ...styles.th, ...style }}>{children}</th>;

/* =====================
   Small helpers
   ===================== */
function sanitizeKey(k) {
  return String(k).replace(/[^\w-]/g, "_");
}