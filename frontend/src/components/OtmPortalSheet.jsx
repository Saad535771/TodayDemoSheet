import React, { useEffect, useMemo, useRef, useState } from "react";

const COLUMNS = [
  { key: "day", label: "Day", width: 110 },
  { key: "time", label: "Time", width: 120 },
  { key: "tuitionName", label: "Tuition Name", width: 180 },
  { key: "groupName", label: "Group Name", width: 170 },
  { key: "classStartTime", label: "Class Start", width: 130 },
  { key: "classEndTime", label: "Class End", width: 130 },
  { key: "status", label: "Status", width: 140 },
  { key: "notes", label: "Notes", width: 220 },
];

const COLOR_OPTIONS = [
  { value: "", label: "None", bg: "#ffffff" },
  { value: "#fef3c7", label: "Yellow", bg: "#fef3c7" },
  { value: "#dcfce7", label: "Green", bg: "#dcfce7" },
  { value: "#dbeafe", label: "Blue", bg: "#dbeafe" },
  { value: "#fce7f3", label: "Pink", bg: "#fce7f3" },
  { value: "#ede9fe", label: "Purple", bg: "#ede9fe" },
];

const makeEmptyRow = () => ({
  day: "",
  time: "",
  tuitionName: "",
  groupName: "",
  classStartTime: "",
  classEndTime: "",
  status: "",
  notes: "",
});

function getDisplayName(user) {
  if (user?.name) return user.name;
  const prefix = user?.email?.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function aggregateReports(entries = []) {
  const byStatus = {};
  const byDay = {};

  entries.forEach((item) => {
    const status = (item.status || "Unknown").trim();
    const day = (item.day || "Unknown").trim();

    byStatus[status] = (byStatus[status] || 0) + 1;
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return {
    totalEntries: entries.length,
    byStatus,
    byDay,
  };
}

function aggregateTotalClass(entries = []) {
  const byTuition = {};

  entries.forEach((item) => {
    const tuition = (item.tuitionName || "Unknown").trim();
    byTuition[tuition] = (byTuition[tuition] || 0) + 1;
  });

  return {
    totalClasses: entries.length,
    byTuition,
  };
}

const styles = {
  page: {
    padding: "20px",
  },

  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    borderRadius: "22px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e7edf5",
    overflow: "hidden",
  },

  header: {
    padding: "20px 22px 16px",
    borderBottom: "1px solid #e7edf5",
    background: "#fff",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#163b68",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  tabsWrap: {
    display: "flex",
    gap: "4px",
    padding: "0 16px",
    borderBottom: "1px solid #e7edf5",
    overflowX: "auto",
    background: "#fff",
  },

  tabBtn: (active) => ({
    border: "none",
    borderBottom: active ? "3px solid #2563eb" : "3px solid transparent",
    background: "transparent",
    color: active ? "#2563eb" : "#475569",
    padding: "14px 16px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),

  body: {
    padding: "16px",
  },

  topNote: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "14px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "14px",
  },

  sheetWrap: {
    border: "1px solid #dbe4ee",
    borderRadius: "18px",
    background: "#fff",
    overflow: "hidden",
  },

  sheetViewport: {
    maxHeight: "68vh",
    overflow: "auto",
    background: "#fff",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "1500px",
    tableLayout: "fixed",
  },

  th: {
    position: "sticky",
    top: 0,
    zIndex: 8,
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    padding: "10px 8px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    whiteSpace: "nowrap",
    textAlign: "center",
  },

  addRowCell: {
    position: "sticky",
    top: 41,
    zIndex: 7,
    background: "#fefce8",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5edf5",
    padding: "4px",
  },

  td: {
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    padding: "4px",
    background: "#fff",
  },

  stickyIndexHead: {
    position: "sticky",
    left: 0,
    zIndex: 12,
    background: "#f1f5f9",
    width: "58px",
    minWidth: "58px",
    maxWidth: "58px",
  },

  stickyColorHead: {
    position: "sticky",
    left: 58,
    zIndex: 12,
    background: "#f1f5f9",
    width: "100px",
    minWidth: "100px",
    maxWidth: "100px",
  },

  stickyIndexCell: (isAddRow = false) => ({
    position: "sticky",
    left: 0,
    zIndex: isAddRow ? 11 : 6,
    background: isAddRow ? "#fefce8" : "#f8fafc",
    width: "58px",
    minWidth: "58px",
    maxWidth: "58px",
    textAlign: "center",
    fontWeight: "800",
    color: "#334155",
  }),

  stickyColorCell: (isAddRow = false, rowBg = "#fff") => ({
    position: "sticky",
    left: 58,
    zIndex: isAddRow ? 11 : 6,
    background: isAddRow ? "#fefce8" : rowBg,
    width: "100px",
    minWidth: "100px",
    maxWidth: "100px",
  }),

  cellInput: (active = false) => ({
    width: "100%",
    border: active ? "2px solid #2563eb" : "1px solid transparent",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    transition: "0.15s ease",
    boxSizing: "border-box",
  }),

  addBtn: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    borderRadius: "8px",
    padding: "10px 8px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  deleteBtn: {
    width: "100%",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: "8px",
    padding: "9px 8px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  select: {
    width: "100%",
    border: "1px solid #dbe4ee",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "12px",
    background: "#fff",
    outline: "none",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e7edf5",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },

  statTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "800",
    color: "#334155",
  },

  statNumber: {
    marginTop: "10px",
    fontSize: "34px",
    fontWeight: "900",
    color: "#1d4ed8",
  },

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "8px 0",
    borderBottom: "1px dashed #e2e8f0",
    fontSize: "14px",
    color: "#0f172a",
  },

  empty: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
  },
};

export default function OtmPortalSheet({
  user,
  userId,
  title = "Otm Management",
  subtitle,
  initialEntries = [],
  loading = false,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}) {
  const [tab, setTab] = useState("tuitions");
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(makeEmptyRow());
  const [savingRowId, setSavingRowId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [rowColors, setRowColors] = useState({});
  const cellRefs = useRef({});

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const reports = useMemo(() => aggregateReports(entries), [entries]);
  const totalClass = useMemo(() => aggregateTotalClass(entries), [entries]);

  const storageKey = useMemo(
    () => `otm-row-colors-${userId || user?.id || "self"}`,
    [userId, user]
  );

  useEffect(() => {
    setEntries(Array.isArray(initialEntries) ? initialEntries : []);
  }, [initialEntries]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setRowColors(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load row colors", err);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(rowColors));
    } catch (err) {
      console.error("Failed to save row colors", err);
    }
  }, [rowColors, storageKey]);

  const rowOrder = useMemo(() => ["draft", ...entries.map((item) => String(item.id))], [entries]);

  function setCellRef(rowKey, colKey, node) {
    cellRefs.current[`${rowKey}-${colKey}`] = node;
  }

  function focusCell(rowKey, colKey) {
    const el = cellRefs.current[`${rowKey}-${colKey}`];
    if (el) {
      el.focus();
      if (typeof el.select === "function") {
        el.select();
      }
      setActiveCell(`${rowKey}-${colKey}`);
    }
  }

  function moveFocus(rowKey, colIndex, rowDelta, colDelta) {
    const rowIndex = rowOrder.findIndex((r) => r === rowKey);
    if (rowIndex === -1) return;

    let nextRowIndex = rowIndex + rowDelta;
    let nextColIndex = colIndex + colDelta;

    if (nextColIndex < 0) nextColIndex = 0;
    if (nextColIndex > COLUMNS.length - 1) nextColIndex = COLUMNS.length - 1;
    if (nextRowIndex < 0) nextRowIndex = 0;
    if (nextRowIndex > rowOrder.length - 1) nextRowIndex = rowOrder.length - 1;

    const nextRowKey = rowOrder[nextRowIndex];
    const nextColKey = COLUMNS[nextColIndex].key;
    focusCell(nextRowKey, nextColKey);
  }

  function handleDraftChange(field, value) {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleEntryChange(id, field, value) {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function createDraftRow() {
    if (!onCreateEntry) return;

    const hasValue = Object.values(draft).some((value) => String(value || "").trim() !== "");
    if (!hasValue) return;

    try {
      setCreating(true);
      const created = await onCreateEntry(draft);
      if (created?.id) {
        setEntries((prev) => [created, ...prev]);
      } else {
        // fallback: if backend only returns success
        setEntries((prev) => [{ id: Date.now(), ...draft }, ...prev]);
      }
      setDraft(makeEmptyRow());
      setTimeout(() => focusCell("draft", COLUMNS[0].key), 30);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add row");
    } finally {
      setCreating(false);
    }
  }

  async function saveExistingRow(rowId) {
    if (!onUpdateEntry) return;
    const row = entries.find((item) => item.id === rowId);
    if (!row) return;

    try {
      setSavingRowId(rowId);
      const updated = await onUpdateEntry(rowId, row);
      if (updated?.id) {
        setEntries((prev) =>
          prev.map((item) => (item.id === rowId ? updated : item))
        );
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update row");
    } finally {
      setSavingRowId(null);
    }
  }

  async function removeRow(rowId) {
    if (!onDeleteEntry) return;
    if (!window.confirm("Delete this row?")) return;

    try {
      await onDeleteEntry(rowId);
      setEntries((prev) => prev.filter((item) => item.id !== rowId));
      setTimeout(() => focusCell("draft", COLUMNS[0].key), 30);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete row");
    }
  }

  function handleKeyDown(e, rowKey, colIndex, rowId = null) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(rowKey, colIndex, 0, 1);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(rowKey, colIndex, 0, -1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(rowKey, colIndex, 1, 0);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(rowKey, colIndex, -1, 0);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (rowKey === "draft") {
        if (colIndex === COLUMNS.length - 1) {
          createDraftRow();
        } else {
          moveFocus(rowKey, colIndex, 0, 1);
        }
        return;
      }

      if (rowId) {
        saveExistingRow(rowId);
        moveFocus(rowKey, colIndex, 1, 0);
      }
      return;
    }

    if (e.key === "Delete" && rowId && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      removeRow(rowId);
    }
  }

  function updateRowColor(rowId, color) {
    setRowColors((prev) => ({
      ...prev,
      [rowId]: color,
    }));
  }

  if (loading) {
    return <div style={styles.empty}>Loading OTM portal...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>{subtitle || `Logged in as ${displayName}`}</p>
        </div>

        <div style={styles.tabsWrap}>
          <button
            style={styles.tabBtn(tab === "tuitions")}
            onClick={() => setTab("tuitions")}
          >
            {displayName} Tuitions
          </button>

          <button
            style={styles.tabBtn(tab === "reports")}
            onClick={() => setTab("reports")}
          >
            Reports
          </button>

          <button
            style={styles.tabBtn(tab === "totalClass")}
            onClick={() => setTab("totalClass")}
          >
            Total Class
          </button>
        </div>

        <div style={styles.body}>
          {tab === "tuitions" && (
            <>

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, ...styles.stickyIndexHead }}>#</th>
                        <th style={{ ...styles.th, ...styles.stickyColorHead }}>Color</th>

                        {COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            style={{
                              ...styles.th,
                              width: col.width,
                              minWidth: col.width,
                              maxWidth: col.width,
                            }}
                          >
                            {col.label}
                          </th>
                        ))}

                        <th style={{ ...styles.th, width: 110 }}>Action</th>
                      </tr>

                      <tr>
                        <td style={{ ...styles.addRowCell, ...styles.stickyIndexCell(true) }}>
                          New
                        </td>

                        <td style={{ ...styles.addRowCell, ...styles.stickyColorCell(true) }}>
                          <select style={styles.select} disabled>
                            <option>Draft</option>
                          </select>
                        </td>

                        {COLUMNS.map((col, colIndex) => (
                          <td
                            key={col.key}
                            style={{
                              ...styles.addRowCell,
                              width: col.width,
                              minWidth: col.width,
                              maxWidth: col.width,
                            }}
                          >
                            <input
                              ref={(node) => setCellRef("draft", col.key, node)}
                              style={styles.cellInput(activeCell === `draft-${col.key}`)}
                              value={draft[col.key]}
                              onChange={(e) => handleDraftChange(col.key, e.target.value)}
                              onFocus={() => setActiveCell(`draft-${col.key}`)}
                              onKeyDown={(e) => handleKeyDown(e, "draft", colIndex)}
                              placeholder={col.label}
                            />
                          </td>
                        ))}

                        <td style={styles.addRowCell}>
                          <button
                            type="button"
                            style={styles.addBtn}
                            onClick={createDraftRow}
                            disabled={creating}
                          >
                            {creating ? "Adding..." : "Add Row"}
                          </button>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      {entries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={COLUMNS.length + 3}
                            style={{ padding: "24px", textAlign: "center", color: "#64748b" }}
                          >
                            No entries found.
                          </td>
                        </tr>
                      ) : (
                        entries.map((row, rowIndex) => {
                          const rowBg = rowColors[row.id] || "#ffffff";

                          return (
                            <tr key={row.id} style={{ background: rowBg }}>
                              <td style={{ ...styles.td, ...styles.stickyIndexCell(false) }}>
                                {rowIndex + 1}
                              </td>

                              <td
                                style={{
                                  ...styles.td,
                                  ...styles.stickyColorCell(false, rowBg),
                                }}
                              >
                                <select
                                  style={styles.select}
                                  value={rowColors[row.id] || ""}
                                  onChange={(e) => updateRowColor(row.id, e.target.value)}
                                >
                                  {COLOR_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {COLUMNS.map((col, colIndex) => (
                                <td
                                  key={col.key}
                                  style={{
                                    ...styles.td,
                                    background: rowBg,
                                    width: col.width,
                                    minWidth: col.width,
                                    maxWidth: col.width,
                                  }}
                                >
                                  <input
                                    ref={(node) => setCellRef(String(row.id), col.key, node)}
                                    style={styles.cellInput(
                                      activeCell === `${row.id}-${col.key}`
                                    )}
                                    value={row[col.key] || ""}
                                    onChange={(e) =>
                                      handleEntryChange(row.id, col.key, e.target.value)
                                    }
                                    onFocus={() => setActiveCell(`${row.id}-${col.key}`)}
                                    onBlur={() => saveExistingRow(row.id)}
                                    onKeyDown={(e) =>
                                      handleKeyDown(e, String(row.id), colIndex, row.id)
                                    }
                                  />
                                </td>
                              ))}

                              <td style={{ ...styles.td, background: rowBg }}>
                                <button
                                  type="button"
                                  style={styles.deleteBtn}
                                  onClick={() => removeRow(row.id)}
                                >
                                  {savingRowId === row.id ? "Saving..." : "Delete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "reports" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>Total Entries</h3>
                <div style={styles.statNumber}>{reports.totalEntries || 0}</div>
              </div>

              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>By Status</h3>
                {Object.keys(reports.byStatus || {}).length === 0 ? (
                  <div style={{ marginTop: 12, color: "#64748b" }}>No report data</div>
                ) : (
                  Object.entries(reports.byStatus).map(([key, value]) => (
                    <div key={key} style={styles.listItem}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>By Day</h3>
                {Object.keys(reports.byDay || {}).length === 0 ? (
                  <div style={{ marginTop: 12, color: "#64748b" }}>No day data</div>
                ) : (
                  Object.entries(reports.byDay).map(([key, value]) => (
                    <div key={key} style={styles.listItem}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "totalClass" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>Total Classes</h3>
                <div style={{ ...styles.statNumber, color: "#16a34a" }}>
                  {totalClass.totalClasses || 0}
                </div>
              </div>

              <div style={styles.statCard}>
                <h3 style={styles.statTitle}>Classes By Tuition</h3>
                {Object.keys(totalClass.byTuition || {}).length === 0 ? (
                  <div style={{ marginTop: 12, color: "#64748b" }}>No class data</div>
                ) : (
                  Object.entries(totalClass.byTuition).map(([key, value]) => (
                    <div key={key} style={styles.listItem}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}