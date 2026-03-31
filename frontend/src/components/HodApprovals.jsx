import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

const POLL_MS = 15000;

const styles = {
  page: {
    padding: "24px",
    fontFamily: "'Calibri', sans-serif",
    color: "#333",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    border: "1px solid #eef0f3",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
  },
  countBadge: {
    minWidth: "32px",
    height: "32px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    padding: "0 10px",
  },
  refreshBtn: {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    background: "#111827",
    color: "#ffffff",
    padding: "12px 10px",
    textAlign: "center",
    border: "1px solid #111827",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px",
    border: "1px solid #111827",
    textAlign: "center",
    verticalAlign: "middle",
  },
  actionGroup: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  approveBtn: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  rejectBtn: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    minWidth: "180px",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  statusPill: (bg, color = "#ffffff") => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  }),
  empty: {
    padding: "26px",
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "600",
  },
};

function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((entry) => String(entry || "").trim()).filter(Boolean))];
  }

  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((entry) => String(entry || "").trim()).filter(Boolean))];
      }
    } catch (error) {
      // fallback
    }
  }

  return [...new Set(raw.split(",").map((entry) => entry.trim()).filter(Boolean))];
}

function renderStatusPills(value) {
  const statuses = normalizeMultiValue(value);
  if (!statuses.length) return "--";

  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
      {statuses.map((status) => {
        let pillStyle = styles.statusPill("#e5e7eb", "#111827");
        if (status === "Tuition Done") pillStyle = styles.statusPill("#16a34a");
        else if (status === "1st Demo Done") pillStyle = styles.statusPill("#111827");
        else if (status === "2nd Demo Done") pillStyle = styles.statusPill("#8B4513");
        else if (status === "payment Process") pillStyle = styles.statusPill("#facc15", "#111827");
        return (
          <span key={status} style={pillStyle}>
            {status}
          </span>
        );
      })}
    </div>
  );
}

export default function HodApprovals({ me, onCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState({});

  const canManage = me?.role === "admin" || me?.role === "hod";
  const pendingCount = useMemo(() => items.length, [items]);

  async function loadRows({ silent = false } = {}) {
    if (!canManage) {
      setItems([]);
      setLoading(false);
      onCountChange?.(0);
      return;
    }

    if (!silent) setLoading(true);

    try {
      const { data } = await api.get("/tuitions/payment-approvals");
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setItems(nextItems);
      onCountChange?.(nextItems.length);
    } catch (error) {
      console.error("Failed to load HOD approvals:", error?.response?.data || error.message);
      onCountChange?.(0);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return undefined;

    const intervalId = window.setInterval(() => {
      loadRows({ silent: true });
    }, POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [canManage]);

  async function handleDecision(tuitionId, action) {
    try {
      setBusyId(tuitionId);

      await api.post(`/tuitions/${encodeURIComponent(tuitionId)}/payment-approval`, {
        action,
        reason: rejectionReasons[tuitionId] || "",
      });

      await loadRows({ silent: true });
    } catch (error) {
      console.error("Approval action failed:", error?.response?.data || error.message);
      alert(error?.response?.data?.message || "Failed to update approval status.");
    } finally {
      setBusyId("");
    }
  }

  if (!canManage) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.empty}>You do not have access to HOD approvals.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <h2 style={styles.title}>HOD Approvals</h2>
            <p style={styles.subtitle}>
              Jab kisi tuition ka status Tuition Done hota hai to woh pehle yahan aayega.
              Approve karne ke baad hi Payment Sheet mein record jayega.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {pendingCount > 0 && <span style={styles.countBadge}>{pendingCount}</span>}
            <button type="button" style={styles.refreshBtn} onClick={() => loadRows()}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : !items.length ? (
          <div style={styles.empty}>No pending approvals.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Tuition ID</th>
                  <th style={styles.th}>Tuition Name</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>OTM</th>
                  <th style={styles.th}>Tutor</th>
                  <th style={styles.th}>Fee</th>
                  <th style={styles.th}>Reject Reason</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isBusy = busyId === item.tuitionId;

                  return (
                    <tr key={item.tuitionId}>
                      <td style={styles.td}>{item.date || item.demoDate || "--"}</td>
                      <td style={styles.td}>{item.tuitionId || "--"}</td>
                      <td style={styles.td}>{item.tuitionName || "--"}</td>
                      <td style={styles.td}>{renderStatusPills(item.status)}</td>
                      <td style={styles.td}>{item.otmName || "--"}</td>
                      <td style={styles.td}>{item.tutorName || "--"}</td>
                      <td style={styles.td}>{item.estimatedFee || "--"}</td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          style={styles.input}
                          placeholder="Optional reject reason"
                          value={rejectionReasons[item.tuitionId] || ""}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [item.tuitionId]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button
                            type="button"
                            style={styles.approveBtn}
                            disabled={isBusy}
                            onClick={() => handleDecision(item.tuitionId, "approve")}
                          >
                            {isBusy ? "Please wait..." : "Approve"}
                          </button>

                          <button
                            type="button"
                            style={styles.rejectBtn}
                            disabled={isBusy}
                            onClick={() => handleDecision(item.tuitionId, "reject")}
                          >
                            {isBusy ? "Please wait..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}