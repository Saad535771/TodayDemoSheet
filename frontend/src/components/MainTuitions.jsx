import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";
import MonthlyTuition from "./MonthlyTuition";
import MonthlyTuitionTable from "./MonthlyTuitionTable";

export default function MainTuitions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/tuitions");
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleZoom = (factor) => {
    setZoom((prev) => Math.min(Math.max(prev + factor, 0.5), 2.5));
  };

  return (
    <div style={{ fontFamily: "'Calibri', sans-serif", color: "#333" }}>
      {/* Component 1: Add Form */}
      <MonthlyTuition onLoad={load} />

      {/* Component 2: Excel Table */}
      <MonthlyTuitionTable 
        items={items} 
        load={load} 
        zoom={zoom} 
        handleZoom={handleZoom} 
      />
    </div>
  );
}