import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const DEFAULT_DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DEFAULT_STATUS_OPTIONS = [
  "class done",
  "class pending",
  "missed by teacher",
  "missed by student",
];
export const DEFAULT_DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];
export const GRID_DIMENSIONS = {
  days: 136,
  time: 140,
  duration: 92,
  startMonth: 98,
  status: 126,
  decidedFee: 92,
  action: 104,
};
export const TEXT_COLUMNS = [
  { key: "tuitionName", label: "Tuition Name", width: 118 },
  { key: "tutorName", label: "Tutor Name", width: 118 },
  { key: "groupName", label: "Group Name", width: 118, isTag: true }, // isTag add kiya
  { key: "decidedFee", label: "Decided Fee", width: 92 },           //
  { key: "classStartTime", label: "Class Start", width: 92 },
  { key: "classEndTime", label: "Class End", width: 92 },
  { key: "notes", label: "Notes", width: 132 },
];
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500];
export const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
export const DAY_INDEX = DEFAULT_DAY_OPTIONS.reduce((acc, day, index) => {
  acc[day.toLowerCase()] = index;
  return acc;
}, {});
export function normalizeString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

// Nested/stringified JSON ko normal value mein convert karta hai.
// Example:
// ["[\"Monday\"]"] => ["Monday"]
// "[\"tutor1\",\"tutor2\"]" => ["tutor1", "tutor2"]
export function decodeSerializedValue(value, maxDepth = 6) {
  let current = value;

  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (typeof current !== "string") {
      return current;
    }

    const text = current.trim();

    if (!text) {
      return "";
    }

    const candidates = [
      text,
      text
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\"),
    ];

    let parsedSuccessfully = false;
    let parsedValue = current;

    for (const candidate of candidates) {
      try {
        parsedValue = JSON.parse(candidate);
        parsedSuccessfully = true;
        break;
      } catch (error) {
        // Plain text ho to next candidate try karein.
      }
    }

    if (!parsedSuccessfully || parsedValue === current) {
      return current;
    }

    current = parsedValue;
  }

  return current;
}

export function normalizeArray(value) {
  const collectValues = (input, depth = 0) => {
    if (
      depth > 8 ||
      input === undefined ||
      input === null
    ) {
      return [];
    }

    const decoded = decodeSerializedValue(input);

    if (Array.isArray(decoded)) {
      return decoded.flatMap((item) =>
        collectValues(item, depth + 1)
      );
    }

    if (
      decoded &&
      typeof decoded === "object"
    ) {
      return Object.values(decoded).flatMap((item) =>
        collectValues(item, depth + 1)
      );
    }

    const text = normalizeString(decoded);

    if (!text) {
      return [];
    }

    const cleaned = text
      .replace(/\\"/g, '"')
      .replace(
        /^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g,
        ""
      )
      .trim();

    if (!cleaned) {
      return [];
    }

    return cleaned
      .split(/[,\n|]+/)
      .map((item) =>
        item
          .replace(/\\"/g, '"')
          .replace(
            /^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g,
            ""
          )
          .trim()
      )
      .filter(Boolean);
  };

  return [...new Set(collectValues(value))];
}

export function sortDays(days = []) {
  return normalizeArray(days).sort(
    (a, b) =>
      (DAY_INDEX[a.toLowerCase()] ?? 999) -
      (DAY_INDEX[b.toLowerCase()] ?? 999)
  );
}

export function normalizeTimeText(value) {
  const firstValue =
    normalizeArray(value)[0] ||
    normalizeString(value);

  const text = normalizeString(firstValue)
    .replace(/\s+/g, "");

  if (!text) {
    return "";
  }

  const match = text.match(
    /^(\d{1,2})(?::?(\d{1,2}))?(am|pm)$/i
  );

  if (!match) {
    return normalizeString(firstValue);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const suffix = match[3].toUpperCase();

  if (
    !Number.isFinite(hour) ||
    hour < 1 ||
    hour > 12
  ) {
    return normalizeString(firstValue);
  }

  if (
    !Number.isFinite(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return normalizeString(firstValue);
  }

  return `${hour}:${String(minute).padStart(
    2,
    "0"
  )} ${suffix}`;
}

export function toMinutes(timeLabel) {
  const normalized = normalizeTimeText(timeLabel);
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3].toUpperCase();
  if (suffix === "AM" && hour === 12) hour = 0;
  if (suffix === "PM" && hour !== 12) hour += 12;
  return hour * 60 + minute;
}

export function formatTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return "";
  let normalized = totalMinutes % (24 * 60);
  if (normalized < 0) normalized += 24 * 60;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function addMinutes(timeLabel, minutesToAdd) {
  const start = toMinutes(timeLabel);
  if (!Number.isFinite(start)) return "";
  return formatTime(start + Number(minutesToAdd || 0));
}

export function getDurationLabel(options, value) {
  const found = options.find((item) => Number(item.value) === Number(value));
  return found?.label || `${value} min`;
}

export function normalizeMonthValue(value) {
  const text = normalizeString(value);
  return /^\d{4}-\d{2}$/.test(text) ? text : "";
}

export function extractMonthYear(row) {
  const monthValue =
    normalizeMonthValue(row?.tuitionStartMonth) || normalizeMonthValue(row?.tuitionEndMonth);
  if (monthValue) {
    return {
      month: monthValue.slice(5, 7),
      year: monthValue.slice(0, 4),
    };
  }

  const createdAt = normalizeString(row?.createdAt);
  if (createdAt) {
    const date = new Date(createdAt);
    if (!Number.isNaN(date.getTime())) {
      return {
        month: String(date.getMonth() + 1).padStart(2, "0"),
        year: String(date.getFullYear()),
      };
    }
  }

  return { month: "", year: "" };
}

export function getStatusMeta(status) {
  const rawValue = normalizeString(status);
  const value = rawValue ? rawValue.toLowerCase() : "";
  if (!value) {
    return { label: "--", background: "#ffffff", color: "#64748b", border: "#d1d5db" };
  }
  if (value === "class done") {
    return {
      label: "Class Done",
      background: "#dcfce7",
      color: "#166534",
      border: "#15803d",
    };
  }
  if (value === "class pending") {
    return {
      label: "Class Pending",
      background: "#fef3c7",
      color: "#92400e",
      border: "#d97706",
    };
  }
  if (value === "tuition pause") {
    return {
      label: "Tuition Pause",
      background: "#e0e7ff",
      color: "#3730a3",
      border: "#6366f1",
    };
  }
  return {
    label: value === "missed by teacher" ? "Missed by Teacher" : "Missed by Student",
    background: "#fee2e2",
    color: "#b91c1c",
    border: "#ef4444",
  };
}

export function getDisplayName(user) {
  if (user?.name) return user.name;
  const prefix = user?.email?.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export function matchesSearch(row, searchTerm) {
  const query = normalizeString(searchTerm).toLowerCase();
  if (!query) return true;
  return Object.values(row || {}).some((value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase().includes(query);
    if (value && typeof value === "object") {
      return JSON.stringify(value).toLowerCase().includes(query);
    }
    return String(value ?? "").toLowerCase().includes(query);
  });
}

export function matchesFilters(row, filters) {
  const normalizedRowDays = normalizeArray(row.days);
  const rowDays = normalizeArray(
    normalizedRowDays.length ? normalizedRowDays : row.dayText || row.day || row.days
  ).map((day) => normalizeString(day).toLowerCase());
  const status = normalizeString(row.status).toLowerCase();
  const { month, year } = extractMonthYear(row);
  const selectedDay = normalizeString(filters?.day).toLowerCase();

  // Exact day matching prevents partial/serialized values from leaking into the result.
  if (selectedDay && !rowDays.includes(selectedDay)) return false;
  if (filters.status && status !== filters.status.toLowerCase()) return false;
  if (filters.month && filters.month !== month) return false;
  if (filters.year && filters.year !== year) return false;
  return true;
}

export function paginate(items, page, pageSize) {
  const safePage = Math.max(1, Number(page || 1));
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function MultiSelectCell({
  value = [],
  options = [],
  placeholder = "Select days",
  onChange,
  triggerProps = {},
  onRequestMove,
}) {
  const selected = useMemo(() => {
  const allowedDays = new Map(
    options.map((item) => [
      normalizeString(item).toLowerCase(),
      item,
    ])
  );

  return sortDays(value)
    .map((item) =>
      allowedDays.get(
        normalizeString(item).toLowerCase()
      )
    )
    .filter(Boolean);
}, [options, value]);
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
    <div style={styles.dropdownWrap}>
      <button
        type="button"
        className="otm-grid-editor"
        ref={mergedTriggerRef}
        style={styles.dropdownTrigger(open, !!selected.length)}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        onFocus={triggerProps.onFocus}
        data-grid-editor={triggerProps["data-grid-editor"]}
        data-grid-key={triggerProps["data-grid-key"]}
      >
{selected.length ? (
  <span style={styles.dropdownBadgeList}>
    {selected.map((item) => (
      <span
        key={item}
        style={styles.dayValueBadge}
      >
        {item}
      </span>
    ))}
  </span>
) : (
  <span
    style={styles.dropdownTriggerText(false)}
  >
    {placeholder}
  </span>
)}

<span style={styles.dropdownArrow}>▾</span>
      </button>

      {open && (
        <div style={styles.dropdownMenu}>
          {options.map((option, index) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                style={styles.dropdownOption(active, index === activeIndex)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleOption(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index, option)}
              >
                <span style={styles.dropdownCheck(active)}>{active ? "✓" : ""}</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BadgeList({
  value,
  emptyText = "--",
  variant = "default",
}) {
  const items = useMemo(
    () => normalizeArray(value),
    [value]
  );

  if (!items.length) {
    return (
      <span style={styles.badgeEmpty}>
        {emptyText}
      </span>
    );
  }

  return (
    <span style={styles.badgeList}>
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          style={styles.valueBadge(variant)}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

export function MultiValueBadgeInput({
  value,
  onChange,
  onBlur,
  placeholder = "Type and press Enter",
  triggerProps = {},
}) {
  const values = useMemo(
    () => normalizeArray(value),
    [value]
  );

  const [draftValue, setDraftValue] =
    useState("");

  const commitDraft = useCallback(
    (rawValue = draftValue) => {
      const incoming = normalizeArray(rawValue);

      if (!incoming.length) {
        return values;
      }

      const nextValues = [
        ...new Set([...values, ...incoming]),
      ];

      onChange?.(nextValues);
      setDraftValue("");

      return nextValues;
    },
    [draftValue, onChange, values]
  );

  const removeValue = useCallback(
    (item) => {
      onChange?.(
        values.filter(
          (valueItem) => valueItem !== item
        )
      );
    },
    [onChange, values]
  );

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      if (draftValue.trim()) {
        event.preventDefault();
        event.stopPropagation();
        commitDraft();
        return;
      }
    }

    if (
      event.key === "Backspace" &&
      !draftValue &&
      values.length
    ) {
      event.preventDefault();
      removeValue(values[values.length - 1]);
      return;
    }

    triggerProps.onKeyDown?.(event);
  };

  return (
    <div style={styles.badgeEditorWrap}>
      <div style={styles.badgeEditorValues}>
        {values.map((item, index) => (
          <span
            key={`${item}-${index}`}
            style={styles.editableValueBadge}
          >
            <span>{item}</span>

            <button
              type="button"
              tabIndex={-1}
              aria-label={`Remove ${item}`}
              style={styles.badgeRemoveBtn}
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() => removeValue(item)}
            >
              ×
            </button>
          </span>
        ))}

        <input
          {...triggerProps}
          className="otm-grid-editor"
          style={styles.badgeEditorInput}
          value={draftValue}
          placeholder={
            values.length ? "+ add" : placeholder
          }
          onChange={(event) =>
            setDraftValue(event.target.value)
          }
          onKeyDown={handleKeyDown}
          onPaste={(event) => {
            const pasted =
              event.clipboardData?.getData(
                "text"
              ) || "";

            if (/[,|\n]/.test(pasted)) {
              event.preventDefault();
              commitDraft(pasted);
            }
          }}
          onBlur={(event) => {
            if (draftValue.trim()) {
              commitDraft();
            }

            triggerProps.onBlur?.(event);
            onBlur?.(event);
          }}
        />
      </div>
    </div>
  );
}

export function DayTimeAssignmentsEditor({
  days = [],
  assignments = {},
  timeOptions = [],
  onChange,
  listId = "otm-time-options",
  compact = false,
  getEditorProps,
}) {
  const sortedDays = sortDays(days);
  if (sortedDays.length === 0) {
    return <div style={styles.placeholderCell}>Select days first</div>;
  }

  return (
    <div style={compact ? styles.dayTimeGridCompact : styles.dayTimeGrid}>
      {sortedDays.map((day) => {
        const editorProps = getEditorProps?.(day) || {};
        return (
          <div key={day} style={styles.dayTimeCard}>
            <div style={styles.dayTimeBadge}>{day}</div>
            <input
              list={listId}
              className="otm-grid-editor"
              style={compact ? styles.compactInputTight : styles.compactInput}
              placeholder="9:15 PM"
              value={assignments?.[day] || ""}
              onChange={(event) => onChange(day, event.target.value)}
              onBlur={(event) => onChange(day, normalizeTimeText(event.target.value))}
              {...editorProps}
            />
          </div>
        );
      })}
      <datalist id={listId}>
        {timeOptions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}

export function Toolbar({
  title,
  search,
  onSearch,
  filters,
  onFiltersChange,
  pageSize,
  onPageSizeChange,
  selectedCount,
  onMoveUp,
  onMoveDown,
  dayOptions,
  yearOptions,
  statusOptions,
  showStatus = true,
}) {
  return (
    <div style={styles.toolbarWrap}>
      <div style={styles.toolbarLeft}>
        <div style={styles.toolbarTitle}>{title || "Sheet Controls"}</div>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search across all fields"
        />
      </div>

      <div style={styles.toolbarRight}>
        <select
          style={styles.filterSelect}
          value={filters.day}
          onChange={(event) => onFiltersChange({ ...filters, day: event.target.value })}
        >
          <option value="">All days</option>
          {dayOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          style={styles.filterSelect}
          value={filters.month}
          onChange={(event) => onFiltersChange({ ...filters, month: event.target.value })}
        >
          <option value="">All months</option>
          {MONTH_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          style={styles.filterSelect}
          value={filters.year}
          onChange={(event) => onFiltersChange({ ...filters, year: event.target.value })}
        >
          <option value="">All years</option>
          {yearOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {showStatus && (
          <select
            style={styles.filterSelect}
            value={filters.status}
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
          >
            <option value="">All status</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )}

        <select
          style={styles.filterSelect}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>

        <button type="button" style={styles.moveBtn} onClick={onMoveUp} disabled={!selectedCount}>
          ↑ Move
        </button>
        <button type="button" style={styles.moveBtn} onClick={onMoveDown} disabled={!selectedCount}>
          ↓ Move
        </button>
        <div style={styles.selectionPill}>{selectedCount} selected</div>
      </div>
    </div>
  );
}

export function Pagination({ totalItems, page, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <div style={styles.paginationWrap}>
      <span style={styles.paginationMeta}>
        Page {page} of {totalPages} • {totalItems} record(s)
      </span>
      <div style={styles.paginationBtns}>
        <button
          type="button"
          style={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <button
          type="button"
          style={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export const styles = {
  page: {
    fontFamily: "'Calibri', sans-serif",
    color: "#0f172a",
  },
  card: {
    overflow: "hidden",
    background: "#ffffff",
  },
  header: {
    padding: "20px 22px",
  },
  title: { margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" },
  subtitle: { margin: "8px 0 0", color: "#475569", fontSize: 14, fontWeight: 600 },
  adminBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
  },
  adminLabel: { fontSize: 13, fontWeight: 800, color: "#1d4ed8" },
  tabsWrap: {
    display: "flex",
    gap: 4,
    padding: "0 16px",
    overflowX: "auto",
  },
  tabBtn: (active) => ({
    border: "none",
    borderBottom: active ? "3px solid #16a34a" : "3px solid transparent",
    background: "transparent",
    color: active ? "#16a34a" : "#475569",
    padding: "14px 18px",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),
  body: { padding: 16 },
  formCard: {
    marginBottom: 16,
    border: "1px solid #000000",
    borderRadius: 16,
    background: "#ffffff",
    overflow: "hidden",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "14px 16px 0",
  },
  formTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  formSubtitle: { fontSize: 12, color: "#475569", fontWeight: 600 },
  formSheetScroll: {
    overflowX: "auto",
    borderTop: "1px solid #000000",
    borderBottom: "1px solid #000000",
    marginTop: 10,
  },
  formTable: {
    width: "100%",
    minWidth: 1520,
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "fixed",
  },
  formHeadCell: {
    background: "#000000",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
    padding: "8px 6px",
    borderRight: "1px solid #000000",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  formBodyCell: {
    borderRight: "1px solid #000000",
    borderTop: "1px solid #000000",
    background: "#ffffff",
    padding: 0,
    verticalAlign: "top",
  },
  formActionCell: {
    borderTop: "1px solid #000000",
    background: "#ffffff",
    padding: 6,
    verticalAlign: "middle",
  },
  formInput: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
    textAlign: "center",
  },
  formSelect: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
    textAlign: "center",
    textAlignLast: "center",
  },
  formTextArea: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    textAlign: "center",
  },
  toolbarWrap: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  toolbarLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  toolbarRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  toolbarTitle: { fontWeight: 900, color: "#0f172a", fontSize: 14 },
  searchInput: {
    minWidth: 220,
    border: "1px solid #000000",
    borderRadius: 10,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
  },
  filterSelect: {
    border: "1px solid #dbe4ee",
    borderRadius: 10,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    background: "#fff",
  },
  moveBtn: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 10,
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  selectionPill: {
    padding: "6px 8px",
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#334155",
    fontSize: 11,
    fontWeight: 800,
  },
  sheetWrap: {
    border: "1px solid #000000",
    borderRadius: 16,
    background: "#fff",
    height: "76vh",
    overflow: "hidden",
  },
  sheetViewport: { overflow: "auto", background: "#fff", height: "76vh" },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 1560,
    tableLayout: "fixed",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 8,
    background: "#000000",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
    padding: "8px 6px",
    borderBottom: "1px solid #000000",
    borderRight: "1px solid #000000",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #000000",
    borderRight: "1px solid #000000",
    padding: 0,
    background: "#fff",
    verticalAlign: "top",
    textAlign: "center",
  },
  checkCell: { width: 42, minWidth: 42, maxWidth: 42, textAlign: "center" },
  numberCell: {
    width: 44,
    minWidth: 44,
    maxWidth: 44,
    textAlign: "center",
    fontWeight: 900,
  },
  cellInput: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
    textAlign: "center",
  },
  cellTextArea: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.35,
    textAlign: "center",
  },
  readOnlyCell: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    boxSizing: "border-box",
    background: "#f8fafc",
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "#0f172a",
    fontWeight: 700,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  select: {
    width: "100%",
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "transparent",
    textAlign: "center",
    textAlignLast: "center",
  },
  statusSelect: (status) => {
    const meta = getStatusMeta(status);
    return {
      width: "100%",
      minHeight: 30,
      border: `1px solid ${meta.border}`,
      borderRadius: 999,
      padding: "5px 8px",
      fontSize: 11,
      fontWeight: 900,
      color: meta.color,
      background: meta.background,
      outline: "none",
      boxSizing: "border-box",
      textTransform: "capitalize",
      textAlign: "center",
      textAlignLast: "center",
    };
  },
  actionBtn: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 8px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtn: {
    width: "100%",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: 10,
    padding: "10px 8px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  empty: {
    padding: 28,
    textAlign: "center",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: 16,
    background: "#f8fafc",
  },
  dropdownWrap: {
    position: "relative",
    padding: 4,
  },
  dropdownTrigger: (open, hasValue) => ({
    width: "100%",
    minHeight: 28,
    border: `1px solid ${open ? "#16a34a" : hasValue ? "#107c41" : "#cbd5e1"}`,

    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 800,
    color: hasValue ? "#166534" : "#64748b",
    background: hasValue ? "#ecfdf5" : "#ffffff",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
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
    fontSize: 10,
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
    zIndex: 999,
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
  multiWrap: { display: "grid", gap: 3, padding: 4, minHeight: 30 },
  pillSelectorWrap: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  dayPill: (active) => ({
    border: active ? "1px solid #107c41" : "1px solid #cbd5e1",
    background: active ? "#107c41" : "#ffffff",
    color: active ? "#ffffff" : "#334155",
    borderRadius: 999,
    minWidth: 28,
    padding: "4px 6px",
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
  }),
  multiHint: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 600,
    textAlign: "center",
  },
  multiValueText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: 700,
    textAlign: "center",
  },
  dayTimeGrid: {
    display: "grid",
    gap: 4,
  },
  dayTimeGridCompact: {
    display: "grid",
    gap: 4,
    padding: 6,
  },
  dayTimeCard: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 4,
    alignItems: "center",
  },
  dayTimeBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#334155",
    background: "#eef2f7",
    borderRadius: 999,
    padding: "4px 6px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  compactInput: {
    width: "100%",
    minHeight: 30,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "4px 6px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    textAlign: "center",
  },
  compactInputTight: {
    width: "100%",
    minHeight: 28,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "4px 6px",
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    textAlign: "center",
  },
  placeholderCell: {
    minHeight: 30,
    borderRadius: 8,
    border: "1px dashed #cbd5e1",
    padding: "6px 8px",
    fontSize: 11,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 12,
  },
  statTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: "#334155" },
  statValue: { marginTop: 10, fontSize: 32, fontWeight: 900, color: "#16a34a" },
  reportTable: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  reportTh: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 8,
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    color: "#334155",
    whiteSpace: "nowrap",
  },
  reportTd: {
    border: "1px solid #e5e7eb",
    padding: 8,
    fontSize: 11,
    color: "#0f172a",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    verticalAlign: "top",
  },
  paginationWrap: {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  paginationMeta: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  paginationBtns: { display: "flex", gap: 8 },
  pageBtn: {
    border: "1px solid #dbe4ee",
    background: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  dropdownBadgeList: {
  display: "grid",
  gap: 4,
  flex: 1,
  minWidth: 0,
  overflow: "visible",
},

dayValueBadge: {
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  background: "#eef2f7",
  color: "#334155",
  padding: "4px 6px",
  fontSize: 10,
  fontWeight: 900,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
},

badgeList: {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
},

badgeEmpty: {
  color: "#94a3b8",
  fontSize: 11,
},

valueBadge: (variant = "default") => ({
  display: "inline-flex",
  alignItems: "center",
 
  border: `1px solid ${
    variant === "day"
      ? "#86efac"
      : variant === "group"
        ? "#93c5fd"
        : "#c4b5fd"
  }`,
  background:
    variant === "day"
      ? "#dcfce7"
      : variant === "group"
        ? "#dbeafe"
        : "#ede9fe",
  color:
    variant === "day"
      ? "#166534"
      : variant === "group"
        ? "#1d4ed8"
        : "#6d28d9",
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 800,
  whiteSpace: "nowrap",
}),

badgeEditorWrap: {
  width: "100%",
  minHeight: 32,
  padding: 3,
  boxSizing: "border-box",
},

badgeEditorValues: {
  width: "100%",
  minHeight: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: 3,
},

editableValueBadge: {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  borderRadius: 999,
  border: "1px solid #93c5fd",
  background: "#eff6ff",
  color: "#1e40af",
  padding: "2px 4px 2px 7px",
  fontSize: 10,
  fontWeight: 800,
  maxWidth: "100%",
},

badgeRemoveBtn: {
  width: 16,
  height: 16,
  border: "none",
  borderRadius: 999,
  background: "rgba(30, 64, 175, 0.12)",
  color: "#1e40af",
  padding: 0,
  lineHeight: 1,
  fontSize: 12,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
},

badgeEditorInput: {
  flex: "1 1 62px",
  minWidth: 55,
  minHeight: 24,
  border: "none",
  outline: "none",
  background: "transparent",
  textAlign: "center",
  fontSize: 10,
  padding: "2px 4px",
},
};