import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";
const PAGE_SIZE = 100;
const styles = {
  page: {
    background: "#f4f6f8",
    minHeight: "100vh",
    padding: "0",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  container: {
    background: "#ffffff",
    border: "1px solid #111",
    borderRadius: "0",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    background: "#111827",
    color: "#fff",
    borderBottom: "1px solid #111",
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
    fontWeight: "800",
    letterSpacing: "0.2px",
  },
  countBadge: {
    background: "#000",
    border: "1px solid #374151",
    color: "#fff",
    padding: "3px 7px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "700",
  },
  selectedBadge: {
    background: "#1d4ed8",
    border: "1px solid #1e40af",
    color: "#fff",
    padding: "3px 7px",
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
  btn: {
    border: "1px solid #111",
    borderRadius: "4px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
    lineHeight: "1",
    whiteSpace: "nowrap",
  },
  btnRefresh: {
    background: "#ffffff",
    color: "#111827",
  },
  btnRestore: {
    background: "#16a34a",
    color: "#fff",
  },
  btnDelete: {
    background: "#dc2626",
    color: "#fff",
  },
  btnDeleteAll: {
    background: "#7f1d1d",
    color: "#fff",
  },
  btnMuted: {
    background: "#e5e7eb",
    color: "#111827",
  },
  disabledBtn: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  tableWrap: {
    width: "100%",
    maxHeight: "calc(100vh - 88px)",
    overflow: "auto",
    background: "#fff",
  },
  table: {
    borderCollapse: "collapse",
    tableLayout: "fixed",
    minWidth: "1680px",
    width: "100%",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#111827",
    color: "#fff",
    border: "1px solid #111",
    padding: "5px 4px",
    fontSize: "9px",
    fontWeight: "800",
    textAlign: "center",
    whiteSpace: "nowrap",
    lineHeight: "1.1",
  },
  td: {
    border: "1px solid #111",
    padding: "4px 4px",
    fontSize: "8px",
    color: "#111827",
    verticalAlign: "middle",
    textAlign: "center",
    wordBreak: "break-word",
    background: "#ffffff",
    lineHeight: "1.15",
    height: "30px",
  },
  selectedRow: {
    background: "#ecfdf5",
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
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "58px",
    maxWidth: "100%",
    padding: "3px 6px",
    borderRadius: "4px",
    fontSize: "7px",
    fontWeight: "800",
    lineHeight: "1",
    border: "1px solid #111",
    whiteSpace: "nowrap",
  },
  statusDone: {
    background: "#111",
    color: "#fff",
  },
  ratingAverage: {
    background: "#f59e0b",
    color: "#fff",
    borderColor: "#b45309",
  },
  sourceMahad: {
    background: "#0ea5e9",
    color: "#fff",
    borderColor: "#0284c7",
  },
  redCell: {
    background: "#dc0000",
    color: "#fff",
  },
  actionBox: {
    display: "flex",
    justifyContent: "center",
    gap: "4px",
    flexWrap: "nowrap",
  },
  miniBtn: {
    border: "1px solid #111",
    borderRadius: "3px",
    padding: "4px 6px",
    fontSize: "8px",
    fontWeight: "800",
    cursor: "pointer",
    lineHeight: "1",
  },
  emptyState: {
    textAlign: "center",
    padding: "20px 10px",
    color: "#6b7280",
    background: "#fff",
  },
  loading: {
    padding: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },
  footer: {
    padding: "6px 8px",
    background: "#f3f4f6",
    borderTop: "1px solid #111",
    fontSize: "10px",
    color: "#111827",
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
  },
};

const columnWidths = {
  select: 30,
  date: 95,
  time: 100,
  tuitionName: 95,
  status: 105,
  blank: 95,
  estimatedFee: 80,
  tutorName: 90,
  tutorFee: 80,
  rejectedTutor: 120,
  feedback: 240,
  country: 90,
  otmName: 70,
  className: 90,
  subjects: 80,
  daysPerWeek: 75,
  source: 100,
  demoDate: 95,
  parentsContact: 105,
  demoRating: 110,
  tuitionId: 70,
  syncFlag: 45,
  actions: 105,
};

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function formatTime(value, fallbackHour) {
  if (value) {
    const raw = String(value).trim();
    const match24 = raw.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      let hours = Number(match24[1]);
      const minutes = match24[2];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return raw;
  }

  if (fallbackHour === null || fallbackHour === undefined || fallbackHour === "") return "-";
  const hourNumber = Number(fallbackHour);
  if (!Number.isFinite(hourNumber)) return fallbackHour;
  const ampm = hourNumber >= 12 ? "PM" : "AM";
  const hours = hourNumber % 12 || 12;
  return `${String(hours).padStart(2, "0")}:00 ${ampm}`;
}

function getStatusStyle(status) {
  if (status === "1st Demo Done") return { ...styles.badge, ...styles.statusDone };
  if (status === "2nd Demo Done") return { ...styles.badge, background: "#7c2d12", color: "#fff" };
  if (status === "Tuition Done") return { ...styles.badge, background: "#15803d", color: "#fff" };
  if (status === "Tuition Cancelled") return { ...styles.badge, background: "#dc2626", color: "#fff" };
  if (status === "Pending") return { ...styles.badge, background: "#2563eb", color: "#fff" };
  return styles.badge;
}

function getRatingStyle(rating) {
  if (rating === "Average Demo") return { ...styles.badge, ...styles.ratingAverage };
  if (rating === "Strong Demo") return { ...styles.badge, background: "#16a34a", color: "#fff" };
  if (rating === "Weak Demo") return { ...styles.badge, background: "#dc2626", color: "#fff" };
  return styles.badge;
}

function getSourceStyle(source) {
  if (source === "mahad") return { ...styles.badge, ...styles.sourceMahad };
  if (source === "areeba") return { ...styles.badge, background: "#ec4899", color: "#fff" };
  if (source === "sibgha") return { ...styles.badge, background: "#14b8a6", color: "#fff" };
  return styles.badge;
}

function getButtonStyle(baseStyle, disabled = false) {
  return {
    ...styles.btn,
    ...baseStyle,
    ...(disabled ? styles.disabledBtn : {}),
  };
}

export default function MonthlyTrashBin() {
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const tableWrapRef = useRef(null);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const selectedCount = selectedIds.size;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.id));

  useEffect(() => {
    fetchTrash();
  }, []);

  function cleanSelection(nextItems) {
    const validIds = new Set(nextItems.map((item) => item.id));
    setSelectedIds((prev) => {
      const next = new Set();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }

  async function fetchTrash() {
    try {
      setLoading(true);
      const res = await api.get("/tuitions/trash");
      const nextItems = Array.isArray(res.data) ? res.data : [];
      setItems(nextItems);
      setVisibleCount(PAGE_SIZE);
      cleanSelection(nextItems);
    } catch (err) {
      console.error("Failed to load trash", err);
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

  function toggleVisible() {
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

  function clearSelected() {
    setSelectedIds(new Set());
  }

  async function restoreByIds(ids) {
    for (const id of ids) {
      await api.put(`/tuitions/${id}/restore`);
    }
  }

  async function deleteByIds(ids) {
    for (const id of ids) {
      await api.delete(`/tuitions/${id}/force`);
    }
  }

  async function handleRestore(id) {
    try {
      setActionLoading(true);
      await restoreByIds([id]);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore item");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleForceDelete(id) {
    const ok = window.confirm(
      "⚠️ Are you sure?\n\nThis record will be permanently deleted."
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await deleteByIds([id]);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete permanently");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkRestore() {
    if (selectedCount === 0) return;

    const ok = window.confirm(`Restore ${selectedCount} selected record(s)?`);
    if (!ok) return;

    try {
      setActionLoading(true);
      const ids = selectedItems.map((item) => item.id);
      await restoreByIds(ids);
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      clearSelected();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore selected records");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedCount === 0) return;

    const ok = window.confirm(
      `⚠️ Permanently delete ${selectedCount} selected record(s)?\n\nThis action cannot be undone.`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      const ids = selectedItems.map((item) => item.id);
      await deleteByIds(ids);
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      clearSelected();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete selected records");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAll() {
    if (items.length === 0) return;

    const ok = window.confirm(
      `⚠️ Delete ALL ${items.length} trash record(s) permanently?\n\nThis action cannot be undone.`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      const ids = items.map((item) => item.id);
      await deleteByIds(ids);
      setItems([]);
      clearSelected();
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete all records");
      await fetchTrash();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading Recycle Bin...</div>;
  }

  const actionDisabled = actionLoading || items.length === 0;
  const selectedDisabled = actionLoading || selectedCount === 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <h2 style={styles.title}>🗑 Recycle Bin For Monthly Tuition Sheet</h2>
            <span style={styles.countBadge}>Total: {items.length}</span>
            <span style={styles.countBadge}>Showing: {visibleItems.length}</span>
            <span style={styles.selectedBadge}>Selected: {selectedCount}</span>
          </div>

          <div style={styles.toolbar}>
            <button
              onClick={fetchTrash}
              disabled={actionLoading}
              style={getButtonStyle(styles.btnRefresh, actionLoading)}
            >
              Refresh
            </button>

            <button
              onClick={toggleVisible}
              disabled={actionDisabled}
              style={getButtonStyle(styles.btnMuted, actionDisabled)}
            >
              {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
            </button>

            <button
              onClick={clearSelected}
              disabled={selectedDisabled}
              style={getButtonStyle(styles.btnMuted, selectedDisabled)}
            >
              Clear
            </button>

            <button
              onClick={handleBulkRestore}
              disabled={selectedDisabled}
              style={getButtonStyle(styles.btnRestore, selectedDisabled)}
            >
              Restore Selected
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={selectedDisabled}
              style={getButtonStyle(styles.btnDelete, selectedDisabled)}
            >
              Delete Selected
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={actionDisabled}
              style={getButtonStyle(styles.btnDeleteAll, actionDisabled)}
            >
              Delete All
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>Trash is Empty</h3>
            <p>Deleted tuitions will appear here.</p>
          </div>
        ) : (
          <>
            <div
              ref={tableWrapRef}
              style={styles.tableWrap}
              onScroll={handleScroll}
            >
              <table style={styles.table}>
                <colgroup>
                  <col style={{ width: columnWidths.select }} />
                  <col style={{ width: columnWidths.date }} />
                  <col style={{ width: columnWidths.time }} />
                  <col style={{ width: columnWidths.tuitionName }} />
                  <col style={{ width: columnWidths.status }} />
                  <col style={{ width: columnWidths.blank }} />
                  <col style={{ width: columnWidths.estimatedFee }} />
                  <col style={{ width: columnWidths.tutorName }} />
                  <col style={{ width: columnWidths.tutorFee }} />
                  <col style={{ width: columnWidths.rejectedTutor }} />
                  <col style={{ width: columnWidths.feedback }} />
                  <col style={{ width: columnWidths.country }} />
                  <col style={{ width: columnWidths.otmName }} />
                  <col style={{ width: columnWidths.className }} />
                  <col style={{ width: columnWidths.subjects }} />
                  <col style={{ width: columnWidths.daysPerWeek }} />
                  <col style={{ width: columnWidths.source }} />
                  <col style={{ width: columnWidths.demoDate }} />
                  <col style={{ width: columnWidths.parentsContact }} />
                  <col style={{ width: columnWidths.demoRating }} />
                  <col style={{ width: columnWidths.tuitionId }} />
                  <col style={{ width: columnWidths.syncFlag }} />
                  <col style={{ width: columnWidths.actions }} />
                </colgroup>

                <thead>
                  <tr>
                    <th style={styles.th}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleVisible}
                        style={styles.checkbox}
                      />
                    </th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Tuition</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Rejected</th>
                    <th style={styles.th}>Est. Fee</th>
                    <th style={styles.th}>Tutor</th>
                    <th style={styles.th}>Tutor Fee</th>
                    <th style={styles.th}>Rejected Tutor</th>
                    <th style={styles.th}>Feedback</th>
                    <th style={styles.th}>Country</th>
                    <th style={styles.th}>OTM</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Days</th>
                    <th style={styles.th}>Source</th>
                    <th style={styles.th}>Demo Date</th>
                    <th style={styles.th}>Parent Contact</th>
                    <th style={styles.th}>Demo Rating</th>
                    <th style={styles.th}>Tuition ID</th>
                    <th style={styles.th}>Sync</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.map((item) => {
                    const selected = selectedIds.has(item.id);

                    return (
                      <tr key={item.id}>
                        <td
                          style={{
                            ...styles.td,
                            ...(selected ? styles.selectedRow : {}),
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOne(item.id)}
                            style={styles.checkbox}
                          />
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {formatDate(item.date)}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {formatTime(item.demoTime, item.timeHour)}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          <span style={styles.tuitionName}>{item.tuitionName || "-"}</span>
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          <span style={getStatusStyle(item.status)}>{item.status || "-"}</span>
                        </td>

                        <td style={{ ...styles.td, ...styles.redCell }}>
                          {item.rejectedTutor ? item.rejectedTutor : ""}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.estimatedFee || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.tutorName || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.tutorFee || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.rejectedTutor || ""}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.feedback || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.country || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.otmName || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.className || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.subjects || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.daysPerWeek || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          <span style={getSourceStyle(item.source)}>{item.source || "-"}</span>
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {formatDate(item.demoDate)}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.parentsContact || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          <span style={getRatingStyle(item.demoRating)}>
                            {item.demoRating || "-"}
                          </span>
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.tuitionId || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          {item.syncFlag || "-"}
                        </td>

                        <td style={{ ...styles.td, ...(selected ? styles.selectedRow : {}) }}>
                          <div style={styles.actionBox}>
                            <button
                              style={{
                                ...styles.miniBtn,
                                ...styles.btnRestore,
                                ...(actionLoading ? styles.disabledBtn : {}),
                              }}
                              disabled={actionLoading}
                              onClick={() => handleRestore(item.id)}
                            >
                              Res
                            </button>
                            <button
                              style={{
                                ...styles.miniBtn,
                                ...styles.btnDelete,
                                ...(actionLoading ? styles.disabledBtn : {}),
                              }}
                              disabled={actionLoading}
                              onClick={() => handleForceDelete(item.id)}
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
                Scroll down to load more records. {PAGE_SIZE} records load per batch.
              </span>
              <span>
                Showing {visibleItems.length} of {items.length}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
