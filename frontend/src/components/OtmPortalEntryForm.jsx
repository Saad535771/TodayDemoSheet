import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DayTimeAssignmentsEditor,
  getStatusMeta,
  sortDays,
  styles,
  GRID_DIMENSIONS,
} from "./otmPortalShared.jsx";
export function MultiTagInput({ value = [], onChange, onBlur, placeholder, gridBindings = {} }) {
  const tags = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) return value.split(",").map(t => t.trim());
    return [];
  }, [value]);
  const [inputValue, setInputValue] = useState("");

  const commitInput = useCallback(() => {
    const newTag = inputValue.trim().replace(/,/g, "");
    if (!newTag) return tags;

    const nextTags = tags.includes(newTag)
      ? tags
      : [...tags, newTag];

    onChange(nextTags);
    setInputValue("");
    return nextTags;
  }, [inputValue, onChange, tags]);

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      e.stopPropagation();
      commitInput();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.stopPropagation();
      onChange(tags.slice(0, -1));
    } else if (gridBindings.onKeyDown) {
      gridBindings.onKeyDown(e);
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div style={localStyles.tagWrap}>
      {tags.map((tag, idx) => (
        <span key={idx} style={localStyles.tagPill}>
          {tag}
          <button type="button" onClick={() => removeTag(idx)} style={localStyles.tagRemove}>×</button>
        </span>
      ))}
      <input
        type="text"
        className="otm-grid-editor"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        ref={gridBindings.ref}
        onKeyDown={handleKeyDown}
        onFocus={gridBindings.onFocus}
        onBlur={(event) => {
          if (inputValue.trim()) {
            commitInput();
          }
          gridBindings.onBlur?.(event);
          onBlur?.(event);
        }}
        placeholder={tags.length ? "" : placeholder}
        style={localStyles.tagInput}
        data-grid-editor={gridBindings["data-grid-editor"]}
        data-grid-key={gridBindings["data-grid-key"]}
      />
    </div>
  );
}

// --------------------------------------------------------
// 2. MultiSelectDropdown (Days ke liye)
// --------------------------------------------------------
function MultiSelectDropdown({ value = [], options = [], placeholder = "Select days", onChange, triggerProps = {} }) {
  const selected = useMemo(() => sortDays(value || []), [value]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !optionRefs.current.some(n => n?.contains(event.target))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const toggleOption = useCallback((option) => {
    const isSelected = selected.includes(option);
    onChange(isSelected ? selected.filter((item) => item !== option) : sortDays([...selected, option]));
  }, [onChange, selected]);

  const handleTriggerKeyDown = useCallback((event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      setOpen((prev) => !prev);
      return;
    }
    triggerProps.onKeyDown?.(event);
  }, [triggerProps]);

  const selectedLabel = selected.length ? selected.map((item) => item.slice(0, 3)).join(", ") : placeholder;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        className="otm-grid-editor"
        ref={triggerRef}
        style={localStyles.dropdownTrigger(open, !!selected.length)}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        {...triggerProps}
      >
        <span style={localStyles.dropdownTriggerText(!!selected.length)}>{selectedLabel}</span>
        <span style={localStyles.dropdownArrow}>▾</span>
      </button>

      {open && (
        <div style={localStyles.dropdownMenu}>
          {options.map((option, index) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                ref={(node) => (optionRefs.current[index] = node)}
                type="button"
                style={localStyles.dropdownOption(active, index === activeIndex)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleOption(option)}
              >
                <span style={localStyles.dropdownCheck(active)}>{active ? "✓" : ""}</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------
// 3. Main Form Component
// --------------------------------------------------------
export default function OtmPortalEntryForm({
  draft = {},
  dayOptions = [],
  timeOptions = [],
  durationOptions = [],
  statusOptions = [],
  creating,
  onDraftFieldChange,
  onDraftTimeChange,
  onCreateEntry,
}) {
  const sortedDraftDays = useMemo(() => sortDays(draft.days || []), [draft.days]);

  const COL_WIDTHS = {
    days: "120px",
    time: "140px",
    duration: "90px",
    tuition: "130px",
    tutor: "140px",
    group: "140px",
    fee: "90px",
    start: "80px",
    end: "80px",
    notes: "130px",
    status: "100px",
    action: "90px",
  };

  return (
    <div style={styles.formCard}>
      <div style={{ ...styles.formHeader, padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Add OTM Tuition Entry</div>
      </div>

      <div style={{ overflowX: "auto", padding: "4px" }}>
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.days }}>Days</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.time }}>Time</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.duration }}>Duration</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.tuition }}>Tuition Name</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.tutor }}>Tutor Name</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.group }}>Group Name</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.fee }}>Decided Fee</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.start }}>Class Start</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.end }}>Class End</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.notes }}>Notes</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.status }}>Status</th>
              <th style={{ ...localStyles.th, width: COL_WIDTHS.action }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={localStyles.td}>
                <MultiSelectDropdown
                  value={draft.days}
                  options={dayOptions}
                  onChange={(next) => onDraftFieldChange("days", next)} />
              </td>
              <td style={localStyles.td}>
                <DayTimeAssignmentsEditor
                  days={sortedDraftDays}
                  assignments={draft.timeAssignments || {}}
                  timeOptions={timeOptions}
                  listId="otm-draft-time-options"
                  compact
                  onChange={onDraftTimeChange}
                />
              </td>
              <td style={localStyles.td}>
                <select
                  style={localStyles.inputBase}
                  value={draft.durationMinutes || durationOptions[0]?.value || 60}
                  onChange={(e) => onDraftFieldChange("durationMinutes", Number(e.target.value))}
                >
                  {durationOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </td>
              <td style={localStyles.td}>
                <input
                  type="text"
                  style={localStyles.inputBase}
                  value={draft.tuitionName || ""}
                  onChange={(e) => onDraftFieldChange("tuitionName", e.target.value)}
                  placeholder="Tuition"
                />
              </td>
              <td style={localStyles.td}>
                <MultiTagInput
                  value={draft.tutorName}
                  onChange={(next) => onDraftFieldChange("tutorName", next)}
                  placeholder="Tutor + Enter"
                />
              </td>
              <td style={localStyles.td}>
                <MultiTagInput
                  value={draft.groupName}
                  onChange={(next) => onDraftFieldChange("groupName", next)}
                  placeholder="Group + Enter"
                />
              </td>
              <td style={localStyles.td}>
                <input
                  type="number"
                  style={localStyles.inputBase}
                  value={draft.decidedFee || ""}
                  onChange={(e) => onDraftFieldChange("decidedFee", e.target.value)}
                  placeholder="Fee"
                />
              </td>
              <td style={localStyles.td}><div style={localStyles.readOnly}>Auto</div></td>
              <td style={localStyles.td}><div style={localStyles.readOnly}>Auto</div></td>
              <td style={localStyles.td}>
                <input
                  type="text"
                  style={localStyles.inputBase}
                  value={draft.notes || ""}
                  onChange={(e) => onDraftFieldChange("notes", e.target.value)}
                  placeholder="Notes"
                />
              </td>
              <td style={localStyles.td}>
                <select
                  style={{ ...localStyles.inputBase, background: draft.status === 'Active' ? '#dcfce7' : '#fff' }}
                  value={draft.status || ""}
                  onChange={(e) => onDraftFieldChange("status", e.target.value)}
                >
                  <option value="" disabled>Select</option>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>{getStatusMeta(item)?.label || item}</option>
                  ))}
                </select>
              </td>
              <td style={localStyles.td}>
                <button
                  type="button"
                  style={localStyles.actionBtn}
                  disabled={creating}
                  onClick={() => {
                    // Safe guard: Payload me se agar ghalti se bhi koi purani field ho toh remove kar dein
                    const payload = { ...draft };
                    onCreateEntry(payload);
                  }}
                >
                  {creating ? "..." : "Add"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
const localStyles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#e0f2fe", // Light blue background
    color: "#0369a1",           // Dark blue text
    border: "1px solid #bae6fd",
    borderRadius: "999px",      // Pill shape (fully rounded)
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: "500",
    margin: "2px"
  },
  removeBadgeBtn: {
    background: "none",
    border: "none",
    color: "#0369a1",
    marginLeft: "6px",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: "1",
    padding: 0,
    fontWeight: "bold"
  },
  tagInputContainer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "2px",
    width: "100%",
    minHeight: "32px",
    padding: "2px 4px",
    background: "transparent",
  },
th: {
    padding: "6px 4px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#475569",
    textAlign: "left",
    borderBottom: "1px solid #cbd5e1",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "4px",
    verticalAlign: "top",
    boxSizing: "border-box",
  },
  inputBase: {
    width: "100%",
    minHeight: "28px",
    padding: "0 6px",
    fontSize: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  readOnly: {
    width: "100%",
    minHeight: "28px",
    padding: "4px 6px",
    fontSize: "11px",
    color: "#94a3b8",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    boxSizing: "border-box",
    textAlign: "center",
  },
  actionBtn: {
    width: "100%",
    minHeight: "28px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  dropdownTrigger: (open, hasValue) => ({
    width: "100%",
    height: "28px",
    border: `1px solid ${open ? "#16a34a" : hasValue ? "#107c41" : "#cbd5e1"}`,
    borderRadius: "4px",
    padding: "0 6px",
    fontSize: "11px",
    fontWeight: 700,
    color: hasValue ? "#166534" : "#64748b",
    background: hasValue ? "#ecfdf5" : "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    boxSizing: "border-box",
  }),
  dropdownTriggerText: (hasValue) => ({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  dropdownArrow: { fontSize: "10px", color: "#475569" },
  dropdownMenu: {
    position: "relative",
    top: "30px",
    width:'150px',
    right: 0,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    zIndex: '9999',
    maxHeight: "150px",
    overflowY: "auto",
    padding: "2px",
  },
  dropdownOption: (active, focused) => ({
    width: "100%",
    border: "none",
    background: active ? "#ecfdf5" : focused ? "#f8fafc" : "#ffffff",
    color: "#0f172a",
    padding: "6px",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    textAlign: "left",
  }),
  dropdownCheck: (active) => ({
    width: "12px",
    height: "12px",
    border: `1px solid ${active ? "#16a34a" : "#cbd5e1"}`,
    background: active ? "#16a34a" : "#ffffff",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    borderRadius: "2px",
  }),
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2px",
    padding: "2px 4px",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    minHeight: "28px",
    background: "#fff",
    boxSizing: "border-box",
  },
  tagPill: {
    background: "#e0f2fe",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    borderRadius: "3px",
    padding: "0 4px",
    fontSize: "10px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
  },
  tagRemove: {
    border: "none",
    background: "transparent",
    color: "#0284c7",
    cursor: "pointer",
    fontSize: "12px",
    lineHeight: 1,
    padding: 0,
  },
  tagInput: {
    border: "none",
    outline: "none",
    fontSize: "11px",
    flex: 1,
    minWidth: "40px",
    background: "transparent",
  },
};