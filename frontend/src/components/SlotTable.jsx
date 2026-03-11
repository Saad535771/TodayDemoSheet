import React, { useState, useEffect, useRef, useMemo } from "react";
import { api } from "../api/api.js";

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    overflow: "hidden",
    marginBottom: "24px",
    border: "1px solid #eef0f3",
    fontFamily: "'Calibri', sans-serif",
    position: "relative",
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
    overflowX: "auto",
    overflowY: "auto",
    background: "#ffffff",
    maxHeight: "500px",
  },
  table: {
    width: "100%",
    height: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    background: "#f3f2f1",
    color: "#323130",
    fontWeight: "600",
    padding: "8px 10px",
    textAlign: "left",
    border: "1px solid #c8c6c4",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  td: {
    padding: "0",
    textAlign: "center",
    border: "1px solid #c8c6c4",
    verticalAlign: "middle",
    height: "35px",
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
    width: "24px",
    height: "24px",
    border: "2px solid #666",
    cursor: "pointer",
    borderRadius: "4px",
    overflow: "hidden",
    display: "inline-block",
  },
  pickerPopup: {
    position: "static",
    top:"0px" ,
    left: "0px",
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "6px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    zIndex: 3000,
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

function useDebouncedValue(value, delay = 350) {
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
    <div style={{ position: "relative", zIndex: 99999 }}>
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
            width: "min(1100px,95vw)",
           
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
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "14px",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraftTerm("");
                manager.clear();
              }
            }}
          />

          <button
            type="button"
            onClick={() => {
              setDraftTerm("");
              manager.clear();
            }}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== ColorSwatch ==================== */
const ColorSwatch = ({ color = "#ffffff", onChange }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
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

  const openPopup = () => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();
    setPopupPos({
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
    });
    setShowPopup(true);
  };

  useEffect(() => {
    if (!showPopup) return;

    const handleOutside = (e) => {
      if (swatchRef.current && !swatchRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showPopup]);

  return (
    <div ref={swatchRef} style={{ position: "relative", display: "inline-block" }}>
      <div
        onClick={openPopup}
        style={{ ...styles.colorSwatch, backgroundColor: color }}
        title="Click to change color (Excel style)"
      />

      {showPopup && (
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
                  setShowPopup(false);
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

/* ====================
   Utilities & constants
   ==================== */
function format12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}

const DEMO_RATING_VALUES = ["", "Average Demo", "Strong Demo", "Weak Demo"];
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
const columnColors = { "Rejected Tutor": "#ffebee" };
const PASSWORD_SECRET = "admin123";

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
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "inline-block",
        ...style,
      }}
    >
      {highlightText(val, searchTerm)}
    </span>
  );
};

/* keyboard nav */
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

/* TableSkeleton */
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

/* =========================
   SlotTable component
   ========================= */
export default function SlotTable({ slot, onChanged, isProtected, isLoadingData }) {
  const [open, setOpen] = useState(slot.items?.length > 0);
  const [zoom, setZoom] = useState(1);
  const [localItems, setLocalItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());

  const role = "admin";
  const themeColor = role === "admin" ? "#1e3c72" : "#7b4397";

  const [isUnlocked, setIsUnlocked] = useState(!isProtected);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const managerRef = useRef(null);
  const instanceKey = useRef(
    sanitizeKey(slot.slotHeader || `slot-${Math.random().toString(36).slice(2, 8)}`)
  ).current;

  useEffect(() => {
    setLocalItems(slot.items || []);
    setSelectedRows(new Set());
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

  const filteredItems = useMemo(() => {
    return localItems.filter((item) => itemMatchesSearch(item, searchTerm));
  }, [localItems, searchTerm]);

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

  const updateRecord = async (item, field, newValue) => {
    try {
      setLocalItems((prev) =>
        prev.map((x) => (x.tuitionId === item.tuitionId ? { ...x, [field]: newValue } : x))
      );

      const payload = { ...item, [field]: newValue, _source: "target" };
      await api.patch(`/target/${encodeURIComponent(item.tuitionId)}`, payload);

      if (onChanged) await onChanged();
    } catch (e) {
      alert("Update failed.");
      if (onChanged) await onChanged();
    }
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

    let newItems = [...localItems];
    const selectedSet = new Set(selectedRows);
    const indices = [];

    newItems.forEach((item, idx) => {
      if (selectedSet.has(item.tuitionId)) indices.push(idx);
    });

    const selectedItems = indices.sort((a, b) => a - b).map((i) => newItems[i]);
    newItems = newItems.filter((item) => !selectedSet.has(item.tuitionId));

    const insertIndex =
      direction === "up"
        ? Math.max(0, indices[0] - 1)
        : Math.min(newItems.length, indices[indices.length - 1] - selectedItems.length + 1);

    newItems.splice(insertIndex, 0, ...selectedItems);
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
      setOpen((v) => !v);
    }
  };

  const handleZoom = (e, factor) => {
    e.stopPropagation();
    setZoom((prev) => {
      let newZoom = prev + factor;
      if (newZoom < 0.5) newZoom = 0.5;
      if (newZoom > 2) newZoom = 2;
      return newZoom;
    });
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
          <div style={styles.tableWrapper}>
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
                  {Math.round(zoom * 100)}%
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
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                transition: "transform 0.2s ease",
                width: `${100 / zoom}%`,
              }}
            >
              <table style={styles.table}>
                <thead>
                  <tr>
                    <TH style={{ width: "42px", textAlign: "center", background: "#e5e7eb" }}>✓</TH>
                    <TH style={{ width: "40px", textAlign: "center", background: "#e5e7eb" }}>Sort</TH>
                    <TH style={{ width: "30px", textAlign: "center", background: "#e5e7eb" }}>🎨</TH>

                    <TH>Demo Time</TH>
                    <TH>Tuition Name</TH>
                    <TH>Source</TH>
                    <TH>Country</TH>
                    <TH>Parent Contact</TH>
                    <TH>Class</TH>
                    <TH>Subject</TH>
                    <TH>Tutor Name</TH>
                    <TH>Tutor Fees</TH>
                    <TH style={{ color: "#d32f2f" }}>Rejected Tutor</TH>
                    <TH>Status</TH>
                    <TH>Feedback</TH>
                    <TH>Demo Date</TH>
                    <TH>Tuition Id</TH>
                    <TH>Demo Rating</TH>
                    <TH>Sync</TH>
                    <TH style={{ textAlign: "center" }}>Action</TH>
                  </tr>
                </thead>

                <tbody>
                  {showSkeleton ? (
                    <TableSkeleton />
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="20"
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
                    filteredItems.map((it) => {
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
                            />
                          </td>

                          <EditableCell
                            val={it.demoTime}
                            type="time"
                            onSave={(val) => updateRecord(it, "demoTime", val)}
                            width={100}
                            searchTerm={searchTerm}
                          />

                          <td
                            style={{
                              ...styles.td,
                              backgroundColor: it.tuitionNameColor || "inherit",
                              minWidth: 150,
                              padding: "0 10px",
                              height: "35px",
                              cursor: "cell",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "8px" }}>
                              <span style={{ flex: 1 }}>{highlightText(it.tuitionName || "", searchTerm)}</span>
                              <ColorSwatch
                                color={it.tuitionNameColor || "#ffffff"}
                                onChange={(c) => updateRecord(it, "tuitionNameColor", c)}
                              />
                            </div>
                          </td>

                          <EditableCell
                            val={it.source}
                            options={sourcesList}
                            onSave={(val) => updateRecord(it, "source", val)}
                            width={110}
                            searchTerm={searchTerm}
                            customRender={(val, q) => renderPill(val, getSourceStyle, q)}
                          />

                          <EditableCell
                            val={it.country}
                            onSave={(val) => updateRecord(it, "country", val)}
                            width={100}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.parentsContact || it.parentContact}
                            onSave={(val) => updateRecord(it, "parentsContact", val)}
                            width={130}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.className || it.class}
                            onSave={(val) => updateRecord(it, "className", val)}
                            width={100}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.subjects || it.subject}
                            onSave={(val) => updateRecord(it, "subjects", val)}
                            width={120}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.tutorName}
                            onSave={(val) => updateRecord(it, "tutorName", val)}
                            width={140}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.tutorFees || it.tutorFee}
                            onSave={(val) => updateRecord(it, "tutorFees", val)}
                            width={100}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.rejectedTutor}
                            onSave={(val) => updateRecord(it, "rejectedTutor", val)}
                            bg={columnColors["Rejected Tutor"]}
                            width={120}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.status}
                            options={statusList}
                            onSave={(val) => updateRecord(it, "status", val)}
                            width={140}
                            searchTerm={searchTerm}
                            customRender={(val, q) => renderPill(val, getStatusStyle, q)}
                          />

                          <EditableCell
                            val={it.feedback}
                            onSave={(val) => updateRecord(it, "feedback", val)}
                            width={180}
                            searchTerm={searchTerm}
                          />

                          <EditableCell
                            val={it.demoDate}
                            type="date"
                            onSave={(val) => updateRecord(it, "demoDate", val)}
                            width={120}
                            searchTerm={searchTerm}
                          />

                          <td
                            tabIndex={0}
                            onKeyDown={handleGridKeyDown}
                            className="excel-cell"
                            style={{
                              ...styles.td,
                              padding: "0 10px",
                              fontWeight: "bold",
                              color: "#555",
                              backgroundColor: "inherit",
                              textAlign: "left",
                            }}
                          >
                            {highlightText(it.tuitionId, searchTerm)}
                          </td>

                          <EditableCell
                            val={it.demoRating}
                            options={DEMO_RATING_VALUES}
                            onSave={(val) => updateRecord(it, "demoRating", val)}
                            width={130}
                            searchTerm={searchTerm}
                            customRender={(val, q) => renderPill(val, getDemoRatingStyle, q)}
                          />

                          <EditableCell
                            val={it.syncFlag || it.sync}
                            onSave={(val) => updateRecord(it, "syncFlag", val)}
                            width={80}
                            searchTerm={searchTerm}
                          />

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

function EditableCell({
  val,
  type = "text",
  options = [],
  onSave,
  bg,
  width,
  customRender,
  searchTerm = "",
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(val || "");
  const tdRef = useRef(null);

  useEffect(() => {
    setCurrentVal(val || "");
  }, [val]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentVal !== val) onSave(currentVal);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
      setTimeout(() => {
        if (tdRef.current) tdRef.current.focus();
      }, 10);
    }
  };

  const handleTdKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditing(true);
    } else {
      handleGridKeyDown(e);
    }
  };

  let displayValue = currentVal;
  if (type === "time" && currentVal) displayValue = format12Hour(currentVal);

  if (!isEditing) {
    return (
      <td
        ref={tdRef}
        tabIndex={0}
        className="excel-cell"
        onClick={() => setIsEditing(true)}
        onKeyDown={handleTdKeyDown}
        style={{
          ...styles.td,
          backgroundColor: bg || "inherit",
          cursor: "cell",
          minWidth: width,
          padding: customRender ? "0 5px" : "0 10px",
          height: "35px",
          textAlign: customRender ? "center" : "left",
        }}
      >
        {customRender ? customRender(displayValue, searchTerm) : highlightText(displayValue || "", searchTerm)}
      </td>
    );
  }

  return (
    <td style={{ ...styles.td, backgroundColor: "white", minWidth: width }}>
      {options.length > 0 ? (
        <select
          autoFocus
          style={{ ...styles.inlineSelect, boxShadow: "inset 0 0 0 2px #107c41" }}
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o || "--"}
            </option>
          ))}
        </select>
      ) : (
        <input
          autoFocus
          type={type}
          style={{ ...styles.inlineInput, boxShadow: "inset 0 0 0 2px #107c41" }}
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
        />
      )}
    </td>
  );
}

/* =====================
   Small helpers
   ===================== */
function sanitizeKey(k) {
  return String(k).replace(/[^\w-]/g, "_");
}