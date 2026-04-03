import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api.js";

const styles = {
  page: {
    padding: "20px",
    display: "grid",
    gap: "16px",
  },

  card: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e7edf5",
    padding: "18px",
  },

  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#163b68",
  },

  text: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: "14px",
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e7edf5",
    borderRadius: "16px",
    background: "#fff",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1150px",
  },

  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid #e7edf5",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },

  notesCell: {
    whiteSpace: "normal",
    minWidth: "220px",
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

export default function AdminOtmUserDetail() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDetails() {
    try {
      setLoading(true);
      const res = await api.get(`/otm-management/admin/${userId}`);
      setData(res.data || null);
    } catch (err) {
      console.error("Failed to load admin OTM details:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [userId]);

  if (loading) {
    return <div style={styles.empty}>Loading OTM user details...</div>;
  }

  if (!data) {
    return <div style={styles.empty}>No OTM user details found.</div>;
  }

  const { user, entries = [], reports = {}, totalClass = {} } = data;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{user?.name || "OTM User"} - OTM Details</h2>
        <p style={styles.text}>
          <strong>ID:</strong> {user?.id || "--"}
        </p>
        <p style={styles.text}>
          <strong>Email:</strong> {user?.email || "--"}
        </p>
        <p style={styles.text}>
          <strong>Role:</strong> {user?.role || "--"}
        </p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Entries</h3>
          <div style={styles.statNumber}>{reports?.totalEntries || 0}</div>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Classes</h3>
          <div style={{ ...styles.statNumber, color: "#16a34a" }}>
            {totalClass?.totalClasses || 0}
          </div>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>By Status</h3>
          {Object.keys(reports?.byStatus || {}).length === 0 ? (
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
          <h3 style={styles.statTitle}>Classes By Tuition</h3>
          {Object.keys(totalClass?.byTuition || {}).length === 0 ? (
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

      {entries.length === 0 ? (
        <div style={styles.empty}>No entries found.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Day</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Tuition Name</th>
                <th style={styles.th}>Group Name</th>
                <th style={styles.th}>Class Start Time</th>
                <th style={styles.th}>Class End Time</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Notes</th>
              </tr>
            </thead>

            <tbody>
              {entries.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.day || "--"}</td>
                  <td style={styles.td}>{item.time || "--"}</td>
                  <td style={styles.td}>{item.tuitionName || "--"}</td>
                  <td style={styles.td}>{item.groupName || "--"}</td>
                  <td style={styles.td}>{item.classStartTime || "--"}</td>
                  <td style={styles.td}>{item.classEndTime || "--"}</td>
                  <td style={styles.td}>{item.status || "--"}</td>
                  <td style={{ ...styles.td, ...styles.notesCell }}>
                    {item.notes || "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}