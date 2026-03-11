import React, { useState } from "react";
import SlotTable from "./SlotTable";

const pageSearchStyles = {
  wrapper: {
    position: "sticky",
    top: "10px",
    zIndex: 50,
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
  },
  inner: {
    width: "min(1100px, 100%)",
    background: "#fff",
    padding: "12px 16px",
    borderRadius: "12px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid #e6e6e6",
  },
  input: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid #c8c6c4",
    fontSize: "15px",
    outline: "none",
  },
  btn: {
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#f3f2f1",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default function TodayDemoPage({
  slots = [],
  onChanged,
  isLoadingData,
}) {
  const [pageSearchTerm, setPageSearchTerm] = useState("");

  return (
    <div>
      {/* single searchbar only on this page */}
      <div style={pageSearchStyles.wrapper}>
        <div style={pageSearchStyles.inner}>
          <input
            type="search"
            placeholder="Search across all tables on this page..."
            value={pageSearchTerm}
            onChange={(e) => setPageSearchTerm(e.target.value)}
            style={pageSearchStyles.input}
          />
          <button
            type="button"
            style={pageSearchStyles.btn}
            onClick={() => setPageSearchTerm("")}
          >
            Clear
          </button>
        </div>
      </div>

      {slots.map((slot) => (
        <SlotTable
          key={slot.slotHeader}
          slot={slot}
          onChanged={onChanged}
          isProtected={slot.isProtected}
          isLoadingData={isLoadingData}
          pageSearchTerm={pageSearchTerm}
        />
      ))}
    </div>
  );
}