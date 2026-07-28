import { useEffect, useState } from "react";
import PaymentCloneTrashTable from "./PaymentCloneTrashTable.jsx";
import MonthlyTrashBin from "./MonthlyTrashBin.jsx";

const styles = {
  page: {
    background: "#f4f6f8",
    minHeight: "100vh",
  },
  switcher: {
    display: "flex",
    gap: "5px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  tab: {
    padding: "4px 8px",
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

export default function TrashBin({ onCountChange, isActive = true }) {
  const [activeTab, setActiveTab] = useState("monthly");
  const [paymentCloneCount, setPaymentCloneCount] = useState(0);

  useEffect(() => {
    if (typeof onCountChange === "function") {
      onCountChange(paymentCloneCount);
    }
  }, [activeTab, onCountChange, paymentCloneCount]);

  return (
    <div style={styles.page}>
      <div style={styles.switcher}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "monthly" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("monthly")}>
          MonthlySheet Trash
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "paymentClone" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("paymentClone")}>
          PaymentSheet With Date Trash
        </button>
      </div>
      {activeTab === "monthly" ? (
        <MonthlyTrashBin isActive={isActive && activeTab === "monthly"} />
      ) : (
        <PaymentCloneTrashTable isActive={isActive && activeTab === "paymentClone"} onCountChange={setPaymentCloneCount} />
      )}
    </div>
  );
}