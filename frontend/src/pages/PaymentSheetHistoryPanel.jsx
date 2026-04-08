import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const ACTOR_COLORS = [
  { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" },
  { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  { bg: "#fefce8", border: "#fde68a", text: "#854d0e" },
  { bg: "#fdf2f8", border: "#f9a8d4", text: "#9d174d" },
  { bg: "#f5f3ff", border: "#c4b5fd", text: "#6d28d9" },
  { bg: "#fff7ed", border: "#fdba74", text: "#9a3412" },
  { bg: "#f0fdfa", border: "#99f6e4", text: "#115e59" },
];

const styles = {
  wrap: {
    width: "100%",
    background: "#ffffff",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "16px 18px",
    borderBottom: "2px solid #000000",
    background: "#ffffff",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#111111",
  },
  subtitle: {
    margin: 0,
    color: "#4b5563",
    fontSize: "13px",
    lineHeight: 1.45,
  },
  closeBtn: {
    height: "42px",
    minWidth: "42px",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#111111",
    fontWeight: 800,
    fontSize: "18px",
    cursor: "pointer",
  },
  summaryBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "12px 18px",
    borderBottom: "1.5px solid #000000",
    background: "#fafafa",
  },
  summaryItem: {
    border: "1px solid #d1d5db",
    borderRadius: "999px",
    padding: "8px 12px",
    background: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
  },
  scroller: {
    width: "100%",
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "70vh",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    minWidth: "1800px",
    borderCollapse: "collapse",
    fontSize: "12px",
    background: "#ffffff",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 3,
    background: "#000000",
    color: "#ffffff",
    padding: "12px 10px",
    textAlign: "center",
    borderRight: "1.5px solid #000000",
    borderBottom: "1.5px solid #000000",
    whiteSpace: "nowrap",
    fontWeight: 800,
  },
  td: {
    verticalAlign: "top",
    padding: "10px",
    borderRight: "1.5px solid #000000",
    borderBottom: "1.5px solid #000000",
    background: "#ffffff",
    color: "#111827",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    fontWeight: 700,
    color: "#475569",
  },
  loading: {
    padding: "24px",
    textAlign: "center",
    fontWeight: 700,
    color: "#374151",
  },
  error: {
    margin: "14px 18px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 700,
  },
  actionTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 800,
    border: "1.5px solid currentColor",
    whiteSpace: "nowrap",
  },
  userTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  },
  chipWrap: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 700,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },
  detailBlock: {
    display: "grid",
    gap: "6px",
  },
  detailLine: {
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    lineHeight: 1.45,
  },
  beforeValue: {
    color: "#9a3412",
    fontWeight: 700,
  },
  afterValue: {
    color: "#166534",
    fontWeight: 700,
  },
  muted: {
    color: "#6b7280",
    fontWeight: 700,
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

function normalizeHistoryResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.logs)) return data.logs;
  return [];
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

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function pickPrimaryValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "—";
}

function getActorColor(name) {
  const key = String(name || "Unknown User");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ACTOR_COLORS[hash % ACTOR_COLORS.length];
}

function buildCompactChangeLines(beforeData, afterData, changedColumns) {
  const columns = changedColumns.length
    ? changedColumns
    : Array.from(new Set([...Object.keys(beforeData), ...Object.keys(afterData)]));

  return columns.map((field) => ({
    field,
    before: displayValue(beforeData[field]),
    after: displayValue(afterData[field]),
  }));
}

export default function PaymentSheetHistoryPanel({ open, onClose, paymentCloneId, rowData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      const filters = [];
      if (paymentCloneId !== undefined && paymentCloneId !== null) {
        filters.push(`paymentCloneId=${encodeURIComponent(paymentCloneId)}`);
      }
      filters.push("moduleName=payment_sheet_with_date");
      const query = filters.length ? `?${filters.join("&")}` : "";

      const endpoints = [
        `/payment-change-requests/history${query}`,
        `/payment-change-requests/history${paymentCloneId !== undefined && paymentCloneId !== null ? `?paymentCloneId=${encodeURIComponent(paymentCloneId)}` : ""}`,
        `/payment-change-requests/logs${paymentCloneId !== undefined && paymentCloneId !== null ? `?paymentCloneId=${encodeURIComponent(paymentCloneId)}` : ""}`,
      ];

      let loaded = [];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          let normalized = normalizeHistoryResponse(res.data);

          if (paymentCloneId !== undefined && paymentCloneId !== null) {
            normalized = normalized.filter((item) => {
              const candidateId = item?.paymentCloneId ?? item?.payment_clone_id ?? item?.paymentClone?.id ?? null;
              return String(candidateId) === String(paymentCloneId);
            });
          }

          if (normalized.length) {
            loaded = normalized;
            break;
          }

          if (!loaded.length) {
            loaded = normalized;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (cancelled) return;

      if (!loaded.length && lastError) {
        setError(lastError?.response?.data?.message || "Failed to load payment sheet history.");
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

  const normalizedItems = useMemo(() => {
    return items.map((item, index) => {
      const changedColumns = toArray(item?.changedColumns ?? item?.changed_columns).map((col) => String(col));
      const beforeData = toObject(item?.beforeData ?? item?.before_data);
      const afterData = toObject(item?.afterData ?? item?.after_data);
      const metadata = toObject(item?.metadata);
      const actorName = item?.actorName || item?.actor_name || item?.actorUser?.name || "Unknown User";
      const actionType = item?.actionType || item?.action_type || "update";
      const timestamp = item?.createdAt || item?.created_at || item?.updatedAt || item?.updated_at;
      const compactLines = buildCompactChangeLines(beforeData, afterData, changedColumns);

      return {
        id: item?.id || `${actorName}-${timestamp}-${index}`,
        actionType,
        actorName,
        timestamp,
        metadata,
        changedColumns,
        beforeData,
        afterData,
        compactLines,
        tuitionName: pickPrimaryValue(
          afterData.tuitionName,
          beforeData.tuitionName,
          item?.paymentClone?.tuitionName,
          metadata?.tuitionName
        ),
        dateWithMonth: pickPrimaryValue(
          afterData.dateWithMonth,
          beforeData.dateWithMonth,
          afterData.paymentDate,
          beforeData.paymentDate,
          metadata?.date,
          rowData?.dateWithMonth,
          rowData?.paymentDate
        ),
        tutorFee: pickPrimaryValue(afterData.tutorFee, beforeData.tutorFee, rowData?.tutorFee),
        lacasShare: pickPrimaryValue(afterData.lacasShare, beforeData.lacasShare, rowData?.lacasShare),
        totalFees: pickPrimaryValue(afterData.totalFees, beforeData.totalFees, rowData?.totalFees),
      };
    });
  }, [items, rowData]);

  const summary = useMemo(() => {
    const users = new Set(normalizedItems.map((item) => item.actorName));
    const actions = new Set(normalizedItems.map((item) => item.actionType));
    return {
      total: normalizedItems.length,
      users: users.size,
      actions: actions.size,
    };
  }, [normalizedItems]);

  if (!open) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h3 style={styles.title}>
            {paymentCloneId ? "Payment Row History" : "Payment Sheet History"}
          </h3>
          <p style={styles.subtitle}>
            Yeh full-width history table hai. Har user ki create, update, delete, reorder changes yahan same sheet style me show hongi.
          </p>
        </div>
        <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close history panel">
          ×
        </button>
      </div>

      <div style={styles.summaryBar}>
        <div style={styles.summaryItem}>Total Changes: {summary.total}</div>
        <div style={styles.summaryItem}>Users: {summary.users}</div>
        <div style={styles.summaryItem}>Action Types: {summary.actions}</div>
        <div style={styles.summaryItem}>Mode: {paymentCloneId ? "Selected Row" : "Whole Sheet"}</div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.scroller}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, minWidth: "170px" }}>Date &amp; Time</th>
              <th style={{ ...styles.th, minWidth: "180px" }}>User</th>
              <th style={{ ...styles.th, minWidth: "120px" }}>Action</th>
              <th style={{ ...styles.th, minWidth: "220px" }}>Tuition Name</th>
              <th style={{ ...styles.th, minWidth: "130px" }}>Date</th>
              <th style={{ ...styles.th, minWidth: "110px" }}>Tutor Fee</th>
              <th style={{ ...styles.th, minWidth: "110px" }}>Lacas Share</th>
              <th style={{ ...styles.th, minWidth: "110px" }}>Total Fee</th>
              <th style={{ ...styles.th, minWidth: "250px" }}>Changed Columns</th>
              <th style={{ ...styles.th, minWidth: "600px" }}>Before / After Changes</th>
              <th style={{ ...styles.th, minWidth: "260px" }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={styles.loading}>Loading payment history...</td>
              </tr>
            ) : null}

            {!loading && !normalizedItems.length ? (
              <tr>
                <td colSpan={11} style={styles.empty}>No history found yet.</td>
              </tr>
            ) : null}

            {!loading && normalizedItems.map((item) => {
              const actionStyle = getActionStyle(item.actionType);
              const actorStyle = getActorColor(item.actorName);
              return (
                <tr key={item.id}>
                  <td style={styles.td}>{formatDateTime(item.timestamp)}</td>
                  <td style={{ ...styles.td, background: actorStyle.bg }}>
                    <span
                      style={{
                        ...styles.userTag,
                        background: actorStyle.bg,
                        color: actorStyle.text,
                        borderColor: actorStyle.border,
                      }}
                    >
                      {item.actorName}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.actionTag, ...actionStyle }}>
                      {String(item.actionType).toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>{displayValue(item.tuitionName)}</td>
                  <td style={styles.td}>{displayValue(item.dateWithMonth)}</td>
                  <td style={styles.td}>{displayValue(item.tutorFee)}</td>
                  <td style={styles.td}>{displayValue(item.lacasShare)}</td>
                  <td style={styles.td}>{displayValue(item.totalFees)}</td>
                  <td style={styles.td}>
                    <div style={styles.chipWrap}>
                      {(item.changedColumns.length ? item.changedColumns : ["No explicit columns"]).map((col) => (
                        <span key={`${item.id}-${col}`} style={styles.chip}>{col}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.detailBlock}>
                      {item.compactLines.length ? item.compactLines.map((line) => (
                        <div key={`${item.id}-${line.field}`} style={styles.detailLine}>
                          <strong>{line.field}</strong>
                          <div>
                            <span style={styles.beforeValue}>Before:</span> {line.before}
                          </div>
                          <div>
                            <span style={styles.afterValue}>After:</span> {line.after}
                          </div>
                        </div>
                      )) : <span style={styles.muted}>No before/after diff found.</span>}
                    </div>
                  </td>
                  <td style={styles.td}>{displayValue(item.metadata?.message || item.metadata?.historyLabel || "Payment sheet changed.")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
