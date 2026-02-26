import React, { useState } from "react";
import { api } from "../api/api.js";

const styles = {
  card: { background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", padding: "24px", marginBottom: "24px", border: "1px solid #eef0f3" },
  summaryBtn: { cursor: "pointer", fontWeight: "700", color: "#1e3c72", display: "flex", alignItems: "center", gap: "8px", listStyle: "none", fontSize: "16px" },
  singleLineForm: { display: "flex", overflowX: "auto", gap: "0px", marginTop: "16px", padding: "10px", background: "#f3f2f1", border: "1px solid #c8c6c4", borderRadius: "4px", alignItems: "flex-end" },
  createInput: { width: "100%", padding: "8px", border: "1px solid #c8c6c4", fontSize: "13px", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif", background: "white", outline: "none" },
  primaryBtn: { background: "#107c41",margin:'0px 5px',fontSize:'15px', color: "white", border: "none", padding: "0px 16px", borderRadius: "50px", fontWeight: "600", cursor: "pointer", fontFamily: "'Calibri', sans-serif", minWidth: "100px", height: "34px", whiteSpace: "nowrap" }
};
const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = ["", "1st Demo Done", "2nd Demo Done", "payment Process", "Tuition Done", "Tuition Cancelled", "irrelevant", "Not available", "Pending"];

// --- COLOR LOGIC FUNCTIONS ---

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
    default: return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }
};

const getDemoRatingStyle = (rating) => {
  switch (rating) {
    case "Average Demo": return { backgroundColor: "#ca8a04", color: "white", border: "1px solid #ca8a04" }; // Dark Yellow
    case "Strong Demo": return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" }; // Green
    case "Weak Demo": return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" }; // Red
    default: return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }
};

const getSourceStyle = (source) => {
  switch (source) {
    case "mahad": return { backgroundColor: "#0ea5e9", color: "white", border: "1px solid #0ea5e9" }; // Blue
    case "areeba": return { backgroundColor: "#ec4899", color: "white", border: "1px solid #ec4899" }; // Pink
    case "sibgha": return { backgroundColor: "#14b8a6", color: "white", border: "1px solid #14b8a6" }; // Teal
    default: return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }
};

function generateTuitionId() { return `T-${Math.floor(1000 + Math.random() * 9000)}`; }

function emptyForm() {
  return {
    tuitionId: generateTuitionId(), 
    date: new Date().toISOString().split('T')[0], 
    time: "", 
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
    // classTime remove kar diya gaya hai
    rejectedTutor: "", 
    status: "", 
    feedback: "", 
    demoDate: "", 
    demoRating: "", 
    sync: ""
  };
}

export default function MonthlyTuition({ onLoad }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());

  function setCreateField(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  async function create(e) {
    e.preventDefault();
    setCreating(true);
    try {
      // time property ab sirf demoTime par base karegi kyunke classTime remove ho chuka hai
      const payloadToSubmit = { ...form, time: form.demoTime || "12:00" };
      await api.post("/api/tuitions", payloadToSubmit);
      setForm(emptyForm());
      await onLoad();
    } catch (e) {
      alert("Create failed. Please check backend validation.");
    } finally {
      setCreating(false);
    }
  }

  // KEYBOARD NAVIGATION LOGIC
  const handleKeyDown = (e) => {
    if (['Enter', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
      const formElement = e.currentTarget;
      const elements = Array.from(formElement.querySelectorAll('input, select, button'));
      const index = elements.indexOf(e.target);

      if (index > -1) {
        if (e.key === 'Enter') {
          if (e.target.tagName === 'BUTTON') return;
          e.preventDefault();
          if (index < elements.length - 1) elements[index + 1].focus();
        } 
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          if (e.target.type === 'date' || e.target.type === 'time' || e.target.tagName === 'SELECT') return;
          const isText = e.target.type === 'text';
          
          if (e.key === 'ArrowRight') {
            if (isText && e.target.selectionStart !== e.target.value.length) return;
            e.preventDefault();
            if (index < elements.length - 1) elements[index + 1].focus();
          } 
          else if (e.key === 'ArrowLeft') {
            if (isText && e.target.selectionEnd !== 0) return;
            e.preventDefault();
            if (index > 0) elements[index - 1].focus();
          }
        }
      }
    }
  };

  return (
    <div style={styles.card}>
      <details>
        <summary style={styles.summaryBtn}>
          <span style={{ fontSize: 20, color: "#107c41", marginRight: 5 }}>+</span> Add New Tuition (Quick Entry)
        </summary>
        <form onSubmit={create} style={styles.singleLineForm} onKeyDown={handleKeyDown}>
          <CreateField label="Tuition ID" val={form.tuitionId} onChange={v => setCreateField("tuitionId", v)} width="100px" />
          <CreateField label="Date" type="date" val={form.date} onChange={v => setCreateField("date", v)} width="130px" />
          <CreateField label="Demo Time" type="time" val={form.demoTime} onChange={v => setCreateField("demoTime", v)} width="110px" />
          <CreateField label="Tuition Name" val={form.tuitionName} onChange={v => setCreateField("tuitionName", v)} width="150px" />
          
          <div style={{ minWidth: "120px" }}>
            <label style={{ fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 2, display: "block" }}>Source</label>
            <select 
              style={{ ...styles.createInput, ...getSourceStyle(form.source), fontWeight: "bold" }} 
              value={form.source} 
              onChange={e => setCreateField("source", e.target.value)}
            >
              {sourcesList.map(o => (
                <option key={o} value={o} style={{ backgroundColor: "white", color: "black", fontWeight: "normal" }}>
                  {o || "-- Select --"}
                </option>
              ))}
            </select>
          </div>

          <CreateField label="Country" val={form.country} onChange={v => setCreateField("country", v)} width="100px" />
          <CreateField label="Parent Contact" val={form.parentsContact} onChange={v => setCreateField("parentsContact", v)} width="120px" />
          <CreateField label="Class" val={form.className} onChange={v => setCreateField("className", v)} width="100px" />
          <CreateField label="Subject" val={form.subjects} onChange={v => setCreateField("subjects", v)} width="120px" />
          <CreateField label="Days/Week" val={form.daysPerWeek} onChange={v => setCreateField("daysPerWeek", v)} width="90px" />
          <CreateField label="Estimated Fee" val={form.estimatedFee} onChange={v => setCreateField("estimatedFee", v)} width="110px" />
          <CreateField label="Tutor Name" val={form.tutorName} onChange={v => setCreateField("tutorName", v)} width="130px" />
          <CreateField label="Tutor Fees" val={form.tutorFees} onChange={v => setCreateField("tutorFees", v)} width="100px" />
          {/* Class Time Field yahan se remove kar di gayi hai */}
          <CreateField label="Rejected Tutor" val={form.rejectedTutor} onChange={v => setCreateField("rejectedTutor", v)} width="130px" />
          <CreateField label="Feedback" val={form.feedback} onChange={v => setCreateField("feedback", v)} width="150px" />
          
          <div style={{ minWidth: "120px" }}>
            <label style={{ fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 2, display: "block" }}>Status</label>
            <select 
              style={{ ...styles.createInput, ...getStatusStyle(form.status), fontWeight: "bold" }} 
              value={form.status} 
              onChange={e => setCreateField("status", e.target.value)}
            >
              {statusList.map(o => (
                <option key={o} value={o} style={{ backgroundColor: "white", color: "black", fontWeight: "normal" }}>
                  {o || "-- Select --"}
                </option>
              ))}
            </select>
          </div>
          
          <CreateField label="Demo Date" type="date" val={form.demoDate} onChange={v => setCreateField("demoDate", v)} width="130px" />
          
          <div style={{ minWidth: "120px" }}>
            <label style={{ fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 2, display: "block" }}>Demo Rating</label>
            <select 
              style={{ ...styles.createInput, ...getDemoRatingStyle(form.demoRating), fontWeight: "bold" }} 
              value={form.demoRating} 
              onChange={e => setCreateField("demoRating", e.target.value)}
            >
              {demoRatings.map(o => (
                <option key={o} value={o} style={{ backgroundColor: "white", color: "black", fontWeight: "normal" }}>
                  {o || "-- Select --"}
                </option>
              ))}
            </select>
          </div>

          <CreateField label="Sync" val={form.sync} onChange={v => setCreateField("sync", v)} width="100px" />

          <div style={{ paddingBottom: "2px" }}>
            <button type="submit" style={styles.primaryBtn} disabled={creating}>
              {creating ? "Adding..." : "Add Row +"}
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}

function CreateField({ label, val, onChange, type="text", width="120px" }) {
  return (
    <div style={{ minWidth: width }}>
      <label style={{fontSize: 11, fontWeight: "bold", color: "#666", marginBottom: 2, display: "block"}}>{label}</label>
      <input type={type} style={{ width: "100%", padding: "8px", border: "1px solid #c8c6c4", fontSize: "12px", boxSizing: "border-box", fontFamily: "'Calibri', sans-serif", background: "white", outline: "none" }} value={val || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}