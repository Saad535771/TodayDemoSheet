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
    height: "92vh",
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
    flexShrink: 0,
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
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: "16px",
    background: "#f8fafc",
    display: "grid",
    gap: "14px",
    alignContent: "start",
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
    whiteSpace: "nowrap",
  },
  smallInlineBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "4px 9px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#ffffff",
    whiteSpace: "nowrap",
    marginTop: "6px",
  },
  block: {
    background: "#ffffff",
    border: "1.5px solid #000000",
    borderRadius: "14px",
    overflow: "hidden",
    flexShrink: 0,
  },
  blockTitle: {
    padding: "12px 14px",
    borderBottom: "1.5px solid #000000",
    fontWeight: 800,
    fontSize: "14px",
    color: "#111111",
    background: "#ffffff",
  },
  blockSubText: {
    padding: "10px 14px 0 14px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 600,
  },
  legendNote: {
    padding: "0 14px 12px 14px",
    fontSize: "12px",
    color: "#475569",
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: "auto",
    overflowY: "hidden",
    background: "#ffffff",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    minWidth: "2000px",
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
  actionCell: {
    minWidth: "170px",
  },
  timeCell: {
    minWidth: "170px",
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

function parseMaybeObject(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function parseMaybeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function camelToSnake(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function getFieldValue(obj, key) {
  const source = parseMaybeObject(obj);
  const snakeKey = camelToSnake(key);

  if (Object.prototype.hasOwnProperty.call(source, key)) {
    return source[key];
  }
  if (Object.prototype.hasOwnProperty.call(source, snakeKey)) {
    return source[snakeKey];
  }

  if (key === "daysPerWeek" && Object.prototype.hasOwnProperty.call(source, "days_per_week")) {
    return source.days_per_week;
  }
  if (key === "dateWithMonth" && Object.prototype.hasOwnProperty.call(source, "date_with_month")) {
    return source.date_with_month;
  }
  if (key === "tuitionName" && Object.prototype.hasOwnProperty.call(source, "tuition_name")) {
    return source.tuition_name;
  }
  if (key === "className" && Object.prototype.hasOwnProperty.call(source, "class_name")) {
    return source.class_name;
  }
  if (key === "tutorName" && Object.prototype.hasOwnProperty.call(source, "tutor_name")) {
    return source.tutor_name;
  }
  if (key === "tutorShare" && Object.prototype.hasOwnProperty.call(source, "tutor_share")) {
    return source.tutor_share;
  }
  if (key === "lacasShare" && Object.prototype.hasOwnProperty.call(source, "lacas_share")) {
    return source.lacas_share;
  }
  if (key === "totalFees" && Object.prototype.hasOwnProperty.call(source, "total_fees")) {
    return source.total_fees;
  }
  if (key === "otmName" && Object.prototype.hasOwnProperty.call(source, "otm_name")) {
    return source.otm_name;
  }

  return undefined;
}

function getActorSeed(actor) {
  return `${actor?.id ?? "x"}-${actor?.name ?? "user"}-${actor?.email ?? ""}`;
}

function getActorFromItem(item) {
  return item?.actor || {
    id: item?.actorUserId ?? item?.actor_user_id ?? null,
    name: item?.actorName ?? item?.actor_name ?? null,
    email: item?.actorEmail ?? item?.actor_email ?? null,
    role: item?.actorRole ?? item?.actor_role ?? null,
  };
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

function getNormalizedChangedColumns(item) {
  const direct = parseMaybeArray(item?.changedColumns ?? item?.changed_columns)
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (direct.length) return [...new Set(direct)];

  const beforeData = parseMaybeObject(item?.beforeData ?? item?.before_data);
  const afterData = parseMaybeObject(item?.afterData ?? item?.after_data);
  const changed = [];

  for (const field of FIELD_COLUMNS) {
    const beforeValue = getFieldValue(beforeData, field.key);
    const afterValue = getFieldValue(afterData, field.key);
    if (JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null)) {
      changed.push(field.key);
    }
  }

  return changed;
}

function getChangedValueMap(item) {
  const changedColumns = new Set(getNormalizedChangedColumns(item));
  const beforeData = parseMaybeObject(item?.beforeData ?? item?.before_data);
  const afterData = parseMaybeObject(item?.afterData ?? item?.after_data);
  const actionType = item?.actionType ?? item?.action_type;
  const map = {};

  for (const field of FIELD_COLUMNS) {
    const key = field.key;

    if (actionType === "create") {
      const value = getFieldValue(afterData, key);
      if (value !== undefined) {
        map[key] = value;
      }
      continue;
    }

    if (actionType === "delete") {
      const value = getFieldValue(beforeData, key);
      if (value !== undefined) {
        map[key] = value;
      }
      continue;
    }

    if (changedColumns.has(key)) {
      map[key] = getFieldValue(afterData, key);
      continue;
    }

    const snakeKey = camelToSnake(key);
    if (changedColumns.has(snakeKey)) {
      map[key] = getFieldValue(afterData, key);
    }
  }

  return map;
}

function sameActor(a, b) {
  const actorA = getActorFromItem(a);
  const actorB = getActorFromItem(b);

  const idA = actorA?.id ?? null;
  const idB = actorB?.id ?? null;

  if (idA !== null && idB !== null) {
    return String(idA) === String(idB);
  }

  const nameA = String(actorA?.name || "").trim().toLowerCase();
  const nameB = String(actorB?.name || "").trim().toLowerCase();

  return nameA && nameB && nameA === nameB;
}

function buildUniqueActors(items = [], actors = []) {
  const map = new Map();

  actors.forEach((actor) => {
    const seed = getActorSeed(actor);
    if (!map.has(seed)) map.set(seed, actor);
  });

  items.forEach((item) => {
    const actor = getActorFromItem(item);
    const seed = getActorSeed(actor);
    if (!map.has(seed)) map.set(seed, actor);
  });

  return [...map.values()];
}

function mergeConsecutiveLogs(items = []) {
  const merged = [];

  for (const rawItem of items) {
    const item = {
      ...rawItem,
      actionType: rawItem?.actionType ?? rawItem?.action_type,
      createdAt:
        rawItem?.createdAt ??
        rawItem?.created_at ??
        rawItem?.updatedAt ??
        rawItem?.updated_at ??
        null,
    };

    const actor = getActorFromItem(item);
    const changedMap = getChangedValueMap(item);

    const current = {
      ...item,
      actor,
      mergedValues: { ...changedMap },
      mergedCount: 1,
      mergedActionTypes: [item.actionType],
      firstCreatedAt: item.createdAt,
      lastCreatedAt: item.createdAt,
    };

    const last = merged[merged.length - 1];

    if (!last || !sameActor(last, current)) {
      merged.push(current);
      continue;
    }

    last.mergedCount += 1;
    last.mergedActionTypes.push(item.actionType);
    last.lastCreatedAt = item.createdAt || last.lastCreatedAt;
    last.mergedValues = {
      ...(last.mergedValues || {}),
      ...changedMap,
    };
  }

  return merged.map((row, index) => {
    const uniqueActions = [...new Set(row.mergedActionTypes)];
    let displayAction = actionLabel(uniqueActions[0]);

    if (uniqueActions.length > 1) {
      displayAction = uniqueActions.map(actionLabel).join(" + ");
    }

    if (row.mergedCount > 1) {
      displayAction = `${displayAction} (${row.mergedCount} changes)`;
    }

    return {
      ...row,
      rowKey: `${row.id || "audit"}-${index}`,
      displayAction,
      displayTime: formatDateTime(row.lastCreatedAt),
    };
  });
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

  const actorList = useMemo(() => buildUniqueActors(items, actors), [items, actors]);

  const actorColors = useMemo(() => {
    const map = new Map();

    actorList.forEach((actor) => {
      const seed = getActorSeed(actor);
      map.set(seed, colorFromSeed(seed));
    });

    return map;
  }, [actorList]);

  const mergedTimeline = useMemo(() => mergeConsecutiveLogs(items), [items]);

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
              Row ID: {safeText(paymentCloneId)} — same user ke consecutive changes ek hi line me merge honge aur sirf changed fields color me aayengi.
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
                {actorList.length ? (
                  actorList.map((actor, idx) => {
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
                        {safeText(getFieldValue(rowData || {}, col.key))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Audit Timeline (merged & easy view)</div>
            <div style={styles.blockSubText}>
              Top badges ke colors aur neeche highlighted cells same user ko show karte hain.
            </div>

            {loading ? (
              <div style={styles.empty}>Loading audit logs...</div>
            ) : !mergedTimeline.length ? (
              <div style={styles.empty}>No audit log found for this row.</div>
            ) : (
              <>
                <div style={styles.legendNote}>
                  Same user ke consecutive edits ek hi row me show honge. Dusra user edit karega to new row banegi.
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, ...styles.actionCell }}>Action</th>
                        <th style={{ ...styles.th, ...styles.timeCell }}>Time</th>
                        {FIELD_COLUMNS.map((col) => (
                          <th key={col.key} style={styles.th}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mergedTimeline.map((item) => {
                        const actor = item.actor || getActorFromItem(item);
                        const seed = getActorSeed(actor);
                        const color = actorColors.get(seed) || "#166534";

                        return (
                          <tr key={item.rowKey}>
                            <td
                              style={{
                                ...styles.td,
                                ...styles.actionCell,
                                borderLeft: `6px solid ${color}`,
                              }}
                            >
                              <div style={{ fontWeight: 800, color: "#111111" }}>
                                {item.displayAction}
                              </div>
                              <span
                                style={{
                                  ...styles.smallInlineBadge,
                                  background: color,
                                }}
                              >
                                {safeText(actor?.name)}
                              </span>
                            </td>

                            <td style={{ ...styles.td, ...styles.timeCell }}>
                              {item.displayTime}
                            </td>

                            {FIELD_COLUMNS.map((col) => {
                              const highlighted = Object.prototype.hasOwnProperty.call(
                                item.mergedValues || {},
                                col.key
                              );

                              const value = highlighted
                                ? safeText(item.mergedValues[col.key])
                                : "--";

                              return (
                                <td
                                  key={`${item.rowKey}-${col.key}`}
                                  style={{
                                    ...styles.td,
                                    background: highlighted ? color : "#ffffff",
                                    color: highlighted ? "#ffffff" : "#111111",
                                    fontWeight: highlighted ? 800 : 500,
                                  }}
                                >
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}