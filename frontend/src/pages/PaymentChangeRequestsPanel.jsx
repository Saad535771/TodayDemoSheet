import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const FIELD_LABELS = {
  dateWithMonth: "Date With Month",
  tuitionName: "Tuition Name",
  country: "Country",
  className: "Class Name",
  tutorName: "Tutor Name",
  tutorShare: "Tutor Fee",
  lacasShare: "Lacas Share",
  totalFees: "Total Fee",
  status: "Status",
  feedback: "Feedback",
  otmName: "OTM Name",
  rowColor: "Row Color",
  tuitionNameColor: "Tuition Name Color",
  paymentDate: "Payment Date",
  assignedTo: "Assigned To",
  assignedStaffId: "Assigned Staff",
  syncFlag: "Sync Flag",
};

const SUMMARY_FIELDS = [
  "dateWithMonth",
  "tuitionName",
  "country",
  "className",
  "tutorName",
  "tutorShare",
  "lacasShare",
  "totalFees",
  "status",
  "feedback",
  "otmName",
];

const HIDDEN_AUDIT_KEYS = new Set([
  "id",
  "tuitionId",
  "createdAt",
  "updatedAt",
  "created_at",
  "updated_at",
  "deletedFromTodayDemo",
  "isDeleted",
  "orderIndex",
]);

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
    width: "min(1550px, 97vw)",
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
    position: "sticky",
    top: 0,
    zIndex: 5,
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
  empty: {
    padding: "38px 20px",
    textAlign: "center",
    color: "#475569",
    fontWeight: 700,
    background: "#ffffff",
    border: "1.5px solid #cbd5e1",
    borderRadius: "14px",
  },
  logCard: {
    background: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "12px",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "wrap",
  },
  logTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
    color: "#111111",
  },
  logMeta: {
    margin: "5px 0 0 0",
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  logMetaStrong: {
    color: "#111111",
    fontWeight: 800,
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  chipsWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  chip: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #16a34a",
    fontSize: "12px",
    fontWeight: 700,
  },
  changesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "10px",
  },
  changeCard: {
    borderRadius: "12px",
    padding: "12px",
    border: "1.5px solid #16a34a",
    background: "#ecfdf5",
    display: "grid",
    gap: "8px",
    minHeight: "120px",
  },
  changeCardDelete: {
    border: "1.5px solid #ef4444",
    background: "#fef2f2",
  },
  changeFieldTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 800,
    color: "#14532d",
  },
  beforeAfterWrap: {
    display: "grid",
    gap: "8px",
  },
  valueBox: {
    borderRadius: "8px",
    padding: "8px",
    border: "1px solid #bbf7d0",
    background: "#ffffff",
    color: "#111111",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    minHeight: "40px",
  },
  valueBoxMuted: {
    border: "1px solid #fecaca",
    background: "#fff7f7",
  },
  valueLabel: {
    fontSize: "10px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#64748b",
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
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
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

function humanizeKey(key) {
  const source = FIELD_LABELS[key];
  if (source) return source;
  return String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function uniqueColumns(item = {}) {
  const direct = Array.isArray(item.changedColumns)
    ? item.changedColumns.map((col) => String(col || "").trim()).filter(Boolean)
    : [];

  const filteredDirect = direct.filter((key) => !HIDDEN_AUDIT_KEYS.has(key));
  if (filteredDirect.length) return [...new Set(filteredDirect)];

  const beforeData = item?.beforeData && typeof item.beforeData === "object" ? item.beforeData : {};
  const afterData = item?.afterData && typeof item.afterData === "object" ? item.afterData : {};
  const allKeys = [...new Set([...Object.keys(beforeData), ...Object.keys(afterData)])];

  return allKeys.filter((key) => {
    if (HIDDEN_AUDIT_KEYS.has(key)) return false;
    return JSON.stringify(beforeData?.[key]) !== JSON.stringify(afterData?.[key]);
  });
}

function buildChangeEntries(item) {
  const beforeData = item?.beforeData && typeof item.beforeData === "object" ? item.beforeData : {};
  const afterData = item?.afterData && typeof item.afterData === "object" ? item.afterData : {};
  const keys = uniqueColumns(item);

  return keys.map((key) => ({
    key,
    label: humanizeKey(key),
    beforeValue: beforeData?.[key],
    afterValue: afterData?.[key],
  }));
}

function ChangeValue({ label, value, muted = false }) {
  return (
    <div>
      <div style={styles.valueLabel}>{label}</div>
      <div style={{ ...styles.valueBox, ...(muted ? styles.valueBoxMuted : {}) }}>
        {safeString(value)}
      </div>
    </div>
  );
}

function ChangeCard({ entry, actionType }) {
  const isDelete = actionType === "delete";
  const cardStyle = isDelete
    ? { ...styles.changeCard, ...styles.changeCardDelete }
    : styles.changeCard;

  return (
    <div key={entry.key} style={cardStyle}>
      <h4 style={styles.changeFieldTitle}>{entry.label}</h4>

      {actionType === "create" ? (
        <div style={styles.beforeAfterWrap}>
          <ChangeValue label="Added Value" value={entry.afterValue} />
        </div>
      ) : actionType === "delete" ? (
        <div style={styles.beforeAfterWrap}>
          <ChangeValue label="Deleted Value" value={entry.beforeValue} muted />
        </div>
      ) : (
        <div style={styles.beforeAfterWrap}>
          <ChangeValue label="Previous" value={entry.beforeValue} muted />
          <ChangeValue label="Updated" value={entry.afterValue} />
        </div>
      )}
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
              Admin ko yahan user ka naam aur sirf woh fields nazar aayengi jo add ya update hui hain.
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
              {SUMMARY_FIELDS.map((field) => renderFieldCard(humanizeKey(field), rowData?.[field]))}
            </div>
          </div>

          {loading ? (
            <div style={styles.empty}>Loading audit logs...</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>No audit logs found for this row.</div>
          ) : (
            items.map((item) => {
              const changeEntries = buildChangeEntries(item);
              const changedColumns = uniqueColumns(item);
              const createdAt = item.createdAt || item.created_at;

              return (
                <div key={item.id} style={styles.logCard}>
                  <div style={styles.logHeader}>
                    <div>
                      <h4 style={styles.logTitle}>
                        <span style={styles.logMetaStrong}>{safeString(item.actorName)}</span>
                        {" "}
                        ne row par activity ki hai
                      </h4>
                      <p style={styles.logMeta}>
                        Email: <span style={styles.logMetaStrong}>{safeString(item.actorEmail)}</span>
                        {" • "}
                        Role: <span style={styles.logMetaStrong}>{safeString(item.actorRole)}</span>
                        {" • "}
                        Time: <span style={styles.logMetaStrong}>{prettyDate(createdAt)}</span>
                      </p>
                    </div>

                    <div style={styles.badgeRow}>
                      <span style={getActionBadgeStyle(item.actionType)}>
                        {safeString(item.actionType)}
                      </span>
                      <span style={styles.badge}>Row: {safeString(getRowId(item, rowData))}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ ...styles.cellLabel, marginBottom: "8px" }}>
                      Changed Fields
                    </div>
                    <div style={styles.chipsWrap}>
                      {changedColumns.length ? (
                        changedColumns.map((key) => (
                          <span key={`${item.id}-${key}`} style={styles.chip}>
                            {humanizeKey(key)}
                          </span>
                        ))
                      ) : (
                        <span style={styles.badge}>No field-level diff available</span>
                      )}
                    </div>
                  </div>

                  {changeEntries.length ? (
                    <div style={styles.changesGrid}>
                      {changeEntries.map((entry) => (
                        <ChangeCard
                          key={`${item.id}-${entry.key}`}
                          entry={entry}
                          actionType={item.actionType}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
