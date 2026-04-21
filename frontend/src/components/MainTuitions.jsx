import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api/api.js";
import MonthlyTuition from "./MonthlyTuition";
import MonthlyTuitionTable from "./MonthlyTuitionTable";

export default function MainTuitions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(0.6);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tuitions");
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const handleZoom = (factor) => {
    setZoom((prev) => Math.min(Math.max(prev + factor, 0.5), 2.5));
  };
  return (
    <div style={{ fontFamily: "'Calibri', sans-serif", color: "#333" }}>
      <MonthlyTuition onLoad={load} />
      <MonthlyTuitionTable
        items={items}
        load={load}
        zoom={zoom}
        handleZoom={handleZoom}
      />
    </div>
  );
}