import React, { useEffect, useState } from "react";
import MainTuitions from "../components/MainTuitions.jsx";
import TargetBoard from "../components/TargetBoard.jsx";
import StaffManager from "../components/StaffManager.jsx";
import TrashBin from "../components/TrashBin.jsx"; // 👈 IMPORT TRASH BIN
import { api, clearToken, getStoredToken, setAuthToken } from "../api/api.js";
import Logo from "../assets/Logo-1-Blue.png"; // Yeh add karein
// --- STYLES (Modern & Unique) ---
const styles = {
  dashboardContainer: {
    minHeight: "100vh",
    background: "#f8f9fc",
    fontFamily: "'Inter', sans-serif",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255, 255, 255, 0.85)", // Glass effect
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    padding: "12px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "800",
    fontSize: "20px",
    color: "#1e3c72",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  logoIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    borderRadius: "50px",
    boxShadow: "0 4px 12px rgba(30, 60, 114, 0.3)",
    display: "flex",
    padding: "2px",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    
  },
  tabsContainer: {
    display: "flex",
    background: "#f0f2f5",
    padding: "4px",
    borderRadius: "12px",
    gap: "5px",
  },
  tab: (isActive) => ({
    padding: "8px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: isActive ? "#fff" : "#666",
    background: isActive ? "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" : "transparent",
    boxShadow: isActive ? "0 4px 12px rgba(30, 60, 114, 0.2)" : "none",
  }),
  actionSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userInfo: {
    textAlign: "right",
    lineHeight: "1.2",
  },
  userEmail: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  userRole: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  iconBtn: {
    background: "#fff",
    border: "1px solid #e1e4e8",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    color: "#555",
    transition: "0.2s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
  },
  logoutBtn: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)",
  },
  modalCard: {
    background: "white",
    width: "400px",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.2s ease-out",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    background: "#1e3c72",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
  }
};

export default function Dashboard() {
  const [tab, setTab] = useState("target"); 
  const [me, setMe] = useState(null);

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regData, setRegData] = useState({ email: "", password: "", role: "staff" });
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState("");

useEffect(() => {
  const token = getStoredToken();
  if (token) setAuthToken(token);

  api.get("/auth/me")
    .then(r => {
      const userData = r.data.user;
      setMe(userData);

      if (userData.role === "admin" || userData.role === "hod") {
        setTab("main");
      } else {
        if (userData.access_monthly) {
          setTab("main");
        } else if (userData.access_demo) {
          setTab("target");
        } else if (userData.access_trash) {
          setTab("trash");
        } else {
          setTab("no_access");
        }
      }
    })
    .catch((err) => {
      console.log("ME ERROR:", err.response?.data || err.message);
      setMe(null);
    });
}, []);

  function logout() {
    clearToken();
    window.location.href = "/login";
  }

  // Handle Registration
  async function handleRegister(e) {
    e.preventDefault();
    setRegLoading(true);
    setRegMsg("");
    try {
      await api.post("/auth/register", regData);
      setRegMsg("✅ User created successfully!");
      setRegData({ email: "", password: "", role: "staff" });
      setTimeout(() => {
        setShowRegModal(false);
        setRegMsg("");
        if (tab === "staff") {
            window.location.reload(); 
        }
      }, 1500);
    } catch (err) {
      setRegMsg(`❌ ${err?.response?.data?.message || "Failed to create user"}`);
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div style={styles.dashboardContainer}>
      
      {/* --- TOPBAR --- */}
      <div style={styles.topbar}>
        
        {/* Logo */}
        <a href="/" style={styles.logoSection}>
          <div style={styles.logoIcon}><img src={Logo} alt="Logo" className="w-100 h-100 img-fluid" /></div>
          
        </a>

        {/* Center Navigation Tabs */}
        <div style={styles.tabsContainer}>
          
          {/* 1. Today Demo Tab */}
          
          {/* 2. Monthly Tuitions Tab */}
          {(me?.role === 'admin' || me?.access_monthly) && (
            <div 
                style={styles.tab(tab === "main")} 
                onClick={() => setTab("main")}
            >
                📅 Monthly Tuitions
            </div>
          )}
{(me?.role === 'admin' || me?.access_demo) && (
            <div 
                style={styles.tab(tab === "target")} 
                onClick={() => setTab("target")}
            >
                🔥 Today Demo
            </div>
          )}  
          {/* 3. RECYCLE BIN TAB (New) */}
          {(me?.role === 'admin' || me?.access_trash) && (
            <div 
                style={styles.tab(tab === "trash")} 
                onClick={() => setTab("trash")}
            >
                🗑️ Recycle Bin
            </div>
          )}

          {/* 4. STAFF TAB (Only for Admin) */}
          {me?.role === 'admin' && (
             <div 
               style={styles.tab(tab === "staff")} 
               onClick={() => setTab("staff")}
             >
               👥 Staff
             </div>
          )}

        </div>

        {/* Right Actions */}
        <div style={styles.actionSection}>
          
          {/* Add Staff Button */}
          {me?.role === 'admin' && (
             <button 
               style={styles.iconBtn} 
               onClick={() => setShowRegModal(true)}
               title="Add New Staff"
             >
               <span>➕ New Staff</span>
             </button>
          )}

          <div style={{width: 1, height: 24, background: "#ddd"}}></div>

          {/* User Info */}
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{me?.email || "Guest"}</span>
            <span style={styles.userRole}>{me?.role || "Admin"}</span>
          </div>

          {/* Logout */}
          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="overflow-hidden">
        
        {/* Render Views based on Tab */}
        
        {tab === "target" && (
            <div className="fade-in"><TargetBoard /></div>
        )}

        {tab === "main" && (
            <div className="fade-in"><MainTuitions /></div>
        )}

        {/* 👇 TRASH BIN COMPONENT */}
        {tab === "trash" && (
            <div className="fade-in"><TrashBin /></div>
        )}

        {tab === "staff" && (
            <div className="fade-in"><StaffManager /></div>
        )}

        {tab === "no_access" && (
            <div className="fade-in" style={{textAlign: "center", padding: 40, color: "#666"}}>
                <h3>⛔ Access Restricted</h3>
                <p>You do not have permission to view any sheets. Please contact the Admin.</p>
            </div>
        )}

      </div>

      {/* --- REGISTER STAFF MODAL --- */}
      {showRegModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRegModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
              <h3 style={{margin: 0}}>Register New Staff</h3>
              <button onClick={() => setShowRegModal(false)} style={{background:"none", border:"none", fontSize: 20, cursor:"pointer"}}>✕</button>
            </div>
            
            <form onSubmit={handleRegister}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input 
                  required
                  type="email"
                  style={styles.input} 
                  placeholder="staff@portal.com" 
                  value={regData.email}
                  onChange={e => setRegData({...regData, email: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input 
                  required
                  type="password"
                  style={styles.input} 
                  placeholder="Create a password" 
                  value={regData.password}
                  onChange={e => setRegData({...regData, password: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <select 
                   style={styles.input}
                   value={regData.role}
                   onChange={e => setRegData({...regData, role: e.target.value})}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="hod">Hod</option>

                </select>
              </div>

              {regMsg && (
                <div style={{
                  padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 10,
                  background: regMsg.includes("✅") ? "#e6fffa" : "#fff5f5",
                  color: regMsg.includes("✅") ? "#2c7a7b" : "#c53030"
                }}>
                  {regMsg}
                </div>
              )}

              <button type="submit" style={styles.primaryBtn} disabled={regLoading}>
                {regLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Helper CSS for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        
        @media (max-width: 768px) {
          .topbar { flex-direction: column; gap: 15px; padding: 15px; }
          .tabsContainer { width: 100%; justify-content: center; flex-wrap: wrap;}
          .actionSection { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}