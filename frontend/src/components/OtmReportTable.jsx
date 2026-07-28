import React, { useState, useEffect } from "react";
import axios from "axios";

// .env se API base URL fetch karna (Fallback: http://localhost:5005/api)
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

export default function OtmReportModule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // --- 1. FETCH REPORTS LIST (GET) ---
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`);
      setRows(response.data.data || response.data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports from server. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // --- 2. ADD NEW EMPTY ROW (POST) ---
  const handleAddNewRow = async () => {
    try {
      const newPayload = {
        tuitionName: "New Tuition",
        groupName: "",
        tutorName: "",
        reportStatus: "report pending",
        displayOrder: rows.length,
        rowColor: "",
      };
      const response = await axios.post(`${API_BASE_URL}/reports`, newPayload);
      const newRecord = response.data.data || response.data;
      
      // Agar backend id return kare toh theek, warna object mein adjust kar lein
      setRows((prev) => [newRecord, ...prev]);
      setSuccessMsg("New row added successfully!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err) {
      console.error("Error adding new row:", err);
      setError("Failed to add new row.");
    }
  };

  // --- 3. INLINE EDIT / CELL CHANGE (PUT) ---
  const handleCellChange = async (id, field, value) => {
    const originalRows = [...rows];
    const updated = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    setRows(updated);

    try {
      const targetRow = updated.find((r) => r.id === id);
      await axios.put(`${API_BASE_URL}/reports/${id}`, targetRow);
    } catch (err) {
      console.error("Error updating record:", err);
      setError("Failed to save changes to server.");
      setRows(originalRows);
    }
  };

  // --- 4. DELETE RECORD (DELETE) ---
  const handleDeleteRow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report record?")) return;

    const originalRows = [...rows];
    setRows(rows.filter((r) => r.id !== id));

    try {
      await axios.delete(`${API_BASE_URL}/reports/${id}`);
    } catch (err) {
      console.error("Error deleting record:", err);
      setError("Failed to delete record from server.");
      setRows(originalRows);
    }
  };

  // --- 5. DUPLICATE ROW (POST) ---
  const handleDuplicateRow = async (index) => {
    const rowToClone = rows[index];
    const clonedPayload = {
      tuitionName: `${rowToClone.tuitionName || ""} (Copy)`,
      groupName: rowToClone.groupName || "",
      tutorName: rowToClone.tutorName || "",
      reportStatus: rowToClone.reportStatus || "report pending",
      displayOrder: index + 1,
      rowColor: rowToClone.rowColor || "",
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, clonedPayload);
      const newRecord = response.data.data || response.data;
      const updated = [...rows];
      updated.splice(index + 1, 0, newRecord);
      setRows(updated);
    } catch (err) {
      console.error("Error duplicating row:", err);
      setError("Failed to duplicate row.");
    }
  };

  // --- 6. DRAG & DROP REORDER ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reorderedRows = [...rows];
    const [draggedItem] = reorderedRows.splice(draggedIndex, 1);
    reorderedRows.splice(dropIndex, 0, draggedItem);

    setDraggedIndex(null);
    setRows(reorderedRows);

    try {
      await axios.post(`${API_BASE_URL}/reports/reorder`, {
        orderedIds: reorderedRows.map((r) => r.id),
      });
    } catch (err) {
      console.error("Reorder sync error:", err);
    }
  };

  return (
    <div style={styles.moduleContainer}>
      {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}

      {/* Excel Sheet Card Container */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderBar}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h4 style={styles.tableHeading}>📊 OTM Excel Sheet Reports</h4>
            <span style={styles.rowCountBadge}>Total: {rows.length} Rows</span>
          </div>
          <button style={styles.addExcelBtn} onClick={handleAddNewRow}>
            ➕ Add Row
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 35, textAlign: "center" }}>↕</th>
                <th style={{ ...styles.th, width: 40, textAlign: "center" }}>#</th>
                <th style={{ ...styles.th, width: "26%" }}>Tuition Name</th>
                <th style={{ ...styles.th, width: "20%" }}>Group Name</th>
                <th style={{ ...styles.th, width: "20%" }}>Tutor Name</th>
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
                  <td colSpan={8} style={styles.emptyTd}>No records found. Click "Add Row" above to start.</td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const statusStyle = getStatusStyle(row.reportStatus);
                  const isSelected = selectedRowId === row.id;

                  return (
                    <tr
                      key={row.id || index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => setSelectedRowId(row.id)}
                      style={{
                        ...styles.tr,
                        backgroundColor: row.rowColor 
                          ? row.rowColor 
                          : isSelected 
                            ? "#e0f2fe" 
                            : index % 2 === 0 
                              ? "#ffffff" 
                              : "#fcfdfe",
                        opacity: draggedIndex === index ? 0.4 : 1,
                      }}
                    >
                      <td style={{ ...styles.td, cursor: "grab", textAlign: "center", color: "#94a3b8" }}>
                        ⠿
                      </td>
                      <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", color: "#64748b" }}>
                        {index + 1}
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          style={styles.cellInput}
                          value={row.tuitionName || ""}
                          onChange={(e) => handleCellChange(row.id, "tuitionName", e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          style={styles.cellInput}
                          value={row.groupName || ""}
                          onChange={(e) => handleCellChange(row.id, "groupName", e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          style={styles.cellInput}
                          value={row.tutorName || ""}
                          onChange={(e) => handleCellChange(row.id, "tutorName", e.target.value)}
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
                          onChange={(e) => handleCellChange(row.id, "reportStatus", e.target.value)}
                        >
                          {REPORT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} style={{ background: "#fff", color: "#333" }}>
                              {opt.label}
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
                          onChange={(e) => handleCellChange(row.id, "rowColor", e.target.value)}
                        />
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actionGroup}>
                          <button
                            title="Duplicate Row"
                            style={styles.iconBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateRow(index);
                            }}
                          >
                            📑
                          </button>
                          <button
                            title="Delete Row"
                            style={{ ...styles.iconBtn, color: "#ef4444" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(row.id);
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
    gap: "16px",
    width: "100%",
    padding: "10px",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  errorAlert: {
    padding: "10px 14px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    fontSize: "13px",
  },
  successAlert: {
    padding: "10px 14px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    fontSize: "13px",
  },
  tableCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  tableHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #cbd5e1",
  },
  tableHeading: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#1e293b",
  },
  rowCountBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    backgroundColor: "#e2e8f0",
    padding: "3px 8px",
    borderRadius: "4px",
  },
  addExcelBtn: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    backgroundColor: "#ffffff",
  },
  th: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontWeight: "700",
    padding: "10px 8px",
    borderBottom: "2px solid #cbd5e1",
    borderRight: "1px solid #e2e8f0",
    textAlign: "left",
  },
  tr: {
    borderBottom: "1px solid #e2e8f0",
    transition: "background-color 0.1s ease",
  },
  td: {
    padding: "4px 6px",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  cellInput: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid transparent",
    borderRadius: "4px",
    fontSize: "13px",
    color: "#0f172a",
    backgroundColor: "transparent",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  statusSelect: {
    width: "92%",
    padding: "4px 6px",
    borderRadius: "12px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: "700",
    textAlign: "center",
    textAlignLast: "center",
    cursor: "pointer",
    outline: "none",
  },
  colorPicker: {
    width: "24px",
    height: "24px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    background: "none",
  },
  actionGroup: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px",
    borderRadius: "4px",
  },
  emptyTd: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },
};