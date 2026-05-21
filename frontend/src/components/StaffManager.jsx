import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1380px",
  },
  th: {
    textAlign: "center",
    padding: "12px 16px",
    borderBottom: "2px solid #f0f2f5",
    color: "#888",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f9f9f9",
    fontSize: "14px",
    color: "#333",
    verticalAlign: "middle",
  },
  roleBadge: (role) => ({
    background:
      role === "admin"
        ? "#e6fffa"
        : role === "hod"
          ? "#ebf8ff"
          : role === "otm"
            ? "#f3e8ff"
            : "#f8fafc",
    color:
      role === "admin"
        ? "#2c7a7b"
        : role === "hod"
          ? "#2b6cb0"
          : role === "otm"
            ? "#7c3aed"
            : "#475569",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
  }),
  toggleBtn: (active, disabled = false) => ({
    background: active ? "#48bb78" : "#cbd5e0",
    border: "none",
    width: "48px",
    height: "26px",
    borderRadius: "20px",
    cursor: disabled ? "not-allowed" : "pointer",
    position: "relative",
    transition: "0.3s",
    opacity: disabled ? 0.5 : 1,
  }),
  toggleCircle: (active) => ({
    width: "20px",
    height: "20px",
    background: "white",
    borderRadius: "50%",
    position: "absolute",
    top: "3px",
    left: active ? "25px" : "3px",
    transition: "0.3s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  }),
  deleteBtn: {
    background: "#fff5f5",
    color: "#c53030",
    border: "1px solid #feb2b2",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  portalBtn: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #d8b4fe",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    marginRight: "8px",
  },
  mutedText: {
    fontSize: "12px",
    color: "#999",
    fontStyle: "italic",
  },
  centerCell: {
    textAlign: "center",
  },
  actionsWrap: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
  },
};

export default function StaffManager() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data?.users || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }

  function toInt(value) {
    return value ? 1 : 0;
  }

  async function togglePermission(userId, field, currentValue) {
    const updatedUsers = users.map((u) => {
      if (u.id !== userId) return u;

      const nextValue = currentValue ? 0 : 1;
      const updatedUser = {
        ...u,
        [field]: nextValue,
      };

      if (field === "access_chat" && nextValue === 0) {
        updatedUser.access_chat_send = 0;
      }

      if (field === "access_payment_sheet" && nextValue === 0) {
        updatedUser.access_tutor_share = 0;
        updatedUser.access_lacas_share = 0;
        updatedUser.access_total_fees = 0;
        updatedUser.access_payment_actions = 0;
      }

      return updatedUser;
    });

    setUsers(updatedUsers);

    try {
      const user = updatedUsers.find((u) => u.id === userId);

      await api.put(`/auth/users/${userId}/permissions`, {
        access_monthly: toInt(user.access_monthly),
        access_demo: toInt(user.access_demo),
        access_trash: toInt(user.access_trash),
        access_payment_sheet: toInt(user.access_payment_sheet),
        access_tutor_share: toInt(user.access_tutor_share),
        access_lacas_share: toInt(user.access_lacas_share),
        access_total_fees: toInt(user.access_total_fees),
        access_payment_actions: toInt(user.access_payment_actions),
        access_hod_approvals: toInt(user.access_hod_approvals),
        access_staff: toInt(user.access_staff),
        access_otm_management: toInt(user.access_otm_management),
        access_chat: toInt(user.access_chat),
        access_chat_send: toInt(user.access_chat_send),
      });

      const DEFAULT_CHAT_GROUP_ID = 1;

      if (field === "access_chat" || field === "access_chat_send") {
        await api.post(`/chat/groups/${DEFAULT_CHAT_GROUP_ID}/members`, {
          user_id: userId,
          is_active: !!user.access_chat,
          can_send: !!user.access_chat && !!user.access_chat_send,
        });
      }
    } catch (err) {
      alert("Failed to update permission");
      fetchUsers();
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  }

  if (loading) return <div>Loading Staff...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👥 User Management</h2>
        <span style={{ fontSize: 12, color: "#666" }}>
          Manage access to sheets
        </span>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show HOD Approvals</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show Staff</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show OTM Portal</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show Monthly</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show Demo</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show Trash</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show Payment Sheet</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Tutor Share</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Lacas Share</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Total Fees</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Show Chat</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Send Chat Msg</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Payment Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const paymentEnabled = !!user.access_payment_sheet;

              return (
                <tr key={user.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{user.email}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>ID: {user.id}</div>
                  </td>

                  <td style={styles.td}>
                    <span style={styles.roleBadge(user.role)}>{user.role}</span>
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_hod_approvals)}
                      onClick={() =>
                        togglePermission(user.id, "access_hod_approvals", user.access_hod_approvals)
                      }
                    >
                      <div style={styles.toggleCircle(user.access_hod_approvals)} />
                    </button>
                  </td>

                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_staff)}
                      onClick={() =>
                        togglePermission(user.id, "access_staff", user.access_staff)
                      }
                    >
                      <div style={styles.toggleCircle(user.access_staff)} />
                    </button>
                  </td>

                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_otm_management)}
                      onClick={() =>
                        togglePermission(user.id, "access_otm_management", user.access_otm_management)
                      }
                    >
                      <div style={styles.toggleCircle(user.access_otm_management)} />
                    </button>
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_monthly)}
                      onClick={() =>
                        togglePermission(user.id, "access_monthly", user.access_monthly)
                      }
                    >
                      <div style={styles.toggleCircle(user.access_monthly)} />
                    </button>
                  </td>

                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_demo)}
                      onClick={() =>
                        togglePermission(user.id, "access_demo", user.access_demo)
                      }
                    >
                      <div style={styles.toggleCircle(user.access_demo)} />
                    </button>
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_trash)}
                      onClick={() =>
                        togglePermission(user.id, "access_trash", user.access_trash)
                      }>
                      <div style={styles.toggleCircle(user.access_trash)} />
                    </button>
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_payment_sheet)}
                      onClick={() =>
                        togglePermission(
                          user.id,
                          "access_payment_sheet",
                          user.access_payment_sheet
                        )
                      }>
                      <div style={styles.toggleCircle(user.access_payment_sheet)} />
                    </button>
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    {paymentEnabled ? (
                      <button
                        style={styles.toggleBtn(user.access_tutor_share)}
                        onClick={() =>
                          togglePermission(
                            user.id,
                            "access_tutor_share",
                            user.access_tutor_share
                          )
                        }>
                        <div style={styles.toggleCircle(user.access_tutor_share)} />
                      </button>
                    ) : (
                      <span style={styles.mutedText}>Enable payment sheet</span>
                    )}
                  </td>

                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    {paymentEnabled ? (
                      <button
                        style={styles.toggleBtn(user.access_lacas_share)}
                        onClick={() =>
                          togglePermission(
                            user.id,
                            "access_lacas_share",
                            user.access_lacas_share
                          )
                        }
                      >
                        <div style={styles.toggleCircle(user.access_lacas_share)} />
                      </button>
                    ) : (
                      <span style={styles.mutedText}>Enable payment sheet</span>
                    )}
                  </td>

                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    {paymentEnabled ? (
                      <button
                        style={styles.toggleBtn(user.access_total_fees)}
                        onClick={() =>
                          togglePermission(
                            user.id,
                            "access_total_fees",
                            user.access_total_fees
                          )
                        }
                      >
                        <div style={styles.toggleCircle(user.access_total_fees)} />
                      </button>
                    ) : (
                      <span style={styles.mutedText}>Enable payment sheet</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    {paymentEnabled ? (
                      <button
                        style={styles.toggleBtn(user.access_payment_actions)}
                        onClick={() =>
                          togglePermission(
                            user.id,
                            "access_payment_actions",
                            user.access_payment_actions
                          )
                        }
                      >
                        <div style={styles.toggleCircle(user.access_payment_actions)} />
                      </button>
                    ) : (
                      <span style={styles.mutedText}>Enable payment sheet</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    <button
                      style={styles.toggleBtn(user.access_chat)}
                      onClick={() => togglePermission(user.id, "access_chat", user.access_chat)}
                    >
                      <div style={styles.toggleCircle(user.access_chat)} />
                    </button>
                  </td>

                  <td style={{ ...styles.td, ...styles.centerCell }}>
                    {user.access_chat ? (
                      <button
                        style={styles.toggleBtn(user.access_chat_send)}
                        onClick={() => togglePermission(user.id, "access_chat_send", user.access_chat_send)}
                      >
                        <div style={styles.toggleCircle(user.access_chat_send)} />
                      </button>
                    ) : (
                      <span style={styles.mutedText}>Enable chat first</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <div style={styles.actionsWrap}>
                      {user.role === "otm" && (
                        <button
                          style={styles.portalBtn}
                          onClick={() => navigate(`/admin/otm/${user.id}`)}
                        >
                          Open Portal
                        </button>
                      )}

                      {user.role !== "admin" && (
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}