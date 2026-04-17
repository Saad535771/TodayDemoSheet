import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DayTimeAssignmentsEditor,
  getStatusMeta,
  sortDays,
  styles,
  GRID_DIMENSIONS,
} from "./otmPortalShared.jsx";

function getElementSnapshot(key, element) {
  if (!element?.isConnected || element.disabled) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    key,
    element,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };
}

function MultiSelectDropdown({
  value = [],
  options = [],
  placeholder = "Select days",
  onChange,
  triggerProps = {},
  onRequestMove,
}) {
  const selected = useMemo(() => sortDays(value), [value]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  const mergedTriggerRef = useCallback(
    (node) => {
      triggerRef.current = node;
      const incomingRef = triggerProps.ref;
      if (typeof incomingRef === "function") {
        incomingRef(node);
      } else if (incomingRef && typeof incomingRef === "object") {
        incomingRef.current = node;
      }
    },
    [triggerProps]
  );

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      const triggerNode = triggerRef.current;
      if (!triggerNode) return;
      if (triggerNode.contains(event.target)) return;
      const hasOption = optionRefs.current.some((node) => node && node.contains(event.target));
      if (!hasOption) setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const nextIndex = Math.max(
      0,
      options.findIndex((item) => !selected.includes(item))
    );
    setActiveIndex(nextIndex === -1 ? 0 : nextIndex);
  }, [open, options, selected]);

  useEffect(() => {
    if (!open) return;
    const target = optionRefs.current[activeIndex];
    if (target?.focus) {
      target.focus({ preventScroll: true });
    }
  }, [activeIndex, open]);

  const toggleOption = useCallback(
    (option) => {
      const isSelected = selected.includes(option);
      const next = isSelected
        ? selected.filter((item) => item !== option)
        : sortDays([...selected, option]);
      onChange(next);
    },
    [onChange, selected]
  );

  const selectedLabel = selected.length
    ? selected.map((item) => item.slice(0, 3)).join(", ")
    : placeholder;

  const handleTriggerKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setActiveIndex((prev) => Math.min(options.length - 1, prev + 1));
        }
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setActiveIndex((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      triggerProps.onKeyDown?.(event);
    },
    [open, options.length, triggerProps]
  );

  const handleOptionKeyDown = useCallback(
    (event, index, option) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(options.length - 1, prev + 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleOption(option);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus?.({ preventScroll: true });
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus?.({ preventScroll: true });
        onRequestMove?.(event.key === "ArrowLeft" ? "left" : "right");
        return;
      }

      if (event.key === "Tab") {
        setOpen(false);
      }

      if (/^[a-z]$/i.test(event.key)) {
        const matchIndex = options.findIndex((item, itemIndex) => {
          if (itemIndex <= index) return false;
          return item.toLowerCase().startsWith(event.key.toLowerCase());
        });
        if (matchIndex !== -1) {
          event.preventDefault();
          setActiveIndex(matchIndex);
        }
      }
    },
    [onRequestMove, options, toggleOption]
  );

  return (
    <div style={localStyles.dropdownWrap}>
      <button
        type="button"
        className="otm-grid-editor"
        ref={mergedTriggerRef}
        style={localStyles.dropdownTrigger(open, !!selected.length)}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        onFocus={triggerProps.onFocus}
        data-grid-editor={triggerProps["data-grid-editor"]}
        data-grid-key={triggerProps["data-grid-key"]}
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
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                style={localStyles.dropdownOption(active, index === activeIndex)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleOption(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index, option)}
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

const FORM_FIELDS = {
  days: "form::days",
  duration: "form::duration",
  month: "form::month",
  tuitionName: "form::tuitionName",
  tutorName: "form::tutorName",
  groupName: "form::groupName",
  notes: "form::notes",
  status: "form::status",
  newTuitionName: "form::newTuitionName",
  action: "form::action",
};

export default function OtmPortalEntryForm({
  draft,
  dayOptions,
  timeOptions,
  durationOptions,
  statusOptions,
  creating,
  onDraftFieldChange,
  onDraftTimeChange,
  onCreateEntry,
}) {
  const editorRegistryRef = useRef(new Map());

  const registerEditor = useCallback((editorKey, node) => {
    if (!editorKey) return;
    if (node) editorRegistryRef.current.set(editorKey, node);
    else editorRegistryRef.current.delete(editorKey);
  }, []);

  const getEditorSnapshotList = useCallback(() => {
    return Array.from(editorRegistryRef.current.entries())
      .map(([key, element]) => getElementSnapshot(key, element))
      .filter(Boolean)
      .sort((a, b) => {
        if (Math.abs(a.top - b.top) > 8) return a.top - b.top;
        return a.left - b.left;
      });
  }, []);

  const focusEditorByKey = useCallback((editorKey) => {
    const element = editorRegistryRef.current.get(editorKey);
    if (!element?.focus) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  const focusSequentialEditor = useCallback(
    (currentKey, direction = 1) => {
      const items = getEditorSnapshotList();
      const currentIndex = items.findIndex((item) => item.key === currentKey);
      if (currentIndex === -1) return;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= items.length) return;
      focusEditorByKey(items[nextIndex].key);
    },
    [focusEditorByKey, getEditorSnapshotList]
  );

  const focusDirectionalCell = useCallback(
    (currentKey, direction) => {
      const items = getEditorSnapshotList();
      const currentIndex = items.findIndex((item) => item.key === currentKey);
      if (currentIndex === -1) return;
      const current = items[currentIndex];
      let candidate = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const item of items) {
        if (item.key === current.key) continue;

        let isMatch = false;
        let score = Number.POSITIVE_INFINITY;

        if (direction === "left") {
          isMatch = item.right <= current.left + 2;
          if (isMatch) score = (current.left - item.right) * 8 + Math.abs(item.centerY - current.centerY);
        } else if (direction === "right") {
          isMatch = item.left >= current.right - 2;
          if (isMatch) score = (item.left - current.right) * 8 + Math.abs(item.centerY - current.centerY);
        } else if (direction === "up") {
          isMatch = item.bottom <= current.top + 2;
          if (isMatch) score = (current.top - item.bottom) * 8 + Math.abs(item.centerX - current.centerX);
        } else if (direction === "down") {
          isMatch = item.top >= current.bottom - 2;
          if (isMatch) score = (item.top - current.bottom) * 8 + Math.abs(item.centerX - current.centerX);
        }

        if (isMatch && score < bestScore) {
          bestScore = score;
          candidate = item;
        }
      }

      if (!candidate) {
        if (direction === "left" || direction === "up") candidate = items[currentIndex - 1] || null;
        else candidate = items[currentIndex + 1] || null;
      }

      if (candidate) focusEditorByKey(candidate.key);
    },
    [focusEditorByKey, getEditorSnapshotList]
  );

  const handleEditorKeyDown = useCallback(
    (event, editorKey, options = {}) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusDirectionalCell(editorKey, "left");
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusDirectionalCell(editorKey, "right");
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusDirectionalCell(editorKey, "up");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusDirectionalCell(editorKey, "down");
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (options.onEnter) {
          options.onEnter();
          return;
        }
        focusSequentialEditor(editorKey, event.shiftKey ? -1 : 1);
      }
    },
    [focusDirectionalCell, focusSequentialEditor]
  );

  const getEditorBindings = useCallback(
    (editorKey, options = {}) => ({
      ref: (node) => registerEditor(editorKey, node),
      onKeyDown: (event) => handleEditorKeyDown(event, editorKey, options),
      "data-grid-editor": "true",
      "data-grid-key": editorKey,
    }),
    [handleEditorKeyDown, registerEditor]
  );

  const sortedDraftDays = useMemo(() => sortDays(draft.days), [draft.days]);

  return (
    <div style={styles.formCard}>
      <div style={styles.formHeader}>
        <div>
          <div style={styles.formTitle}>Add OTM Tuition Entry</div>
          <div style={styles.formSubtitle}>
            Days field is now dropdown based with keyboard support and multi-select.
          </div>
        </div>
      </div>

      <div style={styles.formSheetScroll}>
        <table style={styles.formTable}>
          <thead>
            <tr>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.days }}>Days</th>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.time }}>Time</th>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.duration }}>Duration</th>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.startMonth }}>Month</th>
              <th style={{ ...styles.formHeadCell, width: 118 }}>Tuition Name</th>
              <th style={{ ...styles.formHeadCell, width: 118 }}>Tutor Name</th>
              <th style={{ ...styles.formHeadCell, width: 118 }}>Group Name</th>
              <th style={{ ...styles.formHeadCell, width: 92 }}>Class Start</th>
              <th style={{ ...styles.formHeadCell, width: 92 }}>Class End</th>
              <th style={{ ...styles.formHeadCell, width: 132 }}>Notes</th>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.status }}>Status</th>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.newTuition }}>New Tuition</th>
              <th style={{ ...styles.formHeadCell, width: GRID_DIMENSIONS.action }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.formBodyCell, width: GRID_DIMENSIONS.days, position: "absolute" }}>
                <MultiSelectDropdown
                  value={draft.days}
                  options={dayOptions}
                  onChange={(next) => onDraftFieldChange("days", next)}
                  triggerProps={getEditorBindings(FORM_FIELDS.days)}
                  onRequestMove={(direction) =>
                    focusDirectionalCell(
                      FORM_FIELDS.days,
                      direction === "left" ? "left" : "right"
                    )
                  }
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: GRID_DIMENSIONS.time }}>
                <DayTimeAssignmentsEditor
                  days={sortedDraftDays}
                  assignments={draft.timeAssignments}
                  timeOptions={timeOptions}
                  listId="otm-draft-time-options"
                  compact
                  onChange={onDraftTimeChange}
                  getEditorProps={(day) =>
                    getEditorBindings(`form::time::${day}`, {
                      onEnter: () => focusSequentialEditor(`form::time::${day}`, 1),
                    })
                  }
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: GRID_DIMENSIONS.duration }}>
                <select
                  className="otm-grid-editor"
                  style={styles.formSelect}
                  value={draft.durationMinutes || durationOptions[0]?.value || 60}
                  onChange={(event) =>
                    onDraftFieldChange("durationMinutes", Number(event.target.value))
                  }
                  {...getEditorBindings(FORM_FIELDS.duration)}
                >
                  {durationOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ ...styles.formBodyCell, width: GRID_DIMENSIONS.startMonth }}>
                <input
                  className="otm-grid-editor"
                  type="month"
                  style={styles.formInput}
                  value={draft.tuitionStartMonth || ""}
                  onChange={(event) => onDraftFieldChange("tuitionStartMonth", event.target.value)}
                  {...getEditorBindings(FORM_FIELDS.month)}
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: 118 }}>
                <input
                  className="otm-grid-editor"
                  type="text"
                  style={styles.formInput}
                  value={draft.tuitionName || ""}
                  onChange={(event) => onDraftFieldChange("tuitionName", event.target.value)}
                  {...getEditorBindings(FORM_FIELDS.tuitionName)}
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: 118 }}>
                <input
                  className="otm-grid-editor"
                  type="text"
                  style={styles.formInput}
                  value={draft.tutorName || ""}
                  onChange={(event) => onDraftFieldChange("tutorName", event.target.value)}
                  {...getEditorBindings(FORM_FIELDS.tutorName)}
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: 118 }}>
                <input
                  className="otm-grid-editor"
                  type="text"
                  style={styles.formInput}
                  value={draft.groupName || ""}
                  onChange={(event) => onDraftFieldChange("groupName", event.target.value)}
                  {...getEditorBindings(FORM_FIELDS.groupName)}
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: 92 }}>
                <div style={styles.readOnlyCell}>Auto</div>
              </td>
              <td style={{ ...styles.formBodyCell, width: 92 }}>
                <div style={styles.readOnlyCell}>Auto</div>
              </td>
              <td style={{ ...styles.formBodyCell, width: 132 }}>
                <input
                  className="otm-grid-editor"
                  type="text"
                  style={styles.formInput}
                  value={draft.notes || ""}
                  onChange={(event) => onDraftFieldChange("notes", event.target.value)}
                  {...getEditorBindings(FORM_FIELDS.notes)}
                />
              </td>
              <td style={{ ...styles.formBodyCell, width: GRID_DIMENSIONS.status }}>
                <select
                  className="otm-grid-editor"
                  style={{ ...styles.formSelect, ...styles.statusSelect(draft.status), minHeight: 30 }}
                  value={draft.status || ""}
                  onChange={(event) => onDraftFieldChange("status", event.target.value)}
                  {...getEditorBindings(FORM_FIELDS.status)}
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {getStatusMeta(item).label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ ...styles.formBodyCell, width: GRID_DIMENSIONS.newTuition }}>
                <input
                  className="otm-grid-editor"
                  type="text"
                  style={styles.formInput}
                  value={draft.newTuitionName || ""}
                  onChange={(event) => onDraftFieldChange("newTuitionName", event.target.value)}
                  placeholder="Monthly tuition name"
                  {...getEditorBindings(FORM_FIELDS.newTuitionName)}
                />
              </td>
              <td style={{ ...styles.formActionCell, width: GRID_DIMENSIONS.action }}>
                <button
                  type="button"
                  style={styles.actionBtn}
                  onClick={onCreateEntry}
                  {...getEditorBindings(FORM_FIELDS.action, { onEnter: onCreateEntry })}
                >
                  {creating ? "Adding..." : "Add Entry"}
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
  dropdownWrap: {
    position: "relative",
    padding: 4,
  },
  dropdownTrigger: (open, hasValue) => ({
    width: "100%",
    minHeight: 30,
    border: `1px solid ${open ? "#16a34a" : hasValue ? "#107c41" : "#cbd5e1"}`,
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 800,
    color: hasValue ? "#166534" : "#64748b",
    background: hasValue ? "#ecfdf5" : "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    cursor: "pointer",
    outline: "none",
    textAlign: "left",
  }),
  dropdownTriggerText: (hasValue) => ({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: hasValue ? "#166534" : "#64748b",
  }),
  dropdownArrow: {
    fontSize: 12,
    color: "#475569",
    flexShrink: 0,
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 4,
    right: 4,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.14)",
    zIndex: 40,
    maxHeight: 180,
    overflowY: "auto",
    padding: 4,
  },
  dropdownOption: (active, focused) => ({
    width: "100%",
    border: focused ? "1px solid #16a34a" : "1px solid transparent",
    background: active ? "#ecfdf5" : focused ? "#f8fafc" : "#ffffff",
    color: "#0f172a",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    outline: "none",
    textAlign: "left",
  }),
  dropdownCheck: (active) => ({
    width: 14,
    height: 14,
    borderRadius: 4,
    border: `1px solid ${active ? "#16a34a" : "#cbd5e1"}`,
    background: active ? "#16a34a" : "#ffffff",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    flexShrink: 0,
  }),
};
