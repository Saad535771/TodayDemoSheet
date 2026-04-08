import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.42)",
    zIndex: 5000,
    display: "flex",
    justifyContent: "flex-end",
  },
  panel: {
    width: "min(560px, 100vw)",
    height: "100vh",
    background: "#ffffff",
    borderLeft: "2px solid #000000",
    boxShadow: "-10px 0 24px rgba(0,0,0,0.14)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#ffffff",
    borderBottom: "2px solid #000000",
    padding: "18px 16px 14px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#111111",
  },
  subtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#4b5563",
    lineHeight: 1.4,
  },
  closeBtn: {
    minWidth: "42px",
    height: "42px",
    borderRadius: "10px",
    border: "1.5px solid #000000",
    background: "#ffffff",
    fontSize: "18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  metaBox: {
    borderBottom: "1px solid #d1d5db",
    padding: "14px 16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    background: "#fafafa",
  },
  metaItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px 12px",
    background: "#ffffff",
  },
  metaLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "4px",
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#111827",
    wordBreak: "break-word",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    background: "#ffffff",
  },
  loading: {
    padding: "20px",
    textAlign: "center",
    fontWeight: 700,
    color: "#374151",
  },
  error: {
    padding: "16px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    borderRadius: "12px",
    fontWeight: 600,
  },
  empty: {
    padding: "20px",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    textAlign: "center",
    color: "#475569",
    fontWeight: 700,
  },
  card: {
    border: "1.5px solid #000000",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "14px",
    background: "#ffffff",
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  tagRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
    border: "1.5px solid #111827",
  },
  timeTag: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
  },
  actor: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#111827",
  },
  message: {
    fontSize: "13px",
    color: "#374151",
    marginBottom: "12px",
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#111827",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  changedCols: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  chip: {
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },
  compareGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  fieldRow: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#ffffff",
  },
  fieldLabel: {
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: 800,
    color: "#334155",
  },
  fieldValues: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
  },
  beforeBox: {
    padding: "10px",
    borderRight: "1px solid #e5e7eb",
    background: "#fff7ed",
  },
  afterBox: {
    padding: "10px",
    background: "#ecfdf5",
  },
  valueLabel: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  valueText: {
    fontSize: "12px",
    color: "#111827",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};

function safeJsonParse(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toArray(value) {
  const parsed = safeJsonParse(value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed === null || parsed === undefined || parsed === "") return [];
  return [parsed];
}

function toObject(value) {
  const parsed = safeJsonParse(value);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  return {};
}

function getActionStyle(actionType) {
  switch (String(actionType || "").toLowerCase()) {
    case "create":
      return { background: "#dcfce7", color: "#166534" };
    case "update":
      return { background: "#dbeafe", color: "#1d4ed8" };
    case "delete":
      return { background: "#fee2e2", color: "#b91c1c" };
    case "reorder":
      return { background: "#ede9fe", color: "#6d28d9" };
    default:
      return { background: "#e5e7eb", color: "#111827" };
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function normalizeHistoryResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.logs)) return data.logs;
  return [];
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function PaymentSheetHistoryPanel({ open, onClose, paymentCloneId, rowData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !paymentCloneId) return;

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      const endpoints = [
        `/payment-change-requests/history?paymentCloneId=${encodeURIComponent(paymentCloneId)}&moduleName=payment_sheet_with_date`,
        `/payment-change-requests/history?paymentCloneId=${encodeURIComponent(paymentCloneId)}`,
        `/payment-change-requests/logs?paymentCloneId=${encodeURIComponent(paymentCloneId)}`,
      ];

      let loaded = [];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          const normalized = normalizeHistoryResponse(res.data).filter((item) => {
            const candidateId = item?.paymentCloneId ?? item?.payment_clone_id ?? item?.paymentClone?.id ?? null;
            return String(candidateId) === String(paymentCloneId);
          });

          if (normalized.length) {
            loaded = normalized;
            break;
          }

          if (!loaded.length) {
            loaded = normalizeHistoryResponse(res.data);
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (cancelled) return;

      if (!loaded.length && lastError) {
        setError(lastError?.response?.data?.message || "Failed to load payment history.");
        setItems([]);
      } else {
        const sorted = [...loaded].sort((a, b) => {
          const aTime = new Date(a?.createdAt || a?.created_at || 0).getTime();
          const bTime = new Date(b?.createdAt || b?.created_at || 0).getTime();
          return bTime - aTime;
        });
        setItems(sorted);
      }

      setLoading(false);
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [open, paymentCloneId]);

  const rowMeta = useMemo(() => ({
    tuitionName: rowData?.tuitionName || "-",
    date: rowData?.date || rowData?.paymentDate || "-",
    tutorFee: rowData?.tutorFee ?? rowData?.tutorShare ?? "-",
    totalFees: rowData?.totalFees ?? "-",
  }), [rowData]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <h3 style={styles.title}>Payment Row History</h3>
            <p style={styles.subtitle}>
              Yeh panel selected row ki changes, user name, changed columns, aur before/after values show karta hai.
            </p>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close history panel">
            ×
          </button>
        </div>

        <div style={styles.metaBox}>
          <div style={styles.metaItem}>
            <div style={styles.metaLabel}>Tuition Name</div>
            <div style={styles.metaValue}>{rowMeta.tuitionName}</div>
          </div>
          <div style={styles.metaItem}>
            <div style={styles.metaLabel}>Date</div>
            <div style={styles.metaValue}>{rowMeta.date || "-"}</div>
          </div>
          <div style={styles.metaItem}>
            <div style={styles.metaLabel}>Tutor Fee / Share</div>
            <div style={styles.metaValue}>{rowMeta.tutorFee}</div>
          </div>
          <div style={styles.metaItem}>
            <div style={styles.metaLabel}>Total Fee</div>
            <div style={styles.metaValue}>{rowMeta.totalFees}</div>
          </div>
        </div>

        <div style={styles.body}>
          {loading ? <div style={styles.loading}>Loading history...</div> : null}

          {!loading && error ? <div style={styles.error}>{error}</div> : null}

          {!loading && !error && !items.length ? (
            <div style={styles.empty}>No history found for this row yet.</div>
          ) : null}

          {!loading && !error && items.map((item, index) => {
            const changedColumns = toArray(item?.changedColumns ?? item?.changed_columns).map((col) => String(col));
            const beforeData = toObject(item?.beforeData ?? item?.before_data);
            const afterData = toObject(item?.afterData ?? item?.after_data);
            const metadata = toObject(item?.metadata);
            const actorName = item?.actorName || item?.actor_name || item?.actorUser?.name || "Unknown User";
            const actionType = item?.actionType || item?.action_type || "update";
            const timestamp = item?.createdAt || item?.created_at || item?.updatedAt || item?.updated_at;
            const columnsToShow = changedColumns.length
              ? changedColumns
              : Array.from(new Set([...Object.keys(beforeData), ...Object.keys(afterData)]));
            const actionStyle = getActionStyle(actionType);

            return (
              <div key={item?.id || index} style={styles.card}>
                <div style={styles.cardHead}>
                  <div>
                    <div style={styles.tagRow}>
                      <span style={{ ...styles.actionTag, ...actionStyle }}>
                        {String(actionType).toUpperCase()}
                      </span>
                      <span style={styles.timeTag}>{formatDateTime(timestamp)}</span>
                    </div>
                    <div style={{ ...styles.actor, marginTop: 8 }}>{actorName}</div>
                  </div>
                </div>

                <div style={styles.message}>
                  {metadata?.message || metadata?.historyLabel || "Payment row changed."}
                </div>

                {changedColumns.length ? (
                  <>
                    <div style={styles.sectionTitle}>Changed Columns</div>
                    <div style={styles.changedCols}>
                      {changedColumns.map((col) => (
                        <span key={col} style={styles.chip}>{col}</span>
                      ))}
                    </div>
                  </>
                ) : null}

                {columnsToShow.length ? (
                  <>
                    <div style={styles.sectionTitle}>Before / After</div>
                    <div style={styles.compareGrid}>
                      {columnsToShow.map((field) => (
                        <div key={field} style={styles.fieldRow}>
                          <div style={styles.fieldLabel}>{field}</div>
                          <div style={styles.fieldValues}>
                            <div style={styles.beforeBox}>
                              <div style={styles.valueLabel}>Before</div>
                              <div style={styles.valueText}>{displayValue(beforeData[field])}</div>
                            </div>
                            <div style={styles.afterBox}>
                              <div style={styles.valueLabel}>After</div>
                              <div style={styles.valueText}>{displayValue(afterData[field])}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
