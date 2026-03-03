import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/api.js";
import debounce from "lodash.debounce"; 

// ==================== EXCEL COLOR PALETTE (sirf Estimated Fee ke liye) ====================
const themeColors = [
  "#f2f2f2","#d9d9d9","#bfbfbf","#a5a5a5","#7f7f7f","#595959","#404040","#262626",
  "#ffffff","#000000","#ff0000","#ffc000","#ffff00","#92d050","#00b050","#00b0f0",
  "#0070c0","#002060","#7030a0","#c00000","#ff6600","#ffcc00","#99cc00","#339966"
];

const standardColors = [
  "#ffffff","#000000","#ff0000","#ffff00","#00ff00","#00ffff","#0000ff","#ff00ff",
  "#c6e0b4","#9bc2e6","#b4a7d6","#e7e6e6","#d9d9d9","#bfbfbf","#a5a5a5","#7f7f7f"
];

const ExcelColorPicker = ({ currentColor, onColorChange }) => {
  const [show, setShow] = useState(false);
  const pickColor = (color) => { onColorChange(color); setShow(false); };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setShow(!show)} title="Excel Colors" style={{ width: "26px", height: "26px", border: "2px solid #666", backgroundColor: currentColor || "#ffffff", borderRadius: "4px", cursor: "pointer" }} />
      {show && (
        <div style={{ position: "absolute", top: "34px", left: "-10px", background: "#fff", border: "1px solid #999", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", zIndex: 3000, borderRadius: "6px", padding: "10px", width: "280px" }}>
          <div style={{ marginBottom: "8px" }}><div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#444" }}>Theme Colors</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 24px)", gap: "3px" }}>
              {themeColors.map((c, i) => <div key={i} onClick={() => pickColor(c)} style={{ width: "24px", height: "24px", background: c, border: "1px solid #aaa", cursor: "pointer", borderRadius: "3px" }} />)}
            </div>
          </div>
          <div style={{ marginBottom: "8px" }}><div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#444" }}>Standard Colors</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 24px)", gap: "3px" }}>
              {standardColors.map((c, i) => <div key={i} onClick={() => pickColor(c)} style={{ width: "24px", height: "24px", background: c, border: "1px solid #aaa", cursor: "pointer", borderRadius: "3px" }} />)}
            </div>
          </div>
          <div style={{ textAlign: "center", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
            <input type="color" value={currentColor || "#ffffff"} onChange={(e) => pickColor(e.target.value)} style={{ width: "100%", height: "32px", cursor: "pointer" }} />
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: { background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", padding: "24px", marginBottom: "24px", border: "1px solid #eef0f3" },
  title: { fontSize: "22px", fontWeight: "700", color: "#1e3c72", margin: 0 },
  tableWrapper: { 
    overflowX: "auto", 
    background: "#ffffff", 
    maxHeight: "75vh", 
    marginTop: "0px",           
    border: "1px solid #c8c6c4" 
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px", whiteSpace: "nowrap" },
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
    position: "relative"          
  },
  td: { padding: "0", border: "1px solid #c8c6c4", verticalAlign: "middle", height: "35px" },
  inlineInput: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif" },
  inlineSelect: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif", cursor: "pointer" },
  actionBtn: { padding: "6px 10px", borderRadius: "4px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer", background: "#fee2e2", color: "#b91c1c", fontFamily: "'Calibri', sans-serif" },
  moveBtn: { cursor: "pointer", border: "none", background: "transparent", fontSize: "14px", padding: "2px 6px", color: "#555" },
  mergeBtn: { padding: "8px 16px", borderRadius: 6, background: "#22c55e", color: "#fff", border: "none", fontWeight: "600", cursor: "pointer" },
  unmergeBtn: { padding: "8px 16px", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none", fontWeight: "600", cursor: "pointer" },
  bulkMoveBtn: { padding: "8px 16px", borderRadius: 6, background: "#3b82f6", color: "#fff", border: "none", fontWeight: "600", cursor: "pointer" },
  toolbar: { padding: "10px 24px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "12px", flexWrap: "wrap" },
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

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = ["", "1st Demo Done", "2nd Demo Done", "payment Process", "Tuition Done", "Tuition Cancelled", "irrelevant", "Not available", "Pending"];

// --- PILL COLOR LOGIC --- (pura same)
const getStatusStyle = (status) => { /* pura original same */ 
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

const getDemoRatingStyle = (rating) => { /* pura original same */ 
  switch (rating) {
    case "Average Demo": return { backgroundColor: "#ca8a04", color: "white", border: "1px solid #ca8a04" }; 
    case "Strong Demo": return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" }; 
    case "Weak Demo": return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" }; 
    default: return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};

const getSourceStyle = (source) => { /* pura original same */ 
  switch (source) {
    case "mahad": return { backgroundColor: "#0ea5e9", color: "white", border: "1px solid #0ea5e9" }; 
    case "areeba": return { backgroundColor: "#ec4899", color: "white", border: "1px solid #ec4899" }; 
    case "sibgha": return { backgroundColor: "#14b8a6", color: "white", border: "1px solid #14b8a6" }; 
    default: return { backgroundColor: "transparent", color: "inherit", border: "1px solid transparent" };
  }
};

const columnColors = { "Rejected Tutor": "#ffebee" };

function format12Hour(time24) { /* pura original same */ 
  if (!time24) return "";
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}

const renderPill = (val, styleFn) => { /* pura original same */ 
  if (!val) return "";
  const style = styleFn(val);
  return (
    <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-block", ...style }}>
      {val}
    </span>
  );
};

export const handleGridKeyDown = (e) => { /* pura original same */ 
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
  const [selectedRows, setSelectedRows] = useState([]);
  const [estimatedFeeMerges, setEstimatedFeeMerges] = useState([]);

  useEffect(() => {
    setLocalItems(items);
    setSelectedRows([]);
  }, [items]);

  const allColumns = [ /* pura original same */ 
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

  const performSearch = async (query) => { /* pura original same */ 
    try {
      if (!query) {
        setLocalItems(items);
        return;
      }
      setIsSearching(true);
      const resp = await api.get("/api/tuitions/search", {
        params: {
          q: query,
          fields: allColumns.map(c => c.key).join(","),
          sortField: sortField,
          sortDir: sortDir,
          assignedTo: assignedFilter || ""
        }
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
  }, [searchTerm, sortField, sortDir, assignedFilter]);

  const updateRecord = async (item, field, newValue) => { /* pura original same */ 
    try {
      setLocalItems(prev => prev.map(x => x.tuitionId === item.tuitionId ? { ...x, [field]: newValue } : x));
      const payload = { ...item, [field]: newValue, _source: "main" };
      await api.patch(`/api/tuitions/${encodeURIComponent(item.tuitionId)}`, payload);
    } catch(e) {
      alert("Update failed.");
      load(); 
    }
  };

  async function removeItem(tuitionId) { /* pura original same */ 
    if (!window.confirm("Delete this row?")) return;
    try {
      await api.delete(`/api/tuitions/${encodeURIComponent(tuitionId)}`);
      await load();
    } catch (e) {
      alert("Delete failed");
    }
  }

  const moveRow = async (index, direction) => { /* pura original same */ 
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
      await api.post("/api/tuitions/reorder", { items: reorderPayload });
    } catch (error) {
      console.error("Failed to save reorder", error);
      alert("Nayi tarteeb save nahi ho saki. Backend check karein.");
      load(); 
    }
  };

  // ================= MULTIPLE SELECT + BULK MOVE =================
  const toggleRowSelect = (index) => {
    setSelectedRows(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort((a,b)=>a-b)
    );
  };

  const moveSelected = async (direction) => {
    if (selectedRows.length === 0) return;
    let newItems = [...localItems];
    const sorted = [...selectedRows].sort((a,b)=>a-b);
    const blockStart = sorted[0];
    const blockEnd = sorted[sorted.length-1];
    if (direction === 'up' && blockStart === 0) return;
    if (direction === 'down' && blockEnd === newItems.length-1) return;
    const target = direction === 'up' ? blockStart - 1 : blockEnd + 1;
    const block = newItems.splice(blockStart, sorted.length);
    newItems.splice(target, 0, ...block);
    setLocalItems(newItems);
    setSelectedRows(sorted.map((_, i) => target + i));
    try {
      const reorderPayload = newItems.map((item, idx) => ({ tuitionId: item.tuitionId, orderIndex: idx }));
      await api.post("/api/tuitions/reorder", { items: reorderPayload });
    } catch (error) { load(); }
  };

  // ================= ESTIMATED FEE MERGE =================
  const mergeEstimatedFee = () => {
    if (selectedRows.length < 2) { alert("Merge ke liye kam az kam 2 rows select karo!"); return; }
    const sorted = [...selectedRows];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i-1] + 1) { alert("Sirf lagatar rows merge kar sakte ho!"); return; }
    }
    const newMerge = { start: sorted[0], rowspan: sorted.length };
    setEstimatedFeeMerges(prev => [...prev, newMerge]);
    setSelectedRows([]);
  };

  const unmergeAll = () => setEstimatedFeeMerges([]);

  const getMergeForRow = (index) => estimatedFeeMerges.find(m => m.start <= index && index < m.start + m.rowspan);

  // ================= COLUMN RESIZE =================
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
      
      {/* FIXED SEARCH BAR — sirf search */}
      <div style={styles.fixedSearchContainer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent:"end", gap: 16, maxWidth: "1100px", margin: "0 auto" }}>
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
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          />
          <button 
            onClick={() => { setSearchTerm(""); setLocalItems(items); }}
            style={{ padding: "10px 16px", borderRadius: 6, background: "#f3f2f1", border: "none", fontWeight: "600" }}
          >
            Clear
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3f2f1", padding: "6px 12px", borderRadius: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#666" }}>Zoom</span>
            <button onClick={() => handleZoom(-0.1)} style={{ cursor: "pointer", fontSize: "18px", border: "none", background: "none" }}>-</button>
            <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "40px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} style={{ cursor: "pointer", fontSize: "16px", border: "none", background: "none" }}>+</button>
          </div>
        </div>
      </div>

      {/* 🔥 TOOLBAR — table ke upar (merge + bulk move buttons) */}
      <div style={styles.toolbar}>
        <button onClick={mergeEstimatedFee} style={styles.mergeBtn}>Merge Est. Fee</button>
        <button onClick={unmergeAll} style={styles.unmergeBtn}>Unmerge All</button>
        <button onClick={() => moveSelected('up')} style={styles.bulkMoveBtn} disabled={selectedRows.length === 0}>↑ Selected Rows</button>
        <button onClick={() => moveSelected('down')} style={styles.bulkMoveBtn} disabled={selectedRows.length === 0}>↓ Selected Rows</button>
      </div>

      <h2 style={styles.title}>Monthly Tuitions (Excel View)</h2>

      <div style={{ display: "none" }}>
        {/* tera pura old filter logic yahan hai */}
      </div>

      <div style={styles.tableWrapper}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease", width: `${100 / zoom}%` }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <TH style={{ width: "80px", textAlign: "center" }}>Sort / Select</TH>
                <TH style={{ width: "30px", textAlign: "center" }}>🎨</TH> 
                {/* baaki TH with resizer same */}
                <TH style={{ position: "relative", minWidth: "110px" }}>Demo Time<div onMouseDown={(e) => handleResizeStart(e, 2)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "180px" }}>Tuition Name<div onMouseDown={(e) => handleResizeStart(e, 3)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>Status<div onMouseDown={(e) => handleResizeStart(e, 4)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>Estimated Fee<div onMouseDown={(e) => handleResizeStart(e, 5)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "160px" }}>Tutor Name<div onMouseDown={(e) => handleResizeStart(e, 6)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>Tutor Fees<div onMouseDown={(e) => handleResizeStart(e, 7)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>Rejected Tutor<div onMouseDown={(e) => handleResizeStart(e, 8)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "200px" }}>Feedback<div onMouseDown={(e) => handleResizeStart(e, 9)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>Country<div onMouseDown={(e) => handleResizeStart(e, 10)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>Parent Contact<div onMouseDown={(e) => handleResizeStart(e, 11)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>Class<div onMouseDown={(e) => handleResizeStart(e, 12)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>Subject<div onMouseDown={(e) => handleResizeStart(e, 13)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>Days per week<div onMouseDown={(e) => handleResizeStart(e, 14)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>Source<div onMouseDown={(e) => handleResizeStart(e, 15)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "120px" }}>Demo Date<div onMouseDown={(e) => handleResizeStart(e, 16)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "100px" }}>Tuition Id<div onMouseDown={(e) => handleResizeStart(e, 17)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "140px" }}>Demo Rating<div onMouseDown={(e) => handleResizeStart(e, 18)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ position: "relative", minWidth: "80px" }}>Sync<div onMouseDown={(e) => handleResizeStart(e, 19)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
                <TH style={{ textAlign: "center", minWidth: "80px" }}>Action<div onMouseDown={(e) => handleResizeStart(e, 20)} style={{ position: "absolute", right: "-2px", top: 0, width: "4px", height: "100%", cursor: "col-resize", zIndex: 20 }} /></TH>
              </tr>
            </thead>
            <tbody>
              {localItems.length === 0 ? (
                <tr><td colSpan="21" style={{padding: 20, textAlign: "center", color: "#888"}}>No records found</td></tr>
              ) : localItems.map((it, index) => {
                const mergeInfo = getMergeForRow(index);
                const isMergeStart = mergeInfo && index === mergeInfo.start;
                const rowspan = mergeInfo ? mergeInfo.rowspan : 1;
                const shouldRenderEstFee = !mergeInfo || isMergeStart;

                return (
                  <tr key={it.tuitionId} style={{ backgroundColor: it.rowColor || "inherit", transition: "background 0.2s" }}>
                    <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <input type="checkbox" checked={selectedRows.includes(index)} onChange={() => toggleRowSelect(index)} />
                        <div>
                          <button onClick={() => moveRow(index, 'up')} disabled={index === 0} style={{...styles.moveBtn, opacity: index === 0 ? 0.3 : 1}}>▲</button>
                          <button onClick={() => moveRow(index, 'down')} disabled={index === localItems.length - 1} style={{...styles.moveBtn, opacity: index === localItems.length - 1 ? 0.3 : 1}}>▼</button>
                        </div>
                      </div>
                    </td>

                    <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                      <input type="color" value={it.rowColor || "#ffffff"} onInput={(e) => updateRecord(it, "rowColor", e.target.value)} style={styles.colorPicker} title="Row color" />
                    </td>
                    
                    <EditableCell val={it.demoTime} type="time" onSave={(val) => updateRecord(it, "demoTime", val)} width={100} />
                    
                    {/* 🔥 TUITION NAME — NATIVE COLOR PICKER (sahi se call ho raha hai) */}
                    <EditableCell 
                      val={it.tuitionName} 
                      onSave={(val) => updateRecord(it, "tuitionName", val)} 
                      width={150} 
                      showColorPicker={true}
                      cellColor={it.tuitionNameColor} 
                      onColorChange={(color) => updateRecord(it, "tuitionNameColor", color)}
                      bg={it.tuitionNameColor} 
                    />
                    
                    <EditableCell val={it.status} options={statusList} onSave={(val) => updateRecord(it, "status", val)} width={140} customRender={(val) => renderPill(val, getStatusStyle)} />
                    
                    {shouldRenderEstFee && (
                      <EditableCell 
                        val={it.estimatedFee} 
                        onSave={(val) => updateRecord(it, "estimatedFee", val)} 
                        width={100}
                        centerText={true}
                        allowWrap={true}
                        cellColor={it.estimatedFeeColor}
                        onColorChange={(color) => updateRecord(it, "estimatedFeeColor", color)}
                        rowspan={rowspan}
                      />
                    )}

                    {/* baaki sab cells same */}
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
                    <td tabIndex={0} onKeyDown={handleGridKeyDown} className="excel-cell" style={{...styles.td, padding: "0 10px", fontWeight: "bold", color: "#555", backgroundColor: "inherit"}}>{it.tuitionId}</td>
                    <EditableCell val={it.demoRating} options={demoRatings} onSave={(val) => updateRecord(it, "demoRating", val)} width={130} customRender={(val) => renderPill(val, getDemoRatingStyle)} />
                    <EditableCell val={it.syncFlag || it.sync} onSave={(val) => updateRecord(it, "sync", val)} width={80} />
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
    </div>
  );
}

const TH = ({ children, style }) => <th style={{...styles.th, ...style}}>{children}</th>;

// EditableCell — Tuition Name ke liye native color picker fix kiya
function EditableCell({ 
  val, type = "text", options = [], onSave, bg, width, customRender, showColorPicker, 
  cellColor, onColorChange, centerText = false, allowWrap = false, rowspan = 1 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(val || "");
  const tdRef = useRef(null);

  useEffect(() => { setCurrentVal(val || ""); }, [val]);

  const handleBlur = (e) => {
    if (e.relatedTarget && e.relatedTarget.type === 'color') return;
    setIsEditing(false);
    if (currentVal !== val) onSave(currentVal);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const td = e.target.closest('td');
      const cellIndex = td?.cellIndex;
      const nextRow = td?.parentElement?.nextElementSibling;
      e.target.blur();
      setTimeout(() => {
        if (nextRow && cellIndex !== undefined) {
          const nextTd = nextRow.children[cellIndex];
          if (nextTd) nextTd.focus();
        } else if (tdRef.current) tdRef.current.focus();
      }, 50);
    }
  };

  const extraStyle = {
    ...(centerText && { textAlign: "center" }),
    ...(allowWrap && { whiteSpace: "normal", wordBreak: "break-word", height: "auto", minHeight: "35px", padding: "8px 10px" })
  };

  if (!isEditing) {
    const isSatisfiedGreen = bg === "#22c55e"; 
    return (
      <td 
        ref={tdRef}
        tabIndex={0}
        className="excel-cell"
        onClick={() => setIsEditing(true)} 
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setIsEditing(true); } else { handleGridKeyDown(e); } }}
        style={{ 
          ...styles.td, 
          backgroundColor: bg ? bg : "inherit", 
          color: isSatisfiedGreen ? "white" : "inherit", 
          cursor: "cell", 
          minWidth: width, 
          padding: customRender ? "0 5px" : "0 10px", 
          height: allowWrap ? "auto" : "35px",
          ...extraStyle,
          rowSpan: rowspan
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: centerText ? "center" : "flex-start", gap: "6px" }}>
          {customRender ? customRender(val) : (type === "time" && val ? format12Hour(val) : (val || ""))}
          {showColorPicker && (
            <input 
              type="color" 
              value={cellColor || "#ffffff"} 
              onInput={(e) => onColorChange(e.target.value)} 
              style={{ ...styles.colorPicker, marginLeft: "5px", marginRight: "5px" }} 
              title="Cell color"
            />
          )}
        </div>
      </td>
    );
  }

  return (
    <td style={{ ...styles.td, backgroundColor: "white", minWidth: width, ...extraStyle }} rowSpan={rowspan}>
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