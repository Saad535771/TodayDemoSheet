import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";

// --- CSS Styles (Excel Theme) ---
const styles = {
  container: {
    fontFamily: "'Calibri', sans-serif",
    color: "#333",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #eef0f3",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e3c72",
    margin: 0,
  },
  summaryBtn: {
    cursor: "pointer",
    fontWeight: "700",
    color: "#1e3c72",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    listStyle: "none",
    fontSize: "16px",
  },
  tableWrapper: {
    overflowX: "auto",
    background: "#ffffff",
    maxHeight: "75vh",
    marginTop: "20px",
    border: "1px solid #c8c6c4",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  th: {
    background: "#f3f2f1", // Excel header
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
    padding: "0", // 0 padding for full width input
    border: "1px solid #c8c6c4",
    verticalAlign: "middle",
    height: "35px",
  },
  // Inline Input Styles (Excel feel)
  inlineInput: {
    width: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: "0",
    fontSize: "14px",
    background: "transparent",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Calibri', sans-serif",
  },
  inlineInputFocus: {
    background: "#ffffff",
    boxShadow: "inset 0 0 0 2px #107c41", // Excel green focus
  },
  inlineSelect: {
    width: "100%",
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
  actionBtn: (type) => ({
    padding: "6px 10px",
    borderRadius: "4px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    margin: "0 2px",
    fontFamily: "'Calibri', sans-serif",
    background: type === "edit" ? "#e0f2fe" : type === "delete" ? "#fee2e2" : type === "save" ? "#dcfce7" : "#f3f4f6",
    color: type === "edit" ? "#0369a1" : type === "delete" ? "#b91c1c" : type === "save" ? "#15803d" : "#4b5563",
  }),
  // Form Styles
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  createInput: {
    width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0",
    fontSize: "14px", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white",
    border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600",
    cursor: "pointer", fontFamily: "'Calibri', sans-serif",
  }
};

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = ["", "Pending", "Active", "Rejected", "Completed"];

const statusColors = {
  "Pending": "#fef08a",   // Yellow
  "Active": "#bbf7d0",    // Green
  "Rejected": "#fecaca",  // Red
  "Completed": "#bfdbfe"  // Blue
};

function generateTuitionId() {
  return `T-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Helper to convert 24h to 12h AM/PM
function format12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12
  return `${hours}:${m} ${ampm}`;
}

function emptyForm() {
  return {
    tuitionId: generateTuitionId(),
    date: new Date().toISOString().split('T')[0],
    demoTime: "",
    tuitionName: "",
    source: "",
    country: "",
    parentsContact: "",
    className: "",
    subjects: "",
    daysPerWeek: "",
    estimatedFee: "",
    tutorName: "",
    tutorFees: "",
    classTime: "",
    rejectedTutor: "",
    status: "",
    feedback: "",
    demoDate: "",
    demoRating: "",
    sync: ""
  };
}

export default function MainTuitions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Creation State
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Inline Edit State
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/tuitions");
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function setCreateField(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  async function create(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/api/tuitions", form);
      setForm(emptyForm());
      await load();
    } catch (e) {
      alert("Create failed");
    } finally {
      setCreating(false);
    }
  }

  function startInlineEdit(item) {
    setEditingId(item.tuitionId);
    setEditRow({ 
        ...item,
        demoTime: item.demoTime || "",
        classTime: item.classTime || "",
        date: item.date || "",
        demoDate: item.demoDate || ""
    });
  }

  function handleInlineChange(key, value) {
    setEditRow(prev => ({ ...prev, [key]: value }));
  }

  function cancelInlineEdit() {
    setEditingId(null);
    setEditRow(null);
  }

  async function saveInlineEdit() {
    try {
      // Tutor Name and Status will be sent here. Backend should listen to this for "Today Demo" Sync.
      const payload = { ...editRow, _source: "main" };
      await api.patch(`/api/tuitions/${encodeURIComponent(editingId)}`, payload);
      setEditingId(null);
      setEditRow(null);
      await load();
    } catch (e) {
      alert("Failed to save changes.");
    }
  }

  async function removeItem(tuitionId) {
    if (!window.confirm("Delete this row?")) return;
    try {
      await api.delete(`/api/tuitions/${encodeURIComponent(tuitionId)}`);
      await load();
    } catch (e) {
      alert("Delete failed");
    }
  }

  const handleZoom = (factor) => {
    setZoom((prev) => Math.min(Math.max(prev + factor, 0.5), 2.5)); // Min 50%, Max 250%
  };

  return (
    <div style={styles.container}>
      
      {/* ADD NEW TUITION FORM */}
      <div style={styles.card}>
        <details>
          <summary style={styles.summaryBtn}>
            <span style={{fontSize: 20, color: "#2a5298", marginRight: 5}}>+</span> Add New Tuition
          </summary>
          <form onSubmit={create} style={{marginTop: 15}}>
             <div style={styles.grid}>
                <CreateField label="Tuition ID" val={form.tuitionId} onChange={v => setCreateField("tuitionId", v)} />
                <CreateField label="Date" type="date" val={form.date} onChange={v => setCreateField("date", v)} />
                <CreateField label="Demo Time" type="time" val={form.demoTime} onChange={v => setCreateField("demoTime", v)} />
                <CreateField label="Tuition Name" val={form.tuitionName} onChange={v => setCreateField("tuitionName", v)} />
                
                <div>
                  <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, display: "block"}}>Source</label>
                  <select style={styles.createInput} value={form.source} onChange={e => setCreateField("source", e.target.value)}>
                    {sourcesList.map(o => <option key={o} value={o}>{o || "-- Select --"}</option>)}
                  </select>
                </div>

                <CreateField label="Country" val={form.country} onChange={v => setCreateField("country", v)} />
                <CreateField label="Parent Contact" val={form.parentsContact} onChange={v => setCreateField("parentsContact", v)} />
                <CreateField label="Class" val={form.className} onChange={v => setCreateField("className", v)} />
                <CreateField label="Subject" val={form.subjects} onChange={v => setCreateField("subjects", v)} />
                <CreateField label="Days Per Week" val={form.daysPerWeek} onChange={v => setCreateField("daysPerWeek", v)} />
                <CreateField label="Estimated Fee" val={form.estimatedFee} onChange={v => setCreateField("estimatedFee", v)} />
                <CreateField label="Tutor Name" val={form.tutorName} onChange={v => setCreateField("tutorName", v)} />
                <CreateField label="Tutor Fees" val={form.tutorFees} onChange={v => setCreateField("tutorFees", v)} />
                <CreateField label="Class Time" type="time" val={form.classTime} onChange={v => setCreateField("classTime", v)} />
                <CreateField label="Rejected Tutor" val={form.rejectedTutor} onChange={v => setCreateField("rejectedTutor", v)} />
                
                <div>
                  <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, display: "block"}}>Status</label>
                  <select style={styles.createInput} value={form.status} onChange={e => setCreateField("status", e.target.value)}>
                    {statusList.map(o => <option key={o} value={o}>{o || "-- Select --"}</option>)}
                  </select>
                </div>
                
                <CreateField label="Demo Date" type="date" val={form.demoDate} onChange={v => setCreateField("demoDate", v)} />
                
                <div>
                  <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, display: "block"}}>Demo Rating</label>
                  <select style={styles.createInput} value={form.demoRating} onChange={e => setCreateField("demoRating", e.target.value)}>
                    {demoRatings.map(o => <option key={o} value={o}>{o || "-- Select --"}</option>)}
                  </select>
                </div>

                <CreateField label="Sync" val={form.sync} onChange={v => setCreateField("sync", v)} />
             </div>
             <button style={{...styles.primaryBtn, marginTop: 15}} disabled={creating}>
               {creating ? "Adding..." : "Add Record"}
             </button>
          </form>
        </details>
      </div>

      {/* EXCEL STYLE TABLE */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={styles.title}>Monthly Tuitions (Excel View)</h2>
          
          {/* ZOOM CONTROLS */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f3f2f1", padding: "6px 12px", borderRadius: "8px", border: "1px solid #c8c6c4" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Zoom</span>
            <button onClick={() => handleZoom(-0.1)} style={{ cursor: "pointer", fontSize: "18px", border: "none", background: "none", fontWeight: "bold" }}>-</button>
            <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "40px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} style={{ cursor: "pointer", fontSize: "16px", border: "none", background: "none", fontWeight: "bold" }}>+</button>
          </div>
        </div>
        
        <div style={styles.tableWrapper}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease", width: `${100 / zoom}%` }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <TH>Date</TH>
                  <TH>Demo Time</TH>
                  <TH>Tuition Name</TH>
                  <TH>Source</TH>
                  <TH>Country</TH>
                  <TH>Parent Contact</TH>
                  <TH>Class</TH>
                  <TH>Subject</TH>
                  <TH>Days per week</TH>
                  <TH>Estimated Fee</TH>
                  <TH>Tutor Name</TH>
                  <TH>Tutor Fees</TH>
                  <TH>Class Time</TH>
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
                {items.length === 0 ? (
                  <tr><td colSpan="21" style={{padding: 20, textAlign: "center", color: "#888"}}>No records found</td></tr>
                ) : items.map((it) => {
                  const isEditing = editingId === it.tuitionId;
                  
                  return (
                    <tr key={it.tuitionId} style={{ background: isEditing ? "#f0f9ff" : "white" }}>
                      
                      <td style={styles.td}><StyledInput isEditing={isEditing} type="date" val={isEditing ? editRow.date : it.date} onChange={e => handleInlineChange("date", e.target.value)} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} type="time" val={isEditing ? editRow.demoTime : format12Hour(it.demoTime)} onChange={e => handleInlineChange("demoTime", e.target.value)} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.tuitionName : it.tuitionName} onChange={e => handleInlineChange("tuitionName", e.target.value)} width={150} /></td>
                      
                      {/* SOURCE DROPDOWN */}
                      <td style={styles.td}>
                        {isEditing ? (
                          <select style={styles.inlineSelect} value={editRow.source} onChange={e => handleInlineChange("source", e.target.value)}>
                             {sourcesList.map(s => <option key={s} value={s}>{s || "--"}</option>)}
                          </select>
                        ) : <span style={{padding: "0 10px"}}>{it.source}</span>}
                      </td>
                      
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.country : it.country} onChange={e => handleInlineChange("country", e.target.value)} width={100} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.parentsContact : it.parentsContact} onChange={e => handleInlineChange("parentsContact", e.target.value)} width={130} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.className : it.className} onChange={e => handleInlineChange("className", e.target.value)} width={100} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.subjects : it.subjects} onChange={e => handleInlineChange("subjects", e.target.value)} width={120} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.daysPerWeek : it.daysPerWeek} onChange={e => handleInlineChange("daysPerWeek", e.target.value)} width={100} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.estimatedFee : it.estimatedFee} onChange={e => handleInlineChange("estimatedFee", e.target.value)} width={100} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.tutorName : it.tutorName} onChange={e => handleInlineChange("tutorName", e.target.value)} width={140} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.tutorFees : it.tutorFees} onChange={e => handleInlineChange("tutorFees", e.target.value)} width={100} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} type="time" val={isEditing ? editRow.classTime : format12Hour(it.classTime)} onChange={e => handleInlineChange("classTime", e.target.value)} /></td>
                      
                      {/* REJECTED TUTOR (RED BACKGROUND) */}
                      <td style={{ ...styles.td, backgroundColor: "#ffebee" }}> 
                        <StyledInput isEditing={isEditing} val={isEditing ? editRow.rejectedTutor : it.rejectedTutor} onChange={e => handleInlineChange("rejectedTutor", e.target.value)} width={120} />
                      </td>

                      {/* STATUS DROPDOWN (WITH COLORS) */}
                      <td style={{ ...styles.td, backgroundColor: isEditing ? statusColors[editRow.status] : statusColors[it.status] }}>
                        {isEditing ? (
                          <select style={{...styles.inlineSelect, background: "transparent", fontWeight: "bold"}} value={editRow.status} onChange={e => handleInlineChange("status", e.target.value)}>
                             {statusList.map(s => <option key={s} value={s}>{s || "--"}</option>)}
                          </select>
                        ) : <span style={{padding: "0 10px", fontWeight: "bold"}}>{it.status}</span>}
                      </td>

                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.feedback : it.feedback} onChange={e => handleInlineChange("feedback", e.target.value)} width={180} /></td>
                      <td style={styles.td}><StyledInput isEditing={isEditing} type="date" val={isEditing ? editRow.demoDate : it.demoDate} onChange={e => handleInlineChange("demoDate", e.target.value)} /></td>
                      <td style={styles.td}><span style={{padding: "0 10px", fontWeight: "bold", color: "#555"}}>{it.tuitionId}</span></td>
                      
                      {/* DEMO RATING */}
                      <td style={styles.td}>
                        {isEditing ? (
                          <select style={styles.inlineSelect} value={editRow.demoRating} onChange={e => handleInlineChange("demoRating", e.target.value)}>
                             {demoRatings.map(d => <option key={d} value={d}>{d || "--"}</option>)}
                          </select>
                        ) : <span style={{padding: "0 10px"}}>{it.demoRating}</span>}
                      </td>

                      <td style={styles.td}><StyledInput isEditing={isEditing} val={isEditing ? editRow.sync : it.sync} onChange={e => handleInlineChange("sync", e.target.value)} width={80} /></td>

                      {/* ACTIONS */}
                      <td style={{...styles.td, textAlign: "center", minWidth: "120px", background: isEditing ? "#f0f9ff" : "white"}}>
                        {isEditing ? (
                          <>
                            <button style={styles.actionBtn("save")} onClick={saveInlineEdit}>Save</button>
                            <button style={styles.actionBtn("cancel")} onClick={cancelInlineEdit}>X</button>
                          </>
                        ) : (
                          <>
                            <button style={styles.actionBtn("edit")} onClick={() => startInlineEdit(it)}>Edit</button>
                            <button style={styles.actionBtn("delete")} onClick={() => removeItem(it.tuitionId)}>Del</button>
                          </>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
const TH = ({ children, style }) => <th style={{...styles.th, ...style}}>{children}</th>;

function CreateField({ label, val, onChange, type="text" }) {
  return (
    <div>
      <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, display: "block"}}>{label}</label>
      <input type={type} style={styles.createInput} value={val || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function StyledInput({ isEditing, val, onChange, type="text", width }) {
  const [focused, setFocused] = useState(false);
  
  if (!isEditing) {
    return <div style={{ padding: "0 10px", minWidth: width || "auto", overflow: "hidden", textOverflow: "ellipsis" }}>{val || "-"}</div>;
  }

  return (
    <input 
      type={type}
      style={{
        ...styles.inlineInput, 
        ...(focused ? styles.inlineInputFocus : {}),
        minWidth: width || 120
      }} 
      value={val || ""} 
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}