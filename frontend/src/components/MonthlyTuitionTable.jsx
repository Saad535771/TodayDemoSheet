import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/api.js";
import debounce from "lodash.debounce"; 

const styles = {
  card: { background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", padding: "24px", marginBottom: "24px", border: "1px solid #eef0f3" },
  title: { fontSize: "22px", fontWeight: "700", color: "#1e3c72", margin: 0 },
  tableWrapper: { 
    overflowX: "auto", 
    height:"100%",
    marginTop: "0px",           
  
  },
  table: { width: "100%",height:"100%",  fontSize: "12px",},
  th: { 
    background: "#f3f2f1", 
    color: "#323130", 
    fontWeight: "600", 
    padding: "8px 10px", 
    textAlign: "center", 
    border: "1px solid #c8c6c4", 
    position: "sticky", 
    top: 0, 
    height: "100%",
    zIndex: 10,
    position: "relative"          
  },
  td: { padding: "0", border: "1px solid #c8c6c4",textAlign: "center", verticalAlign: "middle", height: "15px",width:"15px" },
  inlineInput: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif" },
  inlineSelect: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif", cursor: "pointer" },
  actionBtn: { padding: "6px 10px", borderRadius: "4px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer", background: "#fee2e2", color: "#b91c1c", fontFamily: "'Calibri', sans-serif" },
  moveBtn: { cursor: "pointer", border: "none", background: "transparent", fontSize: "14px", padding: "2px 6px", color: "#555" },
  colorSwatch: { 
    width: "18px", 
    height: "18px", 
    border: "2px solid #666", 
    cursor: "pointer", 
    borderRadius: "4px", 
    overflow: "hidden",
    display: "inline-block"
  },
  pickerPopup: {
    position: "fixed",                    // ← zoom ke bawajood sahi position
    background: "white",
    border: "1px solid #ccc",
    padding: "10px",
    margin:"0px",
    borderRadius: "6px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    zIndex: 3000,
    width: "220px"
  },
  
  fixedSearchContainer: {
    position: "fixed",
    top: '75px',
    right: 0,
    width: "80%",
    padding: "14px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    zIndex: 100,
  }
};

// ==================== EXCEL STYLE COLOR PICKER (hamesha visible swatch + popup) ====================
const ColorSwatch = ({ color = "#ffffff", onChange }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: "-330px", left: 0 });
  const swatchRef = useRef(null);

  const presets = [
    "#ffffff", "#f8f9fa", "#ffebee", "#fff3e0", "#f3e5f5", "#e8f5e9", 
    "#e3f2fd", "#fff8e1", "#fce4ec", "#e0f2f1", "#f1f8e9", "#e8eaf6",
    "#ef5350", "#ff9800", "#fdd835", "#209024", "#2196f3", "#9c27b0",
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
          style={{ ...styles.pickerPopup,  left: popupPos.left }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#444" }}>
            Default Colors
          </div>
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

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = ["", "1st Demo Done", "2nd Demo Done", 
  "payment Process", 
  "Tuition Done", 
  "Tuition Cancelled", 
  "irrelevant", "Not available", "Pending"];

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

const columnColors = { "Rejected Tutor": "#ffebee" };

function format12Hour(time24) { 
  if (!time24) return "";
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}

const renderPill = (val, styleFn) => { 
  if (!val) return "";
  const style = styleFn(val);
  return (
    <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-block", ...style }}>
      {val}
    </span>
  );
};

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

export default function MonthlyTuitionTable({ items, load, zoom, handleZoom }) {
  const [localItems, setLocalItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set()); // multiple select

  useEffect(() => {
    setLocalItems(items);
    setSelectedRows(new Set());
  }, [items]);

  const allColumns = [ 
    { key: "tuitionId", label: "Tuition Id" },
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
    { key: "demoDate", label: "Demo Date" }
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFields, setSelectedFields] = useState(allColumns.map(c => c.key));
  const [sortField, setSortField] = useState("orderIndex");
  const [sortDir, setSortDir] = useState("ASC");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async (query) => { 
    try {
      if (!query) { setLocalItems(items); return; }
      setIsSearching(true);
      const resp = await api.get("/tuitions/search", {
        params: { q: query, fields: allColumns.map(c => c.key).join(","), sortField, sortDir, assignedTo: assignedFilter || "" }
      });
      if (resp?.data?.items) setLocalItems(resp.data.items);
    } catch (err) {
      console.error("Search failed", err);
    } finally { setIsSearching(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => performSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm, sortField, sortDir, assignedFilter]);

  const updateRecord = async (item, field, newValue) => { 
    try {
      setLocalItems(prev => prev.map(x => x.tuitionId === item.tuitionId ? { ...x, [field]: newValue } : x));
      const payload = { ...item, [field]: newValue, _source: "main" };
      await api.patch(`/tuitions/${encodeURIComponent(item.tuitionId)}`, payload);
    } catch(e) {
      alert("Update failed.");
      load(); 
    }
  };

  async function removeItem(tuitionId) { 
    if (!window.confirm("Delete this row?")) return;
    try {
      await api.delete(`/tuitions/${encodeURIComponent(tuitionId)}`);
      await load();
    } catch (e) { alert("Delete failed"); }
  }

  const moveRow = async (index, direction) => { 
    if (direction === 'up' && index === 0) return; 
    if (direction === 'down' && index === localItems.length - 1) return; 

    const newItems = [...localItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setLocalItems(newItems);

    try {
      const reorderPayload = newItems.map((item, idx) => ({ tuitionId: item.tuitionId, orderIndex: idx }));
      await api.post("/tuitions/reorder", { items: reorderPayload });
    } catch (error) {
      console.error("Failed to save reorder", error);
      load(); 
    }
  };

  // 🔥 SORTING FIX: Multiple rows move (jitni baar click karo utni baar move — selection clear nahi hoti)
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

    try {
      const reorderPayload = newItems.map((item, idx) => ({ tuitionId: item.tuitionId, orderIndex: idx }));
      await api.post("/tuitions/reorder", { items: reorderPayload });
    } catch (error) {
      console.error("Failed to save reorder", error);
      load(); 
    }
  };

  const toggleRowSelection = (tuitionId) => {
    const newSet = new Set(selectedRows);
    newSet.has(tuitionId) ? newSet.delete(tuitionId) : newSet.add(tuitionId);
    setSelectedRows(newSet);
  };

  const handleResizeStart = (e, colIndex) => {
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

  return (
    <div style={styles.card}>
      <style>{`.excel-cell:focus { outline: 2px solid #107c41; outline-offset: -2px; }`}</style>
      
      <div style={styles.fixedSearchContainer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "end", gap: 16, maxWidth: "1100px", margin: "0 auto" }}>
          <input
            placeholder={isSearching ? "Searching..." : "Search across all columns..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c8c6c4", fontSize: "15px", flex: 1, maxWidth: "520px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          />
          <button 
            onClick={() => { setSearchTerm(""); setLocalItems(items); setSelectedRows(new Set()); }}
            style={{ padding: "10px 16px", borderRadius: 6, background: "#f3f2f1", border: "none", fontWeight: "600" }}
          >
            Clear
          </button>

          {selectedRows.size > 0 && (
            <>
              <button onClick={() => moveSelected('up')} style={{ padding: "8px 16px", background: "#1976d2", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                ↑ Move Selected
              </button>
              <button onClick={() => moveSelected('down')} style={{ padding: "8px 16px", background: "#1976d2", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                ↓ Move Selected
              </button>
              <span style={{ padding: "8px 12px", background: "#f0f0f0", borderRadius: "6px", fontSize: "13px" }}>
                {selectedRows.size} rows selected
              </span>
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3f2f1", padding: "6px 12px", borderRadius: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#666" }}>Zoom</span>
            <button onClick={() => handleZoom(-0.1)} style={{ cursor: "pointer", fontSize: "18px", border: "none", background: "none" }}>-</button>
            <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "40px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} style={{ cursor: "pointer", fontSize: "16px", border: "none", background: "none" }}>+</button>
          </div>
        </div>
      </div>

      <h2 style={styles.title}>Monthly Tuitions (Excel View)</h2>

      <div style={{ display: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, alignItems: "center" }}>
          <input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select multiple value={selectedFields} onChange={(e) => setSelectedFields(Array.from(e.target.selectedOptions).map(o => o.value))}>
            {allColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease", width: `${100 / zoom}%` }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <TH style={{ width: "42px", textAlign: "center" }}>✓</TH>
                <TH style={{ width: "40px", textAlign: "center" }}>Sort</TH>
                <TH style={{ width: "36px", textAlign: "center" }}>🎨</TH> 
                
                <TH style={{ position: "relative", minWidth: "110px" }}>
                  Demo Time
                  <div onMouseDown={(e) => handleResizeStart(e, 2)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "180px" }}>
                  Tuition Name
                  <div onMouseDown={(e) => handleResizeStart(e, 3)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>
                  Status
                  <div onMouseDown={(e) => handleResizeStart(e, 4)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>
                  Estimated Fee
                  <div onMouseDown={(e) => handleResizeStart(e, 5)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "160px" }}>
                  Tutor Name
                  <div onMouseDown={(e) => handleResizeStart(e, 6)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>
                  Tutor Fees
                  <div onMouseDown={(e) => handleResizeStart(e, 7)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>
                  Rejected Tutor
                  <div onMouseDown={(e) => handleResizeStart(e, 8)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "200px" }}>
                  Feedback
                  <div onMouseDown={(e) => handleResizeStart(e, 9)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>
                  Country
                  <div onMouseDown={(e) => handleResizeStart(e, 10)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>
                  Parent Contact
                  <div onMouseDown={(e) => handleResizeStart(e, 11)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>
                  Class
                  <div onMouseDown={(e) => handleResizeStart(e, 12)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>
                  Subject
                  <div onMouseDown={(e) => handleResizeStart(e, 13)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>
                  Days per week
                  <div onMouseDown={(e) => handleResizeStart(e, 14)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>
                  Source
                  <div onMouseDown={(e) => handleResizeStart(e, 15)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>
                  Demo Date
                  <div onMouseDown={(e) => handleResizeStart(e, 16)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>
                  Tuition Id
                  <div onMouseDown={(e) => handleResizeStart(e, 17)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>
                  Demo Rating
                  <div onMouseDown={(e) => handleResizeStart(e, 18)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ position: "relative", minWidth: "80px" }}>
                  Sync
                  <div onMouseDown={(e) => handleResizeStart(e, 19)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
                <TH style={{ textAlign: "center", minWidth: "80px" }}>
                  Action
                  <div onMouseDown={(e) => handleResizeStart(e, 20)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} />
                </TH>
              </tr>
            </thead>
            <tbody>
              {localItems.length === 0 ? (
                <tr><td colSpan="22" style={{padding: 20, textAlign: "center", color: "#888"}}>No records found</td></tr>
              ) : localItems.map((it, index) => (
                <tr key={it.tuitionId} style={{ backgroundColor: it.rowColor || "inherit", transition: "background 0.2s" }}>
                  {/* Checkbox for multiple select */}
                  <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(it.tuitionId)}
                      onChange={() => toggleRowSelection(it.tuitionId)}
                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                    />
                  </td>

                  {/* Single row move */}
                  <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <button onClick={() => moveRow(index, 'up')} disabled={index === 0} style={{...styles.moveBtn, opacity: index === 0 ? 0.3 : 1}}>▲</button>
                      <button onClick={() => moveRow(index, 'down')} disabled={index === localItems.length - 1} style={{...styles.moveBtn, opacity: index === localItems.length - 1 ? 0.3 : 1}}>▼</button>
                    </div>
                  </td>

                  {/* Row Color (Excel style) */}
                  <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                    <ColorSwatch color={it.rowColor || "#ffffff"} onChange={(c) => updateRecord(it, "rowColor", c)} />
                  </td>
                  
                  <EditableCell val={it.demoTime} type="time" onSave={(val) => updateRecord(it, "demoTime", val)} width={100} />

                  {/* Tuition Name — text + hamesha visible color square (screenshot jaisa) */}
                  <td 
                    tabIndex={0}
                    className="excel-cell"
                    onClick={() => {}} // text pe click karne se edit mode mein nahi jaaye (sirf color click pe popup)
                    onKeyDown={(e) => { if (e.key === 'Enter') {} else handleGridKeyDown(e); }}
                    style={{ 
                      ...styles.td, 
                      backgroundColor: it.tuitionNameColor || "inherit", 
                      minWidth: 180, 
                      padding: "0 10px", 
                      height: "35px",
                      cursor: "cell"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "8px" }}>
                      <span style={{ flex: 1 }}>{it.tuitionName || ""}</span>
                      <ColorSwatch 
                        color={it.tuitionNameColor || "#ffffff"} 
                        onChange={(c) => updateRecord(it, "tuitionNameColor", c)} 
                      />
                    </div>
                  </td>
                  
                  <EditableCell val={it.status} options={statusList} onSave={(val) => updateRecord(it, "status", val)} width={140} customRender={(val) => renderPill(val, getStatusStyle)} />
                  <EditableCell val={it.estimatedFee} onSave={(val) => updateRecord(it, "estimatedFee", val)} width={100} />
                  <EditableCell val={it.tutorName} onSave={(val) => updateRecord(it, "tutorName", val)} width={140} />
                  <EditableCell val={it.tutorFee || it.tutorFees} onSave={(val) => updateRecord(it, "tutorFees", val)} width={100} />
                  <EditableCell val={it.rejectedTutor} onSave={(val) => updateRecord(it, "rejectedTutor", val)} bg={columnColors["Rejected Tutor"]} width={120} />
                  <EditableCell val={it.feedback} onSave={(val) => updateRecord(it, "feedback", val)} width={180} bg={it.feedback?.toString().trim().toLowerCase() === "satisfied" ? "#22c55e" : null} />
                  <EditableCell val={it.country} onSave={(val) => updateRecord(it, "country", val)} width={100} />
                  <EditableCell val={it.parentsContact} onSave={(val) => updateRecord(it, "parentsContact", val)} width={130} />
                  <EditableCell val={it.className} onSave={(val) => updateRecord(it, "className", val)} width={100} />
                  <EditableCell val={it.subjects} onSave={(val) => updateRecord(it, "subjects", val)} width={120} />
                  <EditableCell val={it.daysPerWeek} onSave={(val) => updateRecord(it, "daysPerWeek", val)} width={100} />
                  <EditableCell val={it.source} options={sourcesList} onSave={(val) => updateRecord(it, "source", val)} width={110} customRender={(val) => renderPill(val, getSourceStyle)} />
                  <EditableCell val={it.demoDate} type="date" onSave={(val) => updateRecord(it, "demoDate", val)} width={120} />

                  <td tabIndex={0} onKeyDown={handleGridKeyDown} className="excel-cell" style={{...styles.td, padding: "0 10px", fontWeight: "bold", color: "#555", backgroundColor: "inherit"}}>
                    {it.tuitionId}
                  </td>
                  
                  <EditableCell val={it.demoRating} options={demoRatings} onSave={(val) => updateRecord(it, "demoRating", val)} width={130} customRender={(val) => renderPill(val, getDemoRatingStyle)} />
                  <EditableCell val={it.syncFlag || it.sync} onSave={(val) => updateRecord(it, "sync", val)} width={80} />
                  
                  <td tabIndex={0} onKeyDown={handleGridKeyDown} className="excel-cell" style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                    <button style={styles.actionBtn} onClick={() => removeItem(it.tuitionId)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const TH = ({ children, style }) => <th style={{...styles.th, ...style}}>{children}</th>;

// EditableCell (sirf text edit ke liye — color Tuition Name aur Row mein alag handle)
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
      handleBlur();
      const td = e.target.closest('td');
      const cellIndex = td?.cellIndex;
      const nextRow = td?.parentElement?.nextElementSibling;
      setTimeout(() => {
        if (nextRow && cellIndex !== undefined) {
          const nextTd = nextRow.children[cellIndex];
          if (nextTd) nextTd.focus();
        }
      }, 50);
    }
  };

  if (!isEditing) {
    return (
      <td 
        ref={tdRef}
        tabIndex={0}
        className="excel-cell"
        onClick={() => setIsEditing(true)} 
        onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(true); else handleGridKeyDown(e); }}
        style={{ 
          ...styles.td, 
          backgroundColor: bg ? bg : "inherit", 
          minWidth: width, 
          padding: customRender ? "0 5px" : "0 10px", 
          height: "35px",
          cursor: "cell"
        }}
      >
        {customRender ? customRender(val) : (type === "time" && val ? format12Hour(val) : (val || ""))}
      </td>
    );
  }

  return (
    <td style={{ ...styles.td, backgroundColor: "white", minWidth: width }}>
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        {options.length > 0 ? (
          <select autoFocus style={styles.inlineSelect} value={currentVal} onChange={e => setCurrentVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleInputKeyDown}>
            {options.map(o => <option key={o} value={o}>{o || "--"}</option>)}
          </select>
        ) : (
          <input autoFocus type={type} style={{ ...styles.inlineInput, flex: 1 }} value={currentVal} onChange={e => setCurrentVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleInputKeyDown} />
        )}
      </div>
    </td>
  );
}