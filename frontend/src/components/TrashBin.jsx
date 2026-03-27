import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";

const styles = {
  container: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    animation: "fadeIn 0.3s ease-out",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "15px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#e53e3e", // Redish color for trash
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  countBadge: {
    fontSize: "12px",
    background: "#fff5f5",
    color: "#c53030",
    padding: "2px 10px",
    borderRadius: "12px",
    fontWeight: "600",
    border: "1px solid #feb2b2"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textalign: "center",
    padding: "12px",
    borderBottom: "2px solid #f0f2f5",
    color: "#888",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "600"
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #f9f9f9",
    fontSize: "14px",
    color: "#333",
    verticalAlign: "middle"
  },
  // Buttons
  btnRestore: {
    background: "#48bb78", // Green
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "8px",
    fontSize: "12px",
    fontWeight: "500",
    transition: "0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  btnForceDelete: {
    background: "#e53e3e", // Red
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  emptyState: {
    textAlign: "center",
    padding: "50px",
    color: "#a0aec0",
    fontStyle: "italic",
    background: "#f9fafb",
    borderRadius: "8px",
    marginTop: "10px"
  }
};

export default function TrashBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Load Data
  useEffect(() => {
    fetchTrash();
  }, []);

  async function fetchTrash() {
    try {
      const res = await api.get("/tuitions/trash");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load trash", err);
    } finally {
      setLoading(false);
    }
  }

  // 2. Restore Item (Backend: PUT /:id/restore)
  async function handleRestore(id) {
    // Confirm ki zaroorat nahi hoti restore mein usually, par laga sakte hain
    try {
      await api.put(`/tuitions/${id}/restore`);
      // UI se remove karein
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to restore item");
    }
  }

  // 3. Force Delete (Backend: DELETE /:id/force)
  async function handleForceDelete(id) {
    if (!window.confirm("⚠️ ARE YOU SURE?\n\nThis will permanently delete this record. You cannot undo this action.")) {
      return;
    }
    try {
      await api.delete(`/tuitions/${id}/force`);
      // UI se remove karein
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete permanently");
    }
  }

  if (loading) return <div style={{padding: 20}}>Loading Recycle Bin...</div>;

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          🗑️ Recycle Bin
          {items.length > 0 && <span style={styles.countBadge}>{items.length}</span>}
        </h2>
        <button onClick={fetchTrash} style={{background:'transparent', border:'1px solid #ddd', padding:'5px 10px', borderRadius:6, cursor:'pointer'}}>
          🔄 Refresh
        </button>
      </div>

      {/* Table or Empty State */}
      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>Trash is Empty ✨</h3>
          <p>Items deleted from the main sheet will appear here.</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Tuition Details</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Deleted Date</th>
              <th style={{...styles.th, textAlign: "right"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {/* ID Column */}
                <td style={styles.td}>
                  <span style={{fontWeight: 'bold', color: '#555'}}>#{item.tuitionId}</span>
                </td>
                
                {/* Details Column */}
                <td style={styles.td}>
                  <div style={{fontWeight: '600'}}>{item.subjects || "No Subject"}</div>
                  <div style={{fontSize: '12px', color: '#777'}}>{item.className || "No Class"} • {item.location || item.country}</div>
                </td>

                {/* Status Column */}
                <td style={styles.td}>
                   <span style={{
                      padding: "2px 8px", 
                      borderRadius: "4px", 
                      fontSize: "11px", 
                      background: "#edf2f7", 
                      color: "#4a5568"
                   }}>
                     {item.status || "Unknown"}
                   </span>
                </td>

                {/* Date Column */}
                <td style={styles.td}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                  <div style={{fontSize: 10, color: '#999'}}>{new Date(item.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>

                {/* Actions Column */}
                <td style={{...styles.td, textAlign: "right"}}>
                  <button 
                    style={styles.btnRestore} 
                    onClick={() => handleRestore(item.id)}
                    title="Restore to Main Sheet"
                  >
                    ♻️ Restore
                  </button>
                  <button 
                    style={styles.btnForceDelete} 
                    onClick={() => handleForceDelete(item.id)}
                    title="Delete Permanently"
                  >
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}