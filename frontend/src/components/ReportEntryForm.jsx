import React, { useCallback, useMemo, useRef, useState } from "react";

const API_BASE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ||
  "http://localhost:5005/api"
).replace(/\/$/, "");

const REPORT_STATUS_OPTIONS = [
  { value: "report pending", label: "Report Pending" },
  { value: "report shared", label: "Report Shared" },
];

const FORM_COLUMNS = ["tuitionName", "groupName", "tutorName", "reportStatus", "save"];

function normalizeList(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .flatMap((item) => normalizeList(item, depth + 1))
          .map((item) => String(item).trim())
          .filter(Boolean)
      ),
    ];
  }

  if (typeof value === "object") {
    return normalizeList(Object.values(value), depth + 1);
  }

  const text = String(value).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (parsed !== text) return normalizeList(parsed, depth + 1);
  } catch {
    // Plain text is handled below.
  }

  return [
    ...new Set(
      text
        .replace(/\\"/g, '"')
        .replace(/^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g, "")
        .split(/[,|\n]+/)
        .map((item) =>
          item
            .replace(/\\"/g, '"')
            .replace(/^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g, "")
            .trim()
        )
        .filter(Boolean)
    ),
  ];
}

function buildReportPayload(draft) {
  return {
    tuitionName: String(draft.tuitionName || "").trim(),
    groupName: JSON.stringify(normalizeList(draft.groupName)),
    tutorName: JSON.stringify(normalizeList(draft.tutorName)),
    reportStatus: draft.reportStatus || "report pending",
    rowColor: draft.rowColor || "",
  };
}

function extractCreatedRecord(result) {
  return (
    result?.data?.data ||
    result?.data?.report ||
    result?.data?.row ||
    result?.data ||
    result?.report ||
    result?.row ||
    result ||
    null
  );
}

function shouldMoveLeft(element) {
  if (!element || typeof element.selectionStart !== "number") return true;
  return element.selectionStart === 0 && element.selectionEnd === 0;
}

function shouldMoveRight(element) {
  if (!element || typeof element.selectionStart !== "number") return true;
  const length = String(element.value || "").length;
  return element.selectionStart === length && element.selectionEnd === length;
}

function TagCellEditor({
  value,
  onChange,
  placeholder,
  inputRef,
  onFocus,
  onBlur,
  onGridKeyDown,
  variant = "group",
}) {
  const tags = useMemo(() => normalizeList(value), [value]);
  const [draft, setDraft] = useState("");

  const commit = useCallback(
    (rawValue = draft) => {
      const incoming = normalizeList(rawValue);
      if (!incoming.length) return false;

      onChange([...new Set([...tags, ...incoming])]);
      setDraft("");
      return true;
    },
    [draft, onChange, tags]
  );

  const remove = useCallback(
    (tag) => {
      onChange(tags.filter((item) => item !== tag));
    },
    [onChange, tags]
  );

  return (
    <div style={styles.tagCell} onClick={(event) => event.stopPropagation()}>
      {tags.map((tag) => (
        <span key={tag} style={styles.tagBadge(variant)}>
          <span>{tag}</span>
          <button
            type="button"
            tabIndex={-1}
            style={styles.tagRemove}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => remove(tag)}
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        type="text"
        value={draft}
        placeholder={tags.length ? "+ add" : placeholder}
        style={styles.tagInput}
        onFocus={onFocus}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
            event.preventDefault();
            event.stopPropagation();
            commit();
            return;
          }

          if (event.key === "Backspace" && !draft && tags.length) {
            event.preventDefault();
            remove(tags[tags.length - 1]);
            return;
          }

          onGridKeyDown?.(event);
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData?.getData("text/plain") || "";
          if (/[,|\n]/.test(pasted)) {
            event.preventDefault();
            commit(pasted);
          }
        }}
        onBlur={() => {
          if (draft.trim()) commit();
          onBlur?.();
        }}
      />
    </div>
  );
}

export default function ReportEntryForm({ onUpdateReport }) {
  const [reportDraft, setReportDraft] = useState({
    tuitionName: "",
    groupName: [],
    tutorName: [],
    reportStatus: "report pending",
    rowColor: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeCell, setActiveCell] = useState("tuitionName");
  const cellRefs = useRef(new Map());

  const registerCell = useCallback((key, node) => {
    if (node) cellRefs.current.set(key, node);
    else cellRefs.current.delete(key);
  }, []);

  const focusCell = useCallback((key) => {
    const node = cellRefs.current.get(key);
    if (!node?.focus) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  const moveHorizontal = useCallback(
    (currentKey, delta) => {
      const currentIndex = FORM_COLUMNS.indexOf(currentKey);
      if (currentIndex < 0) return;
      const nextIndex = Math.min(
        FORM_COLUMNS.length - 1,
        Math.max(0, currentIndex + delta)
      );
      focusCell(FORM_COLUMNS[nextIndex]);
    },
    [focusCell]
  );

  const handleChange = useCallback((field, value) => {
    setReportDraft((previous) => ({ ...previous, [field]: value }));
    setMessage({ type: "", text: "" });
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (!String(reportDraft.tuitionName || "").trim()) {
      setMessage({ type: "error", text: "Tuition Name is required." });
      focusCell("tuitionName");
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildReportPayload(reportDraft)),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error || result?.message || "Failed to save report.");
      }
      const createdRecord = extractCreatedRecord(result);
      onUpdateReport?.(createdRecord, result);
      window.dispatchEvent(
        new CustomEvent("otm-report-created", {
          detail: createdRecord,
        })
      );
      setReportDraft({
        tuitionName: "",
        groupName: [],
        tutorName: [],
        reportStatus: "report pending",
        rowColor: "",
      });
      setMessage({ type: "saved", text: "Saved" });

      window.setTimeout(() => {
        setMessage((current) => (current.type === "saved" ? { type: "", text: "" } : current));
      }, 1200);

      window.requestAnimationFrame(() => focusCell("tuitionName"));
    } catch (error) {
      console.error("Report save failed:", error);
      setMessage({ type: "error", text: error?.message || "Server connection failed." });
    } finally {
      setSaving(false);
    }
  }, [focusCell, onUpdateReport, reportDraft, saving]);

  const handleGridKeyDown = useCallback(
    (event, key) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "Tab") {
        event.preventDefault();
        moveHorizontal(key, event.shiftKey ? -1 : 1);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (key === "save") void handleSave();
        else moveHorizontal(key, 1);
        return;
      }

      if (event.key === "ArrowLeft" && shouldMoveLeft(event.currentTarget)) {
        event.preventDefault();
        moveHorizontal(key, -1);
        return;
      }

      if (event.key === "ArrowRight" && shouldMoveRight(event.currentTarget)) {
        event.preventDefault();
        moveHorizontal(key, 1);
      }
    },
    [handleSave, moveHorizontal]
  );

  const cellProps = useCallback(
    (key) => ({
      ref: (node) => registerCell(key, node),
      onFocus: () => setActiveCell(key),
      onKeyDown: (event) => handleGridKeyDown(event, key),
    }),
    [handleGridKeyDown, registerCell]
  );

  return (
    <div style={styles.sheetCard}>
      <div style={styles.viewport}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 44 }}>#</th>
              <th style={{ ...styles.th, width: 220 }}>Tuition Name</th>
              <th style={{ ...styles.th, width: 240 }}>Group Name</th>
              <th style={{ ...styles.th, width: 240 }}>Tutor Name</th>
              <th style={{ ...styles.th, width: 150 }}>Report Status</th>
              <th style={{ ...styles.th, width: 110 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.rowNumber}>1</td>

              <td style={styles.td(activeCell === "tuitionName")}>
                <input
                  {...cellProps("tuitionName")}
                  style={styles.cellInput}
                  value={reportDraft.tuitionName}
                  onChange={(event) => handleChange("tuitionName", event.target.value)}
                  placeholder="Type tuition name"
                />
              </td>

              <td style={styles.td(activeCell === "groupName")}>
                <TagCellEditor
                  value={reportDraft.groupName}
                  variant="group"
                  placeholder="Type group + Enter"
                  inputRef={(node) => registerCell("groupName", node)}
                  onFocus={() => setActiveCell("groupName")}
                  onGridKeyDown={(event) => handleGridKeyDown(event, "groupName")}
                  onChange={(value) => handleChange("groupName", value)}
                />
              </td>

              <td style={styles.td(activeCell === "tutorName")}>
                <TagCellEditor
                  value={reportDraft.tutorName}
                  variant="tutor"
                  placeholder="Type tutor + Enter"
                  inputRef={(node) => registerCell("tutorName", node)}
                  onFocus={() => setActiveCell("tutorName")}
                  onGridKeyDown={(event) => handleGridKeyDown(event, "tutorName")}
                  onChange={(value) => handleChange("tutorName", value)}
                />
              </td>

              <td style={styles.td(activeCell === "reportStatus")}>
                <select
                  {...cellProps("reportStatus")}
                  style={styles.cellSelect(reportDraft.reportStatus)}
                  value={reportDraft.reportStatus}
                  onChange={(event) => handleChange("reportStatus", event.target.value)}
                >
                  {REPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>

              <td style={styles.td(activeCell === "save")}>
                <button
                  {...cellProps("save")}
                  type="button"
                  disabled={saving}
                  style={styles.saveCellButton(saving)}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {message.type === "error" ? <div style={styles.inlineError}>{message.text}</div> : null}
    </div>
  );
}

const styles = {
  sheetCard: {
    border: "1px solid #64748b",
    background: "#ffffff",
    marginBottom: 14,
    overflow: "hidden",
    fontFamily: "Calibri, Arial, sans-serif",
  },
  titleBar: {
    minHeight: 46,
    padding: "8px 12px",
    background: "#107c41",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontWeight: 800, fontSize: 14 },
  subtitle: { fontSize: 11, opacity: 0.9, marginTop: 2 },
  saveState: (type) => ({
    minWidth: 72,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 700,
    color: type === "error" ? "#fee2e2" : "#ffffff",
  }),
  viewport: { overflowX: "auto" },
  table: {
    width: "100%",
    minWidth: 964,
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "fixed",
  },
  th: {
    height: 30,
    padding: "5px 7px",
    background: "#0f172a",
    color: "#ffffff",
    borderRight: "1px solid #475569",
    borderBottom: "1px solid #475569",
    fontSize: 11,
    fontWeight: 800,
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  rowNumber: {
    height: 38,
    padding: 0,
    background: "#f1f5f9",
    borderRight: "1px solid #94a3b8",
    borderBottom: "1px solid #94a3b8",
    textAlign: "center",
    color: "#64748b",
    fontWeight: 800,
    fontSize: 12,
  },
  td: (active) => ({
    height: 38,
    padding: 0,
    borderRight: "1px solid #94a3b8",
    borderBottom: "1px solid #94a3b8",
    background: active ? "#ecfdf5" : "#ffffff",
    boxShadow: active ? "inset 0 0 0 2px #16a34a" : "none",
    position: "relative",
  }),
  cellInput: {
    width: "100%",
    height: 37,
    padding: "6px 8px",
    border: 0,
    borderRadius: 0,
    outline: 0,
    background: "transparent",
    boxSizing: "border-box",
    fontSize: 12,
  },
  cellSelect: (status) => ({
    width: "100%",
    height: 37,
    padding: "5px 7px",
    border: 0,
    borderRadius: 0,
    outline: 0,
    background: status === "report shared" ? "#dcfce7" : "#fef3c7",
    color: status === "report shared" ? "#166534" : "#92400e",
    fontWeight: 800,
    fontSize: 11,
    textAlign: "center",
    textAlignLast: "center",
  }),
  tagCell: {
    width: "100%",
    minHeight: 37,
    padding: "3px 5px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 3,
    boxSizing: "border-box",
  },
  tagBadge: (variant) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    padding: "2px 4px 2px 7px",
    border: `1px solid ${variant === "group" ? "#93c5fd" : "#c4b5fd"}`,
    background: variant === "group" ? "#dbeafe" : "#ede9fe",
    color: variant === "group" ? "#1d4ed8" : "#6d28d9",
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
  }),
  tagRemove: {
    width: 15,
    height: 15,
    padding: 0,
    border: 0,
    borderRadius: 999,
    background: "rgba(15,23,42,0.08)",
    color: "inherit",
    cursor: "pointer",
    lineHeight: 1,
  },
  tagInput: {
    flex: "1 1 64px",
    minWidth: 54,
    height: 27,
    padding: "2px 4px",
    border: 0,
    outline: 0,
    background: "transparent",
    fontSize: 11,
  },
  saveCellButton: (saving) => ({
    width: "100%",
    height: 37,
    border: 0,
    borderRadius: 0,
    background: saving ? "#94a3b8" : "#16a34a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: saving ? "not-allowed" : "pointer",
  }),
  inlineError: {
    padding: "7px 10px",
    background: "#fef2f2",
    color: "#b91c1c",
    borderTop: "1px solid #fecaca",
    fontSize: 12,
    fontWeight: 700,
  },
};