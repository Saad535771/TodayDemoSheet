import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";

function isEmptyHistoryValue(value) {
  return value === null || value === undefined || String(value) === "";
}

export default function CellHistoryPopup({
  isOpen,
  onClose,
  x = 0,
  y = 0,
  tuitionId,
  paymentCloneId,
  paymentCloneTeamBId,
  rowId,
  fieldName,
  apiUrl = "/tuitions/history/track",
  config,
}) {
  const resolved = useMemo(
    () => ({
      isOpen: config?.isOpen ?? isOpen,
      x: config?.x ?? x ?? 0,
      y: config?.y ?? y ?? 0,
      recordId:
        config?.recordId ??
        rowId ??
        paymentCloneId ??
        paymentCloneTeamBId ??
        tuitionId ??
        null,
      fieldName: config?.field ?? config?.fieldName ?? fieldName ?? "",
      type: config?.type || "",
      apiUrl: config?.apiUrl || apiUrl,
    }),
    [
      apiUrl,
      config,
      fieldName,
      isOpen,
      paymentCloneId,
      paymentCloneTeamBId,
      rowId,
      tuitionId,
      x,
      y,
    ]
  );

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!resolved.isOpen || !resolved.recordId || !resolved.fieldName) return;

    let cancelled = false;

    const fetchCellHistory = async () => {
      setLoading(true);
      setLoadError("");

      try {
        let response;

        if (resolved.type) {
          const type = encodeURIComponent(resolved.type);
          const recordIdValue = encodeURIComponent(resolved.recordId);
          const field = encodeURIComponent(resolved.fieldName);

          response = await api.get(
            `/otm-management/history/${type}/${recordIdValue}/${field}`
          );
        } else {
          const params = {
            fieldName: resolved.fieldName,
            limit: 100,
            sort: "DESC",
          };

          if (tuitionId) params.tuitionId = tuitionId;
          if (resolved.recordId && !tuitionId) params.rowId = resolved.recordId;

          response = await api.get(resolved.apiUrl, { params });
        }

        if (!cancelled) {
          setHistory(Array.isArray(response.data?.data) ? response.data.data : []);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch cell history", error);
        if (!cancelled) {
          setHistory([]);
          setLoadError(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              "Failed to load history."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchCellHistory();

    return () => {
      cancelled = true;
    };
  }, [
    resolved.apiUrl,
    resolved.fieldName,
    resolved.isOpen,
    resolved.recordId,
    resolved.type,
    tuitionId,
  ]);

  useEffect(() => {
    if (!resolved.isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, resolved.isOpen]);

  if (!resolved.isOpen) return null;

  const popupWidth = 340;
  const popupHeight = 180;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const safeX = Math.max(
    12,
    resolved.x + popupWidth > viewportWidth
      ? viewportWidth - popupWidth - 20
      : resolved.x
  );
  const safeY = Math.max(
    12,
    resolved.y + popupHeight > viewportHeight
      ? viewportHeight - popupHeight - 20
      : resolved.y
  );

  const record = history[currentIndex];
  const editor =
    record?.edited_by ||
    record?.changed_by_name ||
    record?.editor_name ||
    "System";
  const changedAt = record?.created_at || record?.changed_at;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label={`History for ${resolved.fieldName}`}
        style={{
          position: "absolute",
          top: safeY,
          left: safeX,
          width: popupWidth,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.2)",
          border: "1px solid #dbe3ef",
          padding: 14,
          zIndex: 10000,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: ".04em",
            marginBottom: 8,
          }}
        >
          {resolved.fieldName} history
        </div>

        {loading ? (
          <div style={{ color: "#555", fontSize: 14, padding: "10px 0" }}>
            Loading history...
          </div>
        ) : loadError ? (
          <div style={{ color: "#b91c1c", fontSize: 13, padding: "8px 0" }}>
            {loadError}
          </div>
        ) : history.length === 0 ? (
          <div style={{ color: "#555", fontSize: 14, padding: "10px 0" }}>
            No edit history for this cell.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#202124" }}>
                  {editor}
                </div>
                <div style={{ fontSize: 12, color: "#5f6368", marginTop: 2 }}>
                  {changedAt
                    ? new Date(changedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })
                    : "Time unavailable"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {currentIndex + 1}/{history.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(prev + 1, history.length - 1)
                    )
                  }
                  disabled={currentIndex === history.length - 1}
                  style={{
                    background: "none",
                    border: "none",
                    cursor:
                      currentIndex === history.length - 1 ? "default" : "pointer",
                    color:
                      currentIndex === history.length - 1 ? "#cbd5e1" : "#475569",
                    fontSize: 18,
                    padding: "0 4px",
                  }}
                  title="Older edit"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: currentIndex === 0 ? "default" : "pointer",
                    color: currentIndex === 0 ? "#cbd5e1" : "#475569",
                    fontSize: 18,
                    padding: "0 4px",
                  }}
                  title="Newer edit"
                >
                  {">"}
                </button>
              </div>
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#202124",
                lineHeight: 1.5,
                wordBreak: "break-word",
                maxHeight: 120,
                overflow: "auto",
              }}
            >
              {isEmptyHistoryValue(record?.old_value) ? (
                <span>
                  Added <strong>{String(record?.new_value ?? "")}</strong>
                </span>
              ) : isEmptyHistoryValue(record?.new_value) ? (
                <span>
                  Deleted <strong>{String(record?.old_value ?? "")}</strong>
                </span>
              ) : (
                <span>
                  Replaced <strong>{String(record?.old_value)}</strong> with{" "}
                  <strong>{String(record?.new_value)}</strong>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
