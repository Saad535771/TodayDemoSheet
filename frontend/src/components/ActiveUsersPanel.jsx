import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api.js";

const styles = {
  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    borderRadius: "22px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    padding: "22px",
    border: "1px solid #e7edf5",
    marginBottom: "24px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#163b68",
    margin: 0,
  },

  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  liveBadge: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  refreshBtn: {
    background: "#ffffff",
    color: "#1e293b",
    border: "1px solid #dbe4ee",
    borderRadius: "12px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.05)",
  },

  topStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  statBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "700",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  userCard: {
    position: "relative",
    background: "#ffffff",
    border: "1px solid #e7edf5",
    borderRadius: "18px",
    padding: "14px",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
    transition: "0.25s ease",
    overflow: "hidden",
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6)",
  },

  topRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "800",
    flexShrink: 0,
    boxShadow: "0 8px 16px rgba(37, 99, 235, 0.22)",
  },

  infoWrap: {
    minWidth: 0,
    flex: 1,
  },

  email: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  nameText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  sessionText: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusMini: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  badgesWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  badgeBase: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "800",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    maxWidth: "100%",
  },

  roleBadge: (role) => ({
    background:
      role === "admin"
        ? "#dcfce7"
        : role === "hod"
        ? "#e0f2fe"
        : role === "otm"
        ? "#f3e8ff"
        : "#f8fafc",
    color:
      role === "admin"
        ? "#166534"
        : role === "hod"
        ? "#075985"
        : role === "otm"
        ? "#7c3aed"
        : "#475569",
    border: `1px solid ${
      role === "admin"
        ? "#bbf7d0"
        : role === "hod"
        ? "#bae6fd"
        : role === "otm"
        ? "#ddd6fe"
        : "#e2e8f0"
    }`,
  }),

  sheetBadge: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
  },

  loginBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },

  seenBadge: {
    background: "#fefce8",
    color: "#a16207",
    border: "1px solid #fde68a",
  },

  clickHint: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#7c3aed",
    fontWeight: "800",
  },

  empty: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
  },
};

function formatSheetName(sheet) {
  switch (sheet) {
    case "main":
      return "Monthly";
    case "target":
      return "Today Demo";
    case "payment":
      return "Payment";
    case "trash":
      return "Recycle Bin";
    case "staff":
      return "Staff";
    case "dashboard":
      return "Dashboard";
    case "otm-management":
      return "OTM Management";
    default:
      return sheet || "--";
  }
}

function formatDateTimeShort(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(email, name) {
  if (name) return name.trim().charAt(0).toUpperCase();
  if (!email) return "U";
  return email.trim().charAt(0).toUpperCase();
}

export default function ActiveUsersPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadActiveUsers(showLoader = false) {
    try {
      if (showLoader) setLoading(true);
      const res = await api.get("/auth/active-users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to load active users:", err);
      setUsers([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadActiveUsers(true);

    const interval = setInterval(() => {
      loadActiveUsers(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h2 style={styles.title}>🟢 Active Users</h2>
        </div>

        <div style={styles.actions}>
          <div style={styles.liveBadge}>● Auto Refresh 15s</div>
          <button style={styles.refreshBtn} onClick={() => loadActiveUsers(true)}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.topStats}>
        <div style={styles.statBox}>Online Users: {users.length}</div>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading active users...</div>
      ) : users.length === 0 ? (
        <div style={styles.empty}>No active users found.</div>
      ) : (
        <div style={styles.grid}>
          {users.map((user) => (
            <div
              key={`${user.session_id}-${user.user_id}`}
              style={{
                ...styles.userCard,
                cursor: user.role === "otm" ? "pointer" : "default",
              }}
              onClick={() => {
                if (user.role === "otm") {
                  navigate(`/admin/otm/${user.user_id}`);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 16px 30px rgba(15, 23, 42, 0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(15, 23, 42, 0.05)";
              }}
            >
              <div style={styles.topLine} />

              <div style={styles.topRow}>
                <div style={styles.avatar}>{getInitial(user.email, user.name)}</div>

                <div style={styles.infoWrap}>
                  <p style={styles.email}>{user.email || "--"}</p>
                  <div style={styles.nameText}>{user.name || "--"}</div>
                  <div style={styles.sessionText}>
                    Session: {user.session_id || "--"}
                  </div>
                </div>

                <div style={styles.statusMini}>
                  <span style={styles.dot}></span>
                  Online
                </div>
              </div>

              <div style={styles.badgesWrap}>
                <span
                  style={{
                    ...styles.badgeBase,
                    ...styles.roleBadge(user.role),
                  }}
                >
                  {user.role || "--"}
                </span>

                <span
                  style={{
                    ...styles.badgeBase,
                    ...styles.sheetBadge,
                  }}
                >
                  📄 {formatSheetName(user.current_sheet)}
                </span>

                <span
                  style={{
                    ...styles.badgeBase,
                    ...styles.loginBadge,
                  }}
                >
                  ⏰ Login: {formatDateTimeShort(user.login_at)}
                </span>

                <span
                  style={{
                    ...styles.badgeBase,
                    ...styles.seenBadge,
                  }}
                >
                  👁 Last Seen: {formatDateTimeShort(user.last_seen_at)}
                </span>
              </div>

              {user.role === "otm" && (
                <div style={styles.clickHint}>Click to view OTM details</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}