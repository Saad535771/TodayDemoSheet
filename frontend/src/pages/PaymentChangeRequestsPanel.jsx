import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 4000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
  },
  card: {
    width: "min(1700px, 97vw)",
    maxHeight: "92vh",
    background: "#ffffff",
    borderRadius: "18px",
    overflow: "hidden",
    border: "2px solid #000000",
    boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "16px 18px",
    borderBottom: "2px solid #000000",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    background: "#ffffff",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#111111",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#555555",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  btn: {
    border: "1.5px solid #000000",
    background: "#ffffff",
    color: "#111111",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  body: {
    overflow: "auto",
    padding: "16px",
    background: "#f8fafc",
    display: "grid",
    gap: "14px",
  },
  summaryCard: {
    background: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "10px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
  },
  cellLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  cellValue: {
    minHeight: "38px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "8px",
    fontSize: "12px",
    color: "#111111",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "2200px",
    background: "#ffffff",
    border: "1.5px solid #000000",
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#000000",
    color: "#ffffff",
    fontWeight: 700,
    textAlign: "left",
    padding: "12px 10px",
    border: "1px solid #111111",
    fontSize: "12px",
    whiteSpace: "nowrap",
    zIndex: 2,
  },
  td: {
    padding: "10px",
    border: "1px solid #d1d5db",
    verticalAlign: "top",
    fontSize: "12px",
    color: "#111111",
    background: "#ffffff",
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1.5px solid #111111",
    background: "#f1f5f9",
    color: "#111111",
    whiteSpace: "nowrap",
  },
  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "11px",
    lineHeight: 1.45,
    maxHeight: "180px",
    overflow: "auto",
    background: "#f8fafc",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    minWidth: "220px",
  },
  empty: {
    padding: "38px 20px",
    textAlign: "center",
    color: "#475569",
    fontWeight: 700,
  },
};
function prettyDate(value) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}
function safeString(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
}
function prettyJson(value) {
  if (value === null || value === undefined || value === "") return "--";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function getActionBadgeStyle(actionType) {
  switch (actionType) {
    case "create":
      return { ...styles.badge, background: "#dcfce7", color: "#166534" };
    case "update":
      return { ...styles.badge, background: "#dbeafe", color: "#1d4ed8" };
    case "delete":
      return { ...styles.badge, background: "#fee2e2", color: "#b91c1c" };
    case "reorder":
      return { ...styles.badge, background: "#fef3c7", color: "#92400e" };
    default:
      return styles.badge;
  }
}
function getDisplayRow(item, rowData) {
  return item?.afterData || item?.beforeData || rowData || {};
}
function getRowId(item, rowData) {
  return (
    item?.paymentCloneId ??
    item?.payment_clone_id ??
    item?.beforeData?.id ??
    item?.afterData?.id ??
    rowData?.id ??
    "--"
  );
}
function renderFieldCard(label, value) {
  return (
    <div key={label}>
      <div style={styles.cellLabel}>{label}</div>
      <div style={styles.cellValue}>{safeString(value)}</div>
    </div>
  );
}
export default function PaymentChangeRequestsPanel({
  open,
  onClose,
  paymentCloneId,
  rowData,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const totalCount = useMemo(() => items.length, [items]);
  async function loadLogs() {
    if (!open) return;
    try {
      setLoading(true);
      const res = await api.get("/payment-change-requests/logs", {
        params: paymentCloneId ? { paymentCloneId } : {},
      });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (err) {
      console.error("Failed to load payment audit logs:", err);
      alert(err?.response?.data?.message || "Failed to load payment audit logs.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (open) {
      void loadLogs();
    }
  }, [open, paymentCloneId]);
  if (!open) return null;
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Payment Sheet Audit</h3>
            <p style={styles.subtitle}>
              Yahan admin ko yeh dikhay ga ke kis user ne is row mein kya change kiya.
            </p>
          </div>
          <div style={styles.headerActions}>
            <span style={styles.badge}>Row ID: {safeString(paymentCloneId)}</span>
            <span style={styles.badge}>Logs: {totalCount}</span>
            <button type="button" style={styles.btn} onClick={() => void loadLogs()}>
              Refresh
            </button>
            <button type="button" style={styles.btn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div style={styles.body}>
          <div style={styles.summaryCard}>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#111111" }}>
              Current Row Details
            </div>
            <div style={styles.summaryGrid}>
              {renderFieldCard("Date With Month", rowData?.dateWithMonth)}
              {renderFieldCard("Tuition Name", rowData?.tuitionName)}
              {renderFieldCard("Country", rowData?.country)}
              {renderFieldCard("Class Name", rowData?.className)}
              {renderFieldCard("Tutor Name", rowData?.tutorName)}
              {renderFieldCard("Tutor Fee", rowData?.tutorShare)}
              {renderFieldCard("Lacas Share", rowData?.lacasShare)}
              {renderFieldCard("Total Fee", rowData?.totalFees)}
              {renderFieldCard("Status", rowData?.status)}
              {renderFieldCard("Feedback", rowData?.feedback)}
              {renderFieldCard("OTM Name", rowData?.otmName)}
            </div>
          </div>
          {loading ? (
            <div style={styles.empty}>Loading audit logs...</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>No audit logs found for this row.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Row ID</th>
                  <th style={styles.th}>Changed Columns</th>
                  <th style={styles.th}>Date With Month</th>
                  <th style={styles.th}>Tuition Name</th>
                  <th style={styles.th}>Country</th>
                  <th style={styles.th}>Class Name</th>
                  <th style={styles.th}>Tutor Name</th>
                  <th style={styles.th}>Tutor Fee</th>
                  <th style={styles.th}>Lacas Share</th>
                  <th style={styles.th}>Total Fee</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Feedback</th>
                  <th style={styles.th}>OTM Name</th>
                  <th style={styles.th}>Before</th>
                  <th style={styles.th}>After</th>
                  <th style={styles.th}>Edited At</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const row = getDisplayRow(item, rowData);
                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>{safeString(item.actorName)}</td>
                      <td style={styles.td}>{safeString(item.actorEmail)}</td>
                      <td style={styles.td}>{safeString(item.actorRole)}</td>
                      <td style={styles.td}>
                        <span style={getActionBadgeStyle(item.actionType)}>
                          {safeString(item.actionType)}
                        </span>
                      </td>
                      <td style={styles.td}>{safeString(getRowId(item, rowData))}</td>
                      <td style={styles.td}>
                        {Array.isArray(item.changedColumns) && item.changedColumns.length
                          ? item.changedColumns.join(", ")
                          : "--"}
                      </td>
                      <td style={styles.td}>{safeString(row.dateWithMonth)}</td>
                      <td style={styles.td}>{safeString(row.tuitionName)}</td>
                      <td style={styles.td}>{safeString(row.country)}</td>
                      <td style={styles.td}>{safeString(row.className)}</td>
                      <td style={styles.td}>{safeString(row.tutorName)}</td>
                      <td style={styles.td}>{safeString(row.tutorShare)}</td>
                      <td style={styles.td}>{safeString(row.lacasShare)}</td>
                      <td style={styles.td}>{safeString(row.totalFees)}</td>
                      <td style={styles.td}>{safeString(row.status)}</td>
                      <td style={styles.td}>{safeString(row.feedback)}</td>
                      <td style={styles.td}>{safeString(row.otmName)}</td>
                      <td style={styles.td}>
                        <pre style={styles.pre}>{prettyJson(item.beforeData)}</pre>
                      </td>
                      <td style={styles.td}>
                        <pre style={styles.pre}>{prettyJson(item.afterData)}</pre>
                      </td>
                      <td style={styles.td}>
                        {prettyDate(item.createdAt || item.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}