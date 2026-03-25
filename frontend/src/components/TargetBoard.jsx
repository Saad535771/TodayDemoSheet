import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";
import SlotTable from "./SlotTable.jsx";

const FILTERS = ["", "Followup", "Today Demo", "Future Demo"];

export default function TargetBoard() {
  const [slots, setSlots] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/target", { params: filter ? { filter } : {} });
      setSlots(data.slots || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="mx-1">
          <h5 style={{ margin: 0 }}>Today Demo + Feedback (Target)</h5>
          <div className="muted">Auto grouped by time slots (8AM–11PM)</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select className="select" style={{ width: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTERS.map(f => <option key={f} value={f}>{f ? f : "All Filters"}</option>)}
          </select>
        
        </div>
      </div>
      <div className="space" />
      <div style={{ display: "grid", gap: 12 }}>
        {slots.map(slot => (
          <SlotTable key={slot.slotHeader} slot={slot} onChanged={load} />
        ))}
      </div>
    </div>
  );
}
