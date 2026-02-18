import React, { useState, useEffect } from "react";
import { api } from "../api/api.js";

// --- CSS Styles (Injected for portability) ---
const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    overflow: "hidden",
    marginBottom: "24px",
    border: "1px solid #eef0f3",
    fontFamily: "'Inter', sans-serif",
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
  headerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  headerMeta: {
    fontSize: "13px",
    opacity: 0.85,
    marginTop: "4px",
    display: "block",
  },
  tableWrapper: {
    overflowX: "auto",
    background: "#fdfdfd",
    maxHeight: "500px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  th: {
    background: "#f8f9fc",
    color: "#6b7280",
    fontWeight: "600",
    padding: "14px 16px",
    textAlign: "left",
    borderBottom: "2px solid #eef0f3",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "middle",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid transparent",
    background: "transparent",
    transition: "all 0.2s",
    fontSize: "14px",
    outline: "none",
  },
  inputFocus: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  select: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: "13px",
  },
  badge: (color, fontColor) => ({
    background: color || "#eff6ff",
    color: fontColor || "#1e40af",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  }),
  btn: (loading) => ({
    padding: "6px 16px",
    background: loading ? "#ccc" : "#10b981", // Green for save
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "transform 0.1s",
  }),
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
  lockIcon: {
    fontSize: "40px",
    marginBottom: "15px",
    display: "block",
  },
  lockedPlaceholder: {
    padding: "40px",
    textAlign: "center",
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "pointer",
  }
};

// Helper to darken colors for gradients
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

const DEMO_RATING_VALUES = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const PASSWORD_SECRET = "admin123"; // Hardcoded Password

export default function SlotTable({ slot, onChanged, isProtected }) {
  const [open, setOpen] = useState(slot.items?.length > 0);
  const [savingId, setSavingId] = useState(null);
  const items = slot.items || [];
  
  // Role Detection (Simulated)
  const role = "admin"; // Replace with localStorage.getItem('role') or similar
  const themeColor = role === "admin" ? "#1e3c72" : "#7b4397"; // Matches Login

  // Lock Logic
  const [isUnlocked, setIsUnlocked] = useState(!isProtected);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function save(tuitionId, patch) {
    setSavingId(tuitionId);
    try {
      await api.patch(`/api/target/${encodeURIComponent(tuitionId)}`, patch);
      if (onChanged) await onChanged();
    } finally {
      setSavingId(null);
    }
  }

  // Handle Unlock
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

  return (
    <>
      <div style={styles.card}>
        {/* Accordion Header */}
        <div style={styles.header(open, themeColor)} onClick={handleHeaderClick}>
          <div>
            <h3 style={styles.headerTitle}>
               {isProtected && !isUnlocked ? "🔒 " : ""} {slot.slotHeader}
            </h3>
            <span style={styles.headerMeta}>
              {slot.displayRange} • {items.length} records
            </span>
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            {open ? "▲ Collapse" : "▼ Expand"}
          </div>
        </div>

        {/* Content Area */}
        {open && isUnlocked ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <TH>Date</TH>
                  <TH>Tuition Name</TH>
                  <TH>ID</TH>
                  <TH>Rejected Tutor</TH>
                  <TH>Tutor Name</TH>
                  <TH>Status</TH>
                  <TH>Subjects</TH>
                  <TH>Class</TH>
                  <TH>Feedback</TH>
                  <TH>Filter</TH>
                  <TH>Time</TH>
                  <TH>Satisfaction</TH>
                  <TH>Rating</TH>
                  <TH>Contact</TH>
                  <TH>Source</TH>
                  <TH style={{textAlign: 'center'}}>Action</TH>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="16" style={{...styles.td, textAlign: "center", color: "#999"}}>No records in this slot</td></tr>
                ) : items.map((it, idx) => (
                  <Row 
                    key={it.tuitionId} 
                    it={it} 
                    onSave={save} 
                    saving={savingId === it.tuitionId} 
                    isEven={idx % 2 === 0}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Locked State Placeholder (Visible if protected & closed, or protected & open but locked) */}
        {open && !isUnlocked && isProtected ? (
           <div style={styles.lockedPlaceholder} onClick={() => setShowPasswordModal(true)}>
              <span style={{fontSize: "24px"}}>🔒</span>
              <p>This content is password protected.</p>
              <button style={styles.btn(false)}>Enter Password</button>
           </div>
        ) : null}
      </div>

      {/* Password Modal */}
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
                style={{...styles.input, ...styles.inputFocus, textAlign: "center", fontSize: "16px", padding: "12px", marginBottom: "10px"}}
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

// Simple Helper for Table Header
const TH = ({ children, style }) => <th style={{ ...styles.th, ...style }}>{children}</th>;

function Row({ it, onSave, saving, isEven }) {
  const [edit, setEdit] = useState({
    demoDate: it.demoDate || "",
    tuitionName: it.tuitionName || "",
    tuitionId: it.tuitionId,
    rejectedTutor: it.rejectedTutor || "",
    tutorName: it.tutorName || "",
    status: it.status || "",
    subjects: it.subjects || "",
    className: it.className || "",
    feedback: it.feedback || "",
    satisfactionRating: it.satisfactionRating || "",
    demoRating: it.demoRating || ""
  });

  function setField(k, v) { setEdit(prev => ({ ...prev, [k]: v })); }

  const rowStyle = {
    background: isEven ? "#ffffff" : "#fafafa",
  };

  return (
    <tr style={rowStyle} className="hover-row">
      <td style={styles.td}>
         <StyledInput value={edit.demoDate} onChange={(e) => setField("demoDate", e.target.value)} placeholder="YYYY-MM-DD" width={110} />
      </td>
      <td style={styles.td} title={it.tuitionName}>{it.tuitionName || <span className="muted">--</span>}</td>
      <td style={styles.td}><b>{it.tuitionId}</b></td>
      <td style={styles.td}>{it.rejectedTutor || "--"}</td>
      <td style={styles.td}>
        <StyledInput value={edit.tutorName} onChange={(e) => setField("tutorName", e.target.value)} />
      </td>
      <td style={styles.td}>
        <StyledInput value={edit.status} onChange={(e) => setField("status", e.target.value)} />
      </td>
      <td style={styles.td}>{it.subjects}</td>
      <td style={styles.td}>{it.className}</td>
      <td style={styles.td}>
        <StyledInput value={edit.feedback} onChange={(e) => setField("feedback", e.target.value)} width={200} />
      </td>
      <td style={styles.td}>
        <span style={styles.badge(it.filterColor, it.filterFontColor)}>{it.filterStatus || "None"}</span>
      </td>
      <td style={styles.td}>{it.timePretty}</td>
      <td style={styles.td}>
        <StyledInput value={edit.satisfactionRating} onChange={(e) => setField("satisfactionRating", e.target.value)} width={120} />
      </td>
      <td style={styles.td}>
        <select style={styles.select} value={edit.demoRating || ""} onChange={(e) => setField("demoRating", e.target.value)}>
          {DEMO_RATING_VALUES.map(v => <option key={v} value={v}>{v || "--"}</option>)}
        </select>
      </td>
      <td style={styles.td}>{it.parentsContact}</td>
      <td style={styles.td}>{it.source}</td>
      <td style={{...styles.td, textAlign: "center"}}>
        <button
          style={styles.btn(saving)}
          disabled={saving}
          onClick={() => onSave(it.tuitionId, {
            demoDate: edit.demoDate,
            tutorName: edit.tutorName,
            status: edit.status,
            feedback: edit.feedback,
            satisfactionRating: edit.satisfactionRating,
            demoRating: edit.demoRating
          })}
        >
          {saving ? "..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

// Styled Input Component to handle Focus effects cleanly
function StyledInput({ value, onChange, placeholder, width }) {
  const [focused, setFocused] = useState(false);
  return (
    <input 
      style={{
        ...styles.input, 
        ...(focused ? styles.inputFocus : {}),
        minWidth: width || 140
      }} 
      value={value} 
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}