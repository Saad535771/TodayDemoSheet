import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";

const LIVE_REFRESH_MS = 3000;

const styles = {
  page: {
    padding: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    border: "1px solid #eef0f3",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e3c72",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#666",
    margin: 0,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: "260px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d6dbe1",
    outline: "none",
    fontSize: "14px",
  },
  addBtn: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  refreshBtn: {
    background: "#f3f4f6",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  liveBadge: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1700px",
    fontSize: "13px",
  },
  th: {
    background: "#f8fafc",
    color: "#334155",
    fontWeight: "700",
    textAlign: "center",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 2,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    padding: "0",
    textAlign: "center",
    height: "46px",
    verticalAlign: "middle",
    background: "#fff",
  },
  input: {
    width: "100%",
    height: "46px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "13px",
    background: "transparent",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: "46px",
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "13px",
    background: "transparent",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  readCell: {
    padding: "10px 12px",
    minHeight: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "cell",
  },
  textLeft: {
    justifyContent: "flex-start",
    textAlign: "left",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  emptyState: {
    padding: "28px",
    textAlign: "center",
    color: "#6b7280",
  },
  loading: {
    padding: "20px",
    textAlign: "center",
    color: "#666",
  },
};

const statusOptions = [
  "",
  "Fees Receive",
  "Fee Pending",
  "Tuition Close",
  "Tuition Pending",
];

function getRowId(row) {
  return row?.id ?? row?.paymentId ?? row?._id ?? row?.rowId;
}

function rowsAreSame(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getStatusStyle(status) {
  switch ((status || "").trim()) {
    case "Fees Receive":
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
      };
    case "Fee Pending":
      return {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fcd34d",
      };
    case "Tuition Close":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
      };
    case "Tuition Pending":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fca5a5",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#475569",
        border: "1px solid #e2e8f0",
      };
  }
}

function StatusPill({ value }) {
  const style = getStatusStyle(value);
  return (
    <span
      style={{
        ...style,
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "700",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {value || "--"}
    </span>
  );
}

function EditableCell({
  value,
  onSave,
  type = "text",
  options = [],
  align = "left",
  renderDisplay,
}) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value ?? "");

  useEffect(() => {
    if (!editing) {
      setCurrentValue(value ?? "");
    }
  }, [value, editing]);

  const save = () => {
    setEditing(false);
    if ((currentValue ?? "") !== (value ?? "")) {
      onSave(currentValue);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      setCurrentValue(value ?? "");
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <td style={styles.td}>
        {options.length > 0 ? (
          <select
            autoFocus
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={save}
            onKeyDown={onKeyDown}
            style={styles.select}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "--"}
              </option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={save}
            onKeyDown={onKeyDown}
            style={styles.input}
          />
        )}
      </td>
    );
  }

  return (
    <td style={styles.td} onClick={() => setEditing(true)}>
      <div
        style={{
          ...styles.readCell,
          ...(align === "left" ? styles.textLeft : {}),
        }}
      >
        {renderDisplay ? renderDisplay(value) : value || ""}
      </div>
    </td>
  );
}

export default function PaymentSheet() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const mountedRef = useRef(true);
  const itemsRef = useRef([]);
  const pollingRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    loadPayments({ initial: true });

    pollingRef.current = setInterval(() => {
      if (document.hidden) return;
      loadPayments({ silent: true });
    }, LIVE_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  async function loadPayments({ initial = false, silent = false } = {}) {
    try {
      if (initial) {
        setLoading(true);
      }

      const res = await api.get("/payments");
      const rows = Array.isArray(res.data) ? res.data : res.data.items || [];

      if (!mountedRef.current) return;

      if (!rowsAreSame(itemsRef.current, rows)) {
        setItems(rows);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      if (!silent && mountedRef.current && initial) {
        setItems([]);
      }
    } finally {
      if (mountedRef.current && initial) {
        setLoading(false);
      }
    }
  }

  async function addRow() {
    try {
      setAdding(true);

      const newRow = {
        tuitionId: `manual-${Date.now()}`,
        paymentDate: "",
        tuitionName: "",
        country: "",
        className: "",
        tutorName: "",
        tutorShare: "",
        lacasShare: "",
        totalFees: "",
        status: "Tuition Pending",
        feedback: "",
        otmName: "",
      };

      const res = await api.post("/payments", newRow);
      const created = res.data?.item || res.data?.payment || res.data;

      if (created && getRowId(created) !== undefined) {
        setItems((prev) => [created, ...prev]);
      } else {
        await loadPayments({ silent: true });
      }
    } catch (err) {
      console.error("Failed to add payment row:", err);
      alert("New payment row create nahi hui.");
    } finally {
      setAdding(false);
    }
  }

  async function updateRow(row, field, newValue) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID missing hai. Backend record identify nahi ho raha.");
      return;
    }

    const oldItems = itemsRef.current;
    const updatedRow = { ...row, [field]: newValue };

    setItems((prev) =>
      prev.map((item) => (getRowId(item) === rowId ? updatedRow : item))
    );

    try {
      await api.patch(`/payments/${encodeURIComponent(rowId)}`, updatedRow);
      await loadPayments({ silent: true });
    } catch (err) {
      console.error("Failed to update payment row:", err);
      setItems(oldItems);
      alert("Update failed.");
    }
  }

  async function deleteRow(row) {
    const rowId = getRowId(row);
    if (rowId === undefined || rowId === null) {
      alert("Row ID missing hai.");
      return;
    }

    if (!window.confirm("Is payment row ko delete karna hai?")) return;

    const oldItems = itemsRef.current;
    setItems((prev) => prev.filter((item) => getRowId(item) !== rowId));

    try {
      await api.delete(`/payments/${encodeURIComponent(rowId)}`);
      await loadPayments({ silent: true });
    } catch (err) {
      console.error("Failed to delete payment row:", err);
      setItems(oldItems);
      alert("Delete failed.");
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const haystack = [
        item.tuitionId,
        item.paymentDate,
        item.tuitionName,
        item.country,
        item.className,
        item.tutorName,
        item.tutorShare,
        item.lacasShare,
        item.totalFees,
        item.status,
        item.feedback,
        item.otmName,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [items, search]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div style={styles.titleWrap}>
            <h2 style={styles.title}>Payment Sheet</h2>
            <p style={styles.subtitle}>
              Monthly Sheet me status Tuition Done hote hi yahan record auto aa jayega.
            </p>
          </div>

          <div style={styles.actions}>
            <div style={styles.liveBadge}>● Live Sync</div>

            <input
              type="text"
              placeholder="Search by tuition id, name, country, tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <button onClick={() => loadPayments({ initial: true })} style={styles.refreshBtn}>
              Refresh
            </button>

            <button onClick={addRow} style={styles.addBtn} disabled={adding}>
              {adding ? "Adding..." : "+ Add Row"}
            </button>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, minWidth: "140px" }}>Tuition Id</th>
                <th style={{ ...styles.th, minWidth: "120px" }}>Date</th>
                <th style={{ ...styles.th, minWidth: "180px" }}>Tuition Name</th>
                <th style={{ ...styles.th, minWidth: "110px" }}>Country</th>
                <th style={{ ...styles.th, minWidth: "100px" }}>Class</th>
                <th style={{ ...styles.th, minWidth: "150px" }}>Tutor Name</th>
                <th style={{ ...styles.th, minWidth: "120px" }}>Tutor Share</th>
                <th style={{ ...styles.th, minWidth: "120px" }}>Lacas Share</th>
                <th style={{ ...styles.th, minWidth: "120px" }}>Total Fees</th>
                <th style={{ ...styles.th, minWidth: "150px" }}>Status</th>
                <th style={{ ...styles.th, minWidth: "220px" }}>Feedback</th>
                <th style={{ ...styles.th, minWidth: "150px" }}>OTM Name</th>
                <th style={{ ...styles.th, minWidth: "90px" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" style={styles.loading}>
                    Loading payment sheet...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="13" style={styles.emptyState}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((row) => {
                  const rowId = getRowId(row);

                  return (
                    <tr key={rowId ?? Math.random()}>
                      <EditableCell
                        value={row.tuitionId || ""}
                        onSave={(val) => updateRow(row, "tuitionId", val)}
                      />
                      <EditableCell
                        value={row.paymentDate || ""}
                        type="date"
                        onSave={(val) => updateRow(row, "paymentDate", val)}
                      />
                      <EditableCell
                        value={row.tuitionName || ""}
                        onSave={(val) => updateRow(row, "tuitionName", val)}
                      />
                      <EditableCell
                        value={row.country || ""}
                        onSave={(val) => updateRow(row, "country", val)}
                      />
                      <EditableCell
                        value={row.className || ""}
                        onSave={(val) => updateRow(row, "className", val)}
                      />
                      <EditableCell
                        value={row.tutorName || ""}
                        onSave={(val) => updateRow(row, "tutorName", val)}
                      />
                      <EditableCell
                        value={row.tutorShare || ""}
                        type="number"
                        onSave={(val) => updateRow(row, "tutorShare", val)}
                      />
                      <EditableCell
                        value={row.lacasShare || ""}
                        type="number"
                        onSave={(val) => updateRow(row, "lacasShare", val)}
                      />
                      <EditableCell
                        value={row.totalFees || ""}
                        type="number"
                        onSave={(val) => updateRow(row, "totalFees", val)}
                      />
                      <EditableCell
                        value={row.status || ""}
                        options={statusOptions}
                        onSave={(val) => updateRow(row, "status", val)}
                        renderDisplay={(val) => <StatusPill value={val} />}
                      />
                      <EditableCell
                        value={row.feedback || ""}
                        onSave={(val) => updateRow(row, "feedback", val)}
                      />
                      <EditableCell
                        value={row.otmName || ""}
                        onSave={(val) => updateRow(row, "otmName", val)}
                      />
                      <td style={styles.td}>
                        <div style={styles.readCell}>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => deleteRow(row)}
                          >
                            Del
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