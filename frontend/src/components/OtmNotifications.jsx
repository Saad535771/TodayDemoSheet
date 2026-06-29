import React, { useState, useEffect } from "react";
import { api } from "../api/api.js";

const styles = {
  container: {
    width: "320px",
    background: "#fff",
    borderLeft: "1px solid #e2e8f0",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    height: "100%",
    fontFamily: "'Calibri', sans-serif"
  },
  card: (color) => ({
    padding: "12px",
    borderRadius: "8px",
    border: `1px solid ${color === 'white' ? '#e2e8f0' : 'transparent'}`,
    backgroundColor: color === 'white' ? '#fff' : color === 'green' ? '#dcfce7' : '#fef3c7',
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  }),
  button: { cursor: 'pointer', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }
};

export default function OtmNotifications({ socket, userId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Initial data fetch
    socket.emit("notifications:summary");

    // Listeners
    socket.on("notifications:summary", (data) => {
        // Agar backend summary object bhej raha hai, toh data.notifications ya data.modules handle karein
        const list = data?.notifications || data?.modules || [];
        setNotifications(list);
    });

    socket.on("notifications:new", (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
        socket.off("notifications:summary");
        socket.off("notifications:new");
    };
  }, [socket]);

  const updateColor = async (id, color) => {
    // Local update
    setNotifications(prev => prev.map(n => n.id === id ? {...n, payload: {...n.payload, colorState: color}} : n));
    // Backend update (agar zaroorat ho)
    try { await api.patch(`/notifications/${id}`, { colorState: color }); } catch(e) {}
  };

  return (
    <div style={styles.container}>
      <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 10px 0" }}>Management Alerts</h3>
      {notifications.length === 0 && <p style={{ fontSize: "12px", color: "#888" }}>No new updates</p>}
      {notifications.map((n) => (
        <div key={n.id} style={styles.card(n.payload?.colorState || 'white')}>
          <div style={{ fontSize: "13px", fontWeight: "bold" }}>{n.title}</div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>{n.message}</div>
          <div style={{ marginTop: "8px", display: "flex", gap: "5px" }}>
            <button style={{...styles.button, background: '#eee'}} onClick={() => updateColor(n.id, 'white')}>White</button>
            <button style={{...styles.button, background: '#22c55e', color: '#fff'}} onClick={() => updateColor(n.id, 'green')}>Green</button>
            <button style={{...styles.button, background: '#f59e0b', color: '#fff'}} onClick={() => updateColor(n.id, 'orange')}>Orange</button>
          </div>
        </div>
      ))}
    </div>
  );
}