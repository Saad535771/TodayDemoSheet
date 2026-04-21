
import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";
const styles = {
  page: {
    background: "#f4f6f8",
    minHeight: "100vh",
  },
  container: {
    background: "#ffffff",
    border: "1px solid #2f3747",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 8px",
    background: "#1f2937",
    color: "#fff",
    borderBottom: "1px solid #2f3747",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "0.3px",
  },

  countBadge: {
    marginLeft: "10px",
    background: "#111827",
    border: "1px solid #4b5563",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  refreshBtn: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #4b5563",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    background: "#fff",
  },

  table: {
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  th: {
    background: "#dbeafe",
    color: "#111827",
    border: "1px solid #2f3747",
    padding: "10px 8px",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center",
    whiteSpace: "nowrap",
  },

  td: {
    border: "1px solid #2f3747",
    padding: "10px 8px",
    fontSize: "10px",
    color: "#111827",
    verticalAlign: "middle",
    textAlign: "center",
    wordBreak: "break-word",
    background: "#ffffff",
  },

  tuitionName: {
    fontWeight: "700",
    color: "#111827",
  },

  muted: {
    fontSize: "0px",
    color: "#6b7280",
    marginTop: "4px",
  },

  statusBadge: {
    display: "inline-block",
    padding: "5px 10px",
    width:'140px',
    borderRadius: "4px",
    border: "1px solid #2f3747",
    background: "#ecfdf5",
    color: "#065f46",
    fontSize: "12px",
    fontWeight: "700",
  },

  btnGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  btnRestore: {
    background: "#16a34a",
    color: "#fff",
    border: "1px solid #166534",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  btnDelete: {
    background: "#dc2626",
    color: "#fff",
    border: "1px solid #7f1d1d",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "600",
  },

  emptyState: {
    textAlign: "center",
    padding: "10px 10px",
    color: "#6b7280",
    background: "#fff",
  },

  loading: {
    padding: "20px",
    fontSize: "15px",
    fontWeight: "600",
  },
};

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function MonthlyTrashBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, []);

  async function fetchTrash() {
    try {
      setLoading(true);
      const res = await api.get("/tuitions/trash");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load trash", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id) {
    try {
      await api.put(`/tuitions/${id}/restore`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to restore item");
    }
  }

  async function handleForceDelete(id) {
    const ok = window.confirm(
      "⚠️ Are you sure?\n\nThis record will be permanently deleted."
    );
    if (!ok) return;

    try {
      await api.delete(`/tuitions/${id}/force`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete permanently");
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading Recycle Bin...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            🗑 Recycle Bin For Monthly Tuition Sheet
            <span style={styles.countBadge}>{items.length}</span>
          </h2>
          <button onClick={fetchTrash} style={styles.refreshBtn}>
            Refresh
          </button>
        </div>

        {items.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>Trash is Empty</h3>
            <p>Deleted tuitions will appear here.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Tuition ID</th>
                  <th style={styles.th}>Tuition Name</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Country</th>
                  <th style={styles.th}>Subjects</th>
                  <th style={styles.th}>Tutor</th>
                  <th style={styles.th}>Parent Contact</th>
                  <th style={styles.th}>Days/Week</th>
                  <th style={styles.th}>Time (Hour)</th>
                  <th style={styles.th}>Estimated Fee</th>
                  <th style={styles.th}>Tutor Fee</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Updated At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      background: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                    }}
                  >
                    <td style={styles.td}>{item.id ?? "-"}</td>
                    <td style={styles.td}>{item.tuitionId ?? "-"}</td>

                    <td style={styles.td}>
                      <div style={styles.tuitionName}>
                        {item.tuitionName || "-"}
                      </div>
                    </td>

                    <td style={styles.td}>{item.className || "-"}</td>
                    <td style={styles.td}>{item.country || "-"}</td>
                    <td style={styles.td}>{item.subjects || "-"}</td>
                    <td style={styles.td}>{item.tutorName || "-"}</td>
                    <td style={styles.td}>{item.parentsContact || "-"}</td>
                    <td style={styles.td}>{item.daysPerWeek || "-"}</td>
                    <td style={styles.td}>{item.timeHour || "-"}</td>
                    <td style={styles.td}>{item.estimatedFee || "-"}</td>
                    <td style={styles.td}>{item.tutorFee || "-"}</td>

                    <td style={styles.td}>
                      <span style={styles.statusBadge}>
                        {item.status || "-"}
                      </span>
                    </td>

                    <td style={styles.td}>{formatDate(item.date)}</td>
                    <td style={styles.td}>{formatDateTime(item.updatedAt)}</td>

                    <td style={styles.td}>
                      <div style={styles.btnGroup}>
                        <button
                          style={styles.btnRestore}
                          onClick={() => handleRestore(item.id)}
                        >
                          Restore
                        </button>
                        <button
                          style={styles.btnDelete}
                          onClick={() => handleForceDelete(item.id)}
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
      </div>
    </div>
  );
}