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
    fontFamily: "'Calibri', sans-serif", // Font changed to Calibri
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
    background: "#ffffff",
    maxHeight: "500px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse", // Ensures no gaps between boxes
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  th: {
    background: "#f3f2f1", // Excel header color
    color: "#323130",
    fontWeight: "600",
    padding: "8px 10px",
    textAlign: "left",
    border: "1px solid #c8c6c4", // Excel grid borders
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  td: {
    padding: "0", // 0 padding so input completely fills the box like Excel
    border: "1px solid #c8c6c4", // Standard Excel borders for every cell
    verticalAlign: "middle",
  },
  input: {
    width: "100%",
    boxSizing: "border-box", // Prevents input from overflowing the cell
    padding: "8px 10px",
    borderRadius: "0", // Removed radius for boxy Excel look
    border: "none", 
    background: "transparent",
    transition: "all 0.1s",
    fontSize: "14px",
    outline: "none",
    fontFamily: "'Calibri', sans-serif",
  },
  inputFocus: {
    background: "#ffffff",
    boxShadow: "inset 0 0 0 2px #107c41", // Excel specific green focus ring
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: "0",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    fontFamily: "'Calibri', sans-serif",
    outline: "none",
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
  // Modal Styles remain same
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  modalCard: {
    background: "white", padding: "30px", borderRadius: "16px",
    width: "90%", maxWidth: "400px", textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  },
  lockIcon: { fontSize: "40px", marginBottom: "15px", display: "block" },
  lockedPlaceholder: {
    padding: "40px", textAlign: "center", background: "#f9fafb",
    color: "#6b7280", cursor: "pointer",
  }
};

// Helper to darken colors for gradients
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

const DEMO_RATING_VALUES = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const PASSWORD_SECRET = "admin123"; 

export default function SlotTable({ slot, onChanged, isProtected }) {
  const [open, setOpen] = useState(slot.items?.length > 0);
  const [savingId, setSavingId] = useState(null);
  const [zoom, setZoom] = useState(1); 
  const items = slot.items || [];
  
  const role = "admin"; 
  const themeColor = role === "admin" ? "#1e3c72" : "#7b4397"; 

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

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header(open, themeColor)} onClick={handleHeaderClick}>
          <div>
            <h3 style={styles.headerTitle}>
               {isProtected && !isUnlocked ? "🔒 " : ""} {slot.slotHeader}
            </h3>
            <span style={styles.headerMeta}>
              {slot.displayRange} • {items.length} records
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {open && isUnlocked && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.2)", padding: "4px 10px", borderRadius: "20px" }}>
                <button onClick={(e) => handleZoom(e, -0.1)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>-</button>
                <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "40px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                <button onClick={(e) => handleZoom(e, 0.1)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>+</button>
              </div>
            )}
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              {open ? "▲ Collapse" : "▼ Expand"}
            </div>
          </div>
        </div>

        {open && isUnlocked ? (
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
                    <TH style={{textAlign: 'center'}}>Action</TH>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="21" style={{...styles.td, textAlign: "center", color: "#999", padding: "15px"}}>No records in this slot</td></tr>
                  ) : items.map((it, idx) => (
                    <Row 
                      key={it.tuitionId || idx} 
                      it={it} 
                      onSave={save} 
                      saving={savingId === it.tuitionId} 
                    />
                  ))}
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
                style={{...styles.input, ...styles.inputFocus, textAlign: "center", fontSize: "16px", padding: "12px", marginBottom: "10px", border: "1px solid #ccc"}}
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

const TH = ({ children, style }) => <th style={{ ...styles.th, ...style }}>{children}</th>;

function Row({ it, onSave, saving }) {
  const [edit, setEdit] = useState({
    date: it.date || "",
    demoTime: it.demoTime || "",
    tuitionName: it.tuitionName || "",
    source: it.source || "",
    country: it.country || "",
    parentContact: it.parentsContact || it.parentContact || "",
    className: it.className || it.class || "",
    subject: it.subjects || it.subject || "",
    daysPerWeek: it.daysPerWeek || "",
    estimatedFee: it.estimatedFee || "",
    tutorName: it.tutorName || "",
    tutorFees: it.tutorFees || "",
    classTime: it.classTime || it.timePretty || "",
    rejectedTutor: it.rejectedTutor || "",
    status: it.status || "",
    feedback: it.feedback || "",
    demoDate: it.demoDate || "",
    tuitionId: it.tuitionId || "",
    demoRating: it.demoRating || "",
    sync: it.sync || ""
  });

  function setField(k, v) { setEdit(prev => ({ ...prev, [k]: v })); }

  return (
    <tr style={{ background: "#ffffff" }}>
      <td style={styles.td}><StyledInput value={edit.date} onChange={(e) => setField("date", e.target.value)} placeholder="YYYY-MM-DD" width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.demoTime} onChange={(e) => setField("demoTime", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.tuitionName} onChange={(e) => setField("tuitionName", e.target.value)} width={150} /></td>
      <td style={styles.td}><StyledInput value={edit.source} onChange={(e) => setField("source", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.country} onChange={(e) => setField("country", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.parentContact} onChange={(e) => setField("parentContact", e.target.value)} width={130} /></td>
      <td style={styles.td}><StyledInput value={edit.className} onChange={(e) => setField("className", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.subject} onChange={(e) => setField("subject", e.target.value)} width={120} /></td>
      <td style={styles.td}><StyledInput value={edit.daysPerWeek} onChange={(e) => setField("daysPerWeek", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.estimatedFee} onChange={(e) => setField("estimatedFee", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.tutorName} onChange={(e) => setField("tutorName", e.target.value)} width={140} /></td>
      <td style={styles.td}><StyledInput value={edit.tutorFees} onChange={(e) => setField("tutorFees", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.classTime} onChange={(e) => setField("classTime", e.target.value)} width={100} /></td>
      
      <td style={{ ...styles.td, backgroundColor: "#ffebee" }}> 
        <StyledInput value={edit.rejectedTutor} onChange={(e) => setField("rejectedTutor", e.target.value)} width={120} />
      </td>

      <td style={styles.td}><StyledInput value={edit.status} onChange={(e) => setField("status", e.target.value)} width={100} /></td>
      <td style={styles.td}><StyledInput value={edit.feedback} onChange={(e) => setField("feedback", e.target.value)} width={180} /></td>
      <td style={styles.td}><StyledInput value={edit.demoDate} onChange={(e) => setField("demoDate", e.target.value)} placeholder="YYYY-MM-DD" width={110} /></td>
      <td style={styles.td}><StyledInput value={edit.tuitionId} onChange={(e) => setField("tuitionId", e.target.value)} width={100} /></td>
      <td style={styles.td}>
        <select style={{...styles.select, width: "120px"}} value={edit.demoRating || ""} onChange={(e) => setField("demoRating", e.target.value)}>
          {DEMO_RATING_VALUES.map(v => <option key={v} value={v}>{v || "--"}</option>)}
        </select>
      </td>
      <td style={styles.td}><StyledInput value={edit.sync} onChange={(e) => setField("sync", e.target.value)} width={80} /></td>
      
      <td style={{...styles.td, textAlign: "center", padding: "4px"}}>
        <button
          style={styles.btn(saving)}
          disabled={saving}
          onClick={() => onSave(it.tuitionId, { ...edit })}
        >
          {saving ? "..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

function StyledInput({ value, onChange, placeholder, width, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <input 
      style={{
        ...styles.input, 
        ...(focused ? styles.inputFocus : {}),
        minWidth: width || 140,
        ...style 
      }} 
      value={value} 
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}