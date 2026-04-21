import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OtmPortalEntryForm from "./OtmPortalEntryForm.jsx";
import {DEFAULT_DAY_OPTIONS,DEFAULT_DURATION_OPTIONS,DEFAULT_STATUS_OPTIONS,
  GRID_DIMENSIONS,DayTimeAssignmentsEditor,Pagination,TEXT_COLUMNS,
  Toolbar,MultiSelectCell,addMinutes,extractMonthYear,getDisplayName,
  getDurationLabel,getStatusMeta,matchesFilters,matchesSearch,
  normalizeArray,normalizeMonthValue,normalizeString,
  normalizeTimeText,paginate,sortDays,styles,} from "./otmPortalShared.jsx";
function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}
function areRowListsEqual(prevRows, nextRows) {
  if (prevRows === nextRows) return true;
  if (!Array.isArray(prevRows) || !Array.isArray(nextRows)) return false;
  if (prevRows.length !== nextRows.length) return false;
  for (let index = 0; index < prevRows.length; index += 1) {
    if (stableSerialize(prevRows[index]) !== stableSerialize(nextRows[index])) {
      return false;
    }
  }
  return true;
}
function buildTimeAssignments(days = [], assignments = {}, fallbackDay = "", fallbackTime = "") {
  const safeDays = sortDays(days);
  const normalizedFallbackTime = normalizeTimeText(fallbackTime);
  return Object.fromEntries(
    safeDays.map((day) => {
      const directValue = assignments?.[day];
      const legacyValue = fallbackDay === day ? normalizedFallbackTime : "";
      return [day, normalizeTimeText(directValue ?? legacyValue)];
    })
  );
}
function getPrimaryTime(days = [], assignments = {}) {
  const firstDay = sortDays(days)[0];
  if (!firstDay) return "";
  return normalizeTimeText(assignments?.[firstDay]);
}

function buildDayTimeSummary(days = [], assignments = {}) {
  return sortDays(days)
    .map((day) => {
      const time = normalizeTimeText(assignments?.[day]);
      return time ? `${day}: ${time}` : `${day}: --`;
    })
    .join(" • ");
}
function computeRow(row, durationOptions) {
  const legacyDay = normalizeString(row.day);
  const legacyTime = normalizeTimeText(row.time || normalizeArray(row.timeSlots)[0] || "");
  const providedDays = normalizeArray(row.days);
  const assignmentDays =
    row.timeAssignments && typeof row.timeAssignments === "object" ? Object.keys(row.timeAssignments): [];
  const days = sortDays(providedDays.length ? providedDays : legacyDay ? [legacyDay] : assignmentDays);
  const durationMinutes = Number(row.durationMinutes || 60);
  const timeAssignments = buildTimeAssignments(days, row.timeAssignments || {}, legacyDay, legacyTime);
  const timeSlots = days.map((day) => normalizeTimeText(timeAssignments[day])).filter(Boolean);
  const time = getPrimaryTime(days, timeAssignments) || legacyTime;
  const classStartTime = time || normalizeString(row.classStartTime);
  const classEndTime = classStartTime
    ? addMinutes(classStartTime, durationMinutes)
    : normalizeString(row.classEndTime);

  return {
    ...row,
    day: days[0] || legacyDay,
    days,
    dayText: days.join(", "),
    time,
    timeText: buildDayTimeSummary(days, timeAssignments),
    timeSlots,
    timeAssignments,
    durationMinutes,
    durationLabel: getDurationLabel(durationOptions, durationMinutes),
    classStartTime,
    classEndTime,
    tuitionStartMonth: normalizeMonthValue(row.tuitionStartMonth),
    tuitionEndMonth: normalizeMonthValue(row.tuitionEndMonth),
    notes: row.notes || "",
    newTuition: Boolean(row.newTuition || row.newTuitionName),
    newTuitionName: normalizeString(row.newTuitionName) || "",
    sourceTuitionId: normalizeString(row.sourceTuitionId),
    status: normalizeString(row.status).toLowerCase() || "",
  };
}

function buildEntryPayload(row) {
  const normalizedDays = sortDays(row.days || []);
  const normalizedAssignments = buildTimeAssignments(
    normalizedDays,
    row.timeAssignments || {},
    row.day,
    row.time
  );
  const primaryTime = getPrimaryTime(normalizedDays, normalizedAssignments);
  const { tuitionEndMonth, ...safeRow } = row || {};

  return {
    ...safeRow,
    day: normalizedDays[0] || "",
    days: normalizedDays,
    dayText: normalizedDays.join(", "),
    time: primaryTime,
    timeText: buildDayTimeSummary(normalizedDays, normalizedAssignments),
    timeAssignments: normalizedAssignments,
    timeSlots: normalizedDays.map((day) => normalizedAssignments[day]).filter(Boolean),
    classStartTime: primaryTime,
    classEndTime: primaryTime ? addMinutes(primaryTime, row.durationMinutes) : "",
  };
}

function makeEmptyDraft(durationOptions) {
  return {
    days: [],
    timeAssignments: {},
    durationMinutes: Number(durationOptions?.[0]?.value || 60),
    tuitionStartMonth: "",
    tuitionName: "",
    tutorName: "",
    groupName: "",
    classStartTime: "",
    classEndTime: "",
    status: "",
    notes: "",
    newTuition: false,
    newTuitionName: "",
  };
}

function buildCellPrefix(rowId, columnKey) {
  return `${rowId}::${columnKey}`;
}

function buildEditorKey(rowId, columnKey, editorKey = "main") {
  return `${buildCellPrefix(rowId, columnKey)}::${editorKey}`;
}

function getElementSnapshot(key, element) {
  if (!element?.isConnected || element.disabled) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    key,
    element,
    rect,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    area: rect.width * rect.height,
  };
}

function isTextInputLike(element) {
  if (!element) return false;
  if (element.tagName === "TEXTAREA") return true;
  if (element.tagName !== "INPUT") return false;
  const type = (element.type || "text").toLowerCase();
  return ["text", "search", "email", "url", "tel", "password"].includes(type);
}

function shouldNavigateHorizontally() {
  return true;
}

function shouldNavigateVertically() {
  return true;
}

export default function OtmPortalSheet({
  user,
  portalUser,
  isAdmin = false,
  title = "OTM Portal",
  subtitle,
  initialEntries = [],
  loading = false,
  meta = {},
  reportRows = [],
  reportSummary = null,
  totalClassRows = [],
  totalClassSummary = null,
  onCreateEntry,
  onUpdateEntry,
  onReorderEntries,
  onDeleteEntry,
  onAdminUserChange,
}) {
  const dayOptions = meta.dayOptions?.length ? meta.dayOptions : DEFAULT_DAY_OPTIONS;
  const statusOptions = meta.statusOptions?.length ? meta.statusOptions : DEFAULT_STATUS_OPTIONS;
  const durationOptions =
    meta.durationOptions?.length ? meta.durationOptions : DEFAULT_DURATION_OPTIONS;
  const timeOptions = meta.classTimes?.length
    ? meta.classTimes.map((item) => item.label || item.startTime)
    : [];
  const displayName = useMemo(() => getDisplayName(portalUser || user), [portalUser, user]);

  const [tab, setTab] = useState("tuitions");
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(() => makeEmptyDraft(durationOptions));
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeCellPrefix, setActiveCellPrefix] = useState("");
  const saveTimeoutsRef = useRef(new Map());
  const entriesRef = useRef([]);
  const editorRegistryRef = useRef(new Map());
  const [searchByTab, setSearchByTab] = useState({ tuitions: "", reports: "", totalClass: "" });
  const [filtersByTab, setFiltersByTab] = useState({
    tuitions: { day: "", month: "", year: "", status: "" },
    reports: { day: "", month: "", year: "", status: "" },
    totalClass: { day: "", month: "", year: "", status: "" },
  });
  const [pageByTab, setPageByTab] = useState({ tuitions: 1, reports: 1, totalClass: 1 });
  const [pageSizeByTab, setPageSizeByTab] = useState({ tuitions: 20, reports: 20, totalClass: 20 });

  useEffect(() => {
    const nextEntries = (Array.isArray(initialEntries) ? initialEntries : []).map((row) =>
      computeRow(row, durationOptions)
    );

    setEntries((prev) => (areRowListsEqual(prev, nextEntries) ? prev : nextEntries));
    setSelectedIds((prev) => {
      const validIds = new Set(nextEntries.map((row) => row.id));
      const filtered = prev.filter((id) => validIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [initialEntries, durationOptions]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => () => {
    saveTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    saveTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    setDraft(makeEmptyDraft(durationOptions));
  }, [durationOptions]);

  const currentSearch = searchByTab[tab] || "";
  const currentFilters = filtersByTab[tab];
  const currentPageSize = pageSizeByTab[tab] || 20;

  const yearOptions = useMemo(() => {
    const years = new Set();
    [...entries, ...reportRows, ...totalClassRows].forEach((row) => {
      const { year } = extractMonthYear(row);
      if (year) years.add(year);
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [entries, reportRows, totalClassRows]);

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (row) => matchesSearch(row, searchByTab.tuitions) && matchesFilters(row, filtersByTab.tuitions)
      ),
    [entries, searchByTab.tuitions, filtersByTab.tuitions]
  );

  const filteredReportRows = useMemo(
    () =>
      (reportRows || []).filter(
        (row) => matchesSearch(row, searchByTab.reports) && matchesFilters(row, filtersByTab.reports)
      ),
    [reportRows, searchByTab.reports, filtersByTab.reports]
  );

  const filteredTotalClassRows = useMemo(
    () =>
      (totalClassRows || []).filter(
        (row) =>
          matchesSearch(row, searchByTab.totalClass) &&
          matchesFilters(row, filtersByTab.totalClass)
      ),
    [totalClassRows, searchByTab.totalClass, filtersByTab.totalClass]
  );

  const pagedEntries = useMemo(
    () => paginate(filteredEntries, pageByTab.tuitions, pageSizeByTab.tuitions),
    [filteredEntries, pageByTab.tuitions, pageSizeByTab.tuitions]
  );
  const pagedReportRows = useMemo(
    () => paginate(filteredReportRows, pageByTab.reports, pageSizeByTab.reports),
    [filteredReportRows, pageByTab.reports, pageSizeByTab.reports]
  );
  const pagedTotalClassRows = useMemo(
    () => paginate(filteredTotalClassRows, pageByTab.totalClass, pageSizeByTab.totalClass),
    [filteredTotalClassRows, pageByTab.totalClass, pageSizeByTab.totalClass]
  );

  const registerEditor = useCallback((editorKey, node) => {
    if (!editorKey) return;
    if (node) {
      editorRegistryRef.current.set(editorKey, node);
    } else {
      editorRegistryRef.current.delete(editorKey);
    }
  }, []);

  const getEditorSnapshotList = useCallback(() => {
    return Array.from(editorRegistryRef.current.entries())
      .map(([key, element]) => getElementSnapshot(key, element))
      .filter(Boolean)
      .sort((a, b) => {
        if (Math.abs(a.top - b.top) > 8) return a.top - b.top;
        if (Math.abs(a.left - b.left) > 8) return a.left - b.left;
        return a.area - b.area;
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
          if (isMatch) {
            score = (current.left - item.right) * 8 + Math.abs(item.centerY - current.centerY);
          }
        } else if (direction === "right") {
          isMatch = item.left >= current.right - 2;
          if (isMatch) {
            score = (item.left - current.right) * 8 + Math.abs(item.centerY - current.centerY);
          }
        } else if (direction === "up") {
          isMatch = item.bottom <= current.top + 2;
          if (isMatch) {
            score = (current.top - item.bottom) * 8 + Math.abs(item.centerX - current.centerX);
          }
        } else if (direction === "down") {
          isMatch = item.top >= current.bottom - 2;
          if (isMatch) {
            score = (item.top - current.bottom) * 8 + Math.abs(item.centerX - current.centerX);
          }
        }

        if (isMatch && score < bestScore) {
          bestScore = score;
          candidate = item;
        }
      }

      if (!candidate) {
        if (direction === "left" || direction === "up") {
          candidate = items[currentIndex - 1] || null;
        } else if (direction === "right" || direction === "down") {
          candidate = items[currentIndex + 1] || null;
        }
      }

      if (candidate) {
        focusEditorByKey(candidate.key);
      }
    },
    [focusEditorByKey, getEditorSnapshotList]
  );

  function getRowIdFromEditorKey(editorKey) {
    return String(editorKey || "").split("::")[0] || "";
  }

  const handleGridEditorKeyDown = useCallback(
    (event, editorKey, { multiline = false } = {}) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "ArrowLeft" && shouldNavigateHorizontally(event)) {
        event.preventDefault();
        focusDirectionalCell(editorKey, "left");
        return;
      }

      if (event.key === "ArrowRight" && shouldNavigateHorizontally(event)) {
        event.preventDefault();
        focusDirectionalCell(editorKey, "right");
        return;
      }

      if (event.key === "ArrowUp" && shouldNavigateVertically(event)) {
        event.preventDefault();
        focusDirectionalCell(editorKey, "up");
        return;
      }

      if (event.key === "ArrowDown" && shouldNavigateVertically(event)) {
        event.preventDefault();
        focusDirectionalCell(editorKey, "down");
        return;
      }

      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        const rowId = getRowIdFromEditorKey(editorKey);

        const persistAndMove = async () => {
          if (rowId && onUpdateEntry) {
            const timeoutId = saveTimeoutsRef.current.get(rowId);
            if (timeoutId) {
              clearTimeout(timeoutId);
              saveTimeoutsRef.current.delete(rowId);
            }

            const sourceRow = entriesRef.current.find((item) => item.id === rowId);
            if (sourceRow) {
              try {
                await onUpdateEntry(rowId, buildEntryPayload(sourceRow));
              } catch (error) {
                console.error("Failed to update row", error);
              }
            }
          }

          focusSequentialEditor(editorKey, event.shiftKey ? -1 : 1);
        };

        void persistAndMove();
      }
    },
    [focusDirectionalCell, focusSequentialEditor, onUpdateEntry]
  );

  const getCellClassName = useCallback(
    (rowId, columnKey) => {
      const cellPrefix = buildCellPrefix(rowId, columnKey);
      return `otm-grid-cell ${activeCellPrefix === cellPrefix ? "otm-grid-cell--active" : ""}`;
    },
    [activeCellPrefix]
  );

  const getGridEditorBindings = useCallback(
    (rowId, columnKey, editorSubKey = "main", options = {}) => {
      const cellPrefix = buildCellPrefix(rowId, columnKey);
      const editorKey = buildEditorKey(rowId, columnKey, editorSubKey);
      return {
        ref: (node) => registerEditor(editorKey, node),
        onFocus: () => setActiveCellPrefix(cellPrefix),
        onKeyDown: (event) => handleGridEditorKeyDown(event, editorKey, options),
        "data-grid-editor": "true",
        "data-grid-key": editorKey,
      };
    },
    [handleGridEditorKeyDown, registerEditor]
  );

  function setSearchValue(value) {
    setSearchByTab((prev) => ({ ...prev, [tab]: value }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  function setFilterValue(nextFilters) {
    setFiltersByTab((prev) => ({ ...prev, [tab]: nextFilters }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  function setPageSizeValue(size) {
    setPageSizeByTab((prev) => ({ ...prev, [tab]: size }));
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }

  const flushRowSave = useCallback(
    async (rowId, overrideRow = null) => {
      if (!onUpdateEntry || !rowId) return;

      const timeoutId = saveTimeoutsRef.current.get(rowId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        saveTimeoutsRef.current.delete(rowId);
      }

      const sourceRow = overrideRow || entriesRef.current.find((item) => item.id === rowId);
      if (!sourceRow) return;

      try {
        await onUpdateEntry(rowId, buildEntryPayload(sourceRow));
      } catch (error) {
        console.error("Failed to update row", error);
      }
    },
    [onUpdateEntry]
  );

  const scheduleRowSave = useCallback(
    (rowId, overrideRow = null, delay = 350) => {
      if (!onUpdateEntry || !rowId) return;

      const existingTimeout = saveTimeoutsRef.current.get(rowId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        flushRowSave(rowId, overrideRow);
      }, delay);

      saveTimeoutsRef.current.set(rowId, timeoutId);
    },
    [flushRowSave, onUpdateEntry]
  );

  function updateDraftField(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "days") {
        const sorted = sortDays(value);
        const nextAssignments = {};
        sorted.forEach((day) => {
          nextAssignments[day] = prev.timeAssignments?.[day] || "";
        });
        next.days = sorted;
        next.timeAssignments = nextAssignments;
      }
      if (field === "durationMinutes") {
        next.durationMinutes = Number(value || 60);
      }
      return next;
    });
  }

  function updateDraftTime(day, value) {
    setDraft((prev) => ({
      ...prev,
      timeAssignments: {
        ...(prev.timeAssignments || {}),
        [day]: value,
      },
    }));
  }

  const updateRow = useCallback(
    (rowId, field, value, options = {}) => {
      let nextRowSnapshot = null;

      setEntries((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;

          let nextRow = row;

          if (field === "days") {
            const nextDays = sortDays(value);
            const nextAssignments = buildTimeAssignments(
              nextDays,
              row.timeAssignments || {},
              row.day,
              row.time
            );
            nextRow = computeRow(
              {
                ...row,
                day: nextDays[0] || "",
                days: nextDays,
                timeAssignments: nextAssignments,
                timeSlots: nextDays.map((day) => nextAssignments[day]).filter(Boolean),
                time: getPrimaryTime(nextDays, nextAssignments),
              },
              durationOptions
            );
          } else if (field === "timeAssignments") {
            const nextAssignments = buildTimeAssignments(row.days || [], value, row.day, row.time);
            nextRow = computeRow(
              {
                ...row,
                timeAssignments: nextAssignments,
                timeSlots: (row.days || []).map((day) => nextAssignments[day]).filter(Boolean),
                time: getPrimaryTime(row.days || [], nextAssignments),
              },
              durationOptions
            );
          } else {
            nextRow = computeRow({ ...row, [field]: value }, durationOptions);
          }

          nextRowSnapshot = nextRow;
          return nextRow;
        })
      );

      if (options.save !== false && nextRowSnapshot) {
        scheduleRowSave(rowId, nextRowSnapshot, options.delay ?? 350);
      }

      return nextRowSnapshot;
    },
    [durationOptions, scheduleRowSave]
  );

  async function createRow() {
    if (!onCreateEntry) return;
    const validDays = sortDays(draft.days);
    if (!draft.tuitionName || validDays.length === 0) {
      alert("Please add tuition name and select at least one day.");
      return;
    }

    const missingTimeDay = validDays.find((day) => !normalizeTimeText(draft.timeAssignments?.[day]));
    if (missingTimeDay) {
      alert(`Please add time for ${missingTimeDay}.`);
      return;
    }

    try {
      setCreating(true);
      await onCreateEntry(
        buildEntryPayload({
          ...draft,
          day: validDays[0] || "",
          days: validDays,
          timeAssignments: Object.fromEntries(
            validDays.map((day) => [day, normalizeTimeText(draft.timeAssignments?.[day])])
          ),
        })
      );
      setDraft(makeEmptyDraft(durationOptions));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to create rows");
    } finally {
      setCreating(false);
    }
  }

  const saveRow = useCallback(
    async (rowId) => {
      await flushRowSave(rowId);
    },
    [flushRowSave]
  );

  async function deleteRow(rowId) {
    if (!onDeleteEntry) return;
    if (!window.confirm("Delete this row?")) return;
    try {
      await onDeleteEntry(rowId);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete row");
    }
  }

  function toggleSelectRow(rowId) {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  }

  async function moveSelected(direction) {
    if (!onReorderEntries || selectedIds.length === 0) return;

    const next = [...entries];
    const selectedSet = new Set(selectedIds);

    if (direction === "up") {
      for (let index = 1; index < next.length; index += 1) {
        if (selectedSet.has(next[index].id) && !selectedSet.has(next[index - 1].id)) {
          [next[index - 1], next[index]] = [next[index], next[index - 1]];
        }
      }
    } else {
      for (let index = next.length - 2; index >= 0; index -= 1) {
        if (selectedSet.has(next[index].id) && !selectedSet.has(next[index + 1].id)) {
          [next[index], next[index + 1]] = [next[index + 1], next[index]];
        }
      }
    }

    setEntries(next);
    try {
      await onReorderEntries(next.map((item) => item.id));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to reorder rows");
    }
  }

  function renderTextInput(row, field, isDraft = false, readOnly = false, textarea = false) {
    const value = row[field] || "";
    const editorBindings = !isDraft ? getGridEditorBindings(row.id, field, "main", { multiline: textarea }) : {};

    if (readOnly) {
      return <div style={styles.readOnlyCell}>{value || "--"}</div>;
    }

    const commonProps = {
      className: "otm-grid-editor",
      value,
      onChange: (event) => {
        if (isDraft) updateDraftField(field, event.target.value);
        else updateRow(row.id, field, event.target.value);
      },
      onBlur: () => {
        if (!isDraft) saveRow(row.id);
      },
      ...editorBindings,
    };

    if (textarea) {
      return <textarea style={styles.cellTextArea} {...commonProps} />;
    }

    return <input style={styles.cellInput} {...commonProps} />;
  }

  function renderExistingRowDayTimeDuration(row) {
    return (
      <>
        <td className={getCellClassName(row.id, "days")} style={{ ...styles.td, width: GRID_DIMENSIONS.days, position: "relative" }}>
          <MultiSelectCell
            value={row.days || []}
            options={dayOptions}
            placeholder="Select days"
            onChange={(next) => updateRow(row.id, "days", next)}
            triggerProps={getGridEditorBindings(row.id, "days")}
            onRequestMove={(direction) => focusDirectionalCell(row.id + "::days::main", direction)}
          />
        </td>

        <td className={getCellClassName(row.id, "timeAssignments")} style={{ ...styles.td, width: GRID_DIMENSIONS.time }}>
          <DayTimeAssignmentsEditor
            days={row.days || []}
            assignments={row.timeAssignments || {}}
            timeOptions={timeOptions}
            listId={`time-options-${row.id}`}
            compact
            getEditorProps={(day) => getGridEditorBindings(row.id, "timeAssignments", day)}
            onChange={(day, value) => {
              updateRow(row.id, "timeAssignments", {
                ...(row.timeAssignments || {}),
                [day]: value,
              });
            }}
          />
        </td>

        <td className={getCellClassName(row.id, "durationMinutes")} style={{ ...styles.td, width: GRID_DIMENSIONS.duration }}>
          <select
            className="otm-grid-editor"
            style={styles.select}
            value={row.durationMinutes || durationOptions[0]?.value || 60}
            onChange={(event) => updateRow(row.id, "durationMinutes", Number(event.target.value))}
            onBlur={() => saveRow(row.id)}
            {...getGridEditorBindings(row.id, "durationMinutes")}
          >
            {durationOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </td>
      </>
    );
  }

  if (loading) {
    return <div style={styles.empty}>Loading OTM portal...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>{subtitle || `Logged in as ${displayName}`}</p>

          {isAdmin && (
            <div style={styles.adminBar}>
              <div style={styles.adminLabel}>Admin portal switcher</div>
              <select
                style={{ ...styles.select, maxWidth: 360 }}
                value={portalUser?.id || ""}
                onChange={(event) => onAdminUserChange?.(event.target.value)}
              >
                <option value="">Select OTM user</option>
                {(meta.otmUsers || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={styles.tabsWrap}>
          <button style={styles.tabBtn(tab === "tuitions")} onClick={() => setTab("tuitions")}>
            {displayName} Tuitions
          </button>
          <button style={styles.tabBtn(tab === "reports")} onClick={() => setTab("reports")}>
            Reports
          </button>
          <button style={styles.tabBtn(tab === "totalClass")} onClick={() => setTab("totalClass")}>
            Total Classes
          </button>
        </div>

        <div style={styles.body}>
          {tab === "tuitions" && (
            <>
              <style>{`
                .otm-grid-row:hover td {
                  background: #f8fafc;
                }
                .otm-grid-cell {
                  position: relative;
                  transition: background-color 0.15s ease, box-shadow 0.15s ease;
                }
                .otm-grid-cell--active {
                  background: #ecfdf5 !important;
                  box-shadow: inset 0 0 0 2px #16a34a;
                  z-index: 2;
                }
                .otm-grid-editor {
                  transition: box-shadow 0.15s ease, border-color 0.15s ease;
                }
                .otm-grid-editor:focus {
                  outline: none;
                  border-color: #16a34a !important;
                  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
                }
                .otm-grid-checkbox {
                  width: 14px;
                  height: 14px;
                  cursor: pointer;
                }
              `}</style>

              <OtmPortalEntryForm
                draft={draft}
                dayOptions={dayOptions}
                timeOptions={timeOptions}
                durationOptions={durationOptions}
                statusOptions={statusOptions}
                creating={creating}
                onDraftFieldChange={updateDraftField}
                onDraftTimeChange={updateDraftTime}
                onCreateEntry={createRow}
              />

              <Toolbar
                title="Spreadsheet Controls"
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={selectedIds.length}
                onMoveUp={() => moveSelected("up")}
                onMoveDown={() => moveSelected("down")}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
              />

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, ...styles.checkCell }}>Sel</th>
                        <th style={{ ...styles.th, ...styles.numberCell }}>#</th>
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.days }}>Days</th>
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.time }}>Time</th>
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.duration }}>Duration</th>
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.startMonth }}>Month</th>
                        {TEXT_COLUMNS.map((column) => (
                          <th key={column.key} style={{ ...styles.th, width: column.width }}>
                            {column.label}
                          </th>
                        ))}
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.status }}>Status</th>
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.newTuition }}>New Tuition</th>
                        <th style={{ ...styles.th, width: GRID_DIMENSIONS.action }}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={10 + TEXT_COLUMNS.length} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                            No entries found.
                          </td>
                        </tr>
                      ) : (
                        pagedEntries.map((row, index) => (
                          <tr key={row.id} className="otm-grid-row">
                            <td
                              className="otm-grid-cell"
                              style={{ ...styles.td, ...styles.checkCell, textAlign: "center", verticalAlign: "middle" }}
                            >
                              <input
                                className="otm-grid-checkbox"
                                type="checkbox"
                                checked={selectedIds.includes(row.id)}
                                onChange={() => toggleSelectRow(row.id)}
                              />
                            </td>
                            <td
                              className="otm-grid-cell"
                              style={{ ...styles.td, ...styles.numberCell, verticalAlign: "middle" }}
                            >
                              {(pageByTab.tuitions - 1) * pageSizeByTab.tuitions + index + 1}
                            </td>

                            {renderExistingRowDayTimeDuration(row)}

                            <td className={getCellClassName(row.id, "tuitionStartMonth")} style={{ ...styles.td, width: GRID_DIMENSIONS.startMonth }}>
                              <input
                                className="otm-grid-editor"
                                type="month"
                                style={styles.cellInput}
                                value={row.tuitionStartMonth || ""}
                                onChange={(event) => updateRow(row.id, "tuitionStartMonth", event.target.value)}
                                onBlur={() => saveRow(row.id)}
                                {...getGridEditorBindings(row.id, "tuitionStartMonth")}
                              />
                            </td>

                            {TEXT_COLUMNS.map((column) => (
                              <td className={getCellClassName(row.id, column.key)} key={column.key} style={{ ...styles.td, width: column.width }}>
                                {renderTextInput(row, column.key, false, column.readOnly, column.textarea)}
                              </td>
                            ))}

                            <td className={getCellClassName(row.id, "status")} style={{ ...styles.td, width: GRID_DIMENSIONS.status }}>
                              <select
                                className="otm-grid-editor"
                                style={styles.statusSelect(row.status)}
                                value={row.status || ""}
                                onChange={(event) => updateRow(row.id, "status", event.target.value)}
                                onBlur={() => saveRow(row.id)}
                                {...getGridEditorBindings(row.id, "status")}
                              >
                                {statusOptions.map((item) => (
                                  <option key={item} value={item}>
                                    {getStatusMeta(item).label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className={getCellClassName(row.id, "newTuitionName")} style={{ ...styles.td, width: GRID_DIMENSIONS.newTuition }}>
                              <input
                                className="otm-grid-editor"
                                type="text"
                                style={styles.cellInput}
                                value={row.newTuitionName || ""}
                                onChange={(event) => updateRow(row.id, "newTuitionName", event.target.value)}
                                onBlur={() => saveRow(row.id)}
                                placeholder="Monthly tuition name"
                                {...getGridEditorBindings(row.id, "newTuitionName")}
                              />
                            </td>

                            <td className="otm-grid-cell" style={{ ...styles.td, width: GRID_DIMENSIONS.action, padding: 4, verticalAlign: "middle" }}>
                              <button type="button" style={styles.deleteBtn} onClick={() => deleteRow(row.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                totalItems={filteredEntries.length}
                page={pageByTab.tuitions}
                pageSize={pageSizeByTab.tuitions}
                onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, tuitions: nextPage }))}
              />
            </>
          )}

          {tab === "reports" && (
            <>
              <div style={styles.sectionGrid}>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Total Entries</h3>
                  <div style={styles.statValue}>{reportSummary?.totalEntries || 0}</div>
                </div>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Class Done</h3>
                  <div style={styles.statValue}>{reportSummary?.byStatus?.["class done"] || 0}</div>
                </div>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Class Pending</h3>
                  <div style={styles.statValue}>{reportSummary?.byStatus?.["class pending"] || 0}</div>
                </div>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Missed Total</h3>
                  <div style={styles.statValue}>
                    {(reportSummary?.byStatus?.["missed by teacher"] || 0) +
                      (reportSummary?.byStatus?.["missed by student"] || 0)}
                  </div>
                </div>
              </div>

              <Toolbar
                title="Report Summary"
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={0}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
              />

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.reportTable}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh}>Teacher</th>
                        <th style={styles.reportTh}>Tuition</th>
                        <th style={styles.reportTh}>Days</th>
                        <th style={styles.reportTh}>Start Month</th>
                        <th style={styles.reportTh}>End Month</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>Class Done</th>
                        <th style={styles.reportTh}>Class Pending</th>
                        <th style={styles.reportTh}>Missed By Teacher</th>
                        <th style={styles.reportTh}>Missed By Student</th>
                        <th style={styles.reportTh}>New Tuition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedReportRows.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={styles.reportTd}>
                            No report rows found.
                          </td>
                        </tr>
                      ) : (
                        pagedReportRows.map((row, index) => (
                          <tr key={`${row.teacherName}-${row.tuitionName}-${index}`} style={{ background: row.rowColor || "#fff" }}>
                            <td style={styles.reportTd}>{row.teacherName}</td>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>
                              {Array.isArray(row.days) ? row.days.join(", ") : row.day || row.days || "--"}
                            </td>
                            <td style={styles.reportTd}>{row.tuitionStartMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionEndMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.totalClasses}</td>
                            <td style={styles.reportTd}>{row.classDoneCount}</td>
                            <td style={styles.reportTd}>{row.classPendingCount}</td>
                            <td style={styles.reportTd}>{row.missedByTeacherCount}</td>
                            <td style={styles.reportTd}>{row.missedByStudentCount}</td>
                            <td style={styles.reportTd}>{row.newTuitionCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                totalItems={filteredReportRows.length}
                page={pageByTab.reports}
                pageSize={pageSizeByTab.reports}
                onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, reports: nextPage }))}
              />
            </>
          )}

          {tab === "totalClass" && (
            <>
              <div style={styles.sectionGrid}>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>Total Done Classes</h3>
                  <div style={styles.statValue}>{totalClassSummary?.totalClasses || 0}</div>
                </div>
              </div>

              <Toolbar
                title="Done Classes Summary"
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={0}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
              />

              <div style={styles.sheetWrap}>
                <div style={styles.sheetViewport}>
                  <table style={styles.reportTable}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh}>Tuition</th>
                        <th style={styles.reportTh}>Tutor</th>
                        <th style={styles.reportTh}>Day</th>
                        <th style={styles.reportTh}>Time</th>
                        <th style={styles.reportTh}>Duration</th>
                        <th style={styles.reportTh}>Start Month</th>
                        <th style={styles.reportTh}>End Month</th>
                        <th style={styles.reportTh}>Status</th>
                        <th style={styles.reportTh}>Total Classes</th>
                        <th style={styles.reportTh}>New Tuition Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTotalClassRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={styles.reportTd}>
                            No total class rows found.
                          </td>
                        </tr>
                      ) : (
                        pagedTotalClassRows.map((row, index) => (
                          <tr key={`${row.tuitionName}-${row.tutorName}-${index}`} style={{ background: row.rowColor || "#fff" }}>
                            <td style={styles.reportTd}>{row.tuitionName}</td>
                            <td style={styles.reportTd}>{row.tutorName}</td>
                            <td style={styles.reportTd}>{row.days}</td>
                            <td style={styles.reportTd}>{row.time}</td>
                            <td style={styles.reportTd}>{row.duration}</td>
                            <td style={styles.reportTd}>{row.tuitionStartMonth || "--"}</td>
                            <td style={styles.reportTd}>{row.tuitionEndMonth || "--"}</td>
                            <td style={styles.reportTd}>
                              {(() => {
                                const statusMeta = getStatusMeta(row.status);
                                return (
                                  <span
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 999,
                                      display: "inline-block",
                                      border: `1px solid ${statusMeta.border}`,
                                      background: statusMeta.background,
                                      color: statusMeta.color,
                                    }}
                                  >
                                    {statusMeta.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={styles.reportTd}>{row.totalClasses}</td>
                            <td style={styles.reportTd}>{row.newTuitionCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                totalItems={filteredTotalClassRows.length}
                page={pageByTab.totalClass}
                pageSize={pageSizeByTab.totalClass}
                onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, totalClass: nextPage }))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
