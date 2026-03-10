import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/api.js";

/* =========================
   SlotTable with GLOBAL SEARCH
   - Single floating search bar appended to body
   - All SlotTable instances subscribe and receive same term
   - Each slot scrolls to its first matching row and highlights it
   ========================= */

const styles = {
  card: { background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: "24px", border: "1px solid #eef0f3", fontFamily: "'Calibri', sans-serif", position: "relative", zIndex: 1 },
  header: (isOpen, roleColor) => ({
    background: isOpen ? `linear-gradient(135deg, ${roleColor} 0%, ${adjustColor(roleColor, -20)} 100%)` : "#ffffff",
    color: isOpen ? "#ffffff" : "#333", padding: "16px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.3s ease", borderBottom: isOpen ? "none" : "1px solid #eee",
  }),
  headerTitle: { fontSize: "18px", fontWeight: "700", margin: 0 },
  headerMeta: { fontSize: "13px", opacity: 0.85, marginTop: "4px", display: "block" },
  tableWrapper: { overflowX: "auto", background: "#ffffff", maxHeight: "500px" },
  table: { width: "100%", height: "100%", borderCollapse: "collapse", fontSize: "14px",},
  th: { background: "#f3f2f1", color: "#323130", fontWeight: "600", padding: "8px 10px", textAlign: "left", border: "1px solid #c8c6c4", position: "sticky", top: 0, zIndex: 10 },
  td: { padding: "0",textAlign: "center", border: "1px solid #c8c6c4", verticalAlign: "middle", height: "35px" },
  inlineInput: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif" },
  inlineSelect: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif", cursor: "pointer" },
  actionBtn: { padding: "6px 10px", borderRadius: "4px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer", background: "#fee2e2", color: "#b91c1c", fontFamily: "'Calibri', sans-serif" },
  moveBtn: { cursor: "pointer", border: "none", background: "transparent", fontSize: "14px", padding: "2px 6px", color: "#555" },
  colorSwatch: { width: "24px", height: "24px", border: "2px solid #666", cursor: "pointer", borderRadius: "4px", overflow: "hidden", display: "inline-block" },
  pickerPopup: {
    position: "fixed",
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "6px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    zIndex: 3000,
    width: "220px"
  },
  globalSearchContainerBaseCSS: `position:fixed; top:75px; left:50%; transform:translateX(-50%); z-index:99999; pointer-events: auto;`,
  globalSearchInnerCSS: `width:min(1100px,95%); background:white; padding:12px 18px; border-radius:10px; display:flex; gap:12px; align-items:center; box-shadow:0 10px 30px rgba(0,0,0,0.08); border:1px solid #e6e6e6;`,
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "white", padding: "30px", borderRadius: "16px", width: "90%", maxWidth: "400px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" },
  lockIcon: { fontSize: "40px", marginBottom: "15px", display: "block" },
  lockedPlaceholder: { padding: "40px", textAlign: "center", background: "#f9fafb", color: "#6b7280", cursor: "pointer" },
  btn: (loading) => ({ padding: "6px 16px", background: loading ? "#ccc" : "#10b981", color: "white", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", transition: "transform 0.1s", fontFamily: "'Calibri', sans-serif" })
};
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

/* ==================== ColorSwatch (unchanged) ==================== */
const ColorSwatch = ({ color = "#ffffff", onChange }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const swatchRef = useRef(null);

  const presets = [
    "#ffffff", "#f8f9fa", "#ffebee", "#fff3e0", "#f3e5f5", "#e8f5e9",
    "#e3f2fd", "#fff8e1", "#fce4ec", "#e0f2f1", "#f1f8e9", "#e8eaf6",
    "#ef5350", "#ff9800", "#fdd835", "#4caf50", "#2196f3", "#9c27b0",
    "#f44336", "#ff5722", "#ffc107", "#8bc34a", "#03a9f4", "#673ab7"
  ];

  const openPopup = () => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();
    setPopupPos({ top: `${rect.bottom + 8}px`, left: `${rect.left}px` });
    setShowPopup(true);
  };

  useEffect(() => {
    if (!showPopup) return;
    const handleOutside = (e) => {
      if (swatchRef.current && !swatchRef.current.contains(e.target)) setShowPopup(false);
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
          style={{ ...styles.pickerPopup, left: popupPos.left }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#444" }}>Default Colors</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: "6px", marginBottom: "12px" }}>
            {presets.map((c, i) => (
              <div
                key={i}
                onClick={() => { onChange(c); setShowPopup(false); }}
                style={{ width: "28px", height: "28px", backgroundColor: c, border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}
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
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}
const DEMO_RATING_VALUES = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = ["", "1st Demo Done", "2nd Demo Done", "payment Process", "Tuition Done", "Tuition Cancelled", "irrelevant", "Not available", "Pending"];
const columnColors = { "Rejected Tutor": "#ffebee" };
const PASSWORD_SECRET = "admin123";

const getStatusStyle = (status) => {
  switch (status) {
    case "1st Demo Done": return { backgroundColor: "black", color: "white", border: "1px solid black" };
    case "2nd Demo Done": return { backgroundColor: "#8B4513", color: "white", border: "1px solid #8B4513" };
    case "payment Process": return { backgroundColor: "#fef08a", color: "black", border: "1px solid #fef08a" };
    case "Tuition Done": return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" };
    case "Tuition Cancelled": return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" };
    case "irrelevant": return { backgroundColor: "white", color: "black", border: "1px solid #9ca3af" };
    case "Not available": return { backgroundColor: "#4c1d95", color: "white", border: "1px solid #4c1d95" };
    case "Pending": return { backgroundColor: "#3b82f6", color: "white", border: "1px solid #3b82f6" };
    default: return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};
const getDemoRatingStyle = (rating) => {
  switch (rating) {
    case "Average Demo": return { backgroundColor: "#ca8a04", color: "white", border: "1px solid #ca8a04" };
    case "Strong Demo": return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" };
    case "Weak Demo": return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" };
    default: return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};
const getSourceStyle = (source) => {
  switch (source) {
    case "mahad": return { backgroundColor: "#0ea5e9", color: "white", border: "1px solid #0ea5e9" };
    case "areeba": return { backgroundColor: "#ec4899", color: "white", border: "1px solid #ec4899" };
    case "sibgha": return { backgroundColor: "#14b8a6", color: "white", border: "1px solid #14b8a6" };
    default: return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};
const renderPill = (val, styleFn) => {
  if (!val) return "";
  const style = styleFn(val);
  return (
    <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-block", ...style }}>
      {val}
    </span>
  );
};

/* keyboard nav */
export const handleGridKeyDown = (e) => {
  const td = e.currentTarget;
  if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
    e.preventDefault();
    let target = null;
    if (e.key === 'ArrowRight') target = td.nextElementSibling;
    else if (e.key === 'ArrowLeft') target = td.previousElementSibling;
    else if (e.key === 'ArrowDown') {
      const nextTr = td.parentElement.nextElementSibling;
      if (nextTr) target = nextTr.children[td.cellIndex];
    }
    else if (e.key === 'ArrowUp') {
      const prevTr = td.parentElement.previousElementSibling;
      if (prevTr) target = prevTr.children[td.cellIndex];
    }
    if (target && target.tagName === 'TD') target.focus();
  }
};

/* TableSkeleton (unchanged) */
const TableSkeleton = () => {
  const rows = Array.from({ length: 3 });
  const cols = Array.from({ length: 18 });
  return (
    <>
      {rows.map((_, rIdx) => (
        <tr key={rIdx}>
          {cols.map((_, cIdx) => (
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
   GLOBAL SEARCH MANAGER
   - singleton attached to window.__SLOT_GLOBAL_SEARCH
   ========================= */
function ensureGlobalSearchManager() {
  if (typeof window === "undefined") return null;
  if (window.__SLOT_GLOBAL_SEARCH) return window.__SLOT_GLOBAL_SEARCH;

  const manager = {
    term: "",
    subscribers: new Set(),
    mountCount: 0,
    dom: null,
    input: null,
    label: null,
    createDOM() {
      if (this.dom) return;
      const wrapper = document.createElement("div");
      wrapper.id = "__slot_global_search_wrapper";
      wrapper.style.cssText = styles.globalSearchContainerBaseCSS;
      wrapper.style.pointerEvents = "auto"; // ensure input is clickable

      const inner = document.createElement("div");
      inner.style.cssText = styles.globalSearchInnerCSS;

      // input
      const input = document.createElement("input");
      input.type = "search";
      input.id = "__slot_global_search_input";
      input.placeholder = "Search across all slots... (type and press Enter/Wait)";
      input.style.cssText = "flex:1;padding:10px 14px;border-radius:8px;border:1px solid #c8c6c4;font-size:15px;outline:none;";
      input.autocomplete = "off";

      // clear button
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.textContent = "Clear";
      clearBtn.style.cssText = "padding:10px 14px;border-radius:6px;background:#f3f2f1;border:none;font-weight:600;cursor:pointer;";

      // label (shows active state info)
      const label = document.createElement("div");
      label.id = "__slot_global_search_label";
      label.style.cssText = "font-size:13px;color:#555;margin-left:8px;min-width:140px;text-align:right;";

      inner.appendChild(input);
      inner.appendChild(clearBtn);
      inner.appendChild(label);
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);

      this.dom = wrapper;
      this.input = input;
      this.label = label;

      // events
      input.addEventListener("input", (e) => {
        this.term = e.target.value;
        this.notify();
      });

      clearBtn.addEventListener("click", () => {
        this.term = "";
        if (this.input) this.input.value = "";
        this.notify();
      });

      // keyboard: press Escape to clear, Enter to focus first match (default behavior: we just notify)
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.term = "";
          if (this.input) this.input.value = "";
          this.notify();
        }
      });

    },
    subscribe(cb) {
      if (typeof document !== "undefined") this.createDOM();
      this.subscribers.add(cb);
      this.mountCount++;
      this.show();
      // immediately notify with current term
      cb(this.term);
      return () => {
        this.subscribers.delete(cb);
        this.mountCount = Math.max(0, this.mountCount - 1);
        if (this.mountCount === 0) this.hide();
      };
    },
    notify() {
      for (const cb of Array.from(this.subscribers)) {
        try { cb(this.term); } catch (e) { /* ignore */ }
      }
    },
    setTerm(t) {
      this.term = t || "";
      if (this.input) this.input.value = this.term;
      this.notify();
    },
    show() {
      if (!this.dom) this.createDOM();
      this.dom.style.display = "block";
    },
    hide() {
      if (!this.dom) return;
      this.dom.style.display = "none";
    },
    destroy() {
      if (this.dom && this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
      this.dom = null;
      this.input = null;
      this.label = null;
      this.subscribers.clear();
      this.mountCount = 0;
    }
  };

  window.__SLOT_GLOBAL_SEARCH = manager;
  return manager;
}

/* ===========================
   SlotTable component
   (replaces your previous file, copy-paste ready)
   =========================== */
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
  const instanceKey = useRef(sanitizeKey(slot.slotHeader || `slot-${Math.random().toString(36).slice(2,8)}`)).current;

  useEffect(() => {
    setLocalItems(slot.items || []);
    setSelectedRows(new Set());
  }, [slot.items]);

  // subscribe to global search manager (all instances get same term)
  useEffect(() => {
    const mgr = ensureGlobalSearchManager();
    managerRef.current = mgr;
    if (!mgr) return;
    const unsubscribe = mgr.subscribe((term) => {
      setSearchTerm(term || "");
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When this slot open/unlocked toggle, ensure manager visible
  useEffect(() => {
    const mgr = managerRef.current || ensureGlobalSearchManager();
    if (!mgr) return;
    if (open && isUnlocked) {
      mgr.show();
    } else {
      // If no other subscribers, manager will hide itself via unsubscribe; keep as-is
    }
  }, [open, isUnlocked]);

  // Filtered items use local searchTerm (coming from global manager)
  const filteredItems = localItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.tuitionName || "").toLowerCase().includes(term) ||
      (item.tutorName || "").toLowerCase().includes(term) ||
      (item.status || "").toLowerCase().includes(term) ||
      (item.tuitionId || "").toLowerCase().includes(term)
    );
  });

  // Scroll to first match & highlight it when searchTerm changes and there is a match
  useEffect(() => {
    if (!searchTerm) return;
    if (filteredItems.length === 0) return;

    // find first match
    const first = filteredItems[0];
    if (!first || !first.tuitionId) return;

    const rowId = `row-${instanceKey}-${sanitizeKey(String(first.tuitionId))}`;
    const el = document.getElementById(rowId);
    if (!el) return;

    // ensure slot container is expanded so target row is visible
    if (!open) setOpen(true);

    // give browser a moment to expand and render
    setTimeout(() => {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        // temporarily highlight via outline
        const prevOutline = el.style.outline;
        const prevTransition = el.style.transition;
        el.style.outline = "4px solid rgba(255, 235, 59, 0.9)"; // yellowish
        el.style.transition = "outline 0.25s ease";
        // also focus a cell inside row for keyboard users
        const firstCell = el.querySelector("td");
        if (firstCell && typeof firstCell.focus === "function") {
          firstCell.tabIndex = -1;
          firstCell.focus({ preventScroll: true });
        }
        setTimeout(() => {
          el.style.outline = prevOutline || "";
          el.style.transition = prevTransition || "";
        }, 2000);
      } catch (e) {
        // ignore
      }
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filteredItems.length]);

  const updateRecord = async (item, field, newValue) => {
    try {
      setLocalItems(prev => prev.map(x => x.tuitionId === item.tuitionId ? { ...x, [field]: newValue } : x));
      const payload = { ...item, [field]: newValue, _source: "target" };
      await api.patch(`/target/${encodeURIComponent(item.tuitionId)}`, payload);
      if (onChanged) await onChanged();
    } catch(e) {
      alert("Update failed.");
      if (onChanged) await onChanged();
    }
  };

  async function removeItem(tuitionId) {
    if (!window.confirm("Kya aap is row ko TODAY DEMO se delete karna chahte hain?\n\n(Monthly Sheet mein record safe rahega)")) return;
    try {
      setIsUpdating(true);
      const response = await api.delete(`/target/${encodeURIComponent(tuitionId)}`);
      console.log("✅ Today Demo Delete Success:", response.data);
      if (onChanged) await onChanged();
    } catch (error) {
      console.error("❌ Full Error:", error);
      const msg = error.response?.data?.message || "Delete failed";
      alert("Delete failed: " + msg);
    } finally {
      setIsUpdating(false);
    }
  }

  const moveRow = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localItems.length - 1) return;
    const newItems = [...localItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setLocalItems(newItems);

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        tuitionId: item.tuitionId,
        orderIndex: idx
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
    newItems.forEach((item, idx) => { if (selectedSet.has(item.tuitionId)) indices.push(idx); });

    const selectedItems = indices.sort((a, b) => a - b).map(i => newItems[i]);
    newItems = newItems.filter(item => !selectedSet.has(item.tuitionId));

    let insertIndex = direction === 'up'
      ? Math.max(0, indices[0] - 1)
      : Math.min(newItems.length, indices[indices.length - 1] - selectedItems.length + 1);

    newItems.splice(insertIndex, 0, ...selectedItems);
    setLocalItems(newItems);

    // clear search to avoid duplicate display behavior as you requested
    const mgr = managerRef.current;
    if (mgr) mgr.setTerm("");

    try {
      const reorderPayload = newItems.map((item, idx) => ({
        tuitionId: item.tuitionId,
        orderIndex: idx
      }));
      await api.post("/target/reorder", { items: reorderPayload });
    } catch (error) {
      alert("Nayi tarteeb save nahi ho saki. Backend check karein.");
      if (onChanged) await onChanged();
    }
  };

  const toggleRowSelection = (tuitionId) => {
    const newSet = new Set(selectedRows);
    newSet.has(tuitionId) ? newSet.delete(tuitionId) : newSet.add(tuitionId);
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
      setOpen(v => !v);
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

  // render
  return (
    <>
      <style>{`
        .excel-cell:focus { outline: 2px solid #107c41; outline-offset: -2px; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
        .skeleton-box {
          height: 20px; width: 100%; border-radius: 4px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

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
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              {open ? "▲ Collapse" : "▼ Expand"}
            </div>
          </div>
        </div>

        {open && isUnlocked ? (
          <div style={styles.tableWrapper}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedRows.size > 0 && (
                  <>
                    <button onClick={() => moveSelected('up')} style={{ padding: "8px 12px", background: "#1976d2", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>↑ Move Selected</button>
                    <button onClick={() => moveSelected('down')} style={{ padding: "8px 12px", background: "#1976d2", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>↓ Move Selected</button>
                    <span style={{ padding: "6px 10px", background: "#f0f0f0", borderRadius: "6px", fontSize: "13px" }}>{selectedRows.size} rows selected</span>
                    <button onClick={() => setSelectedRows(new Set())} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Clear Sel</button>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={(e) => handleZoom(e, -0.1)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>-</button>
                <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "40px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                <button onClick={(e) => handleZoom(e, 0.1)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>+</button>
              </div>
            </div>

            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease", width: `${100 / zoom}%` }}>
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
                    <tr><td colSpan="19" style={{...styles.td, textAlign: "center", color: "#999", padding: "15px"}}>No records in this slot</td></tr>
                  ) : filteredItems.map((it) => {
                    const originalIndex = localItems.findIndex(item => item.tuitionId === it.tuitionId);
                    const rowId = `row-${instanceKey}-${sanitizeKey(String(it.tuitionId))}`;
                    return (
                      <tr
                        id={rowId}
                        key={it.tuitionId}
                        style={{ backgroundColor: it.rowColor || "inherit", transition: "background 0.2s" }}
                        tabIndex={-1}
                      >
                        <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                          <input type="checkbox" checked={selectedRows.has(it.tuitionId)} onChange={() => toggleRowSelection(it.tuitionId)} style={{ cursor: "pointer", width: "18px", height: "18px" }} />
                        </td>

                        <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <button onClick={() => moveRow(originalIndex, 'up')} disabled={originalIndex === 0} style={{...styles.moveBtn, opacity: originalIndex === 0 ? 0.3 : 1}}>▲</button>
                            <button onClick={() => moveRow(originalIndex, 'down')} disabled={originalIndex === localItems.length - 1} style={{...styles.moveBtn, opacity: originalIndex === localItems.length - 1 ? 0.3 : 1}}>▼</button>
                          </div>
                        </td>

                        <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                          <ColorSwatch color={it.rowColor || "#ffffff"} onChange={(c) => updateRecord(it, "rowColor", c)} />
                        </td>

                        <EditableCell val={it.demoTime} type="time" onSave={(val) => updateRecord(it, "demoTime", val)} width={100} />

                        <td style={{ ...styles.td, backgroundColor: it.tuitionNameColor || "inherit", minWidth: 150, padding: "0 10px", height: "35px", cursor: "cell" }}>
                          <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "8px" }}>
                            <span style={{ flex: 1 }}>{it.tuitionName || ""}</span>
                            <ColorSwatch color={it.tuitionNameColor || "#ffffff"} onChange={(c) => updateRecord(it, "tuitionNameColor", c)} />
                          </div>
                        </td>

                        <EditableCell val={it.source} options={sourcesList} onSave={(val) => updateRecord(it, "source", val)} width={110} customRender={(val) => renderPill(val, getSourceStyle)} />
                        <EditableCell val={it.country} onSave={(val) => updateRecord(it, "country", val)} width={100} />
                        <EditableCell val={it.parentsContact || it.parentContact} onSave={(val) => updateRecord(it, "parentsContact", val)} width={130} />
                        <EditableCell val={it.className || it.class} onSave={(val) => updateRecord(it, "className", val)} width={100} />
                        <EditableCell val={it.subjects || it.subject} onSave={(val) => updateRecord(it, "subjects", val)} width={120} />
                        <EditableCell val={it.tutorName} onSave={(val) => updateRecord(it, "tutorName", val)} width={140} />
                        <EditableCell val={it.tutorFees || it.tutorFee} onSave={(val) => updateRecord(it, "tutorFees", val)} width={100} />
                        <EditableCell val={it.rejectedTutor} onSave={(val) => updateRecord(it, "rejectedTutor", val)} bg={columnColors["Rejected Tutor"]} width={120} />
                        <EditableCell val={it.status} options={statusList} onSave={(val) => updateRecord(it, "status", val)} width={140} customRender={(val) => renderPill(val, getStatusStyle)} />
                        <EditableCell val={it.feedback} onSave={(val) => updateRecord(it, "feedback", val)} width={180} />
                        <EditableCell val={it.demoDate} type="date" onSave={(val) => updateRecord(it, "demoDate", val)} width={120} />

                        <td tabIndex={0} onKeyDown={handleGridKeyDown} className="excel-cell" style={{...styles.td, padding: "0 10px", fontWeight: "bold", color: "#555", backgroundColor: "inherit"}}>
                          {it.tuitionId}
                        </td>

                        <EditableCell val={it.demoRating} options={DEMO_RATING_VALUES} onSave={(val) => updateRecord(it, "demoRating", val)} width={130} customRender={(val) => renderPill(val, getDemoRatingStyle)} />
                        <EditableCell val={it.syncFlag || it.sync} onSave={(val) => updateRecord(it, "syncFlag", val)} width={80} />

                        <td tabIndex={0} onKeyDown={handleGridKeyDown} className="excel-cell" style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                          <button style={styles.actionBtn} onClick={() => removeItem(it.tuitionId)}>Del</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {open && !isUnlocked && isProtected ? (
           <div style={styles.lockedPlaceholder} onClick={() => setShowPasswordModal(true)}>
              <span style={{fontSize: "24px"}}>🔒</span>
              <p>This content is password protected.</p>
              <button style={styles.btn(false)}>Enter Password</button>
           </div>
        ) : null}
      </div>

      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <span style={styles.lockIcon}>🔐</span>
            <h3 style={{marginTop: 0, color: "#333"}}>Restricted Access</h3>
            <p style={{color: "#666", fontSize: "14px", marginBottom: 20}}>
              Please enter the password to view Monthly Tuitions.
            </p>
            <form onSubmit={handleUnlock}>
              <input 
                type="password" 
                autoFocus
                placeholder="Enter Password" 
                style={{...styles.inlineInput, textAlign: "center", fontSize: "16px", padding: "12px", marginBottom: "10px", border: "1px solid #ccc"}}
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
              />
              {passwordError && <div style={{color: "red", fontSize: "12px", marginBottom: "10px"}}>{passwordError}</div>}
              <button type="submit" style={{...styles.btn(false), width: "100%", padding: "12px", fontSize: "14px"}}>
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
const TH = ({ children, style }) => <th style={{...styles.th, ...style}}>{children}</th>;
function EditableCell({ val, type = "text", options = [], onSave, bg, width, customRender }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(val || "");
  const tdRef = useRef(null);
  useEffect(() => { setCurrentVal(val || ""); }, [val]);
  const handleBlur = () => {
    setIsEditing(false);
    if (currentVal !== val) onSave(currentVal);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
      setTimeout(() => { if (tdRef.current) tdRef.current.focus(); }, 10);
    }
  };
  const handleTdKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(true);
    } else {
      handleGridKeyDown(e);
    }
  };
  let displayValue = currentVal;
  if (type === 'time' && currentVal) displayValue = format12Hour(currentVal);
  if (!isEditing) {
    return (
      <td 
        ref={tdRef}
        tabIndex={0}
        className="excel-cell"
        onClick={() => setIsEditing(true)} 
        onKeyDown={handleTdKeyDown}
        style={{ ...styles.td, backgroundColor: bg ? bg : "inherit", cursor: "cell", minWidth: width, padding: customRender ? "0 5px" : "0 10px", height: "35px" }}
      >
        {customRender ? customRender(displayValue) : (displayValue || "")}
      </td>
    );
  }
  return (
    <td style={{ ...styles.td, backgroundColor: "white", minWidth: width }}>
      {options.length > 0 ? (
        <select autoFocus style={{ ...styles.inlineSelect, boxShadow: "inset 0 0 0 2px #107c41" }} value={currentVal} onChange={e => setCurrentVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleInputKeyDown}>
          {options.map(o => <option key={o} value={o}>{o || "--"}</option>)}
        </select>
      ) : (
        <input autoFocus type={type} style={{ ...styles.inlineInput, boxShadow: "inset 0 0 0 2px #107c41" }} value={currentVal} onChange={e => setCurrentVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleInputKeyDown} />
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