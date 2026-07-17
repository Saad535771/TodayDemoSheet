import React, { useState, useEffect } from "react";
import { api } from "../api/api.js"; 
export default function CellHistoryPopup({ 
  isOpen, 
  onClose, 
  x, 
  y, 
  tuitionId,            // Purani sheets (Tuitions, TodayDemo) ke liye
  paymentCloneId,       // Payment Team A ke liye
  paymentCloneTeamBId, 
  fieldName, 
  apiUrl = "/tuitions/history/track" 
}) {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCellHistory = async () => {
      setLoading(true);
      try {
        const params = { fieldName, limit: 100, sort: "DESC" };
        
        // Jo bhi sheet id pass karegi, wahi parameter API ko jayega
        if (tuitionId) params.tuitionId = tuitionId;
        if (paymentCloneId) params.rowId = paymentCloneId;
        if (paymentCloneTeamBId) params.rowId = paymentCloneTeamBId;

        const response = await api.get(apiUrl, { params });
        setHistory(response.data?.data || []);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Failed to fetch cell history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCellHistory();
  },[isOpen, tuitionId, paymentCloneId, paymentCloneTeamBId, fieldName, apiUrl]);

  if (!isOpen) return null;

  // Popup screen se bahar nah chala jaye is liye coordinates safe banaye
  const popupWidth = 320;
  const popupHeight = 150;
  const safeX = x + popupWidth > window.innerWidth ? window.innerWidth - popupWidth - 20 : x;
  const safeY = y + popupHeight > window.innerHeight ? window.innerHeight - popupHeight - 20 : y;

  const record = history[currentIndex];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999 }}>
      {/* Background click par close karne k liye overlay */}
      <div onClick={onClose} style={{ position: "absolute", width: "100%", height: "100%" }}></div>

      {/* Google Sheets Style Popup Box */}
      <div style={{
        position: "absolute", top: safeY, left: safeX, width: "320px",
        background: "#fff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid #ddd", padding: "12px", zIndex: 10000, fontFamily: "Arial, sans-serif"
      }}>
        {loading ? (
          <div style={{ color: "#555", fontSize: "14px", padding: "10px" }}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{ color: "#555", fontSize: "14px", padding: "10px" }}>No edit history for this cell.</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px", color: "#202124" }}>
                  {record.edited_by || "Admin"}
                </div>
                <div style={{ fontSize: "12px", color: "#5f6368", marginTop: "2px" }}>
                  {new Date(record.created_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true
                  })}
                </div>
              </div>
              
              {/* < > Navigation Buttons */}
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(prev + 1, history.length - 1))}
                  disabled={currentIndex === history.length - 1}
                  style={{
                    background: "none", border: "none", cursor: currentIndex === history.length - 1 ? "default" : "pointer",
                    color: currentIndex === history.length - 1 ? "#ccc" : "#5f6368", fontSize: "16px", padding: "0 4px"
                  }}
                  title="Older edit"
                >
                  {"<"}
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0}
                  style={{
                    background: "none", border: "none", cursor: currentIndex === 0 ? "default" : "pointer",
                    color: currentIndex === 0 ? "#ccc" : "#5f6368", fontSize: "16px", padding: "0 4px"
                  }}
                  title="Newer edit">
                  {">"}
                </button>
              </div>
            </div>
            {/* Change Text */}
            <div style={{ fontSize: "13px", color: "#202124", lineHeight: "1.5" }}>
              {!record.old_value ? (
                <span>Added <strong>{record.new_value}</strong></span>
              ) : !record.new_value ? (
                <span>Deleted <strong>{record.old_value}</strong></span>
              ) : (
                <span>Replaced <strong>{record.old_value}</strong> with <strong>{record.new_value}</strong></span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}