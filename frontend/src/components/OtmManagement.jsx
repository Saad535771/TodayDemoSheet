import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const styles = {
  page: {
    padding: "20px",
  },

  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    borderRadius: "22px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e7edf5",
    overflow: "hidden",
  },

  header: {
    padding: "20px 22px 16px",
    borderBottom: "1px solid #e7edf5",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#163b68",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  tabsWrap: {
    display: "flex",
    gap: "4px",
    padding: "0 16px",
    borderBottom: "1px solid #e7edf5",
    overflowX: "auto",
  },

  tabBtn: (active) => ({
    border: "none",
    borderBottom: active ? "3px solid #2563eb" : "3px solid transparent",
    background: "transparent",
    color: active ? "#2563eb" : "#475569",
    padding: "14px 16px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),

  body: {
    padding: "18px",
  },

  formCard: {
    background: "#ffffff",
    border: "1px solid #e7edf5",
    borderRadius: "18px",
    padding: "14px",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
    marginBottom: "18px",
  },

  formTitle: {
    margin: "0 0 12px",
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },

  rowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(8, minmax(150px, 1fr))",
    gap: "10px",
    overflowX: "auto",
  },

  input: {
    width: "100%",
    minWidth: "150px",
    border: "1px solid #dbe4ee",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },

  primaryBtn: {
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
  },

  secondaryBtn: {
    background: "#eef2f7",
    color: "#0f172a",
    border: "1px solid #dbe4ee",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  dangerBtn: {
    background: "#fff5f5",
    color: "#c53030",
    border: "1px solid #feb2b2",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e7edf5",
    borderRadius: "16px",
    background: "#fff",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1250px",
  },

  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid #e7edf5",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },

  notesCell: {
    whiteSpace: "normal",
    minWidth: "220px",
  },

  inlineActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  empty: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e7edf5",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },

  statTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "800",
    color: "#334155",
  },

  statNumber: {
    marginTop: "10px",
    fontSize: "34px",
    fontWeight: "900",
    color: "#1d4ed8",
  },

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "8px 0",
    borderBottom: "1px dashed #e2e8f0",
    fontSize: "14px",
    color: "#0f172a",
  },
};

const initialForm = {
  day: "",
  time: "",
  tuitionName: "",
  groupName: "",
  classStartTime: "",
  classEndTime: "",
  status: "",
  notes: "",
};

function getDisplayName(user) {
  if (user?.name) return user.name;
  const prefix = user?.email?.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export default function OtmManagement() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("tuitions");
  const [entries, setEntries] = useState([]);
  const [reports, setReports] = useState({
    totalEntries: 0,
    byStatus: {},
    byDay: {},
  });
  const [totalClass, setTotalClass] = useState({
    totalClasses: 0,
    byTuition: {},
  });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const displayName = useMemo(() => getDisplayName(user), [user]);

  async function loadAll() {
    try {
      setLoading(true);

      const [meRes, entriesRes, reportsRes, totalRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/otm-management/entries"),
        api.get("/otm-management/reports"),
        api.get("/otm-management/total-class"),
      ]);

      setUser(meRes.data?.user || null);
      setEntries(entriesRes.data?.entries || []);
      setReports(
        reportsRes.data?.reports || {
          totalEntries: 0,
          byStatus: {},
          byDay: {},
        }
      );
      setTotalClass(
        totalRes.data?.totalClass || {
          totalClasses: 0,
          byTuition: {},
        }
      );
    } catch (err) {
      console.error("Failed to load OTM data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const sessionId =
      localStorage.getItem("session_id") || sessionStorage.getItem("session_id");

    if (!sessionId) return;

    const ping = async () => {
      try {
        await api.put("/auth/presence/heartbeat", {
          session_id: sessionId,
          current_sheet: "otm-management",
        });
      } catch (err) {
        console.error("OTM heartbeat failed:", err);
      }
    };

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      day: item.day || "",
      time: item.time || "",
      tuitionName: item.tuitionName || "",
      groupName: item.groupName || "",
      classStartTime: item.classStartTime || "",
      classEndTime: item.classEndTime || "",
      status: item.status || "",
      notes: item.notes || "",
    });
    setTab("tuitions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/otm-management/entries/${editingId}`, form);
      } else {
        await api.post("/otm-management/entries", form);
      }

      resetForm();
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this entry?")) return;

    try {
      await api.delete(`/otm-management/entries/${id}`);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete entry");
    }
  }

  if (loading) {
    return <div style={styles.empty}>Loading OTM Management...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Otm Management</h2>
          <p style={styles.subtitle}>Logged in as {displayName}</p>
        </div>

        <div style={styles.tabsWrap}>
          <button
            style={styles.tabBtn(tab === "tuitions")}
            onClick={() => setTab("tuitions")}
          >
            {displayName} Tuitions
          </button>

          <button
            style={styles.tabBtn(tab === "reports")}
            onClick={() => setTab("reports")}
          >
            Reports
          </button>

          <button
            style={styles.tabBtn(tab === "totalClass")}
            onClick={() => setTab("totalClass")}
          >
            Total Class
          </button>
        </div>

        <div style={styles.body}>
          {tab === "tuitions" && (
            <>
              <form style={styles.formCard} onSubmit={handleSubmit}>
                <h3 style={styles.formTitle}>
                  {editingId ? "Update Entry" : "Add New Entry"}
                </h3>

                <div style={styles.rowGrid}>
                  <input
                    style={styles.input}
                    name="day"
                    placeholder="Day"
                    value={form.day}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="time"
                    placeholder="Time"
                    value={form.time}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="tuitionName"
                    placeholder="Tuition Name"
                    value={form.tuitionName}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="groupName"
                    placeholder="Group Name"
                    value={form.groupName}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="classStartTime"
                    placeholder="Class Start Time"
                    value={form.classStartTime}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="classEndTime"
                    placeholder="Class End Time"
                    value={form.classEndTime}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="status"
                    placeholder="Status"
                    value={form.status}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    name="notes"
                    placeholder="Notes"
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>

                <div style={styles.actions}>
                  <button type="submit" style={styles.primaryBtn}>
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Entry"
                      : "Add Entry"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      style={styles.secondaryBtn}
                      onClick={resetForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {entries.length === 0 ? (
                <div style={styles.empty}>No entries found.</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Day</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Tuition Name</th>
                        <th style={styles.th}>Group Name</th>
                        <th style={styles.th}>Class Start Time</th>
                        <th style={styles.th}>Class End Time</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Notes</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {entries.map((item) => (
                        <tr key={item.id}>
                          <td style={styles.td}>{item.day || "--"}</td>
                          <td style={styles.td}>{item.time || "--"}</td>
                          <td style={styles.td}>{item.tuitionName || "--"}</td>
                          <td style={styles.td}>{item.groupName || "--"}</td>
                          <td style={styles.td}>{item.classStartTime || "--"}</td>
                          <td style={styles.td}>{item.classEndTime || "--"}</td>
                          <td style={styles.td}>{item.status || "--"}</td>
                          <td style={{ ...styles.td, ...styles.notesCell }}>
                            {item.notes || "--"}
                          </td>
                          <td style={styles.td}>
                            <div style={styles.inlineActions}>
                              <button
                                type="button"
                                style={styles.secondaryBtn}
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                style={styles.dangerBtn}
                                onClick={() => handleDelete(item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === "reports" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>Total Entries</h3>
                <div style={styles.statNumber}>{reports.totalEntries || 0}</div>
              </div>

              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>By Status</h3>
                {Object.keys(reports.byStatus || {}).length === 0 ? (
                  <div style={{ marginTop: 12, color: "#64748b" }}>
                    No report data
                  </div>
                ) : (
                  Object.entries(reports.byStatus).map(([key, value]) => (
                    <div key={key} style={styles.listItem}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>By Day</h3>
                {Object.keys(reports.byDay || {}).length === 0 ? (
                  <div style={{ marginTop: 12, color: "#64748b" }}>
                    No day data
                  </div>
                ) : (
                  Object.entries(reports.byDay).map(([key, value]) => (
                    <div key={key} style={styles.listItem}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "totalClass" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>Total Classes</h3>
                <div style={{ ...styles.statNumber, color: "#16a34a" }}>
                  {totalClass.totalClasses || 0}
                </div>
              </div>

              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>Classes By Tuition</h3>
                {Object.keys(totalClass.byTuition || {}).length === 0 ? (
                  <div style={{ marginTop: 12, color: "#64748b" }}>
                    No class data
                  </div>
                ) : (
                  Object.entries(totalClass.byTuition).map(([key, value]) => (
                    <div key={key} style={styles.listItem}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}