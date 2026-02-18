import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";

// --- CSS Styles ---
const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
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
    borderRadius: "12px",
    border: "1px solid #eef0f3",
    maxHeight: "75vh",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  th: {
    background: "#f8f9fc",
    color: "#475569",
    fontWeight: "600",
    padding: "12px 10px",
    textAlign: "left",
    borderBottom: "2px solid #eef0f3",
    position: "sticky",
    top: 0,
    zIndex: 10,
    minWidth: "120px",
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    height: "50px",
  },
  // Inline Input Styles
  inlineInput: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #2a5298",
    fontSize: "13px",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  inlineSelect: {
    width: "100%",
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #2a5298",
    fontSize: "13px",
  },
  actionBtn: (type) => ({
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    marginRight: "4px",
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
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    minHeight: "80px",
    fontFamily: "inherit",
    marginTop: "8px",
    resize: "vertical",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  }
};

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];

function generateTuitionId() {
  return `T-${Math.floor(1000 + Math.random() * 9000)}`;
}

function emptyForm() {
  return {
    tuitionId: generateTuitionId(),
    date: new Date().toISOString().split('T')[0],
    time: "",
    tuitionName: "",
    source: "",
    country: "",
    parentsContact: "",
    className: "",
    subjects: "",
    daysPerWeek: "",
    estimatedFee: "",
    tutorName: "",
    tutorFee: "",
    secondTutors: "",
    rejectedTutor: "",
    status: "",
    feedback: "",
    demoDate: "",
    satisfactionRating: "",
    demoRating: "",
    syncFlag: ""
  };
}

export default function MainTuitions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
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
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // --- Create Functions ---
  function setCreateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

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

  // --- Inline Edit Functions ---
  function startInlineEdit(item) {
    setEditingId(item.tuitionId);
    setEditRow({ 
        ...item,
        time: item.timeHour ? `${String(item.timeHour).padStart(2, '0')}:00` : (item.time || ""),
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
    if (!confirm("Delete this row?")) return;
    try {
      await api.delete(`/api/tuitions/${encodeURIComponent(tuitionId)}`);
      await load();
    } catch (e) {
      alert("Delete failed");
    }
  }

  return (
    <div style={styles.container}>
      
      {/* --- ADD NEW TUITION (Full Form) --- */}
      <div style={styles.card}>
        <details>
          <summary style={styles.summaryBtn}>
            <span style={{fontSize: 20, color: "#2a5298", marginRight: 5}}>+</span> Add New Tuition
          </summary>
          <form onSubmit={create} style={{marginTop: 15}}>
             <div style={styles.grid}>
                <CreateField label="Tuition ID" val={form.tuitionId} onChange={v => setCreateField("tuitionId", v)} />
                <CreateField label="Entry Date" type="date" val={form.date} onChange={v => setCreateField("date", v)} />
                <CreateField label="Time" type="time" val={form.time} onChange={v => setCreateField("time", v)} />
                <CreateField label="Tuition Name" val={form.tuitionName} onChange={v => setCreateField("tuitionName", v)} />
                <CreateField label="Demo Date" type="date" val={form.demoDate} onChange={v => setCreateField("demoDate", v)} />
                <CreateField label="Tutor Name" val={form.tutorName} onChange={v => setCreateField("tutorName", v)} />
                <CreateField label="Tutor Fee" val={form.tutorFee} onChange={v => setCreateField("tutorFee", v)} />
                <CreateField label="Status" val={form.status} onChange={v => setCreateField("status", v)} />
                <CreateField label="Satisfaction" val={form.satisfactionRating} onChange={v => setCreateField("satisfactionRating", v)} />
                
                {/* Demo Rating Select */}
                <div>
                  <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, display: "block"}}>Demo Rating</label>
                  <select style={styles.createInput} value={form.demoRating} onChange={e => setCreateField("demoRating", e.target.value)}>
                    {demoRatings.map(o => <option key={o} value={o}>{o || "--"}</option>)}
                  </select>
                </div>

                <CreateField label="Parents Contact" val={form.parentsContact} onChange={v => setCreateField("parentsContact", v)} />
                <CreateField label="Source" val={form.source} onChange={v => setCreateField("source", v)} />
                <CreateField label="Country" val={form.country} onChange={v => setCreateField("country", v)} />
                <CreateField label="Class" val={form.className} onChange={v => setCreateField("className", v)} />
                <CreateField label="Subjects" val={form.subjects} onChange={v => setCreateField("subjects", v)} />
                <CreateField label="Days Per Week" val={form.daysPerWeek} onChange={v => setCreateField("daysPerWeek", v)} />
                <CreateField label="Estimated Fee" val={form.estimatedFee} onChange={v => setCreateField("estimatedFee", v)} />
                <CreateField label="Second Tutors" val={form.secondTutors} onChange={v => setCreateField("secondTutors", v)} />
                <CreateField label="Rejected Tutor" val={form.rejectedTutor} onChange={v => setCreateField("rejectedTutor", v)} />
             </div>

             <div style={{marginTop: 12}}>
               <label style={{fontSize: 11, fontWeight: "bold", color: "#666"}}>Feedback / Notes</label>
               <textarea style={styles.textarea} value={form.feedback} onChange={(e) => setCreateField("feedback", e.target.value)} />
             </div>

             <button style={{...styles.primaryBtn, marginTop: 15}} disabled={creating}>
               {creating ? "Adding..." : "Add Record"}
             </button>
          </form>
        </details>
      </div>

      {/* --- EXCEL STYLE TABLE --- */}
      <div style={styles.card}>
        <h2 style={styles.title}>Monthly Tuitions (Sheet View)</h2>
        
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <TH>Action</TH>
                <TH>Tuition ID</TH>
                <TH>Time</TH>
                <TH>Date</TH>
                <TH>Tuition Name</TH>
                <TH>Demo Date</TH>
                <TH>Tutor Name</TH>
                <TH>Status</TH>
                <TH>Satisfaction</TH>
                <TH>Demo Rating</TH>
                <TH>Contact</TH>
                <TH>Source</TH>
                <TH>Country</TH>
                <TH>Feedback</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const isEditing = editingId === it.tuitionId;
                
                return (
                  <tr key={it.tuitionId} style={{ background: isEditing ? "#f0f9ff" : "white" }}>
                    
                    {/* ACTION COLUMN */}
                    <td style={{...styles.td, minWidth: "110px", position: "sticky", left: 0, background: isEditing ? "#f0f9ff" : "white", zIndex: 5, boxShadow: "2px 0 5px rgba(0,0,0,0.05)"}}>
                      {isEditing ? (
                        <>
                          <button style={styles.actionBtn("save")} onClick={saveInlineEdit} title="Save">✅</button>
                          <button style={styles.actionBtn("cancel")} onClick={cancelInlineEdit} title="Cancel">❌</button>
                        </>
                      ) : (
                        <>
                          <button style={styles.actionBtn("edit")} onClick={() => startInlineEdit(it)}>Edit</button>
                          <button style={styles.actionBtn("delete")} onClick={() => removeItem(it.tuitionId)}>Del</button>
                        </>
                      )}
                    </td>

                    {/* DATA COLUMNS */}
                    <td style={styles.td}>
                         {isEditing ? <input style={styles.inlineInput} value={editRow.tuitionId} disabled /> : <b>{it.tuitionId}</b>}
                    </td>
                    <td style={styles.td}>
                         {isEditing ? <input type="time" style={styles.inlineInput} value={editRow.time} onChange={e => handleInlineChange("time", e.target.value)} /> : (it.timeHour ? `${it.timeHour}:00` : it.time)}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input type="date" style={styles.inlineInput} value={editRow.date} onChange={e => handleInlineChange("date", e.target.value)} /> : it.date}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.tuitionName} onChange={e => handleInlineChange("tuitionName", e.target.value)} /> : it.tuitionName}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input type="date" style={styles.inlineInput} value={editRow.demoDate} onChange={e => handleInlineChange("demoDate", e.target.value)} /> : it.demoDate}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.tutorName} onChange={e => handleInlineChange("tutorName", e.target.value)} /> : it.tutorName}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.status} onChange={e => handleInlineChange("status", e.target.value)} /> : 
                        <span style={{padding: "2px 8px", borderRadius: 12, background: "#eee", fontSize: 12}}>{it.status}</span>}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.satisfactionRating} onChange={e => handleInlineChange("satisfactionRating", e.target.value)} /> : it.satisfactionRating}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? (
                          <select style={styles.inlineSelect} value={editRow.demoRating} onChange={e => handleInlineChange("demoRating", e.target.value)}>
                             {demoRatings.map(d => <option key={d} value={d}>{d || "--"}</option>)}
                          </select>
                        ) : it.demoRating}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.parentsContact} onChange={e => handleInlineChange("parentsContact", e.target.value)} /> : it.parentsContact}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.source} onChange={e => handleInlineChange("source", e.target.value)} /> : it.source}
                    </td>
                    <td style={styles.td}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.country} onChange={e => handleInlineChange("country", e.target.value)} /> : it.country}
                    </td>
                    <td style={{...styles.td, minWidth: 200}}>
                        {isEditing ? <input style={styles.inlineInput} value={editRow.feedback} onChange={e => handleInlineChange("feedback", e.target.value)} placeholder="Feedback..." /> : <span style={{color: "#666", fontSize: 12}}>{it.feedback}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && <div style={{padding: 20, textAlign: "center", color: "#888"}}>No records found</div>}
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---
const TH = ({ children }) => <th style={styles.th}>{children}</th>;

function CreateField({ label, val, onChange, type="text" }) {
  return (
    <div>
      <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 4, display: "block"}}>{label}</label>
      <input type={type} style={styles.createInput} value={val || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}