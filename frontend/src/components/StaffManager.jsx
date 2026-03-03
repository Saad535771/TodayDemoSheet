import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";

const styles = {
  container: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "15px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e3c72",
    margin: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #f0f2f5",
    color: "#888",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f9f9f9",
    fontSize: "14px",
    color: "#333",
    verticalAlign: "middle",
  },
  roleBadge: (role) => ({
    background: role === "admin" ? "#e6fffa" : "#ebf8ff",
    color: role === "admin" ? "#2c7a7b" : "#2b6cb0",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
  }),
  toggleBtn: (active) => ({
    background: active ? "#48bb78" : "#cbd5e0",
    border: "none",
    width: "40px",
    height: "22px",
    borderRadius: "20px",
    cursor: "pointer",
    position: "relative",
    transition: "0.3s",
  }),
  toggleCircle: (active) => ({
    width: "16px",
    height: "16px",
    background: "white",
    borderRadius: "50%",
    position: "absolute",
    top: "3px",
    left: active ? "21px" : "3px",
    transition: "0.3s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  }),
  deleteBtn: {
    background: "#fff5f5",
    color: "#c53030",
    border: "1px solid #feb2b2",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default function StaffManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Users
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get("/api/auth/users");
      setUsers(res.data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Toggle Permission
  async function togglePermission(userId, field, currentValue) {
    // Optimistic Update (Turant UI change karein)
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, [field]: !currentValue } : u
    );
    setUsers(updatedUsers);

    try {
      const user = updatedUsers.find(u => u.id === userId);
      // Backend ko saari permissions bhejni hoti hain
      await api.put(`/api/auth/users/${userId}/permissions`, {
        access_monthly: user.access_monthly,
        access_demo: user.access_demo,
        access_trash: user.access_trash // 👈 yeh zaroori hai
      });
    } catch (err) {
      alert("Failed to update permission");
      fetchUsers(); // Revert on error
    }
  }

  // Handle Delete
  async function handleDelete(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await api.delete(`/api/auth/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  }

  if (loading) return <div>Loading Staff...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👥 User Management</h2>
        <span style={{fontSize: 12, color: '#666'}}>Manage access to sheets</span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Show Monthly</th>
            <th style={styles.th}>Show Demo</th>
            <th style={styles.th}>Show Trash</th> {/* 👈 New Column */}
            <th style={{...styles.th, textAlign: 'right'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={styles.td}>
                <div style={{fontWeight: 500}}>{user.email}</div>
                <div style={{fontSize: 11, color: '#999'}}>ID: {user.id}</div>
              </td>
              <td style={styles.td}>
                <span style={styles.roleBadge(user.role)}>{user.role}</span>
              </td>
              
              {/* Toggle: Monthly Access */}
              <td style={styles.td}>
                <button 
                  style={styles.toggleBtn(user.access_monthly)} 
                  onClick={() => togglePermission(user.id, 'access_monthly', user.access_monthly)}
                  title="Toggle Monthly Sheet Access"
                >
                  <div style={styles.toggleCircle(user.access_monthly)} />
                </button>
              </td>

              {/* Toggle: Demo Access */}
              <td style={styles.td}>
                <button 
                  style={styles.toggleBtn(user.access_demo)} 
                  onClick={() => togglePermission(user.id, 'access_demo', user.access_demo)}
                  title="Toggle Demo Sheet Access"
                >
                  <div style={styles.toggleCircle(user.access_demo)} />
                </button>
              </td>

              {/* Toggle: Trash Access (NEW) */}
              <td style={styles.td}>
                <button 
                  style={styles.toggleBtn(user.access_trash)} 
                  onClick={() => togglePermission(user.id, 'access_trash', user.access_trash)}
                  title="Toggle Recycle Bin Access"
                >
                  <div style={styles.toggleCircle(user.access_trash)} />
                </button>
              </td>

              {/* Delete Button */}
              <td style={{...styles.td, textAlign: "right"}}>
                {user.role !== 'admin' && ( // Admin khud ko delete na kare
                    <button style={styles.deleteBtn} onClick={() => handleDelete(user.id)}>
                      Delete
                    </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}