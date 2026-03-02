import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/api.js";
import debounce from "lodash.debounce"; 
const styles = {
  card: { background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", padding: "24px", marginBottom: "24px", border: "1px solid #eef0f3" },
  title: { fontSize: "22px", fontWeight: "700", color: "#1e3c72", margin: 0 },
  tableWrapper: { overflowX: "auto", background: "#ffffff", maxHeight: "75vh", marginTop: "20px", border: "1px solid #c8c6c4" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px", whiteSpace: "nowrap" },
  th: { background: "#f3f2f1", color: "#323130", fontWeight: "600", padding: "8px 10px", textAlign: "left", border: "1px solid #c8c6c4", position: "sticky", top: 0, zIndex: 10 },
  td: { padding: "0", border: "1px solid #c8c6c4", verticalAlign: "middle", height: "35px" },
  inlineInput: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif" },
  inlineSelect: { width: "100%", height: "100%", padding: "8px 10px", border: "none", borderRadius: "0", fontSize: "14px", background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif", cursor: "pointer" },
  actionBtn: { padding: "6px 10px", borderRadius: "4px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer", background: "#fee2e2", color: "#b91c1c", fontFamily: "'Calibri', sans-serif" },
  moveBtn: { cursor: "pointer", border: "none", background: "transparent", fontSize: "14px", padding: "2px 6px", color: "#555" },
  // Border assigned to Color Picker for better visibility
  colorPicker: { width: "24px", height: "24px", padding: "0", border: "2px solid #666", cursor: "pointer", background: "transparent", borderRadius: "4px", overflow: "hidden" }
};

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = ["", "1st Demo Done", "2nd Demo Done", "payment Process", "Tuition Done", "Tuition Cancelled", "irrelevant", "Not available", "Pending"];

// --- PILL COLOR LOGIC ---
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

const columnColors = {
  "Rejected Tutor": "#ffebee",
};

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

  useEffect(() => {
    setLocalItems(items);
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
  const [selectedFields, setSelectedFields] = useState(allColumns.map(c => c.key)); // all selected by default
  const [sortField, setSortField] = useState("orderIndex");
  const [sortDir, setSortDir] = useState("ASC");
  const [assignedFilter, setAssignedFilter] = useState(""); // staff id or blank
  const [isSearching, setIsSearching] = useState(false);
  const performSearch = async (query) => {
  try {
    if (!query) {
      setLocalItems(items); // restore default
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

// ================= DEBOUNCE =================
useEffect(() => {
  const timer = setTimeout(() => {
    performSearch(searchTerm);
  }, 400);

  return () => clearTimeout(timer);
}, [searchTerm, sortField, sortDir, assignedFilter]);

// ================= CLEAR BUTTON =================
<button
  onClick={() => {
    setSearchTerm("");
    setAssignedFilter("");
    setSortField("orderIndex");
    setSortDir("ASC");
    setLocalItems(items);
  }}
>
  Clear
</button>

  // Use a debounced version to avoid too many requests
  // If you don't have lodash, you can replicate with useRef + setTimeout below.
  const debouncedSearchRef = useRef(null);
  useEffect(() => {
    // create debounced function
    if (debouncedSearchRef.current) debouncedSearchRef.current.cancel?.();
    // If lodash.debounce is available (recommended), use:
    // debouncedSearchRef.current = debounce(performSearch, 300);
    // Otherwise fallback:
    let timer;
    debouncedSearchRef.current = {
      call: (q, flds, sf, sd, at) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => performSearch(q, flds, sf, sd, at), 300);
      },
      cancel: () => { if (timer) clearTimeout(timer); timer = null; }
    };
    return () => debouncedSearchRef.current.cancel?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // whenever search state changes, call debounced
  useEffect(() => {
    debouncedSearchRef.current.call?.(searchTerm, selectedFields, sortField, sortDir, assignedFilter);
  }, [searchTerm, selectedFields, sortField, sortDir, assignedFilter]);
  const updateRecord = async (item, field, newValue) => {
    try {
      setLocalItems(prev => prev.map(x => x.tuitionId === item.tuitionId ? { ...x, [field]: newValue } : x));
      const payload = { ...item, [field]: newValue, _source: "main" };
      await api.patch(`/api/tuitions/${encodeURIComponent(item.tuitionId)}`, payload);
    } catch(e) {
      alert("Update failed.");
      load(); 
    }
  };

  async function removeItem(tuitionId) {
    if (!window.confirm("Delete this row?")) return;
    try {
      await api.delete(`/api/tuitions/${encodeURIComponent(tuitionId)}`);
      await load();
    } catch (e) {
      alert("Delete failed");
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
      await api.post("/api/tuitions/reorder", { items: reorderPayload });
    } catch (error) {
      console.error("Failed to save reorder", error);
      alert("Nayi tarteeb save nahi ho saki. Backend check karein.");
      load(); 
    }
  };

  return (
     <div style={styles.card}>
      <style>{`.excel-cell:focus { outline: 2px solid #107c41; outline-offset: -2px; }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={styles.title}>Monthly Tuitions (Excel View)</h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder={isSearching ? "Searching..." : "Search across all columns..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #c8c6c4", minWidth: 260 }}
          />

          <select
            multiple
            value={selectedFields}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map(o => o.value);
              setSelectedFields(opts);
            }}
            style={{ minWidth: 180, height: 34, borderRadius: 6, border: "1px solid #c8c6c4", padding: 6 }}
            title="Select columns to search (ctrl/cmd-click for multiple)"
          >
            {allColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          <select value={sortField} onChange={e => setSortField(e.target.value)} style={{ height: 34, borderRadius: 6 }}>
            <option value="orderIndex">Order (manual)</option>
            <option value="tuitionId">Tuition Id</option>
            <option value="tuitionName">Tuition Name</option>
            <option value="tutorName">Tutor Name</option>
            <option value="demoDate">Demo Date</option>
            <option value="timeHour">Time</option>
          </select>

          <select value={sortDir} onChange={e => setSortDir(e.target.value)} style={{ height: 34, borderRadius: 6 }}>
            <option value="ASC">Asc</option>
            <option value="DESC">Desc</option>
          </select>

          <input
            placeholder="Assigned To (id)"
            value={assignedFilter}
            onChange={e => setAssignedFilter(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #c8c6c4", width: 110 }}
          />

          <button onClick={() => { setSearchTerm(""); setSelectedFields(allColumns.map(c=>c.key)); setSortField("orderIndex"); setSortDir("ASC"); setAssignedFilter(""); }} style={{ padding: "6px 10px", borderRadius: 6 }}>
            Clear
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3f2f1", padding: "6px 12px", borderRadius: 8, border: "1px solid #c8c6c4" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Zoom</span>
            <button onClick={() => handleZoom(-0.1)} style={{ cursor: "pointer", fontSize: "18px", border: "none", background: "none", fontWeight: "bold" }}>-</button>
            <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "40px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} style={{ cursor: "pointer", fontSize: "16px", border: "none", background: "none", fontWeight: "bold" }}>+</button>
          </div>
        </div>
      </div>
      
      <div style={styles.tableWrapper}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease", width: `${100 / zoom}%` }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <TH style={{ width: "40px", textAlign: "center" }}>Sort</TH>
                <TH style={{ width: "30px", textAlign: "center" }}>🎨</TH> 
                <TH>Demo Time</TH>
                <TH>Tuition Name</TH>
                <TH>Status</TH>
                <TH>Estimated Fee</TH>
                <TH>Tutor Name</TH>
                <TH>Tutor Fees</TH>
                <TH style={{ color: "#d32f2f" }}>Rejected Tutor</TH>
                <TH>Feedback</TH>
                <TH>Country</TH>
                <TH>Parent Contact</TH>
                <TH>Class</TH>
                <TH>Subject</TH>
                <TH>Days per week</TH>
                <TH>Source</TH>
                <TH>Demo Date</TH>
                <TH>Tuition Id</TH>
                <TH>Demo Rating</TH>
                <TH>Sync</TH>
                <TH style={{ textAlign: "center" }}>Action</TH>
              </tr>
            </thead>
            <tbody>
              {localItems.length === 0 ? (
                <tr><td colSpan="21" style={{padding: 20, textAlign: "center", color: "#888"}}>No records found</td></tr>
              ) : localItems.map((it, index) => (
                <tr 
                  key={it.tuitionId}
                  style={{ backgroundColor: it.rowColor || "inherit", transition: "background 0.2s" }}
                >
                  <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <button onClick={() => moveRow(index, 'up')} disabled={index === 0} style={{...styles.moveBtn, opacity: index === 0 ? 0.3 : 1}}>▲</button>
                      <button onClick={() => moveRow(index, 'down')} disabled={index === localItems.length - 1} style={{...styles.moveBtn, opacity: index === localItems.length - 1 ? 0.3 : 1}}>▼</button>
                    </div>
                  </td>

                  <td style={{...styles.td, textAlign: "center", backgroundColor: "inherit"}}>
                    <input 
                      type="color" 
                      value={it.rowColor || "#ffffff"} 
                      onInput={(e) => updateRecord(it, "rowColor", e.target.value)} 
                      style={styles.colorPicker}
                      title="Row color"
                    />
                  </td>
                  
                  <EditableCell val={it.demoTime} type="time" onSave={(val) => updateRecord(it, "demoTime", val)} width={100} />
                  
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
                  <EditableCell val={it.estimatedFee} onSave={(val) => updateRecord(it, "estimatedFee", val)} width={100} />
                  <EditableCell val={it.tutorName} onSave={(val) => updateRecord(it, "tutorName", val)} width={140} />
                  <EditableCell val={it.tutorFee || it.tutorFees} onSave={(val) => updateRecord(it, "tutorFees", val)} width={100} />
                  <EditableCell val={it.rejectedTutor} onSave={(val) => updateRecord(it, "rejectedTutor", val)} bg={columnColors["Rejected Tutor"]} width={120} />
                  
                  <EditableCell 
                    val={it.feedback} 
                    onSave={(val) => updateRecord(it, "feedback", val)} 
                    width={180} 
                    bg={it.feedback?.toString().trim().toLowerCase() === "satisfied" ? "#22c55e" : null}
                  />
                  
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

function EditableCell({ val, type = "text", options = [], onSave, bg, width, customRender, showColorPicker, cellColor, onColorChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(val || "");
  const tdRef = useRef(null);

  useEffect(() => { setCurrentVal(val || ""); }, [val]);

  const handleBlur = (e) => {
    if (e.relatedTarget && e.relatedTarget.type === 'color') return;
    setIsEditing(false);
    if (currentVal !== val) onSave(currentVal);
  };

  // NAYI LOGIC: Edit mode mein Enter press karne par save kar ke focus ko neechay wale cell par laye
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const td = e.target.closest('td');
      const cellIndex = td?.cellIndex;
      const nextRow = td?.parentElement?.nextElementSibling;

      e.target.blur(); // Value save karega aur edit mode band kar dega

      // Thore delay ke saath focus ko next row ke same column par shift karega
      setTimeout(() => {
        if (nextRow && cellIndex !== undefined) {
          const nextTd = nextRow.children[cellIndex];
          if (nextTd) nextTd.focus();
        } else if (tdRef.current) {
          tdRef.current.focus(); // Agar akhri row hai to ussi par focus wapis le aye
        }
      }, 50);
    }
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
          height: "35px" 
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