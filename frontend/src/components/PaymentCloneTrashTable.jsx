import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";
const PAGE_SIZE = 100;
const styles = {
  container: {
    background: "#ffffff",
    border: "1px solid #111827",
    borderRadius: "6px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontFamily: "'Calibri', 'Arial', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    background: "#d19d00",
    color: "#fff",
    borderBottom: "1px solid #111827",
    gap: "8px",
    flexWrap: "wrap",
  },
  titleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.2px",
  },
  countBadge: {
    background: "#797979",
    border: "1px solid #475569",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "700",
  },
  selectedBadge: {
    background: "#1d4ed8",
    border: "1px solid #60a5fa",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "700",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  actionBtn: {
    color: "#fff",
    border: "1px solid transparent",
    padding: "5px 9px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "700",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  },
  refreshBtn: {
    background: "#1f2937",
    borderColor: "#4b5563",
  },
  restoreBtn: {
    background: "#16a34a",
    borderColor: "#166534",
  },
  deleteBtn: {
    background: "#dc2626",
    borderColor: "#7f1d1d",
  },
  deleteAllBtn: {
    background: "#991b1b",
    borderColor: "#450a0a",
  },
  disabledBtn: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  tableWrap: {
    width: "100%",
    overflow: "auto",
    background: "#fff",
    maxHeight: "calc(100vh - 165px)",
  },
  table: {
    minWidth: "1710px",
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#eaf2ff",
    color: "#111827",
    border: "1px solid #111827",
    padding: "4px 5px",
    fontSize: "10px",
    fontWeight: "700",
    textAlign: "center",
    whiteSpace: "nowrap",
    height: "25px",
  },
  td: {
    border: "1px solid #111827",
    padding: "3px 5px",
    fontSize: "9px",
    color: "#111827",
    verticalAlign: "middle",
    textAlign: "center",
    wordBreak: "break-word",
    background: "#ffffff",
    height: "25px",
    lineHeight: 1.15,
  },
  checkCell: {
    width: "30px",
    minWidth: "30px",
    maxWidth: "30px",
  },
  checkbox: {
    width: "13px",
    height: "13px",
    cursor: "pointer",
    margin: 0,
  },
  tuitionName: {
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    display: "inline-block",
    padding: "3px 7px",
    minWidth: "72px",
    borderRadius: "4px",
    background: "#111827",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  smallBadge: {
    display: "inline-block",
    padding: "3px 6px",
    borderRadius: "999px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  moneyText: {
    fontWeight: "700",
    color: "#111827",
  },
  rowActions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
  },
  miniRestore: {
    background: "#16a34a",
    color: "#fff",
    border: "1px solid #166534",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "8px",
    fontWeight: "700",
    padding: "4px 6px",
    whiteSpace: "nowrap",
  },
  miniDelete: {
    background: "#dc2626",
    color: "#fff",
    border: "1px solid #7f1d1d",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "8px",
    fontWeight: "700",
    padding: "4px 6px",
    whiteSpace: "nowrap",
  },
  emptyState: {
    textAlign: "center",
    padding: "30px 20px",
    color: "#6b7280",
    background: "#fff",
  },
  loading: {
    padding: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    padding: "6px 10px",
    background: "#f8fafc",
    borderTop: "1px solid #cbd5e1",
    color: "#475569",
    fontSize: "10px",
    fontWeight: "700",
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

function renderValue(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function getStatusStyle(status) {
  switch (String(status || "").trim()) {
    case "Paid":
    case "Received":
    case "Completed":
      return { background: "#16a34a", color: "#fff" };
    case "Pending":
      return { background: "#2563eb", color: "#fff" };
    case "Unpaid":
    case "Rejected":
      return { background: "#dc2626", color: "#fff" };
    case "Partial":
      return { background: "#ca8a04", color: "#fff" };
    default:
      return { background: "#111827", color: "#fff" };
  }
}

export default function PaymentCloneTrashTable({ onCountChange, isActive = true }) {
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    fetchTrash();
  }, [isActive]);

  useEffect(() => {
    if (typeof onCountChange === "function") {
      onCountChange(items.length);
    }
  }, [items.length, onCountChange]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.id));

  async function fetchTrash() {
    try {
      setLoading(true);
      const res = await api.get("/payments-clone/trash/all");
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      setSelectedIds(new Set());
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load payment clone trash", err);
      setItems([]);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }

  function handleScroll(e) {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;

    if (nearBottom && visibleCount < items.length) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
    }
  }

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allVisibleSelected) {
        visibleItems.forEach((item) => next.delete(item.id));
      } else {
        visibleItems.forEach((item) => next.add(item.id));
      }

      return next;
    });
  }

  async function runBulkAction({ ids, action, confirmMessage }) {
    if (!ids.length || busy) return;

    const ok = window.confirm(confirmMessage);
    if (!ok) return;

    try {
      setBusy(true);

      for (const id of ids) {
        if (action === "restore") {
          await api.put(`/payments-clone/trash/${id}/restore`);
        } else if (action === "delete") {
          await api.delete(`/payments-clone/trash/${id}/force`);
        }
      }

      setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Bulk action failed. Please try again.");
      await fetchTrash();
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(id) {
    await runBulkAction({
      ids: [id],
      action: "restore",
      confirmMessage: "Restore this payment trash record?",
    });
  }

  async function handleForceDelete(id) {
    await runBulkAction({
      ids: [id],
      action: "delete",
      confirmMessage:
        "⚠️ Are you sure?\n\nThis payment trash record will be permanently deleted.",
    });
  }

  async function handleRestoreSelected() {
    await runBulkAction({
      ids: Array.from(selectedIds),
      action: "restore",
      confirmMessage: `Restore ${selectedCount} selected payment record(s)?`,
    });
  }

  async function handleDeleteSelected() {
    await runBulkAction({
      ids: Array.from(selectedIds),
      action: "delete",
      confirmMessage:
        `⚠️ Are you sure?\n\n${selectedCount} selected payment record(s) will be permanently deleted.`,
    });
  }

  async function handleDeleteAll() {
    await runBulkAction({
      ids: items.map((item) => item.id),
      action: "delete",
      confirmMessage:
        `⚠️ DELETE ALL?\n\nAll ${items.length} payment trash record(s) will be permanently deleted. This cannot be undone.`,
    });
  }

  const toolbarButton = (style, disabled = false) => ({
    ...styles.actionBtn,
    ...style,
    ...(disabled ? styles.disabledBtn : {}),
  });

  if (loading) {
    return <div style={styles.loading}>Loading Payment Sheet trash...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h2 style={styles.title}>🗑 Recycle Bin For Payment Sheet With Date</h2>
          <span style={styles.countBadge}>Total: {items.length}</span>
          <span style={styles.selectedBadge}>Selected: {selectedCount}</span>
        </div>

        <div style={styles.toolbar}>
          <button
            onClick={fetchTrash}
            style={toolbarButton(styles.refreshBtn, busy)}
            disabled={busy}
          >
            Refresh
          </button>

          <button
            onClick={handleRestoreSelected}
            style={toolbarButton(styles.restoreBtn, busy || selectedCount === 0)}
            disabled={busy || selectedCount === 0}
          >
            Restore Selected
          </button>

          <button
            onClick={handleDeleteSelected}
            style={toolbarButton(styles.deleteBtn, busy || selectedCount === 0)}
            disabled={busy || selectedCount === 0}
          >
            Delete Selected
          </button>

          <button
            onClick={handleDeleteAll}
            style={toolbarButton(styles.deleteAllBtn, busy || items.length === 0)}
            disabled={busy || items.length === 0}
          >
            Delete All
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>Trash is Empty</h3>
          <p>Deleted payment rows will appear here.</p>
        </div>
      ) : (
        <>
          <div style={styles.tableWrap} onScroll={handleScroll}>
            <table style={styles.table}>
              <colgroup>
                <col style={{ width: "32px" }} />
                <col style={{ width: "55px" }} />
                <col style={{ width: "78px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "95px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "85px" }} />
                <col style={{ width: "85px" }} />
                <col style={{ width: "85px" }} />
                <col style={{ width: "95px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "95px" }} />
                <col style={{ width: "140px" }} />
              </colgroup>

              <thead>
                <tr>
                  <th style={{ ...styles.th, ...styles.checkCell }}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={allVisibleSelected}
                      onChange={toggleSelectVisible}
                      title="Select visible records"
                    />
                  </th>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Tuition Name</th>
                  <th style={styles.th}>Students</th>
                  <th style={styles.th}>Country</th>
                  <th style={styles.th}>Subjects</th>
                  <th style={styles.th}>Tutor Name</th>
                  <th style={styles.th}>Tutor Fee</th>
                  <th style={styles.th}>LACAS Share</th>
                  <th style={styles.th}>Total Fee</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Feedback</th>
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}>Deleted At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item, index) => {
                  const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
                  const statusStyle = getStatusStyle(item.status);

                  return (
                    <tr key={item.id}>
                      <td style={{ ...styles.td, ...styles.checkCell, background: rowBg }}>
                        <input
                          type="checkbox"
                          style={styles.checkbox}
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleOne(item.id)}
                        />
                      </td>

                      <td style={{ ...styles.td, background: rowBg }}>{item.id}</td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        {formatDate(item.date || item.paymentDate)}
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <span style={styles.tuitionName}>{renderValue(item.tuitionName)}</span>
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <span style={styles.smallBadge}>{renderValue(item.totalStudents)}</span>
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>{renderValue(item.country)}</td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        {renderValue(item.subjects || item.className)}
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>{renderValue(item.tutorName)}</td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <span style={styles.moneyText}>
                          {renderValue(item.tutorFee ?? item.tutorShare)}
                        </span>
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <span style={styles.moneyText}>{renderValue(item.lacasShare)}</span>
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <span style={styles.moneyText}>{renderValue(item.totalFees)}</span>
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <span style={{ ...styles.statusBadge, ...statusStyle }}>
                          {renderValue(item.status)}
                        </span>
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>{renderValue(item.feedback)}</td>
                      <td style={{ ...styles.td, background: rowBg }}>{renderValue(item.notes)}</td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        {formatDateTime(item.createdAt || item.created_at)}
                      </td>
                      <td style={{ ...styles.td, background: rowBg }}>
                        <div style={styles.rowActions}>
                          <button
                            onClick={() => handleRestore(item.id)}
                            style={styles.miniRestore}
                            disabled={busy}
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleForceDelete(item.id)}
                            style={styles.miniDelete}
                            disabled={busy}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={styles.footer}>
            <span>
              Showing {visibleItems.length} of {items.length} records
            </span>
            <span>
              Scroll down to load next {PAGE_SIZE} records automatically
            </span>
          </div>
        </>
      )}
    </div>
  );
}