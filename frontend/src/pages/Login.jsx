import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api,storeToken } from "../api/api";
import Logo from "../assets/logo-white.png"; // Yeh add karein
// --- CSS Styles (Injected via JS for easy copy-paste) ---
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    fontFamily: "'Inter', sans-serif",
    background: "#f8f9fc",
    overflow: "hidden",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    padding: "40px",
    position: "relative",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    background: "#ffffff",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
  },
  header: {
    marginBottom: "30px",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#333",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#666",
    fontSize: "14px",
  },
  roleSwitcher: {
    display: "flex",
    background: "#f0f2f5",
    padding: "4px",
    borderRadius: "12px",
    marginBottom: "30px",
    cursor: "pointer",
  },
  roleBtn: (isActive, color) => ({
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: isActive ? "white" : "transparent",
    color: isActive ? color : "#888",
    fontWeight: "600",
    boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    textAlign: "center",
  }),
  inputGroup: {
    marginBottom: "20px",
    position: "relative",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "2px solid #eef0f3",
    fontSize: "15px",
    transition: "border-color 0.2s",
    outline: "none",
    boxSizing: "border-box", // Fixes padding issues
  },
  eyeIcon: {
    position: "absolute",
    right: "15px",
    top: "40px",
    cursor: "pointer",
    color: "#999",
    userSelect: "none",
  },
  button: (color, disabled) => ({
    width: "100%",
    padding: "16px",
    borderRadius: "10px",
    border: "none",
    background: disabled ? "#ccc" : color,
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : `0 8px 20px -6px ${color}`,
    transition: "transform 0.2s, box-shadow 0.2s",
    marginTop: "10px",
  }),
  error: {
    background: "#fff2f2",
    color: "#d32f2f",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "20px",
    borderLeft: "4px solid #d32f2f",
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
  },
};
export default function Login() {
  const nav = useNavigate();
  // State
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Theme Colors based on Role
  const themeColor =
  role === "admin"
    ? "#1e3c72"
    : role === "hod"
    ? "#0f9b8e"
    : "#7b4397";
 const bgGradient =
  role === "admin"
    ? "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
    : role === "hod"
    ? "linear-gradient(135deg, #0f9b8e 0%, #38ef7d 100%)"
    : "linear-gradient(135deg, #7b4397 0%, #dc2430 100%)";

 const handleRoleChange = (newRole) => {
  setRole(newRole);
  setError("");
  setEmail("");
  setPassword("");
};

async function onSubmit(e) {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const res = await api.post("/auth/login", {
      email,
      password,
      role
    });

    const data = res.data;

    storeToken(data.token);
    nav("/");
  } catch (err) {
    console.log(err);

    if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else if (err.response?.data?.errors?.length) {
      setError(err.response.data.errors[0].msg);
    } else {
      setError("Login failed");
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={styles.container}>
      
      {/* Left Side: Branding & Art */}
      <div style={{...styles.leftPanel, background: bgGradient}} className="hidden-mobile">
        <div style={{...styles.decorativeCircle, width: 300, height: 300, top: -50, left: -50}}></div>
        <div style={{...styles.decorativeCircle, width: 200, height: 200, bottom: 50, right: 50}}></div>
        <div className="d-flex w-75 justify-content-center align-items-center mb-4" style={{ zIndex: 1 }}>
          <img src={Logo} className="w-50 h-100  img-fluid" alt="" />
           </div>
        <h1 style={{ fontSize: "3rem", marginBottom: "10px", zIndex: 1 }}>Tuition Portal</h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.9, zIndex: 1 }}>
          Manage your tuitions, tutors, and students efficiently.
        </p>
      </div>

      {/* Right Side: Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          
          <div style={styles.header}>
            <h2 style={styles.title}>Welcome Back!</h2>
            <p style={styles.subtitle}>Please login to access the dashboard.</p>
          </div>

          {/* Role Switcher */}
          <div style={styles.roleSwitcher}>
            <button 
              type="button"
              style={styles.roleBtn(role === "admin", "#1e3c72")} 
              onClick={() => handleRoleChange("admin")}
            >
              Admin Login
            </button>
             <button
    type="button"
    style={styles.roleBtn(role === "hod", "#0f9b8e")}
    onClick={() => handleRoleChange("hod")}
  >
    HOD Login
  </button>
            <button 
              type="button"
              style={styles.roleBtn(role === "staff", "#7b4397")} 
              onClick={() => handleRoleChange("staff")}
            >
              Staff Login
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={onSubmit}>
            {/* Email Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input 
                style={{...styles.input, borderColor: error ? "#ffcccc" : "#eef0f3"}}
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@example.com"
                required
                onFocus={(e) => e.target.style.borderColor = themeColor}
                onBlur={(e) => e.target.style.borderColor = "#eef0f3"}
              />
            </div>

            {/* Password Field */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input 
                style={{...styles.input, borderColor: error ? "#ffcccc" : "#eef0f3"}}
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
                onFocus={(e) => e.target.style.borderColor = themeColor}
                onBlur={(e) => e.target.style.borderColor = "#eef0f3"}
              />
              <span 
                style={styles.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "👁️" : "🔒"}
              </span>
            </div>

            {/* Submit Button */}
            <button 
              className="hover-effect"
              style={styles.button(themeColor, loading)} 
              type="submit" 
              disabled={loading}
            >
             {loading ? "Signing in..." : `Login as ${role.toUpperCase()}`}
            </button>
          </form>

        </div>
      </div>

      {/* Helper CSS for Mobile responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        .hover-effect:hover {
           transform: translateY(-2px);
           opacity: 0.95;
        }
        .input:focus {
           box-shadow: 0 0 0 4px rgba(30, 60, 114, 0.1);
        }
      `}</style>
    </div>
  );
}