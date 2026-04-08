import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const FIELD_COLUMNS = [
  { key: "paymentDate", label: "Payment Date" },
  { key: "dateWithMonth", label: "Date With Month" },
  { key: "tuitionName", label: "Tuition Name" },
  { key: "country", label: "Country" },
  { key: "className", label: "Class Name" },
  { key: "tutorName", label: "Tutor Name" },
  { key: "tutorShare", label: "Tutor Fee" },
  { key: "lacasShare", label: "Lacas Share" },
  { key: "totalFees", label: "Total Fee" },
  { key: "status", label: "Status" },
  { key: "feedback", label: "Feedback" },
  { key: "otmName", label: "OTM Name" },
  { key: "daysPerWeek", label: "Days / Week" },
  { key: "date", label: "Date" },
  { key: "notes", label: "Notes" },
];

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 5000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modal: {
    width: "96vw",
    maxWidth: "1800px",
    maxHeight: "92vh",
    background: "#ffffff",
    borderRadius: "16px",
    border: "2px solid #000000",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
  },
  header: {
    padding: "16px",
    borderBottom: "2px solid #000000",
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#111111",
  },
  subtitle: {
    margin: "6px 0 0 0",
    fontSize: "13px",
    color: "#475569",
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
    padding: "16px",
    overflow: "auto",
    background: "#f8fafc",
    display: "grid",
    gap: "14px",
  },
  badgeWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  badge: {
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    color: "#ffffff",
    border: "1px solid rgba(0,0,0,0.18)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  block: {
    background: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "14px",
    overflow: "hidden",
  },
  blockTitle: {
    padding: "12px 14px",
    borderBottom: "1.5px solid #000000",
    fontWeight: 800,
    fontSize: "14px",
    color: "#111111",
    background: "#ffffff",
  },
  tableWrap: {
    overflowX: "auto",
    background: "#ffffff",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    minWidth: "2100px",
    background: "#ffffff",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#000000",
    color: "#ffffff",
    padding: "10px 8px",
    fontSize: "12px",
    fontWeight: 800,
    borderRight: "1px solid #333",
    borderBottom: "1px solid #333",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  td: {
    padding: "8px",
    fontSize: "12px",
    color: "#111111",
    borderRight: "1px solid #d1d5db",
    borderBottom: "1px solid #d1d5db",
    verticalAlign: "top",
    minWidth: "120px",
    background: "#ffffff",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  smallCell: {
    minWidth: "80px",
  },
  metaCell: {
    minWidth: "150px",
  },
  currentRowCell: {
    fontWeight: 600,
  },
  empty: {
    padding: "28px",
    textAlign: "center",
    color: "#475569",
    fontWeight: 700,
  },
};

function safeText(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
}

function formatDateTime(value) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function getActorSeed(actor) {
  return `${actor?.id ?? "x"}-${actor?.name ?? "user"}-${actor?.email ?? ""}`;
}

function colorFromSeed(seed) {
  const palette = [
    "#166534",
    "#1d4ed8",
    "#92400e",
    "#7c3aed",
    "#be123c",
    "#0f766e",
    "#4338ca",
    "#15803d",
    "#b45309",
    "#0369a1",
  ];

  let hash = 0;
  const value = String(seed || "user");
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return palette[Math.abs(hash) % palette.length];
}

function actionLabel(action) {
  switch (action) {
    case "create":
      return "Create";
    case "update":
      return "Update";
    case "delete":
      return "Delete";
    case "reorder":
      return "Reorder";
    default:
      return safeText(action);
  }
}

function getChangedSet(item) {
  const cols = Array.isArray(item?.changedColumns) ? item.changedColumns : [];
  return new Set(cols);
}

function getCellDisplayValue(item, fieldKey) {
  const actionType = item?.actionType;
  const changed = getChangedSet(item).has(fieldKey);

  if (!changed && actionType !== "delete" && actionType !== "create") {
    return "";
  }

  if (actionType === "create") {
    return safeText(item?.afterData?.[fieldKey]);
  }

  if (actionType === "delete") {
    return safeText(item?.beforeData?.[fieldKey]);
  }

  if (changed) {
    return safeText(item?.afterData?.[fieldKey]);
  }

  return "";
}

function isHighlighted(item, fieldKey) {
  const actionType = item?.actionType;
  const changed = getChangedSet(item).has(fieldKey);

  if (actionType === "create") {
    return (item?.afterData?.[fieldKey] ?? null) !== null;
  }

  if (actionType === "delete") {
    return (item?.beforeData?.[fieldKey] ?? null) !== null;
  }

  return changed;
}

export default function PaymentChangeRequestsPanel({
  open,
  onClose,
  paymentCloneId,
  rowData,
}) {
  const [items, setItems] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(false);

  const actorColors = useMemo(() => {
    const map = new Map();
    actors.forEach((actor) => {
      map.set(getActorSeed(actor), colorFromSeed(getActorSeed(actor)));
    });

    items.forEach((item) => {
      const actor = item?.actor || {
        id: item?.actorUserId,
        name: item?.actorName,
        email: item?.actorEmail,
      };
      const seed = getActorSeed(actor);
      if (!map.has(seed)) {
        map.set(seed, colorFromSeed(seed));
      }
    });

    return map;
  }, [actors, items]);

  async function loadLogs() {
    if (!open || !paymentCloneId) return;

    try {
      setLoading(true);
      const res = await api.get("/payment-change-requests/logs", {
        params: { paymentCloneId },
      });

      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      setActors(Array.isArray(res.data?.actors) ? res.data.actors : []);
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Payment Sheet Row Audit</h3>
            <p style={styles.subtitle}>
              Row ID: {safeText(paymentCloneId)} — jis user ne jo field edit ki hai, usi user ke color me woh box highlight hoga.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" style={styles.btn} onClick={() => void loadLogs()}>
              Refresh
            </button>
            <button type="button" style={styles.btn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div style={styles.body}>
          <div style={styles.block}>
            <div style={styles.blockTitle}>Users who edited this row</div>
            <div style={{ padding: "12px" }}>
              <div style={styles.badgeWrap}>
                {actors.length ? (
                  actors.map((actor, idx) => {
                    const seed = getActorSeed(actor);
                    const color = actorColors.get(seed) || "#166534";

                    return (
                      <span key={`${seed}-${idx}`} style={{ ...styles.badge, background: color }}>
                        {safeText(actor?.name)}{actor?.role ? ` (${actor.role})` : ""}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ color: "#475569", fontWeight: 700 }}>
                    No users found for this row yet.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Current Row Snapshot</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {FIELD_COLUMNS.map((col) => (
                      <th key={col.key} style={styles.th}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {FIELD_COLUMNS.map((col) => (
                      <td key={col.key} style={{ ...styles.td, ...styles.currentRowCell }}>
                        {safeText(rowData?.[col.key])}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Audit Timeline (table format)</div>

            {loading ? (
              <div style={styles.empty}>Loading audit logs...</div>
            ) : !items.length ? (
              <div style={styles.empty}>No audit log found for this row.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.metaCell }}>User</th>
                      <th style={{ ...styles.th, ...styles.smallCell }}>Action</th>
                      <th style={{ ...styles.th, ...styles.metaCell }}>Time</th>
                      {FIELD_COLUMNS.map((col) => (
                        <th key={col.key} style={styles.th}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const actor = item?.actor || {
                        id: item?.actorUserId,
                        name: item?.actorName,
                        email: item?.actorEmail,
                        role: item?.actorRole,
                      };

                      const seed = getActorSeed(actor);
                      const color = actorColors.get(seed) || "#166534";

                      return (
                        <tr key={item.id}>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: color }}>
                              {safeText(item.actorName)}
                            </span>
                          </td>

                          <td style={styles.td}>{actionLabel(item.actionType)}</td>
                          <td style={styles.td}>{formatDateTime(item.createdAt)}</td>

                          {FIELD_COLUMNS.map((col) => {
                            const highlighted = isHighlighted(item, col.key);
                            const value = getCellDisplayValue(item, col.key);

                            return (
                              <td
                                key={`${item.id}-${col.key}`}
                                style={{
                                  ...styles.td,
                                  background: highlighted ? color : "#ffffff",
                                  color: highlighted ? "#ffffff" : "#111111",
                                  fontWeight: highlighted ? 800 : 500,
                                }}
                              >
                                {value || "--"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}