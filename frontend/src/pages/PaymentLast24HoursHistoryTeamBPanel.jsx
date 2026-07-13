import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const COLUMNS = [
  ["orderIndex", "Sort", 80],
  ["historyRowId", "#", 80],
  ["dateWithMonth", "Date", 130],
  ["tuitionName", "Tuition Name", 240],
  ["totalStudents", "Total Students", 130],
  ["country", "Country", 130],
  ["subjects", "Subjects", 170],
  ["tutorName", "Tutor Name", 190],
  ["tutorFee", "Tutor Fee", 120],
  ["lacasShare", "Lacas Share", 120],
  ["totalFees", "Total Fee", 120],
  ["status", "Status", 180],
  ["feedback", "Feedback", 300],
  ["notes", "Notes", 220],
];

const ALIASES = {
  id: "historyRowId",
  paymentCloneId: "historyRowId",
  payment_clone_id: "historyRowId",
  paymentDate: "dateWithMonth",
  payment_date: "dateWithMonth",
  date: "dateWithMonth",
  dateWithMonth: "dateWithMonth",
  date_with_month: "dateWithMonth",
  className: "subjects",
  class_name: "subjects",
  subjects: "subjects",
  tutorShare: "tutorFee",
  tutor_share: "tutorFee",
  tutorFee: "tutorFee",
  tutor_fee: "tutorFee",
  lacasShare: "lacasShare",
  lacas_share: "lacasShare",
  totalFees: "totalFees",
  total_fees: "totalFees",
  tuitionName: "tuitionName",
  tuition_name: "tuitionName",
  totalStudents: "totalStudents",
  total_students: "totalStudents",
  tutorName: "tutorName",
  tutor_name: "tutorName",
  orderIndex: "orderIndex",
  order_index: "orderIndex",
  country: "country",
  status: "status",
  feedback: "feedback",
  notes: "notes",
};

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.38)", zIndex: 7000, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 },
  panel: { width: "97vw", height: "90vh", background: "#fff", border: "2px solid #000", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 70px rgba(0,0,0,.25)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "2px solid #000" },
  title: { margin: 0, fontSize: 24, fontWeight: 900 },
  subtitle: { margin: "5px 0 0", color: "#334155", fontSize: 13 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: { height: 42, border: "1.5px solid #000", borderRadius: 10, background: "#fff", color: "#111", fontWeight: 800, padding: "0 14px", cursor: "pointer" },
  darkBtn: { background: "#111827", color: "#fff" },
  closeBtn: { height: 42, minWidth: 42, border: "1.5px solid #000", borderRadius: 10, background: "#fff", fontWeight: 900, fontSize: 18, cursor: "pointer" },
  summary: { display: "flex", gap: 10, flexWrap: "wrap", padding: "12px 18px", background: "#fafafa", borderBottom: "1.5px solid #000" },
  pill: { border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 800 },
  error: { margin: "14px 18px 0", padding: "14px 16px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: 800 },
  scroller: { flex: 1, overflow: "auto" },
  table: { width: "100%", minWidth: 2300, borderCollapse: "collapse", fontSize: 12 },
  th: { position: "sticky", top: 0, zIndex: 3, background: "#000", color: "#fff", padding: "12px 10px", borderRight: "1.5px solid #000", borderBottom: "1.5px solid #000", textAlign: "center", whiteSpace: "nowrap", fontWeight: 900 },
  td: { padding: "10px 8px", borderRight: "1px solid #000", borderBottom: "1px solid #000", textAlign: "center", whiteSpace: "pre-wrap", wordBreak: "break-word", position: "relative" },
  changed: { background: "#dbeafe", fontWeight: 800, boxShadow: "inset 0 0 0 2px rgba(37,99,235,.25)", cursor: "help" },
  dot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 999, background: "#1d4ed8" },
  empty: { padding: 24, textAlign: "center", fontWeight: 800, color: "#475569" },
  tooltip: { position: "fixed", zIndex: 9000, minWidth: 300, maxWidth: 540, background: "#111827", color: "#fff", borderRadius: 12, padding: 12, pointerEvents: "none", fontSize: 12, lineHeight: 1.45, boxShadow: "0 12px 28px rgba(0,0,0,.28)" },
};

function parseJson(v) { if (v == null || v === "") return null; if (typeof v === "object") return v; try { return JSON.parse(v); } catch { return v; } }
function toObject(v) { const p = parseJson(v); return p && typeof p === "object" && !Array.isArray(p) ? p : {}; }
function toArray(v) { const p = parseJson(v); if (Array.isArray(p)) return p; if (p == null || p === "") return []; return [p]; }
function normalizeResponse(data) { return Array.isArray(data) ? data : data?.items || data?.history || data?.requests || data?.data || data?.logs || []; }
function alias(k) { return ALIASES[String(k || "").trim()] || String(k || "").trim(); }
function snake(k) { return String(k || "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase(); }
function pick(row, keys) { for (const k of keys) { if (row && row[k] !== undefined) return row[k]; const s = snake(k); if (row && row[s] !== undefined) return row[s]; } return null; }
function value(row, key) {
  const k = alias(key);
  if (k === "historyRowId") return pick(row, ["historyRowId", "paymentCloneId", "payment_clone_id", "id"]);
  if (k === "dateWithMonth") return pick(row, ["dateWithMonth", "date_with_month", "paymentDate", "payment_date", "date"]);
  if (k === "subjects") return pick(row, ["subjects", "className", "class_name"]);
  if (k === "tutorFee") return pick(row, ["tutorFee", "tutor_fee", "tutorShare", "tutor_share"]);
  return pick(row, [k, key]);
}
function display(v) { if (v === null || v === undefined || v === "") return "—"; return typeof v === "object" ? JSON.stringify(v) : String(v); }
function timeMs(v) { if (!v) return 0; const a = new Date(v).getTime(); if (Number.isFinite(a)) return a; const b = new Date(String(v).replace(" ", "T")).getTime(); return Number.isFinite(b) ? b : 0; }
function fmt(v) { if (!v) return "-"; const d = new Date(v); if (Number.isNaN(d.getTime())) return String(v); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`; }
function rowId(item, meta, before, after) { return item.historyRowId ?? item.paymentCloneId ?? meta.historyRowId ?? meta.originalPaymentCloneId ?? before.id ?? after.id ?? null; }
function cellDetail(details, key) { const k = alias(key); return toObject(details?.[k]) || toObject(details?.[snake(k)]) || {}; }
function afterValue(detail, after, before, snapshot, key, action) {
  if (detail.after !== undefined && detail.after !== null && detail.after !== "") return detail.after;
  const av = value(after, key); if (av !== null && av !== undefined && av !== "") return av;
  const sv = value(snapshot, key); if (sv !== null && sv !== undefined && sv !== "") return sv;
  if (String(action).toLowerCase() === "delete") return value(before, key);
  return null;
}

function normalizeItem(item, index) {
  const before = toObject(item.beforeData ?? item.before_data);
  const after = toObject(item.afterData ?? item.after_data);
  const meta = toObject(item.metadata);
  const snapshot = { ...before, ...(meta.rowSnapshot || {}), ...after };
  const rid = rowId(item, meta, before, after);
  const action = item.actionType ?? item.action_type ?? "update";
  const timestamp = item.createdAt ?? item.created_at ?? item.updatedAt ?? item.updated_at;
  return {
    raw: item,
    id: Number(item.id ?? item.auditId ?? item.audit_id ?? 0) || index,
    action,
    actorName: item.actorName ?? item.actor_name ?? item.actor?.name ?? "Unknown User",
    timestamp,
    before,
    after,
    meta,
    details: toObject(meta.changedCellDetails),
    snapshot: { ...snapshot, historyRowId: rid },
    historyRowId: rid,
    changedColumns: [...new Set(toArray(item.changedColumns ?? item.changed_columns).map(alias).filter(Boolean))],
  };
}

function groupItems(items) {
  const groups = new Map();
  [...items].sort((a, b) => (timeMs(a.timestamp) - timeMs(b.timestamp)) || (a.id - b.id)).forEach((item) => {
    if (item.historyRowId == null) return;
    const key = String(item.historyRowId);
    if (!groups.has(key)) groups.set(key, { historyRowId: item.historyRowId, snapshot: {}, latestTimestamp: item.timestamp, latestActorName: item.actorName, latestId: item.id, changedMap: {}, count: 0 });
    const g = groups.get(key);
    g.snapshot = { ...g.snapshot, ...item.snapshot, historyRowId: item.historyRowId };
    if (item.id >= g.latestId) { g.latestId = item.id; g.latestTimestamp = item.timestamp; g.latestActorName = item.actorName; }
    g.count += 1;
    item.changedColumns.forEach((col) => {
      const detail = cellDetail(item.details, col);
      const before = detail.before !== undefined ? detail.before : value(item.before, col);
      const after = afterValue(detail, item.after, item.before, item.snapshot, col, item.action);
      if (!g.changedMap[col]) g.changedMap[col] = { latestValue: after, items: [] };
      g.changedMap[col].latestValue = after;
      g.changedMap[col].items.push({ actorName: item.actorName, timestamp: item.timestamp, before, after, action: item.action });
    });
  });
  return [...groups.values()].sort((a, b) => (b.latestId || 0) - (a.latestId || 0));
}

export default function PaymentLast24HoursHistoryTeamBPanel({ open, onClose, paymentCloneId }) {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tooltip, setTooltip] = useState(null);

  async function loadData() {
    try {
      setLoading(true); setError("");
      const params = { moduleName: "payment_sheet_with_date", limit: 20000, hours: 24, historyWindow: "last-24-hours", strictLast24: 1 };
      if (paymentCloneId !== undefined && paymentCloneId !== null && paymentCloneId !== "") params.paymentCloneId = paymentCloneId;
      const res = await api.get("/payment-change-requests-team-b/logs/last-24-hours", { params });
      // Backend response is the source of truth. No local 24h time filtering here.
      setItems(normalizeResponse(res.data));
      setFilters(res.data?.filters || null);
    } catch (err) {
      console.error("Last 24 hours history failed:", err);
      setItems([]); setFilters(null);
      setError(err?.response?.data?.message || err?.message || "Failed to load last 24 hours history.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (open) void loadData(); }, [open, paymentCloneId]);

  const normalized = useMemo(() => items.map(normalizeItem).filter((x) => x.historyRowId != null), [items]);
  const rows = useMemo(() => groupItems(normalized), [normalized]);
  const users = useMemo(() => new Set(normalized.map((x) => x.actorName)).size, [normalized]);

  if (!open) return null;
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div><h3 style={styles.title}>Payment Sheet History</h3><p style={styles.subtitle}>Last 24 Hours ka data direct backend response se show ho raha hai.</p></div>
          <div style={styles.actions}><button style={{...styles.btn, ...styles.darkBtn}}>Last 24 Hours</button><button style={styles.btn} onClick={loadData}>Refresh</button><button style={styles.closeBtn} onClick={onClose}>×</button></div>
        </div>
        <div style={styles.summary}>
          <div style={styles.pill}>Rows: {rows.length}</div><div style={styles.pill}>Total Changes: {normalized.length}</div><div style={styles.pill}>Users: {users}</div><div style={styles.pill}>Filter: Last 24 Hours</div>{filters?.mode ? <div style={styles.pill}>API: {String(filters.mode)}</div> : null}
        </div>
        {error ? <div style={styles.error}>{error}</div> : null}
        <div style={styles.scroller}>
          <table style={styles.table}>
            <thead><tr>{COLUMNS.map(([key, label, width]) => <th key={key} style={{...styles.th, minWidth: width}}>{label}</th>)}<th style={{...styles.th, minWidth: 170}}>Last Changed At</th><th style={{...styles.th, minWidth: 160}}>Last Updated By</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={COLUMNS.length + 2} style={styles.empty}>Loading last 24 hours history...</td></tr> : null}
              {!loading && !rows.length ? <tr><td colSpan={COLUMNS.length + 2} style={styles.empty}>No history found in the last 24 hours.</td></tr> : null}
              {!loading && rows.map((row) => <tr key={row.historyRowId}>
                {COLUMNS.map(([key]) => {
                  const change = row.changedMap[key];
                  const changed = Boolean(change?.items?.length);
                  const visible = changed && change.latestValue !== null && change.latestValue !== undefined && change.latestValue !== "" ? change.latestValue : value(row.snapshot, key);
                  const tipItems = [...(change?.items || [])].sort((a,b) => timeMs(b.timestamp) - timeMs(a.timestamp));
                  return <td key={`${row.historyRowId}-${key}`} style={{...styles.td, ...(changed ? styles.changed : {})}} onMouseEnter={(e) => { if (!changed) return; const r=e.currentTarget.getBoundingClientRect(); setTooltip({ x: r.right + 10, y: r.top + 4, key, items: tipItems }); }} onMouseLeave={() => setTooltip(null)}>{changed ? <span style={styles.dot}/> : null}{display(visible)}</td>;
                })}
                <td style={styles.td}>{fmt(row.latestTimestamp)}</td><td style={styles.td}>{row.latestActorName}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {tooltip ? <div style={{...styles.tooltip, left: Math.min(tooltip.x, window.innerWidth - 560), top: Math.min(tooltip.y, window.innerHeight - 280)}}><strong>{tooltip.key}</strong>{tooltip.items.map((it, i) => <div key={`${it.timestamp}-${i}`} style={{borderTop: "1px solid rgba(255,255,255,.15)", marginTop: 8, paddingTop: 8}}><div>{i+1}. {fmt(it.timestamp)} • {it.actorName}</div><div><b>Previous:</b> {display(it.before)}</div><div><b>Changed To:</b> {display(it.after)}</div></div>)}</div> : null}
      </div>
    </div>
  );
}
