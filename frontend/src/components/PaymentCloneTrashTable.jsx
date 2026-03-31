import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";

const styles = {
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
    padding: "14px 18px",
    background: "#1f2937",
    color: "#fff",
    borderBottom: "1px solid #2f3747",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
  },
  countBadge: {
    marginLeft: "10px",
    background: "#111827",
    border: "1px solid #4b5563",
    color: "#fff",
    padding: "4px 10px",
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
    width: "100%",
    minWidth: "1500px",
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
    fontSize: "13px",
    color: "#111827",
    verticalAlign: "middle",
    textAlign: "center",
    wordBreak: "break-word",
    background: "#ffffff",
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
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnDelete: {
    background: "#dc2626",
    color: "#fff",
    border: "1px solid #7f1d1d",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
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

export default function PaymentCloneTrashTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, []);

  async function fetchTrash() {
    try {
      setLoading(true);
      const res = await api.get("/payments-clone/trash/all");
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (err) {
      console.error("Failed to load payment clone trash", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id) {
    try {
      await api.put(`/payments-clone/trash/${id}/restore`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore item");
    }
  }

  async function handleForceDelete(id) {
    const ok = window.confirm(
      "⚠️ Are you sure?\n\nThis payment trash record will be permanently deleted."
    );
    if (!ok) return;

    try {
      await api.delete(`/payments-clone/trash/${id}/force`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete permanently");
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading Payment Sheet trash...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          🗑 Recycle Bin For Payment Sheet With Date
          <span style={styles.countBadge}>{items.length}</span>
        </h2>
        <button onClick={fetchTrash} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>Trash is Empty</h3>
          <p>Deleted payment rows will appear here.</p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tuition ID</th>
                <th style={styles.th}>Payment Date</th>
                <th style={styles.th}>Date With Month</th>
                <th style={styles.th}>Tuition Name</th>
                <th style={styles.th}>Country</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Tutor</th>
                <th style={styles.th}>Tutor Fee</th>
                <th style={styles.th}>Lacas Share</th>
                <th style={styles.th}>Total Fees</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Feedback</th>
                <th style={styles.th}>OTM Name</th>
                <th style={styles.th}>Deleted At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>{item.tuitionId || "-"}</td>
                  <td style={styles.td}>{formatDate(item.paymentDate)}</td>
                  <td style={styles.td}>{item.dateWithMonth || "-"}</td>
                  <td style={styles.td}>{item.tuitionName || "-"}</td>
                  <td style={styles.td}>{item.country || "-"}</td>
                  <td style={styles.td}>{item.className || "-"}</td>
                  <td style={styles.td}>{item.tutorName || "-"}</td>
                  <td style={styles.td}>{item.tutorShare || "-"}</td>
                  <td style={styles.td}>{item.lacasShare || "-"}</td>
                  <td style={styles.td}>{item.totalFees || "-"}</td>
                  <td style={styles.td}>{item.status || "-"}</td>
                  <td style={styles.td}>{item.feedback || "-"}</td>
                  <td style={styles.td}>{item.otmName || "-"}</td>
                  <td style={styles.td}>
                    {formatDateTime(item.createdAt || item.created_at)}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.btnGroup}>
                      <button
                        onClick={() => handleRestore(item.id)}
                        style={styles.btnRestore}
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleForceDelete(item.id)}
                        style={styles.btnDelete}
                      >
                        Delete Forever
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
  );
}