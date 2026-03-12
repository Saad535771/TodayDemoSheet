import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    border: "1px solid #eef0f3",
    marginBottom: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e3c72",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#666",
    margin: 0,
  },
  liveBadge: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  th: {
    background: "#f8fafc",
    color: "#334155",
    fontWeight: "700",
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
    fontSize: "12px",
    textTransform: "uppercase",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #eef2f7",
    color: "#334155",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
  },
  roleBadge: (role) => ({
    background: role === "admin" ? "#e6fffa" : role === "hod" ? "#ecfeff" : "#f3e8ff",
    color: role === "admin" ? "#0f766e" : role === "hod" ? "#0f766e" : "#7c3aed",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  }),
  refreshBtn: {
    background: "#f3f4f6",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
};

function formatSheetName(sheet) {
  switch (sheet) {
    case "main":
      return "Monthly Tuitions";
    case "target":
      return "Today Demo";
    case "payment":
      return "Payment Sheet";
    case "trash":
      return "Recycle Bin";
    case "staff":
      return "Staff Manager";
    case "dashboard":
      return "Dashboard";
    default:
      return sheet || "--";
  }
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
}

export default function ActiveUsersPanel() {
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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h2 style={styles.title}>🟢 Active Users</h2>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={styles.liveBadge}>● Auto Refresh 5s</div>
          <button style={styles.refreshBtn} onClick={() => loadActiveUsers(true)}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Current Sheet</th>
              <th style={styles.th}>Login Time</th>
              <th style={styles.th}>Last Seen</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td style={styles.empty} colSpan={6}>
                  Loading active users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td style={styles.empty} colSpan={6}>
                    No active users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={`${user.session_id}-${user.user_id}`}>
                  <td style={styles.td}>{user.email || "--"}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge(user.role)}>{user.role || "--"}</span>
                  </td>
                  <td style={styles.td}>{formatSheetName(user.current_sheet)}</td>
                  <td style={styles.td}>{formatDateTime(user.login_at)}</td>
                  <td style={styles.td}>{formatDateTime(user.last_seen_at)}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>● Online</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}