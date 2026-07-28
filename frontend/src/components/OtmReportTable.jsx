import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE_URL) ||
  "http://localhost:5005/api";

export const REPORT_STATUS_OPTIONS = [
  { value: "report pending", label: "Report Pending" },
  { value: "report shared", label: "Report Shared" },
];

export function getStatusStyle(status = "") {
  const norm = String(status || "").toLowerCase().trim();
  if (norm === "report shared") {
    return {
      bg: "#dcfce7",
      color: "#166534",
      border: "#86efac",
      label: "Report Shared",
    };
  }
  return {
    bg: "#fef3c7",
    color: "#92400e",
    border: "#fde68a",
    label: "Report Pending",
  };
}

function normalizeList(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .flatMap((item) => normalizeList(item, depth + 1))
          .map((item) => String(item).trim())
          .filter(Boolean)
      ),
    ];
  }

  if (typeof value === "object") {
    return normalizeList(Object.values(value), depth + 1);
  }

  const text = String(value).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (parsed !== text) return normalizeList(parsed, depth + 1);
  } catch {
    // Plain comma-separated text is supported below.
  }

  const cleaned = text
    .replace(/\\"/g, '"')
    .replace(/^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g, "")
    .trim();

  if (!cleaned) return [];

  return [
    ...new Set(
      cleaned
        .split(/[,|\n]+/)
        .map((item) =>
          item
            .replace(/\\"/g, '"')
            .replace(/^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g, "")
            .trim()
        )
        .filter(Boolean)
    ),
  ];
}

function normalizeReportRow(row = {}) {
  return {
    ...row,
    groupName: normalizeList(row.groupName ?? row.group_name),
    tutorName: normalizeList(row.tutorName ?? row.tutor_name),
    reportStatus: row.reportStatus || row.report_status || "report pending",
    rowColor: row.rowColor || row.row_color || "",
  };
}

// tuition_reports.group_name / tutor_name JSON columns must never receive "".
// Sending a JSON string also works with raw MySQL INSERT/UPDATE queries.
function buildReportApiPayload(row = {}) {
  return {
    ...row,
    groupName: JSON.stringify(normalizeList(row.groupName)),
    tutorName: JSON.stringify(normalizeList(row.tutorName)),
  };
}

function MultiBadgeEditor({ value, variant = "group", placeholder, onChange }) {
  const items = normalizeList(value);
  const [draft, setDraft] = useState("");

  const commit = (rawValue = draft) => {
    const incoming = normalizeList(rawValue);
    if (!incoming.length) return;
    onChange([...new Set([...items, ...incoming])]);
    setDraft("");
  };

  const remove = (item) => {
    onChange(items.filter((current) => current !== item));
  };

  return (
    <div style={styles.badgeEditor} onClick={(event) => event.stopPropagation()}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} style={styles.valueBadge(variant)}>
          <span>{item}</span>
          <button
            type="button"
            tabIndex={-1}
            style={styles.removeBadgeBtn}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => remove(item)}
            aria-label={`Remove ${item}`}
          >
            ×
          </button>
        </span>
      ))}

      <input
        type="text"
        style={styles.badgeInput}
        value={draft}
        placeholder={items.length ? "+ add" : placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
            event.preventDefault();
            commit();
          }

          if (event.key === "Backspace" && !draft && items.length) {
            event.preventDefault();
            remove(items[items.length - 1]);
          }
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData?.getData("text") || "";
          if (/[,|\n]/.test(pasted)) {
            event.preventDefault();
            commit(pasted);
          }
        }}
        onBlur={() => {
          if (draft.trim()) commit();
        }}
      />
    </div>
  );
}

export default function OtmReportModule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`);
      const list = response.data?.data || response.data || [];
      setRows((Array.isArray(list) ? list : []).map(normalizeReportRow));
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports from server. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const handleAddNewRow = async () => {
    setError(null);
    try {
      const newPayload = buildReportApiPayload({
        tuitionName: "New Tuition",
        groupName: [],
        tutorName: [],
        reportStatus: "report pending",
        displayOrder: rows.length,
        rowColor: "",
      });

      const response = await axios.post(`${API_BASE_URL}/reports`, newPayload);
      const newRecord = normalizeReportRow(response.data?.data || response.data || {});
      setRows((prev) => [newRecord, ...prev]);
      setSuccessMsg("New row added successfully!");
      window.setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err) {
      console.error("Error adding new row:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to add new row.");
    }
  };

  const handleCellChange = async (id, field, value) => {
    const originalRows = rows;
    const updated = rows.map((row) =>
      row.id === id
        ? {
            ...row,
            [field]: field === "groupName" || field === "tutorName" ? normalizeList(value) : value,
          }
        : row
    );
    setRows(updated);

    try {
      const targetRow = updated.find((row) => row.id === id);
      await axios.put(`${API_BASE_URL}/reports/${id}`, buildReportApiPayload(targetRow));
    } catch (err) {
      console.error("Error updating record:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to save changes to server.");
      setRows(originalRows);
    }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report record?")) return;

    const originalRows = rows;
    setRows(rows.filter((row) => row.id !== id));

    try {
      await axios.delete(`${API_BASE_URL}/reports/${id}`);
    } catch (err) {
      console.error("Error deleting record:", err);
      setError("Failed to delete record from server.");
      setRows(originalRows);
    }
  };

  const handleDuplicateRow = async (index) => {
    const rowToClone = rows[index];
    const clonedPayload = buildReportApiPayload({
      tuitionName: `${rowToClone.tuitionName || ""} (Copy)`,
      groupName: rowToClone.groupName,
      tutorName: rowToClone.tutorName,
      reportStatus: rowToClone.reportStatus || "report pending",
      displayOrder: index + 1,
      rowColor: rowToClone.rowColor || "",
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, clonedPayload);
      const newRecord = normalizeReportRow(response.data?.data || response.data || {});
      const updated = [...rows];
      updated.splice(index + 1, 0, newRecord);
      setRows(updated);
    } catch (err) {
      console.error("Error duplicating row:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to duplicate row.");
    }
  };

  const handleDragStart = (event, index) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (event, dropIndex) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reorderedRows = [...rows];
    const [draggedItem] = reorderedRows.splice(draggedIndex, 1);
    reorderedRows.splice(dropIndex, 0, draggedItem);

    setDraggedIndex(null);
    setRows(reorderedRows);

    try {
      await axios.post(`${API_BASE_URL}/reports/reorder`, {
        orderedIds: reorderedRows.map((row) => row.id),
      });
    } catch (err) {
      console.error("Reorder sync error:", err);
    }
  };

  return (
    <div style={styles.moduleContainer}>
      {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}

      <div style={styles.tableCard}>
        <div style={styles.tableHeaderBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h4 style={styles.tableHeading}>OTM Spreadsheet Reports</h4>
            <span style={styles.rowCountBadge}>Total: {rows.length} Rows</span>
          </div>
          <button type="button" style={styles.addExcelBtn} onClick={handleAddNewRow}>
            + Add Row
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 35, textAlign: "center" }}>↕</th>
                <th style={{ ...styles.th, width: 40, textAlign: "center" }}>#</th>
                <th style={{ ...styles.th, width: "24%" }}>Tuition Name</th>
                <th style={{ ...styles.th, width: "22%" }}>Group Name</th>
                <th style={{ ...styles.th, width: "22%" }}>Tutor Name</th>
                <th style={{ ...styles.th, width: "16%", textAlign: "center" }}>Report Status</th>
                <th style={{ ...styles.th, width: 60, textAlign: "center" }}>Color</th>
                <th style={{ ...styles.th, width: 90, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyTd}>Loading spreadsheet data...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyTd}>No records found. Click Add Row to start.</td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const statusStyle = getStatusStyle(row.reportStatus);
                  const isSelected = selectedRowId === row.id;

                  return (
                    <tr
                      key={row.id || index}
                      draggable
                      onDragStart={(event) => handleDragStart(event, index)}
                      onDragOver={handleDragOver}
                      onDrop={(event) => handleDrop(event, index)}
                      onClick={() => setSelectedRowId(row.id)}
                      style={{
                        ...styles.tr,
                        backgroundColor: row.rowColor
                          ? row.rowColor
                          : isSelected
                            ? "#ecfdf5"
                            : index % 2 === 0
                              ? "#ffffff"
                              : "#fcfdfe",
                        opacity: draggedIndex === index ? 0.4 : 1,
                      }}
                    >
                      <td style={{ ...styles.td, cursor: "grab", textAlign: "center", color: "#94a3b8" }}>⠿</td>
                      <td style={{ ...styles.td, textAlign: "center", fontWeight: 700, color: "#64748b" }}>{index + 1}</td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          style={styles.cellInput}
                          value={row.tuitionName || ""}
                          onChange={(event) => handleCellChange(row.id, "tuitionName", event.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <MultiBadgeEditor
                          value={row.groupName}
                          variant="group"
                          placeholder="Add group"
                          onChange={(value) => handleCellChange(row.id, "groupName", value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <MultiBadgeEditor
                          value={row.tutorName}
                          variant="tutor"
                          placeholder="Add tutor"
                          onChange={(value) => handleCellChange(row.id, "tutorName", value)}
                        />
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <select
                          style={{
                            ...styles.statusSelect,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            borderColor: statusStyle.border,
                          }}
                          value={row.reportStatus || "report pending"}
                          onChange={(event) => handleCellChange(row.id, "reportStatus", event.target.value)}
                        >
                          {REPORT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} style={{ background: "#fff", color: "#333" }}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <input
                          type="color"
                          title="Highlight Row Color"
                          style={styles.colorPicker}
                          value={row.rowColor || "#ffffff"}
                          onChange={(event) => handleCellChange(row.id, "rowColor", event.target.value)}
                        />
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actionGroup}>
                          <button
                            type="button"
                            title="Duplicate Row"
                            style={styles.iconBtn}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDuplicateRow(index);
                            }}
                          >
                            📑
                          </button>
                          <button
                            type="button"
                            title="Delete Row"
                            style={{ ...styles.iconBtn, color: "#ef4444" }}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteRow(row.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  moduleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
    padding: 10,
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  errorAlert: {
    padding: "10px 14px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 6,
    fontSize: 13,
  },
  successAlert: {
    padding: "10px 14px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 6,
    fontSize: 13,
  },
  tableCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #94a3b8",
    borderRadius: 8,
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  tableHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #94a3b8",
  },
  tableHeading: { margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" },
  rowCountBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    backgroundColor: "#e2e8f0",
    padding: "3px 8px",
    borderRadius: 999,
  },
  addExcelBtn: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "1px solid #15803d",
    borderRadius: 7,
    padding: "7px 13px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  tableWrapper: { width: "100%", overflowX: "auto", maxHeight: "72vh", overflowY: "auto" },
  table: { width: "100%", minWidth: 1050, borderCollapse: "collapse", tableLayout: "fixed", fontSize: 13 },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 3,
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    padding: "10px 8px",
    borderRight: "1px solid #475569",
    borderBottom: "1px solid #475569",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tr: { transition: "background-color 0.1s ease" },
  td: {
    height: 42,
    padding: "3px 5px",
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
    verticalAlign: "middle",
    boxSizing: "border-box",
  },
  cellInput: {
    width: "100%",
    minHeight: 32,
    padding: "5px 7px",
    border: "1px solid transparent",
    borderRadius: 4,
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "transparent",
    outline: "none",
    boxSizing: "border-box",
  },
  badgeEditor: {
    minHeight: 32,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    padding: "3px 4px",
    border: "1px solid transparent",
    borderRadius: 5,
    background: "transparent",
  },
  valueBadge: (variant) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    maxWidth: "100%",
    padding: "2px 4px 2px 7px",
    borderRadius: 999,
    border: `1px solid ${variant === "group" ? "#93c5fd" : "#c4b5fd"}`,
    background: variant === "group" ? "#dbeafe" : "#ede9fe",
    color: variant === "group" ? "#1d4ed8" : "#6d28d9",
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
  }),
  removeBadgeBtn: {
    width: 16,
    height: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: 0,
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.08)",
    color: "inherit",
    cursor: "pointer",
    lineHeight: 1,
  },
  badgeInput: {
    flex: "1 1 62px",
    minWidth: 55,
    minHeight: 24,
    padding: "2px 4px",
    border: 0,
    outline: 0,
    background: "transparent",
    fontSize: 11,
  },
  statusSelect: {
    width: "94%",
    minHeight: 28,
    padding: "4px 9px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 800,
    textAlign: "center",
    textAlignLast: "center",
    cursor: "pointer",
    outline: "none",
  },
  colorPicker: { width: 25, height: 25, border: 0, borderRadius: 4, cursor: "pointer", background: "none" },
  actionGroup: { display: "flex", justifyContent: "center", alignItems: "center", gap: 4 },
  iconBtn: { background: "none", border: 0, cursor: "pointer", fontSize: 14, padding: 4, borderRadius: 4 },
  emptyTd: { padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 },
};