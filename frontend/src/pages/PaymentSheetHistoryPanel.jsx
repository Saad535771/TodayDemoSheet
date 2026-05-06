import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";
import PaymentLast24HoursHistoryPanel from "./PaymentLast24HoursHistoryPanel.jsx";

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

const DATA_COLUMNS = [
  { key: "dateWithMonth", label: "Date", width: 120 },
  { key: "tuitionName", label: "Tuition Name", width: 170 },
  { key: "totalStudents", label: "Total Students", width: 120 },
  { key: "country", label: "Country", width: 120 },
  { key: "subjects", label: "Subjects", width: 130 },
  { key: "tutorName", label: "Tutor Name", width: 160 },
  { key: "tutorFee", label: "Tutor Fee", width: 110 },
  { key: "lacasShare", label: "Lacas Share", width: 110 },
  { key: "totalFees", label: "Total Fee", width: 110 },
  { key: "status", label: "Status", width: 170 },
  { key: "feedback", label: "Feedback", width: 180 },
  { key: "notes", label: "Notes", width: 180 },
];

const SHEET_COLUMNS = [
  { key: "orderIndex", label: "Sort", width: 80, kind: "sort" },
  { key: "historyRowId", label: "#", width: 70, kind: "rowId" },
  { key: "rowSelected", label: "", width: 60, kind: "checkbox" },
  { key: "rowColor", label: "🎨", width: 70, kind: "color" },
  ...DATA_COLUMNS,
];

const FIELD_ALIASES = {
  id: "historyRowId",
  orderIndex: "orderIndex",
  rowColor: "rowColor",
  paymentDate: "dateWithMonth",
  date: "dateWithMonth",
  dateWithMonth: "dateWithMonth",
  className: "subjects",
  subjects: "subjects",
  tutorShare: "tutorFee",
  tutorFee: "tutorFee",
  lacasShare: "lacasShare",
  totalFees: "totalFees",
  tuitionName: "tuitionName",
  totalStudents: "totalStudents",
  country: "country",
  tutorName: "tutorName",
  status: "status",
  feedback: "feedback",
  notes: "notes",
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.38)",
    zIndex: 5000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  panel: {
    width: "96vw",
    height: "88vh",
    background: "#ffffff",
    border: "2px solid #000000",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    flexWrap: "wrap",
  },
  historyFilterBtn: {
    height: "42px",
    border: "1.5px solid #000000",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#111111",
    fontWeight: 800,
    fontSize: "13px",
    padding: "0 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  activeHistoryFilterBtn: {
    background: "#111827",
    color: "#ffffff",
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
  error: {
    margin: "14px 18px 0",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 700,
  },
  scroller: {
    flex: 1,
    overflow: "auto",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    minWidth: "2100px",
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
    verticalAlign: "middle",
    padding: "10px 8px",
    borderRight: "1px solid #000000",
    borderBottom: "1px solid #000000",
    background: "#ffffff",
    color: "#111827",
    textAlign: "center",
    position: "relative",
  },
  changedCell: {
    fontWeight: 700,
    cursor: "help",
    boxShadow: "inset 0 0 0 2px rgba(37, 99, 235, 0.18)",
  },
  cellValue: {
    minHeight: "18px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.35,
  },
  changedMarker: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#1d4ed8",
  },
  loading: {
    padding: "24px",
    textAlign: "center",
    fontWeight: 700,
    color: "#374151",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    fontWeight: 700,
    color: "#475569",
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
  tooltip: {
    position: "fixed",
    zIndex: 8000,
    minWidth: "280px",
    maxWidth: "460px",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #374151",
    padding: "12px 14px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
    fontSize: "12px",
  },
  tooltipLabel: {
    fontWeight: 800,
    marginBottom: "8px",
    display: "block",
  },
  tooltipRow: {
    display: "block",
    marginTop: "4px",
  },
  tooltipHistoryItem: {
    display: "block",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.12)",
  },
  colorSwatch: {
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    border: "2px solid #111111",
    display: "inline-block",
  },
  readonlyCheckbox: {
    width: "14px",
    height: "14px",
    accentColor: "#2563eb",
    pointerEvents: "none",
  },
  sortValue: {
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

function getActorColor(name) {
  const key = String(name || "Unknown User");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ACTOR_COLORS[hash % ACTOR_COLORS.length];
}

function normalizeFieldKey(field) {
  return FIELD_ALIASES[String(field || "").trim()] || String(field || "").trim();
}

function toSnakeCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function isEmptyDisplayValue(value) {
  return value === null || value === undefined || value === "";
}

function firstExistingValue(row, keys = []) {
  if (!row) return null;

  for (const rawKey of keys) {
    const key = String(rawKey || "").trim();
    if (!key) continue;

    const snakeKey = toSnakeCase(key);

    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
      return row[key];
    }

    if (Object.prototype.hasOwnProperty.call(row, snakeKey) && row[snakeKey] !== undefined) {
      return row[snakeKey];
    }
  }

  return null;
}

function parseHistoryTimestampMs(value) {
  if (!value) return 0;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : 0;
  }

  const raw = String(value).trim();
  if (!raw) return 0;

  const direct = new Date(raw).getTime();
  if (Number.isFinite(direct)) return direct;

  const normalized = raw.replace(" ", "T");
  const normalizedTime = new Date(normalized).getTime();
  return Number.isFinite(normalizedTime) ? normalizedTime : 0;
}

function getTimestampMs(value) {
  return parseHistoryTimestampMs(value);
}

function getItemTimestampValue(item) {
  return item?.createdAt ?? item?.created_at ?? item?.updatedAt ?? item?.updated_at ?? null;
}

function isWithinLastHours(value, hours = 24) {
  const time = parseHistoryTimestampMs(value);
  if (!time) return false;

  const now = Date.now();
  const from = now - Number(hours || 24) * 60 * 60 * 1000;
  const futureGrace = now + 5 * 60 * 1000;

  return time >= from && time <= futureGrace;
}

function filterItemsByLastHours(rows = [], hours = 24) {
  return rows.filter((item) => isWithinLastHours(getItemTimestampValue(item), hours));
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatLocalMysqlDateTime(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function getAuditIdNumber(item) {
  const value = Number(item?.id ?? item?.auditId ?? item?.audit_id ?? 0);
  return Number.isFinite(value) ? value : 0;
}

const IMPORTANT_HISTORY_SORT_FIELDS = new Set([
  "tuitionName",
  "totalStudents",
  "country",
  "subjects",
  "tutorName",
  "tutorFee",
  "lacasShare",
  "totalFees",
  "status",
  "feedback",
  "notes",
]);

function isImportantHistoryChangeKey(key) {
  return IMPORTANT_HISTORY_SORT_FIELDS.has(normalizeFieldKey(key));
}

function getCellHighlight(actionTypes = []) {
  const normalized = actionTypes.map((value) => String(value || "").toLowerCase());
  if (normalized.includes("delete")) return "#fee2e2";
  if (normalized.includes("create")) return "#dcfce7";
  return "#dbeafe";
}

function readCellValue(row, key) {
  if (!row || !key) return null;

  const normalizedKey = normalizeFieldKey(key);

  switch (normalizedKey) {
    case "historyRowId":
      return firstExistingValue(row, ["historyRowId", "paymentCloneId", "payment_clone_id", "id"]);
    case "dateWithMonth":
      return firstExistingValue(row, ["dateWithMonth", "date_with_month", "paymentDate", "payment_date", "date"]);
    case "subjects":
      return firstExistingValue(row, ["subjects", "className", "class_name"]);
    case "tutorFee":
      return firstExistingValue(row, ["tutorFee", "tutor_fee", "tutorShare", "tutor_share"]);
    case "rowSelected":
      return false;
    default:
      return firstExistingValue(row, [normalizedKey, key]);
  }
}

function getChangedCellDetail(changedCellDetails, colKey) {
  const normalizedKey = normalizeFieldKey(colKey);
  const direct = toObject(changedCellDetails?.[normalizedKey]);
  if (Object.keys(direct).length) return direct;

  const snake = toObject(changedCellDetails?.[toSnakeCase(normalizedKey)]);
  if (Object.keys(snake).length) return snake;

  const original = toObject(changedCellDetails?.[colKey]);
  if (Object.keys(original).length) return original;

  return {};
}

function resolveChangedAfterValue({ detail, afterData, beforeData, snapshot, colKey, actionType }) {
  if (!isEmptyDisplayValue(detail?.after)) return detail.after;

  const afterValue = readCellValue(afterData, colKey);
  if (!isEmptyDisplayValue(afterValue)) return afterValue;

  const snapshotValue = readCellValue(snapshot, colKey);
  if (!isEmptyDisplayValue(snapshotValue)) return snapshotValue;

  if (String(actionType || "").toLowerCase() === "delete") {
    const beforeValue = readCellValue(beforeData, colKey);
    if (!isEmptyDisplayValue(beforeValue)) return beforeValue;
  }

  return detail?.after ?? afterValue ?? snapshotValue ?? null;
}

function buildMergedSnapshot(beforeData, afterData, metadata, rowData) {
  return {
    ...(rowData || {}),
    ...(beforeData || {}),
    ...(metadata?.rowSnapshot || {}),
    ...(afterData || {}),
  };
}

function getRowHistoryId(item, metadata, beforeData, afterData) {
  return (
    item?.historyRowId ??
    item?.paymentCloneId ??
    metadata?.historyRowId ??
    metadata?.originalPaymentCloneId ??
    beforeData?.id ??
    afterData?.id ??
    null
  );
}

function compareSnapshots(a, b) {
  const leftOrder = Number.isFinite(Number(a?.orderIndex)) ? Number(a.orderIndex) : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(Number(b?.orderIndex)) ? Number(b.orderIndex) : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;

  const leftName = String(a?.tuitionName || "");
  const rightName = String(b?.tuitionName || "");
  const byName = leftName.localeCompare(rightName);
  if (byName !== 0) return byName;

  return String(a?.historyRowId || "").localeCompare(String(b?.historyRowId || ""));
}

function serializeChangeEntry(change) {
  return `${formatDateTime(change.timestamp)} • ${change.actorName}\nPrevious: ${displayValue(change.before)}\nChanged To: ${displayValue(change.after)}`;
}
export default function PaymentSheetHistoryPanel({ open, onClose, paymentCloneId, rowData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const [historyWindow, setHistoryWindow] = useState("complete");
  const [last24HistoryOpen, setLast24HistoryOpen] = useState(false);
  const isLast24Hours = historyWindow === "24h";
  const historyModeLabel = isLast24Hours ? "Last 24 Hours" : "Complete History";
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadHistory = async () => {
      setLoading(true);
      setError("");
      const queryParts = ["moduleName=payment_sheet_with_date", "limit=500"];
      if (paymentCloneId !== undefined && paymentCloneId !== null) {
        queryParts.push(`paymentCloneId=${encodeURIComponent(paymentCloneId)}`);
      }
      if (isLast24Hours){
        const fromDate = formatLocalMysqlDateTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
        queryParts.push("hours=24");
        queryParts.push("historyWindow=last-24-hours");
        queryParts.push(`fromDate=${encodeURIComponent(fromDate)}`);
        queryParts.push("strictLast24=1");
      }

      const endpoints = isLast24Hours
        ? [
            `/payment-change-requests/logs/last-24-hours?${queryParts.join("&")}`,
            `/payment-change-requests/history/last-24-hours?${queryParts.join("&")}`,
          ]
        : [
            `/payment-change-requests/logs?${queryParts.join("&")}`,
            `/payment-change-requests/history?${queryParts.join("&")}`,
          ];

      let loaded = [];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          loaded = normalizeHistoryResponse(res.data);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (cancelled) return;

      if (!loaded.length && lastError) {
        setError(lastError?.response?.data?.message || "Failed to load payment sheet history.");
        setItems([]);
      } else {
       setItems(loaded);
      }

      setLoading(false);
    };

    void loadHistory();

    return () => {
      cancelled = true;
      setTooltip(null);
    };
  }, [open, paymentCloneId, isLast24Hours]);

  const normalizedItems = useMemo(() => {
   const sourceItems = items;

    return sourceItems
      .map((item, index) => {
        const rawChangedColumns = toArray(item?.changedColumns ?? item?.changed_columns).map((col) =>
          normalizeFieldKey(col)
        );
        const changedColumns = [...new Set(rawChangedColumns.filter(Boolean))];
        const beforeData = toObject(item?.beforeData ?? item?.before_data);
        const afterData = toObject(item?.afterData ?? item?.after_data);
        const metadata = toObject(item?.metadata);
        const changedCellDetails = toObject(metadata?.changedCellDetails);
        const actorName = item?.actorName || item?.actor_name || item?.actorUser?.name || "Unknown User";
        const actionType = item?.actionType || item?.action_type || "update";
        const timestamp = item?.createdAt || item?.created_at || item?.updatedAt || item?.updated_at;
        const snapshot = buildMergedSnapshot(beforeData, afterData, metadata, rowData);
        const historyRowId = getRowHistoryId(item, metadata, beforeData, afterData);

        return {
          id: item?.id || `${actorName}-${timestamp}-${index}`,
          actionType,
          actorName,
          timestamp,
          metadata,
          beforeData,
          afterData,
          changedColumns,
          changedCellDetails,
          snapshot: {
            ...snapshot,
            historyRowId,
          },
          historyRowId,
        };
      })
      .filter((item) => item.historyRowId !== null && item.historyRowId !== undefined);
  }, [items, rowData, isLast24Hours]);

  const groupedRows = useMemo(() => {
    const groupMap = new Map();

    const chronologicalItems = [...normalizedItems].sort((a, b) => {
      const timeDiff = getTimestampMs(a?.timestamp) - getTimestampMs(b?.timestamp);
      if (timeDiff !== 0) return timeDiff;
      return getAuditIdNumber(a) - getAuditIdNumber(b);
    });

    chronologicalItems.forEach((item) => {
      const groupKey = String(item.historyRowId);
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          historyRowId: item.historyRowId,
          snapshot: { historyRowId: item.historyRowId },
          latestTimestamp: item.timestamp,
          latestActorName: item.actorName,
          latestSortTimeMs: getTimestampMs(item.timestamp),
          latestAuditId: getAuditIdNumber(item),
          hasImportantChanges: false,
          changeCount: 0,
          actionTypes: new Set(),
          changedMap: {},
        });
      }

      const group = groupMap.get(groupKey);
      group.snapshot = {
        ...group.snapshot,
        ...item.snapshot,
        historyRowId: item.historyRowId,
      };
      const itemSortTimeMs = getTimestampMs(item.timestamp);
      const itemAuditId = getAuditIdNumber(item);

      if (
        itemSortTimeMs > (group.latestSortTimeMs || 0) ||
        (itemSortTimeMs === (group.latestSortTimeMs || 0) && itemAuditId > (group.latestAuditId || 0))
      ) {
        group.latestTimestamp = item.timestamp;
        group.latestActorName = item.actorName;
        group.latestSortTimeMs = itemSortTimeMs;
        group.latestAuditId = itemAuditId;
      }

      group.changeCount += 1;
      group.actionTypes.add(String(item.actionType || "update").toLowerCase());

      item.changedColumns.forEach((rawColKey) => {
        const colKey = normalizeFieldKey(rawColKey);
        if (isImportantHistoryChangeKey(colKey)) {
          group.hasImportantChanges = true;
        }

        const detail = getChangedCellDetail(item.changedCellDetails, colKey);
        const beforeValue =
          detail.before !== undefined ? detail.before : readCellValue(item.beforeData, colKey);
        const afterValue = resolveChangedAfterValue({
          detail,
          afterData: item.afterData,
          beforeData: item.beforeData,
          snapshot: item.snapshot,
          colKey,
          actionType: item.actionType,
        });

        if (!group.changedMap[colKey]) {
          group.changedMap[colKey] = {
            latestValue: afterValue,
            firstValue: beforeValue,
            items: [],
          };
        }

        group.changedMap[colKey].latestValue = afterValue;
        group.changedMap[colKey].items.push({
          timestamp: item.timestamp,
          actorName: item.actorName,
          actionType: item.actionType,
          before: beforeValue,
          after: afterValue,
        });
      });
    });

    return [...groupMap.values()]
      .map((group) => ({
        ...group,
        actionTypes: [...group.actionTypes],
      }))
      .sort((a, b) => {
        const importantDiff = Number(Boolean(b.hasImportantChanges)) - Number(Boolean(a.hasImportantChanges));
        if (importantDiff !== 0) return importantDiff;

        const latestDiff = (b.latestSortTimeMs || 0) - (a.latestSortTimeMs || 0);
        if (latestDiff !== 0) return latestDiff;

        const auditDiff = (Number(b.latestAuditId) || 0) - (Number(a.latestAuditId) || 0);
        if (auditDiff !== 0) return auditDiff;

        return compareSnapshots(a.snapshot, b.snapshot);
      });
  }, [normalizedItems]);

  const summary = useMemo(() => {
    const users = new Set(normalizedItems.map((item) => item.actorName));
    return {
      totalRows: groupedRows.length,
      totalChanges: normalizedItems.length,
      users: users.size,
    };
  }, [groupedRows.length, normalizedItems]);

  if (!open) return null;

  return (
    <>
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <h3 style={styles.title}>
              {paymentCloneId ? "Payment Row History" : "Payment Sheet History"}
            </h3>
            <p style={styles.subtitle}>
              {isLast24Hours
                ? "Last 24 hours ki history show ho rahi hai. Permanent complete history safe rahegi."
                : "Complete permanent history show ho rahi hai. 24 hours ke liye button use karein."}
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={{
                ...styles.historyFilterBtn,
                ...(!isLast24Hours ? styles.activeHistoryFilterBtn : {}),
              }}
              onClick={() => setHistoryWindow("complete")}
            >
              Complete History
            </button>
            <button
              type="button"
              style={{
                ...styles.historyFilterBtn,
                ...(isLast24Hours ? styles.activeHistoryFilterBtn : {}),
              }}
              onClick={() => setLast24HistoryOpen(true)}
            >
              Last 24 Hours
            </button>
            <button
              type="button"
              style={styles.closeBtn}
              onClick={onClose}
              aria-label="Close history panel"
            >
              ×
            </button>
          </div>
        </div>

        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>Rows: {summary.totalRows}</div>
          <div style={styles.summaryItem}>Total Changes: {summary.totalChanges}</div>
          <div style={styles.summaryItem}>Users: {summary.users}</div>
          <div style={styles.summaryItem}>Mode: {paymentCloneId ? "Selected Row" : "Whole Sheet"}</div>
          <div style={styles.summaryItem}>Filter: {historyModeLabel}</div>
        </div>
        {error ? <div style={styles.error}>{error}</div> : null}
        <div style={styles.scroller}>
          <table style={styles.table}>
            <thead>
              <tr>
                {SHEET_COLUMNS.map((col) => (
                  <th key={col.key} style={{ ...styles.th, minWidth: `${col.width}px` }}>
                    {col.label}
                  </th>
                ))}
                <th style={{ ...styles.th, minWidth: "170px" }}>Last Changed At</th>
                <th style={{ ...styles.th, minWidth: "150px" }}>Last Updated By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={SHEET_COLUMNS.length + 2} style={styles.loading}>
                    {isLast24Hours ? "Loading last 24 hours history..." : "Loading complete payment history..."}
                  </td>
                </tr>
              ) : null}

              {!loading && !groupedRows.length ? (
                <tr>
                  <td colSpan={SHEET_COLUMNS.length + 2} style={styles.empty}>
                    {isLast24Hours ? "No history found in the last 24 hours." : "No complete history found yet."}
                  </td>
                </tr>
              ) : null}

              {!loading &&
                groupedRows.map((row) => {
                  const actorStyle = getActorColor(row.latestActorName);

                  return (
                    <tr key={String(row.historyRowId)}>
                      {SHEET_COLUMNS.map((col) => {
                        const currentValue = readCellValue(row.snapshot, col.key);
                        const changeInfo = row.changedMap[col.key];
                        const isChanged = Boolean(changeInfo?.items?.length);
                        const tooltipItems = [...(changeInfo?.items || [])].sort(
                          (a, b) => getTimestampMs(b.timestamp) - getTimestampMs(a.timestamp)
                        );
                        const visibleValue =
                          isChanged && !isEmptyDisplayValue(changeInfo?.latestValue)
                            ? changeInfo.latestValue
                            : currentValue;

                        const baseStyle = {
                          ...styles.td,
                          ...(isChanged
                            ? {
                                ...styles.changedCell,
                                background: getCellHighlight(tooltipItems.map((entry) => entry.actionType)),
                              }
                            : {}),
                        };

                        let content = <div style={styles.cellValue}>{displayValue(visibleValue)}</div>;

                        if (col.kind === "checkbox") {
                          content = <input type="checkbox" checked={false} readOnly style={styles.readonlyCheckbox} />;
                        } else if (col.kind === "color") {
                          content = (
                            <span
                              style={{
                                ...styles.colorSwatch,
                                background: visibleValue || currentValue || "#ffffff",
                              }}
                            />
                          );
                        } else if (col.kind === "sort") {
                          content = <span style={styles.sortValue}>{displayValue(visibleValue)}</span>;
                        }

                        return (
                          <td
                            key={`${row.historyRowId}-${col.key}`}
                            style={baseStyle}
                            onMouseEnter={(event) => {
                              if (!isChanged) return;
                              const rect = event.currentTarget.getBoundingClientRect();
                              setTooltip({
                                title: `${col.label || "Field"} • ${tooltipItems.length} change${tooltipItems.length > 1 ? "s" : ""}`,
                                x: rect.right + 10,
                                y: rect.top + 4,
                                items: tooltipItems,
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {isChanged ? <span style={styles.changedMarker} /> : null}
                            {content}
                          </td>
                        );
                      })}

                      <td style={styles.td}>{formatDateTime(row.latestTimestamp)}</td>
                      <td style={{ ...styles.td, background: actorStyle.bg }}>
                        <span
                          style={{
                            ...styles.userTag,
                            background: actorStyle.bg,
                            color: actorStyle.text,
                            borderColor: actorStyle.border,
                          }}
                        >
                          {row.latestActorName}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {tooltip ? (
          <div
            style={{
              ...styles.tooltip,
              left: Math.min(tooltip.x, window.innerWidth - 470),
              top: Math.min(tooltip.y, window.innerHeight - 260),
            }}
          >
            <span style={styles.tooltipLabel}>{tooltip.title}</span>
            {tooltip.items.map((item, index) => (
              <span key={`${item.timestamp}-${index}`} style={styles.tooltipHistoryItem}>
                <span style={styles.tooltipRow}><strong>{index + 1}.</strong> {formatDateTime(item.timestamp)} • {item.actorName}</span>
                <span style={styles.tooltipRow}><strong>Previous:</strong> {displayValue(item.before)}</span>
                <span style={styles.tooltipRow}><strong>Changed To:</strong> {displayValue(item.after)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
    <PaymentLast24HoursHistoryPanel
      open={last24HistoryOpen}
      onClose={() => setLast24HistoryOpen(false)}
      paymentCloneId={paymentCloneId}
    />
    </>
  );
}