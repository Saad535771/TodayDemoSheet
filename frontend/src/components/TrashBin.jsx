import { useState } from "react";
import PaymentCloneTrashTable from "./PaymentCloneTrashTable.jsx";
import MonthlyTrashBin from "./MonthlyTrashBin.jsx";

const styles = {
  page: {
    padding: "20px",
    background: "#f4f6f8",
    minHeight: "100vh",
  },
  switcher: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #1f2937",
    background: "#fff",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
  },
  activeTab: {
    background: "#1f2937",
    color: "#fff",
  },
};

export default function TrashBin() {
  const [activeTab, setActiveTab] = useState("monthly");

  return (
    <div style={styles.page}>
      <div style={styles.switcher}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "monthly" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("monthly")}
        >
          MonthlySheet Trash
        </button>

        <button
          style={{
            ...styles.tab,
            ...(activeTab === "paymentClone" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("paymentClone")}
        >
          PaymentSheet With Date Trash
        </button>
      </div>

      {activeTab === "monthly" ? (
        <MonthlyTrashBin />
      ) : (
        <PaymentCloneTrashTable />
      )}
    </div>
  );
}