import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import OtmPortalEntryForm, { MultiTagInput } from "./OtmPortalEntryForm.jsx";
import OtmReportTable, { REPORT_STATUS_OPTIONS } from "./OtmReportTable.jsx";
import ReportEntryForm from "./ReportEntryForm.jsx";
import OtmNotifications from "./OtmNotifications.jsx";
import OtmTotalClassSheet from "./OtmTotalClassSheet.jsx";
import CellHistoryPopup from './CellHistoryPopup';
import {
  DEFAULT_DAY_OPTIONS,
  DEFAULT_DURATION_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  GRID_DIMENSIONS,
  DayTimeAssignmentsEditor,
  Pagination,
  TEXT_COLUMNS,
  Toolbar,
  MultiSelectCell,
  addMinutes,
  decodeSerializedValue,
  extractMonthYear,
  getDisplayName,
  getDurationLabel,
  getStatusMeta,
  matchesFilters,
  matchesSearch,
  normalizeArray,
  normalizeMonthValue,
  normalizeString,
  normalizeTimeText,
  paginate,
  sortDays,
  styles,
  toMinutes,
} from "./otmPortalShared.jsx";

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

function resolveCanonicalDay(dayValue, allowedDays = []) {
  const normalized = normalizeString(dayValue).toLowerCase();
  if (!normalized) return "";

  const fromAllowed = sortDays(allowedDays).find(
    (day) => day.toLowerCase() === normalized
  );
  if (fromAllowed) return fromAllowed;

  const fromDefaults = DEFAULT_DAY_OPTIONS.find(
    (day) => day.toLowerCase() === normalized
  );
  return fromDefaults || normalizeString(dayValue);
}

function normalizeTimeSlotSequence(value) {
  const decoded = decodeSerializedValue(value);

  if (Array.isArray(decoded)) {
    return decoded.map((item) => normalizeTimeText(item));
  }

  if (decoded && typeof decoded === "object") {
    return Object.values(decoded).map((item) =>
      normalizeTimeText(item)
    );
  }

  return normalizeArray(decoded).map((item) =>
    normalizeTimeText(item)
  );
}

function normalizeTimeAssignmentsValue(
  value,
  days = [],
  timeSlots = [],
  fallbackDay = "",
  fallbackTime = ""
) {
  const safeDays = sortDays(days);
  const result = {};
  const assignedDays = new Set();

  const assign = (dayValue, timeValue) => {
    const day = resolveCanonicalDay(dayValue, safeDays);
    if (!day) return;
    result[day] = normalizeTimeText(timeValue);
    assignedDays.add(day.toLowerCase());
  };

  const ingest = (input, depth = 0) => {
    if (depth > 8 || input === null || input === undefined || input === "") return;

    const decoded = decodeSerializedValue(input);
    if (decoded !== input) {
      ingest(decoded, depth + 1);
      return;
    }

    if (Array.isArray(input)) {
      const objectItems = input.filter(
        (item) => item && typeof item === "object" && !Array.isArray(item)
      );

      if (objectItems.length) {
        objectItems.forEach((item) => {
          const day =
            item.day ??
            item.dayName ??
            item.day_name ??
            item.label ??
            item.name ??
            item.key;
          const time =
            item.time ??
            item.startTime ??
            item.start_time ??
            item.value ??
            item.classTime ??
            item.class_time;
          if (day !== undefined) {
            assign(day, time);
            return;
          }

          Object.entries(item).forEach(
            ([nestedDay, nestedTime]) => {
              const canonicalDay = resolveCanonicalDay(
                nestedDay,
                safeDays
              );
              if (
                DEFAULT_DAY_OPTIONS.some(
                  (defaultDay) =>
                    defaultDay.toLowerCase() ===
                    canonicalDay.toLowerCase()
                )
              ) {
                assign(canonicalDay, nestedTime);
              }
            }
          );
        });
        return;
      }

      const summaryItems = input.filter(
        (item) =>
          typeof item === "string" &&
          /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*:/i.test(
            item.trim()
          )
      );
      if (summaryItems.length) {
        summaryItems.forEach((item) => ingest(item, depth + 1));
        return;
      }

      input.forEach((timeValue, index) => {
        if (safeDays[index]) assign(safeDays[index], timeValue);
      });
      return;
    }

    if (input && typeof input === "object") {
      const entries = Object.entries(input);
      const dayEntries = entries.filter(([day]) => {
        const canonicalDay = resolveCanonicalDay(
          day,
          safeDays
        );
        return DEFAULT_DAY_OPTIONS.some(
          (defaultDay) =>
            defaultDay.toLowerCase() ===
            canonicalDay.toLowerCase()
        );
      });

      if (dayEntries.length) {
        dayEntries.forEach(([day, time]) =>
          assign(day, time)
        );
      } else {
        entries.forEach(([, nestedValue]) =>
          ingest(nestedValue, depth + 1)
        );
      }
      return;
    }

    const text = normalizeString(input);
    if (!text) return;

    const segments = text
      .split(/[•;\n|]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    let matched = false;
    segments.forEach((segment) => {
      const match = segment.match(
        /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*:\s*(.+)$/i
      );
      if (!match) return;
      assign(match[1], match[2]);
      matched = true;
    });

    if (!matched && safeDays.length === 1) {
      assign(safeDays[0], text);
    }
  };

  ingest(value);

  const normalizedSlots = normalizeTimeSlotSequence(
    timeSlots
  );
  normalizedSlots.forEach((timeValue, index) => {
    const day = safeDays[index];
    if (
      day &&
      !assignedDays.has(day.toLowerCase())
    ) {
      assign(day, timeValue);
    }
  });

  const canonicalFallbackDay = resolveCanonicalDay(fallbackDay, safeDays);
  if (
    canonicalFallbackDay &&
    !assignedDays.has(canonicalFallbackDay.toLowerCase()) &&
    normalizeString(fallbackTime)
  ) {
    assign(canonicalFallbackDay, fallbackTime);
  }

  return result;
}

function buildTimeAssignments(days = [], assignments = {}, fallbackDay = "", fallbackTime = "") {
  const safeDays = sortDays(days);
  const normalizedAssignments = normalizeTimeAssignmentsValue(
    assignments,
    safeDays,
    [],
    fallbackDay,
    fallbackTime
  );

  return Object.fromEntries(
    safeDays.map((day) => {
      const matchingKey = Object.keys(normalizedAssignments).find(
        (key) => normalizeString(key).toLowerCase() === day.toLowerCase()
      );
      return [
        day,
        normalizeTimeText(
          matchingKey ? normalizedAssignments[matchingKey] : ""
        ),
      ];
    })
  );
}

function hasMeaningfulTimeAssignments(value) {
  return Object.values(value || {}).some((time) => Boolean(normalizeString(time)));
}

function mergeIncomingRowWithLocal(
  incomingRow,
  localRow,
  durationOptions,
  preserveLocalSchedule = false
) {
  const incoming = computeRow(incomingRow || {}, durationOptions);
  if (!localRow) return incoming;

  const local = computeRow(localRow, durationOptions);
  const incomingHasTimes = hasMeaningfulTimeAssignments(incoming.timeAssignments);
  const localHasTimes = hasMeaningfulTimeAssignments(local.timeAssignments);

  if (!preserveLocalSchedule && (incomingHasTimes || !localHasTimes)) {
    return incoming;
  }

  return computeRow(
    {
      ...incoming,
      day: local.day,
      days: local.days,
      dayText: local.dayText,
      time: local.time,
      timeText: local.timeText,
      timeSlots: local.timeSlots,
      timeAssignments: local.timeAssignments,
      classStartTime: local.classStartTime,
      classEndTime: local.classEndTime,
      durationMinutes: local.durationMinutes,
    },
    durationOptions
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

function computeRow(row = {}, durationOptions) {
  const legacyDay = normalizeString(
    row.day ?? row.dayText ?? row.day_text
  );
  const rawTimeSlots =
    row.timeSlots ??
    row.time_slots ??
    [];
  const legacyTime = normalizeTimeText(
    row.time ??
    row.classStartTime ??
    row.class_start_time ??
    normalizeArray(rawTimeSlots)[0] ??
    ""
  );

  const providedDays = normalizeArray(
    row.days ??
    row.dayText ??
    row.day_text ??
    legacyDay
  );
  const baseDays = sortDays(
    providedDays.length
      ? providedDays
      : legacyDay
        ? normalizeArray(legacyDay)
        : []
  );

  const sourceAssignments = normalizeTimeAssignmentsValue(
    row.timeAssignments ??
      row.time_assignments ??
      row.dayTimeAssignments ??
      row.day_time_assignments ??
      {},
    baseDays,
    rawTimeSlots,
    baseDays[0] || legacyDay,
    legacyTime
  );

  const assignmentDays = Object.keys(sourceAssignments);
  const days = sortDays(
    baseDays.length ? baseDays : assignmentDays
  );

  const durationMinutes = Number(
    row.durationMinutes ??
    row.duration_minutes ??
    60
  );
  const timeAssignments = buildTimeAssignments(
    days,
    sourceAssignments,
    days[0] || legacyDay,
    legacyTime
  );
  const timeSlots = days.map((day) =>
    normalizeTimeText(timeAssignments[day])
  );
  const time = getPrimaryTime(days, timeAssignments) || legacyTime;

  const classStartTime =
    normalizeTimeText(
      row.classStartTime ??
      row.class_start_time
    ) || time;
  const classEndTime =
    normalizeTimeText(
      row.classEndTime ??
      row.class_end_time
    ) ||
    (classStartTime ? addMinutes(classStartTime, durationMinutes) : "");

  const tuitionStartMonth = normalizeMonthValue(
    row.tuitionStartMonth ??
      row.tuition_start_month ??
      (
        row.tuitionStartDate ??
        row.tuition_start_date
          ? String(
              row.tuitionStartDate ??
              row.tuition_start_date
            ).slice(0, 7)
          : ""
      )
  );

  return {
    ...row,
    day: days.join(", "),
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
    tuitionStartMonth,
    tuitionEndMonth: normalizeMonthValue(
      row.tuitionEndMonth ??
      row.tuition_end_month
    ),
    notes: row.notes || "",
    sourceTuitionId: normalizeString(
      row.sourceTuitionId ??
      row.source_tuition_id
    ),
    status:
      normalizeString(row.status).toLowerCase() ||
      "class pending",
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
    timeSlots: normalizedDays.map(
      (day) => normalizedAssignments[day] || ""
    ),
    classStartTime: primaryTime,
    classEndTime: primaryTime ? addMinutes(primaryTime, row.durationMinutes) : "",
    status: normalizeString(row.status).toLowerCase() || "class pending",
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
    decidedFee: "",
    classStartTime: "",
    classEndTime: "",
    status: "class pending",
    notes: "",
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

function shouldNavigateHorizontally() {
  return true;
}

function shouldNavigateVertically() {
  return true;
}

const GRID_CLIPBOARD_COLUMNS = [
  "days",
  "timeAssignments",
  "durationMinutes",
  "tuitionStartMonth",
  ...TEXT_COLUMNS.map((column) => column.key),
  "status",
];

function cloneRows(rows = []) {
  return rows.map((row) => JSON.parse(JSON.stringify(row)));
}

function getRowDays(row) {
  return sortDays(row?.days || row?.dayText || row?.day || []);
}

function getRowScheduleMinutes(row, selectedDay = "") {
  const days = getRowDays(row);
  const requestedDay = normalizeString(selectedDay).toLowerCase();
  const matchingDay = requestedDay
    ? days.find((day) => day.toLowerCase() === requestedDay)
    : "";

  if (matchingDay) {
    const selectedMinutes = toMinutes(row?.timeAssignments?.[matchingDay]);
    return Number.isFinite(selectedMinutes) ? selectedMinutes : Number.POSITIVE_INFINITY;
  }

  const assignmentMinutes = days
    .map((day) => toMinutes(row?.timeAssignments?.[day]))
    .filter(Number.isFinite);

  if (assignmentMinutes.length) return Math.min(...assignmentMinutes);

  const fallbackMinutes = toMinutes(row?.time || row?.classStartTime);
  return Number.isFinite(fallbackMinutes) ? fallbackMinutes : Number.POSITIVE_INFINITY;
}

function sortRowsBySchedule(rows = [], selectedDay = "") {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const timeDifference =
        getRowScheduleMinutes(a.row, selectedDay) -
        getRowScheduleMinutes(b.row, selectedDay);
      return timeDifference || a.index - b.index;
    })
    .map(({ row }) => row);
}

function getClipboardCellValue(row, columnKey, selectedDay = "") {
  if (columnKey === "days") return getRowDays(row).join(", ");
  if (columnKey === "timeAssignments") {
    const matchingDay = getRowDays(row).find(
      (day) => day.toLowerCase() === normalizeString(selectedDay).toLowerCase()
    );
    if (matchingDay) return normalizeTimeText(row?.timeAssignments?.[matchingDay]);
    return buildDayTimeSummary(getRowDays(row), row?.timeAssignments || {});
  }
  if (columnKey === "durationMinutes") return String(row?.durationMinutes || "");

  const value = row?.[columnKey];
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "");
}

function parseClipboardDuration(value, fallback = 60) {
  const text = normalizeString(value).toLowerCase();
  if (!text) return Number(fallback || 60);
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number)) return Number(fallback || 60);
  if (/hour|hr/.test(text)) return Math.round(number * 60);
  return Math.round(number);
}

function parseClipboardAssignments(value, row, selectedDay = "") {
  const text = normalizeString(value);
  const days = getRowDays(row);
  const nextAssignments = { ...(row?.timeAssignments || {}) };
  const segments = text.split(/[•;\n]+/).map((item) => item.trim()).filter(Boolean);
  let matchedSummary = false;

  segments.forEach((segment) => {
    const match = segment.match(/^([^:]+):\s*(.+)$/);
    if (!match) return;
    const day = days.find(
      (item) => item.toLowerCase() === normalizeString(match[1]).toLowerCase()
    );
    if (!day) return;
    nextAssignments[day] = normalizeTimeText(match[2]);
    matchedSummary = true;
  });

  if (!matchedSummary) {
    const requestedDay = normalizeString(selectedDay).toLowerCase();
    const targetDay =
      days.find((day) => day.toLowerCase() === requestedDay) || days[0];
    if (targetDay) nextAssignments[targetDay] = normalizeTimeText(text);
  }

  return nextAssignments;
}

function applyClipboardValueToRow(
  row,
  columnKey,
  rawValue,
  durationOptions,
  selectedDay = ""
) {
  if (!row || !columnKey) return row;

  if (columnKey === "days") {
    const nextDays = sortDays(normalizeArray(rawValue));
    const nextAssignments = buildTimeAssignments(
      nextDays,
      row.timeAssignments || {},
      getRowDays(row)[0] || row.day,
      row.time
    );
    const primaryTime = getPrimaryTime(nextDays, nextAssignments);
    return computeRow(
      {
        ...row,
        day: nextDays.join(", "),
        days: nextDays,
        timeAssignments: nextAssignments,
        time: primaryTime,
        classStartTime: primaryTime,
        classEndTime: primaryTime
          ? addMinutes(primaryTime, Number(row.durationMinutes || 60))
          : "",
      },
      durationOptions
    );
  }

  if (columnKey === "timeAssignments") {
    const nextAssignments = parseClipboardAssignments(rawValue, row, selectedDay);
    const primaryTime = getPrimaryTime(getRowDays(row), nextAssignments);
    return computeRow(
      {
        ...row,
        timeAssignments: nextAssignments,
        time: primaryTime,
        classStartTime: primaryTime,
        classEndTime: primaryTime
          ? addMinutes(primaryTime, Number(row.durationMinutes || 60))
          : "",
      },
      durationOptions
    );
  }

  if (columnKey === "durationMinutes") {
    const durationMinutes = parseClipboardDuration(rawValue, row.durationMinutes);
    return computeRow(
      {
        ...row,
        durationMinutes,
        classEndTime: row.classStartTime
          ? addMinutes(row.classStartTime, durationMinutes)
          : "",
      },
      durationOptions
    );
  }

  if (columnKey === "groupName") {
    return computeRow({ ...row, groupName: normalizeArray(rawValue) }, durationOptions);
  }

  if (columnKey === "classStartTime" || columnKey === "classEndTime") {
    return computeRow(
      { ...row, [columnKey]: normalizeTimeText(rawValue) },
      durationOptions
    );
  }

  if (columnKey === "status") {
    return computeRow(
      { ...row, status: normalizeString(rawValue).toLowerCase() },
      durationOptions
    );
  }

  return computeRow({ ...row, [columnKey]: rawValue }, durationOptions);
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
  onCreateTotalClass,
  onUpdateTotalClass,
  onBulkUpdateTotalClasses,
  onReorderTotalClasses,
  onDeleteTotalClass,
  onAdminUserChange,
  onBackToDirectory,
}) {
  const dayOptions = meta.dayOptions?.length ? meta.dayOptions : DEFAULT_DAY_OPTIONS;
  const statusOptions = meta.statusOptions?.length ? meta.statusOptions : DEFAULT_STATUS_OPTIONS;
  const durationOptions =
    meta.durationOptions?.length ? meta.durationOptions : DEFAULT_DURATION_OPTIONS;
  const timeOptions = meta.classTimes?.length
    ? meta.classTimes.map((item) => item.label || item.startTime)
    : [];
  const displayName = useMemo(() => getDisplayName(portalUser || user), [portalUser, user]);

  const [socket, setSocket] = useState(null);
  const [tab, setTab] = useState("tuitions");
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(() => makeEmptyDraft(durationOptions));
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedColumnKey, setSelectedColumnKey] = useState("");
  const [activeCellPrefix, setActiveCellPrefix] = useState("");
  const saveTimeoutsRef = useRef(new Map());
  const pendingPatchesRef = useRef(new Map());
  const pendingDeleteTimersRef = useRef(new Map());
  const undoStackRef = useRef([]);
  const historyCoalesceRef = useRef({ key: "", at: 0 });
  const activeEditorKeyRef = useRef("");
  const sheetWrapRef = useRef(null);
  const flushRowSaveRef = useRef(null);
  const entriesRef = useRef([]);
  const editorRegistryRef = useRef(new Map());
  const recentScheduleEditsRef = useRef(new Map());
  const [searchByTab, setSearchByTab] = useState({ tuitions: "", reports: "", totalClass: "" });
  const [filtersByTab, setFiltersByTab] = useState({
    tuitions: { day: "", month: "", year: "", status: "" },
    reports: { day: "", month: "", year: "", status: "" },
    totalClass: { day: "", month: "", year: "", status: "" },});
  const [pageByTab, setPageByTab] = useState({ tuitions: 1, reports: 1, totalClass: 1 });
  const [pageSizeByTab, setPageSizeByTab] = useState({ tuitions: 20, reports: 20, totalClass: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [historyConfig, setHistoryConfig] = useState({ 
    isOpen: false, recordId: null, field: null, type: 'tuition', x: 0, y: 0 });
  useEffect(() => {
    const newSocket = io("/notifications", {
      auth: { token: localStorage.getItem("token") }
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    const localById = new Map(
      entriesRef.current.map((row) => [String(row.id), row])
    );
    const now = Date.now();

    const nextEntries = (Array.isArray(initialEntries) ? initialEntries : []).map(
      (row) => {
        const rowKey = String(row.id);
        const localRow = localById.get(rowKey);
        const lastLocalEdit = recentScheduleEditsRef.current.get(rowKey) || 0;
        const preserveLocalSchedule = now - lastLocalEdit < 10000;

        return mergeIncomingRowWithLocal(
          row,
          localRow,
          durationOptions,
          preserveLocalSchedule
        );
      }
    );

    recentScheduleEditsRef.current.forEach((editedAt, rowKey) => {
      if (now - editedAt >= 10000) {
        recentScheduleEditsRef.current.delete(rowKey);
      }
    });

    entriesRef.current = nextEntries;
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
    pendingPatchesRef.current.clear();
    pendingDeleteTimersRef.current.forEach(({ timeoutId, commit }) => {
      clearTimeout(timeoutId);
      void commit();
    });
    pendingDeleteTimersRef.current.clear();
  }, []);

  useEffect(() => {
    setDraft(makeEmptyDraft(durationOptions));
  }, [durationOptions]);

  const currentSearch = searchByTab[tab] || "";
  const currentFilters = filtersByTab[tab] || { day: "", month: "", year: "", status: "" };
  const currentPageSize = pageSizeByTab[tab] || 20;

  const yearOptions = useMemo(() => {
    const years = new Set();
    [...entries, ...(reportRows || []), ...(totalClassRows || [])].forEach((row) => {
      const { year } = extractMonthYear(row);
      if (year) years.add(year);
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [entries, reportRows, totalClassRows]);

  const filteredEntries = useMemo(() => {
    // Keep the saved/manual row order stable while editing. Re-sorting on
    // every time keystroke makes the active row jump and breaks spreadsheet
    // focus, especially when one row has several day/time editors.
    return entries.filter(
      (row) =>
        matchesSearch(row, searchByTab.tuitions) &&
        matchesFilters(row, filtersByTab.tuitions)
    );
  }, [entries, searchByTab.tuitions, filtersByTab.tuitions]);

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

  const focusEditorByKey = useCallback((editorKey, selectContents = true) => {
    const focusNow = () => {
      const element = editorRegistryRef.current.get(editorKey);
      if (!element?.focus) return false;

      element.focus({ preventScroll: true });
      element.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });

      activeEditorKeyRef.current = editorKey;
      const [rowId, columnKey] = String(editorKey).split("::");
      if (rowId && columnKey) {
        setSelectedColumnKey("");
        setActiveCellPrefix(buildCellPrefix(rowId, columnKey));
      }

      if (
        selectContents &&
        (element.tagName === "INPUT" || element.tagName === "TEXTAREA") &&
        !["checkbox", "radio", "color", "date", "month"].includes(
          String(element.type || "").toLowerCase()
        )
      ) {
        window.requestAnimationFrame(() => {
          try {
            element.select?.();
          } catch {
            // Some input types do not support selection.
          }
        });
      }

      return true;
    };

    if (focusNow()) return true;

    window.requestAnimationFrame(() => {
      focusNow();
    });
    return false;
  }, []);

  const getVisibleTimeDays = useCallback(
    (row) => {
      const days = getRowDays(row);
      const selectedDay = normalizeString(
        filtersByTab.tuitions.day
      ).toLowerCase();

      if (!selectedDay) return days;

      const matchingDay = days.find(
        (day) => day.toLowerCase() === selectedDay
      );
      return matchingDay ? [matchingDay] : [];
    },
    [filtersByTab.tuitions.day]
  );

  const findRegisteredKey = useCallback(
    (row, columnKey, preferredSubKey = "main") => {
      if (!row) return "";

      if (columnKey === "timeAssignments") {
        const visibleDays = getVisibleTimeDays(row);
        if (!visibleDays.length) return "";

        const preferredDay = visibleDays.find(
          (day) =>
            day.toLowerCase() ===
            normalizeString(preferredSubKey).toLowerCase()
        );
        const orderedDays = preferredDay
          ? [
              preferredDay,
              ...visibleDays.filter((day) => day !== preferredDay),
            ]
          : visibleDays;

        for (const day of orderedDays) {
          const key = buildEditorKey(
            row.id,
            "timeAssignments",
            day
          );
          if (editorRegistryRef.current.has(key)) return key;
        }
        return "";
      }

      const key = buildEditorKey(row.id, columnKey, "main");
      return editorRegistryRef.current.has(key) ? key : "";
    },
    [getVisibleTimeDays]
  );

  const getLogicalTargetKey = useCallback(
    (currentKey, direction) => {
      const [rowId, columnKey, editorSubKey = "main"] =
        String(currentKey || "").split("::");
      const rowIndex = pagedEntries.findIndex(
        (row) => String(row.id) === String(rowId)
      );
      const columnIndex = GRID_CLIPBOARD_COLUMNS.indexOf(columnKey);

      if (rowIndex === -1 || columnIndex === -1) return "";

      const currentRow = pagedEntries[rowIndex];

      if (
        columnKey === "timeAssignments" &&
        (direction === "up" || direction === "down")
      ) {
        const visibleDays = getVisibleTimeDays(currentRow);
        const dayIndex = visibleDays.findIndex(
          (day) =>
            day.toLowerCase() ===
            normalizeString(editorSubKey).toLowerCase()
        );
        const localNextIndex =
          dayIndex + (direction === "up" ? -1 : 1);

        if (
          dayIndex !== -1 &&
          localNextIndex >= 0 &&
          localNextIndex < visibleDays.length
        ) {
          const localKey = buildEditorKey(
            currentRow.id,
            "timeAssignments",
            visibleDays[localNextIndex]
          );
          if (editorRegistryRef.current.has(localKey)) {
            return localKey;
          }
        }
      }

      if (direction === "left" || direction === "right") {
        const step = direction === "left" ? -1 : 1;

        for (
          let nextColumnIndex = columnIndex + step;
          nextColumnIndex >= 0 &&
          nextColumnIndex < GRID_CLIPBOARD_COLUMNS.length;
          nextColumnIndex += step
        ) {
          const nextColumn =
            GRID_CLIPBOARD_COLUMNS[nextColumnIndex];
          const key = findRegisteredKey(
            currentRow,
            nextColumn,
            editorSubKey
          );
          if (key) return key;
        }

        return "";
      }

      const rowStep = direction === "up" ? -1 : 1;
      for (
        let nextRowIndex = rowIndex + rowStep;
        nextRowIndex >= 0 &&
        nextRowIndex < pagedEntries.length;
        nextRowIndex += rowStep
      ) {
        const key = findRegisteredKey(
          pagedEntries[nextRowIndex],
          columnKey,
          editorSubKey
        );
        if (key) return key;
      }

      return "";
    },
    [findRegisteredKey, getVisibleTimeDays, pagedEntries]
  );

  const focusDirectionalCell = useCallback(
    (currentKey, direction) => {
      const logicalTarget = getLogicalTargetKey(
        currentKey,
        direction
      );
      if (logicalTarget) {
        focusEditorByKey(logicalTarget);
        return;
      }

      const items = getEditorSnapshotList();
      const currentIndex = items.findIndex(
        (item) => item.key === currentKey
      );
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
            score =
              (current.left - item.right) * 8 +
              Math.abs(item.centerY - current.centerY);
          }
        } else if (direction === "right") {
          isMatch = item.left >= current.right - 2;
          if (isMatch) {
            score =
              (item.left - current.right) * 8 +
              Math.abs(item.centerY - current.centerY);
          }
        } else if (direction === "up") {
          isMatch = item.bottom <= current.top + 2;
          if (isMatch) {
            score =
              (current.top - item.bottom) * 8 +
              Math.abs(item.centerX - current.centerX);
          }
        } else if (direction === "down") {
          isMatch = item.top >= current.bottom - 2;
          if (isMatch) {
            score =
              (item.top - current.bottom) * 8 +
              Math.abs(item.centerX - current.centerX);
          }
        }

        if (isMatch && score < bestScore) {
          bestScore = score;
          candidate = item;
        }
      }

      if (candidate) {
        focusEditorByKey(candidate.key);
      }
    },
    [
      focusEditorByKey,
      getEditorSnapshotList,
      getLogicalTargetKey,
    ]
  );

  function getRowIdFromEditorKey(editorKey) {
    return String(editorKey || "").split("::")[0] || "";
  }
// Arrow key navigation (Spreadsheet feel)
const handleKeyDown = (e, rowIndex, colIndex) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    let nextRow = rowIndex;
    let nextCol = colIndex;
    if (e.key === 'ArrowUp') nextRow = Math.max(0, rowIndex - 1);
    if (e.key === 'ArrowDown') nextRow = rowIndex + 1; 
    if (e.key === 'ArrowLeft') nextCol = Math.max(0, colIndex - 1);
    if (e.key === 'ArrowRight') nextCol = colIndex + 1;
    const nextInput = document.getElementById(`tuition-cell-${nextRow}-${nextCol}`);
    if (nextInput) nextInput.focus();
};

// Right click for History
const handleContextMenu = (e, recordId, field) => {
    e.preventDefault();
    setHistoryConfig({
        isOpen: true,
        recordId,
        field,
        type: 'tuition', // Backend history type
        x: e.clientX,
        y: e.clientY
    });
};
  const moveFocusAndPersist = useCallback(
    (editorKey, direction) => {
      const rowId = getRowIdFromEditorKey(editorKey);

      focusDirectionalCell(editorKey, direction);

      if (rowId && onUpdateEntry) {
        window.setTimeout(() => {
          void flushRowSaveRef.current?.(rowId);
        }, 0);
      }
    },
    [focusDirectionalCell, onUpdateEntry]
  );

  const handleGridEditorKeyDown = useCallback(
    (event, editorKey, { multiline = false } = {}) => {
      if (event.isComposing) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (
        event.key === "ArrowLeft" &&
        shouldNavigateHorizontally(event)
      ) {
        event.preventDefault();
        moveFocusAndPersist(editorKey, "left");
        return;
      }

      if (
        event.key === "ArrowRight" &&
        shouldNavigateHorizontally(event)
      ) {
        event.preventDefault();
        moveFocusAndPersist(editorKey, "right");
        return;
      }

      if (
        event.key === "ArrowUp" &&
        shouldNavigateVertically(event)
      ) {
        event.preventDefault();
        moveFocusAndPersist(editorKey, "up");
        return;
      }

      if (
        event.key === "ArrowDown" &&
        shouldNavigateVertically(event)
      ) {
        event.preventDefault();
        moveFocusAndPersist(editorKey, "down");
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        moveFocusAndPersist(
          editorKey,
          event.shiftKey ? "left" : "right"
        );
        return;
      }

      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        moveFocusAndPersist(
          editorKey,
          event.shiftKey ? "up" : "down"
        );
      }
    },
    [moveFocusAndPersist]
  );

  const getCellClassName = useCallback(
    (rowId, columnKey) => {
      const cellPrefix = buildCellPrefix(rowId, columnKey);
      const columnSelected =
        selectedColumnKey === columnKey
          ? "otm-grid-cell--column-selected"
          : "";
      const active =
        activeCellPrefix === cellPrefix
          ? "otm-grid-cell--active"
          : "";
      return `otm-grid-cell ${columnSelected} ${active}`;
    },
    [activeCellPrefix, selectedColumnKey]
  );

  const getGridEditorBindings = useCallback(
    (
      rowId,
      columnKey,
      editorSubKey = "main",
      options = {}
    ) => {
      const cellPrefix = buildCellPrefix(rowId, columnKey);
      const editorKey = buildEditorKey(
        rowId,
        columnKey,
        editorSubKey
      );

      return {
        ref: (node) => registerEditor(editorKey, node),
        onFocus: () => {
          activeEditorKeyRef.current = editorKey;
          setSelectedColumnKey("");
          setActiveCellPrefix(cellPrefix);
        },
        onKeyDown: (event) =>
          handleGridEditorKeyDown(
            event,
            editorKey,
            options
          ),
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
    async (rowId, overridePatch = null) => {
      if (!onUpdateEntry || rowId === undefined || rowId === null) return;

      const rowKey = String(rowId);
      const timeoutId = saveTimeoutsRef.current.get(rowKey);
      if (timeoutId) {
        clearTimeout(timeoutId);
        saveTimeoutsRef.current.delete(rowKey);
      }

      const pendingPatch = pendingPatchesRef.current.get(rowKey) || {};
      const patch = {
        ...pendingPatch,
        ...(overridePatch || {}),
      };

      if (Object.keys(patch).length === 0) return;
      pendingPatchesRef.current.delete(rowKey);

      try {
        const savedEntry = await onUpdateEntry(rowId, patch);
        if (savedEntry) {
          const preserveLocalSchedule =
            Object.prototype.hasOwnProperty.call(
              patch,
              "timeAssignments"
            ) ||
            Object.prototype.hasOwnProperty.call(
              patch,
              "timeSlots"
            ) ||
            Object.prototype.hasOwnProperty.call(
              patch,
              "days"
            );

          const nextEntries = entriesRef.current.map((item) => {
            if (String(item.id) !== rowKey) return item;

            return mergeIncomingRowWithLocal(
              { ...item, ...savedEntry },
              item,
              durationOptions,
              preserveLocalSchedule
            );
          });

          entriesRef.current = nextEntries;
          setEntries(nextEntries);
        }
      } catch (error) {
        pendingPatchesRef.current.set(rowKey, patch);
        console.error("Failed to update row", error);
      }
    },
    [durationOptions, onUpdateEntry]
  );

  flushRowSaveRef.current = flushRowSave;

  const scheduleRowSave = useCallback(
    (rowId, patch = {}, delay = 250) => {
      if (!onUpdateEntry || rowId === undefined || rowId === null) return;

      const rowKey = String(rowId);
      pendingPatchesRef.current.set(rowKey, {
        ...(pendingPatchesRef.current.get(rowKey) || {}),
        ...patch,
      });

      const existingTimeout = saveTimeoutsRef.current.get(rowKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        void flushRowSave(rowId);
      }, delay);

      saveTimeoutsRef.current.set(rowKey, timeoutId);
    },
    [flushRowSave, onUpdateEntry]
  );

  const recordUndoSnapshot = useCallback((coalesceKey = "") => {
    const now = Date.now();
    const previous = historyCoalesceRef.current;
    const shouldCoalesce =
      coalesceKey && previous.key === coalesceKey && now - previous.at < 900;

    if (!shouldCoalesce) {
      undoStackRef.current.push(cloneRows(entriesRef.current));
      if (undoStackRef.current.length > 60) undoStackRef.current.shift();
    }

    historyCoalesceRef.current = { key: coalesceKey, at: now };
  }, []);

  const undoLastChange = useCallback(async () => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;

    historyCoalesceRef.current = { key: "", at: 0 };
    const currentRows = cloneRows(entriesRef.current);
    const snapshotIds = new Set(snapshot.map((row) => String(row.id)));
    const cancelledDeleteIds = new Set();

    // A row deletion is committed after a short grace period. Ctrl+Z cancels it.
    pendingDeleteTimersRef.current.forEach((pending, rowKey) => {
      if (snapshotIds.has(rowKey)) {
        clearTimeout(pending.timeoutId);
        pendingDeleteTimersRef.current.delete(rowKey);
        cancelledDeleteIds.add(rowKey);
      }
    });

    saveTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    saveTimeoutsRef.current.clear();
    pendingPatchesRef.current.clear();

    setEntries(snapshot);
    entriesRef.current = snapshot;

    const currentById = new Map(currentRows.map((row) => [String(row.id), row]));
    const changedRows = snapshot.filter((row) => {
      const current = currentById.get(String(row.id));
      return current && stableSerialize(current) !== stableSerialize(row);
    });
    const committedDeletedRows = snapshot.filter((row) => {
      const rowKey = String(row.id);
      return !currentById.has(rowKey) && !cancelledDeleteIds.has(rowKey);
    });

    try {
      await Promise.all(
        changedRows.map((row) =>
          onUpdateEntry?.(row.id, buildEntryPayload(row))
        )
      );
      await Promise.all(
        committedDeletedRows.map((row) =>
          onCreateEntry?.(buildEntryPayload(row))
        )
      );

      const reorderableIds = snapshot
        .map((row) => row.id)
        .filter((id) => currentById.has(String(id)));
      if (onReorderEntries && reorderableIds.length === currentRows.length) {
        await onReorderEntries(reorderableIds);
      }
    } catch (error) {
      console.error("Failed to persist undo", error);
    }
  }, [onCreateEntry, onReorderEntries, onUpdateEntry]);

  function updateDraftField(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "days") {
        const sorted = sortDays(value);
        const nextAssignments = {};
        const previousAssignmentEntries = Object.entries(
          prev.timeAssignments || {}
        );
        sorted.forEach((day) => {
          const matchingEntry = previousAssignmentEntries.find(
            ([key]) => normalizeString(key).toLowerCase() === day.toLowerCase()
          );
          nextAssignments[day] = matchingEntry?.[1] || "";
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
      const rowKey = String(rowId);
      let nextRowSnapshot = null;
      let patch = { [field]: value };

      if (options.recordUndo !== false) {
        recordUndoSnapshot(
          options.undoKey || `${rowId}:${field}`
        );
      }

      const nextRows = entriesRef.current.map((row) => {
        if (String(row.id) !== rowKey) return row;

        let nextRow;

        if (field === "days") {
          const nextDays = sortDays(value);
          const nextAssignments = buildTimeAssignments(
            nextDays,
            row.timeAssignments || {},
            normalizeArray(row.days)[0] || row.day,
            row.time
          );
          const primaryTime = getPrimaryTime(
            nextDays,
            nextAssignments
          );
          const nextStart = primaryTime;
          const nextEnd = nextStart
            ? addMinutes(
                nextStart,
                Number(row.durationMinutes || 60)
              )
            : "";

          nextRow = computeRow(
            {
              ...row,
              day: nextDays.join(", "),
              days: nextDays,
              timeAssignments: nextAssignments,
              timeSlots: nextDays.map(
                (day) => nextAssignments[day] || ""
              ),
              time: primaryTime,
              classStartTime: nextStart,
              classEndTime: nextEnd,
            },
            durationOptions
          );

          patch = {
            day: nextDays.join(", "),
            days: nextDays,
            timeAssignments: nextAssignments,
            timeSlots: nextRow.timeSlots,
            time: nextRow.time,
            timeText: nextRow.timeText,
            durationMinutes: nextRow.durationMinutes,
            classStartTime: nextRow.classStartTime,
            classEndTime: nextRow.classEndTime,
          };

          recentScheduleEditsRef.current.set(
            rowKey,
            Date.now()
          );
        } else if (field === "timeAssignments") {
          const nextDays = getRowDays(row);
          const currentAssignments = buildTimeAssignments(
            nextDays,
            row.timeAssignments || {},
            nextDays[0] || row.day,
            row.time
          );
          const incomingAssignments =
            normalizeTimeAssignmentsValue(
              value,
              nextDays
            );
          const mergedAssignments = {
            ...currentAssignments,
            ...incomingAssignments,
          };
          const nextAssignments = buildTimeAssignments(
            nextDays,
            mergedAssignments,
            nextDays[0] || row.day,
            row.time
          );
          const primaryTime = getPrimaryTime(
            nextDays,
            nextAssignments
          );
          const nextStart = primaryTime;
          const nextEnd = nextStart
            ? addMinutes(
                nextStart,
                Number(row.durationMinutes || 60)
              )
            : "";

          nextRow = computeRow(
            {
              ...row,
              timeAssignments: nextAssignments,
              timeSlots: nextDays.map(
                (day) => nextAssignments[day] || ""
              ),
              time: primaryTime,
              classStartTime: nextStart,
              classEndTime: nextEnd,
            },
            durationOptions
          );

          patch = {
            day: nextDays.join(", "),
            days: nextDays,
            timeAssignments: nextAssignments,
            timeSlots: nextRow.timeSlots,
            time: nextRow.time,
            timeText: nextRow.timeText,
            durationMinutes: nextRow.durationMinutes,
            classStartTime: nextRow.classStartTime,
            classEndTime: nextRow.classEndTime,
          };

          recentScheduleEditsRef.current.set(
            rowKey,
            Date.now()
          );
        } else if (field === "durationMinutes") {
          const nextDuration = Number(value || 60);
          const nextEnd = row.classStartTime
            ? addMinutes(
                row.classStartTime,
                nextDuration
              )
            : "";

          nextRow = computeRow(
            {
              ...row,
              durationMinutes: nextDuration,
              classEndTime: nextEnd,
            },
            durationOptions
          );

          patch = {
            durationMinutes: nextDuration,
            durationLabel: nextRow.durationLabel,
            classEndTime: nextRow.classEndTime,
          };
        } else if (field === "classStartTime") {
          const nextStart = normalizeTimeText(value);
          nextRow = computeRow(
            {
              ...row,
              classStartTime: nextStart,
            },
            durationOptions
          );
          patch = { classStartTime: nextStart };
        } else if (field === "classEndTime") {
          const nextEnd = normalizeTimeText(value);
          nextRow = computeRow(
            {
              ...row,
              classEndTime: nextEnd,
            },
            durationOptions
          );
          patch = { classEndTime: nextEnd };
        } else {
          nextRow = computeRow(
            { ...row, [field]: value },
            durationOptions
          );
        }

        nextRowSnapshot = nextRow;
        return nextRow;
      });

      if (!nextRowSnapshot) return null;

      entriesRef.current = nextRows;
      setEntries(nextRows);

      if (options.save !== false) {
        scheduleRowSave(
          rowId,
          patch,
          options.delay ?? 350
        );

        if (options.immediate) {
          window.setTimeout(() => {
            void flushRowSaveRef.current?.(rowId);
          }, 0);
        }
      }

      return nextRowSnapshot;
    },
    [
      durationOptions,
      recordUndoSnapshot,
      scheduleRowSave,
    ]
  );

  const updateTimeAssignment = useCallback(
    (
      rowId,
      day,
      value,
      {
        normalize = false,
        immediate = false,
        recordUndo = true,
      } = {}
    ) => {
      const normalizedDay = resolveCanonicalDay(day);
      if (!normalizedDay) return null;

      return updateRow(
        rowId,
        "timeAssignments",
        {
          [normalizedDay]: normalize
            ? normalizeTimeText(value)
            : value,
        },
        {
          delay: immediate ? 0 : 500,
          immediate,
          recordUndo,
          undoKey: `${rowId}:timeAssignments:${normalizedDay}`,
        }
      );
    },
    [updateRow]
  );

  async function createRow() {
    if (!onCreateEntry) return;
    const validDays = sortDays(draft.days || []);

    try {
      setCreating(true);
      await onCreateEntry(
        buildEntryPayload({
          ...draft,
          status: draft.status || "class pending",
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

  const applyClipboardMatrix = useCallback(
    (matrix, targetRowIds, startColumnIndex = 0) => {
      if (!Array.isArray(matrix) || !matrix.length || !targetRowIds.length) return;

      recordUndoSnapshot("");
      historyCoalesceRef.current = { key: "", at: 0 };
      const targetIdSet = new Set(targetRowIds.map(String));
      const targetPosition = new Map(targetRowIds.map((id, index) => [String(id), index]));
      const changedRows = new Map();

      const nextEntries = entriesRef.current.map((sourceRow) => {
        const rowKey = String(sourceRow.id);
        if (!targetIdSet.has(rowKey)) return sourceRow;

        const rowPosition = targetPosition.get(rowKey) || 0;
        const sourceCells = matrix[matrix.length === 1 ? 0 : rowPosition];
        if (!sourceCells) return sourceRow;

        let nextRow = sourceRow;
        sourceCells.forEach((cellValue, cellOffset) => {
          const columnKey = GRID_CLIPBOARD_COLUMNS[startColumnIndex + cellOffset];
          if (!columnKey) return;
          nextRow = applyClipboardValueToRow(
            nextRow,
            columnKey,
            cellValue,
            durationOptions,
            filtersByTab.tuitions.day
          );
        });

        if (stableSerialize(nextRow) !== stableSerialize(sourceRow)) {
          changedRows.set(rowKey, nextRow);
        }
        return nextRow;
      });

      if (!changedRows.size) return;
      entriesRef.current = nextEntries;
      setEntries(nextEntries);
      changedRows.forEach((row) => {
        scheduleRowSave(row.id, buildEntryPayload(row), 0);
      });
    },
    [durationOptions, filtersByTab.tuitions.day, recordUndoSnapshot, scheduleRowSave]
  );

  const handleSheetCopy = useCallback(
    (event) => {
      const target = event.target;
      const hasNativeSelection =
        (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") &&
        Number.isInteger(target.selectionStart) &&
        target.selectionStart !== target.selectionEnd;

      if (hasNativeSelection && !selectedIds.length && !selectedColumnKey) return;

      const selectedSet = new Set(selectedIds.map(String));
      const selectedRows = pagedEntries.filter((row) => selectedSet.has(String(row.id)));
      let text = "";

      if (selectedColumnKey) {
        const rows = selectedRows.length ? selectedRows : pagedEntries;
        text = rows
          .map((row) =>
            getClipboardCellValue(row, selectedColumnKey, filtersByTab.tuitions.day)
          )
          .join("\n");
      } else if (selectedRows.length) {
        text = selectedRows
          .map((row) =>
            GRID_CLIPBOARD_COLUMNS.map((columnKey) =>
              getClipboardCellValue(row, columnKey, filtersByTab.tuitions.day)
            ).join("\t")
          )
          .join("\n");
      } else {
        const [rowId, columnKey] = activeEditorKeyRef.current.split("::");
        const row = pagedEntries.find((item) => String(item.id) === String(rowId));
        if (row && GRID_CLIPBOARD_COLUMNS.includes(columnKey)) {
          text = getClipboardCellValue(row, columnKey, filtersByTab.tuitions.day);
        }
      }

      if (!text) return;
      event.preventDefault();
      event.clipboardData?.setData("text/plain", text);
    },
    [filtersByTab.tuitions.day, pagedEntries, selectedColumnKey, selectedIds]
  );

  const handleSheetPaste = useCallback(
    (event) => {
      const clipboardText = event.clipboardData?.getData("text/plain") || "";
      if (!clipboardText) return;

      const normalizedText = clipboardText.replace(/\r/g, "").replace(/\n$/, "");
      const matrix = normalizedText.split("\n").map((line) => line.split("\t"));
      const selectedSet = new Set(selectedIds.map(String));
      const selectedRows = pagedEntries.filter((row) => selectedSet.has(String(row.id)));

      if (selectedColumnKey) {
        const targetRows = selectedRows.length ? selectedRows : pagedEntries;
        const columnIndex = GRID_CLIPBOARD_COLUMNS.indexOf(selectedColumnKey);
        if (columnIndex === -1 || !targetRows.length) return;
        event.preventDefault();
        applyClipboardMatrix(
          matrix.map((row) => [row[0] ?? ""]),
          targetRows.map((row) => row.id),
          columnIndex
        );
        return;
      }

      if (selectedRows.length) {
        event.preventDefault();
        applyClipboardMatrix(matrix, selectedRows.map((row) => row.id), 0);
        return;
      }

      const [activeRowId, activeColumnKey] = activeEditorKeyRef.current.split("::");
      const startRowIndex = pagedEntries.findIndex(
        (row) => String(row.id) === String(activeRowId)
      );
      const startColumnIndex = GRID_CLIPBOARD_COLUMNS.indexOf(activeColumnKey);
      if (startRowIndex === -1 || startColumnIndex === -1) return;

      const targetRows = pagedEntries
        .slice(startRowIndex, startRowIndex + Math.max(matrix.length, 1))
        .map((row) => row.id);
      event.preventDefault();
      applyClipboardMatrix(matrix, targetRows, startColumnIndex);
    },
    [applyClipboardMatrix, pagedEntries, selectedColumnKey, selectedIds]
  );

  const handleSheetFocusCapture = useCallback((event) => {
    const target = event.target?.closest?.(
      "[data-grid-key]"
    );
    const editorKey = target?.dataset?.gridKey || "";
    if (!editorKey) return;

    const [rowId, columnKey] = editorKey.split("::");
    activeEditorKeyRef.current = editorKey;
    setSelectedColumnKey("");
    setActiveCellPrefix(
      buildCellPrefix(rowId, columnKey)
    );
  }, []);

  const handleSheetBlurCapture = useCallback(() => {
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      const activeKey =
        activeElement?.dataset?.gridKey || "";

      if (
        activeKey &&
        sheetWrapRef.current?.contains(activeElement)
      ) {
        return;
      }

      activeEditorKeyRef.current = "";
      setActiveCellPrefix("");
    }, 0);
  }, []);

  const handleSheetKeyDownCapture = useCallback(
    (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        void undoLastChange();
      }
    },
    [undoLastChange]
  );

  useEffect(() => {
    if (tab !== "tuitions") return undefined;
    const handleWindowKeyDown = (event) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      const insideSheet = sheetWrapRef.current?.contains(target);
      const focusIsOnDocument =
        target === document.body || target === document.documentElement;
      if (!insideSheet && !focusIsOnDocument) return;
      handleSheetKeyDownCapture(event);
    };
    window.addEventListener("keydown", handleWindowKeyDown, true);
    return () => window.removeEventListener("keydown", handleWindowKeyDown, true);
  }, [handleSheetKeyDownCapture, tab]);

  async function deleteRow(rowId) {
    if (!onDeleteEntry) return;
    if (!window.confirm("Delete this row? Ctrl+Z can restore it for a few seconds.")) return;

    const rowKey = String(rowId);
    recordUndoSnapshot("");
    historyCoalesceRef.current = { key: "", at: 0 };

    const nextEntries = entriesRef.current.filter(
      (row) => String(row.id) !== rowKey
    );
    entriesRef.current = nextEntries;
    setEntries(nextEntries);
    setSelectedIds((prev) => prev.filter((id) => String(id) !== rowKey));

    const commit = async () => {
      pendingDeleteTimersRef.current.delete(rowKey);
      try {
        await onDeleteEntry(rowId);
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to delete row");
      }
    };

    const timeoutId = window.setTimeout(() => {
      void commit();
    }, 30000);

    pendingDeleteTimersRef.current.set(rowKey, { timeoutId, commit });
  }

  function toggleSelectRow(rowId) {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  }

  async function moveSelected(direction) {
    if (!onReorderEntries || selectedIds.length === 0) return;

    recordUndoSnapshot("");
    historyCoalesceRef.current = { key: "", at: 0 };
    const next = [...entriesRef.current];
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

    entriesRef.current = next;
    setEntries(next);
    try {
      await onReorderEntries(next.map((item) => item.id));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to reorder rows");
    }
  }

  function renderTextInput(
    row,
    field,
    isDraft = false,
    readOnly = false,
    textarea = false
  ) {
    const rawValue = row[field] ?? "";
    const value =
      field === "tutorName" && Array.isArray(rawValue)
        ? rawValue.join(", ")
        : rawValue;
    const editorBindings = !isDraft
      ? getGridEditorBindings(row.id, field, "main", { multiline: textarea })
      : {};

    if (readOnly) {
      return <div style={styles.readOnlyCell}>{value || "--"}</div>;
    }

    if (field === "groupName") {
      return (
        <MultiTagInput
          value={normalizeArray(value)}
          placeholder="Add group"
          gridBindings={editorBindings}
          onChange={(nextValues) => {
            if (isDraft) {
              updateDraftField(field, nextValues);
            } else {
              updateRow(row.id, field, nextValues);
            }
          }}
          onBlur={() => {
            if (!isDraft) {
              void saveRow(row.id);
            }
          }}
        />
      );
    }

    const commonProps = {
      className: "otm-grid-editor",
      value,
      onChange: (event) => {
        if (isDraft) updateDraftField(field, event.target.value);
        else updateRow(row.id, field, event.target.value);
      },
      onBlur: () => {
        if (!isDraft) void saveRow(row.id);
      },
      onContextMenu: (e) => {
      if (!isDraft) handleContextMenu(e, row.id, field);
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
        <td
          className={getCellClassName(row.id, "days")}
          style={{ ...styles.td, width: GRID_DIMENSIONS.days, position: "relative" }}
          onContextMenu={(event) => handleContextMenu(event, row.id, "days")}
        >
          <MultiSelectCell
          style={{zIndex:'999',}}
            value={row.days || []}
            options={dayOptions}
            placeholder="Select days"
            onChange={(next) => updateRow(row.id, "days", next)}
            triggerProps={getGridEditorBindings(row.id, "days")}
            onRequestMove={(direction) => focusDirectionalCell(row.id + "::days::main", direction)}
          />
        </td>

        <td
          className={getCellClassName(row.id, "timeAssignments")}
          style={{ ...styles.td, width: GRID_DIMENSIONS.time }}
          onContextMenu={(event) => handleContextMenu(event, row.id, "timeAssignments")}
        >
          <DayTimeAssignmentsEditor
            days={row.days || []}
            assignments={row.timeAssignments || {}}
            timeOptions={timeOptions}
            listId={`time-options-${row.id}`}
            compact
            visibleDay={filtersByTab.tuitions.day}
            emphasizeVisibleDay={Boolean(filtersByTab.tuitions.day)}
            getEditorProps={(day) =>
              getGridEditorBindings(
                row.id,
                "timeAssignments",
                day
              )
            }
            onChange={(day, value) => {
              updateTimeAssignment(
                row.id,
                day,
                value
              );
            }}
            onCommit={(day, value) => {
              updateTimeAssignment(
                row.id,
                day,
                value,
                {
                  normalize: true,
                  immediate: true,
                  recordUndo: false,
                }
              );
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
            onContextMenu={(e) => handleContextMenu(e, row.id, "durationMinutes")}
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

  function getColumnHeaderProps(columnKey, width) {
    const selected = selectedColumnKey === columnKey;
    const toggleColumn = () => {
      setSelectedColumnKey((prev) => (prev === columnKey ? "" : columnKey));
      setSelectedIds([]);
      activeEditorKeyRef.current = "";
      setActiveCellPrefix("");
    };

    return {
      tabIndex: 0,
      title: "Click to select this column for Ctrl+C / Ctrl+V",
      onClick: toggleColumn,
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleColumn();
        }
      },
      style: {
        ...styles.th,
        width,
        cursor: "pointer",
        background: selected ? "#166534" : "#000000",
        boxShadow: selected ? "inset 0 -3px 0 #86efac" : "none",
      },
    };
  }

  if (loading) {
    return <div style={styles.empty}>Loading OTM portal...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div className="d-flex justify-content-between mx-3 align-items-center">
          <div style={styles.header}>
            <div className="d-flex align-items-center gap-2">
              {isAdmin && onBackToDirectory && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm me-2"
                  onClick={onBackToDirectory}
                >
                  ← Back to User Directory
                </button>
              )}
              <h2 style={styles.title}>{title}</h2>
            </div>
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
          <div className="shadow rounded-4 border overflow-auto" style={{ width: "300px", maxHeight: "180px" }}>
            <OtmNotifications userId={user?.id} socket={socket} />
          </div>
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
                .otm-grid-cell--column-selected {
                  background: #f0fdf4 !important;
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
                  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2) !important;
                }
                .otm-grid-cell--active .otm-grid-editor {
                  background: #f0fdf4 !important;
                }
                .otm-grid-cell--active textarea.otm-grid-editor,
                .otm-grid-cell--active input.otm-grid-editor,
                .otm-grid-cell--active select.otm-grid-editor,
                .otm-grid-cell--active button.otm-grid-editor {
                  border-color: #16a34a !important;
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

              <div
                ref={sheetWrapRef}
                style={styles.sheetWrap}
                onCopy={handleSheetCopy}
                onPaste={handleSheetPaste}
                onFocusCapture={handleSheetFocusCapture}
                onBlurCapture={handleSheetBlurCapture}
              >
                <div style={styles.sheetViewport}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, ...styles.checkCell }}>Sel</th>
                        <th style={{ ...styles.th, ...styles.numberCell }}>#</th>
                        <th {...getColumnHeaderProps("days", GRID_DIMENSIONS.days)}>Days</th>
                        <th {...getColumnHeaderProps("timeAssignments", GRID_DIMENSIONS.time)}>Time</th>
                        <th {...getColumnHeaderProps("durationMinutes", GRID_DIMENSIONS.duration)}>Duration</th>
                        <th {...getColumnHeaderProps("tuitionStartMonth", GRID_DIMENSIONS.startMonth)}>Month</th>
                        {TEXT_COLUMNS.map((column) => (
                          <th key={column.key} {...getColumnHeaderProps(column.key, column.width)}>
                            {column.label}
                          </th>
                        ))}
                        <th {...getColumnHeaderProps("status", GRID_DIMENSIONS.status)}>Status</th>
                    
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
                              className={getCellClassName(row.id, "select")}
                              style={{ ...styles.td, ...styles.checkCell, textAlign: "center", verticalAlign: "middle" }}
                            >
                              <input
                                type="checkbox"
                                className="otm-grid-checkbox"
                                checked={selectedIds.includes(row.id)}
                                onChange={() => toggleSelectRow(row.id)}
                              />
                            </td>
                            <td style={{ ...styles.td, ...styles.numberCell, textAlign: "center", verticalAlign: "middle" }}>
                              {(pageByTab.tuitions - 1) * pageSizeByTab.tuitions + index + 1}
                            </td>
                            {renderExistingRowDayTimeDuration(row)}
                           <td className={getCellClassName(row.id, "tuitionStartMonth")} style={{ ...styles.td, width: GRID_DIMENSIONS.startMonth }}>
            <input
              type="month"
              className="otm-grid-editor"
              style={styles.cellInput}
              value={row.tuitionStartMonth || ""}
              onChange={(event) => updateRow(row.id, "tuitionStartMonth", event.target.value)}
              onBlur={() => saveRow(row.id)}
              onContextMenu={(e) => handleContextMenu(e, row.id, "tuitionStartMonth")}
              {...getGridEditorBindings(row.id, "tuitionStartMonth")}
            />
          </td>

                            {TEXT_COLUMNS.map((column) => (
                              <td key={column.key} className={getCellClassName(row.id, column.key)} style={{ ...styles.td, width: column.width }}>
                                {renderTextInput(row, column.key, false, column.readOnly, column.key === "notes")}
                              </td>
                            ))}

                          <td className={getCellClassName(row.id, "status")} style={{ ...styles.td, width: GRID_DIMENSIONS.status }}>
            <select
              className="otm-grid-editor"
              style={styles.statusSelect(row.status)}
              value={row.status || ""}
              onChange={(event) => updateRow(row.id, "status", event.target.value)}
              onBlur={() => saveRow(row.id)}
              onContextMenu={(e) => handleContextMenu(e, row.id, "status")}
              {...getGridEditorBindings(row.id, "status")}
            >
                                {statusOptions.map((item) => (
                                  <option key={item} value={item}>
                                    {getStatusMeta(item).label}
                                  </option>
                                ))}
                              </select>
                            </td>
                              

                            <td style={{ ...styles.td, width: GRID_DIMENSIONS.action, padding: 6, verticalAlign: "middle" }}>
                              <button
                                type="button"
                                style={styles.deleteBtn}
                                onClick={() => deleteRow(row.id)}>
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
{/* Reports Tab ka Data aur Form - Yeh sirf tab show hoga jab Reports tab open ho */}
{tab === "reports" && (
  <>
    <ReportEntryForm 
      onUpdateReport={(data) => {
        console.log("Report Data Updated: ", data);
      }} 
    />
              <Toolbar
                title="Report Controls"
                search={currentSearch}
                onSearch={setSearchValue}
                filters={currentFilters}
                onFiltersChange={setFilterValue}
                pageSize={currentPageSize}
                onPageSizeChange={setPageSizeValue}
                selectedCount={0}
                dayOptions={dayOptions}
                yearOptions={yearOptions}
                statusOptions={statusOptions}
                showStatus={true}
              />
<OtmReportTable
      rows={pagedReportRows}
      page={pageByTab.reports}
      pageSize={pageSizeByTab.reports}
      dayOptions={dayOptions}
      timeOptions={timeOptions}
      durationOptions={durationOptions}
      onUpdateRow={(rowId, field, value) => {
        if (typeof onUpdateEntry === "function") {
          onUpdateEntry(rowId, { [field]: value });
        }
      }}
      onDeleteRow={onDeleteEntry}
    />
    
              <Pagination
                totalItems={filteredReportRows.length}
                page={pageByTab.reports}
                pageSize={pageSizeByTab.reports}
                onPageChange={(nextPage) => setPageByTab((prev) => ({ ...prev, reports: nextPage }))}
              />
            </>
          )}

        {tab === "totalClass" && (
          <OtmTotalClassSheet
            rows={filteredTotalClassRows}
            summary={totalClassSummary}
            search={searchByTab.totalClass}
            onSearch={(value) => {
              setSearchByTab((prev) => ({ ...prev, totalClass: value }));
              setPageByTab((prev) => ({ ...prev, totalClass: 1 }));
            }}
            filters={filtersByTab.totalClass}
            onFiltersChange={(nextFilters) => {
              setFiltersByTab((prev) => ({ ...prev, totalClass: nextFilters }));
              setPageByTab((prev) => ({ ...prev, totalClass: 1 }));
            }}
            page={pageByTab.totalClass}
            pageSize={pageSizeByTab.totalClass}
            onPageChange={(nextPage) =>
              setPageByTab((prev) => ({ ...prev, totalClass: nextPage }))
            }
            onPageSizeChange={(size) => {
              setPageSizeByTab((prev) => ({ ...prev, totalClass: size }));
              setPageByTab((prev) => ({ ...prev, totalClass: 1 }));
            }}
            dayOptions={dayOptions}
            yearOptions={yearOptions}
            statusOptions={statusOptions}
            durationOptions={durationOptions}
            onCreateRow={onCreateTotalClass}
            onUpdateRow={onUpdateTotalClass}
            onBulkUpdateRows={onBulkUpdateTotalClasses}
            onReorderRows={onReorderTotalClasses}
            onDeleteRow={onDeleteTotalClass}
          />
        )}
        </div>
        {historyConfig.isOpen && (
            <CellHistoryPopup 
                config={historyConfig} 
                onClose={() => setHistoryConfig({ ...historyConfig, isOpen: false })} 
            />
        )}
      </div>
    </div>
  );
}