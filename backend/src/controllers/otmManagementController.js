import {
  OTM_DAY_OPTIONS,
  OTM_DURATION_OPTIONS,
  OTM_STATUS_OPTIONS,
  OTM_TIME_OPTIONS,
  buildScheduleFields,
  normalizeArrayInput,
  normalizeString,
  normalizeTimeAssignments,
  normalizeTimeLabel,
  countBy,
  sortDays,
  parseDecidedFee,
  toPlainEntries,
  sortEntries,
  buildSummary,
  buildReportRows,
} from "../utils/otmScheduleUtils.js";

export function makeOtmManagementController({
  User,
  OtmTuitionEntry,
  OtmPortalReport,
  OtmClassTime,
  OtmTotalClass,
}) {
  function hasOtmAccess(req) {
    const value =
      req.user?.accessOtmManagement ??
      req.user?.access_otm_management ??
      0;

    return value === true || value === 1 || value === "1" || value === "true";
  }

  const canUsePortal = (req) =>
    req.user?.role === "admin" ||
    req.user?.role === "otm" ||
    hasOtmAccess(req);

  const isAdmin = (req) => req.user?.role === "admin";

  const getDisplayName = (user) => {
    if (user?.name) return user.name;
    const prefix = user?.email?.split("@")[0] || "User";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  // Keep API/sync code safe when legacy DB rows contain NULL values or
  // spreadsheet tag fields arrive as arrays. Do not rely on a utility
  // normalizer returning an empty string for NULL.
  function safeText(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => (item === null || item === undefined ? "" : String(item).trim()))
        .filter(Boolean)
        .join(", ");
    }
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function safeLower(value) {
    return safeText(value).toLowerCase();
  }

  // Imported schedule helpers were written for clean form values. Legacy
  // database rows can contain NULLs inside days/times, so normalize those
  // values locally before calling any shared helper that uses toLowerCase().
  const safeDayOrder = new Map(
    (Array.isArray(OTM_DAY_OPTIONS) ? OTM_DAY_OPTIONS : [])
      .map((day, index) => [safeLower(day), index])
  );

  function safeArrayInput(value) {
    if (Array.isArray(value)) {
      return value.map(safeText).filter(Boolean);
    }

    const text = safeText(value);
    if (!text) return [];

    return text
      .split(",")
      .map((item) => safeText(item))
      .filter(Boolean);
  }

  function safeSortDays(value) {
    const uniqueDays = [...new Set(safeArrayInput(value))];

    return uniqueDays.sort((left, right) => {
      const leftRank = safeDayOrder.get(safeLower(left)) ?? 999;
      const rightRank = safeDayOrder.get(safeLower(right)) ?? 999;

      if (leftRank !== rightRank) return leftRank - rightRank;
      return safeText(left).localeCompare(safeText(right));
    });
  }

  function safeTimeLabel(value) {
    const text = safeText(value);
    if (!text) return "";

    try {
      return safeText(normalizeTimeLabel(text));
    } catch (error) {
      // Keep a valid-looking legacy string instead of crashing the whole sync.
      return text;
    }
  }

  function safeTimeAssignments(value, days = []) {
    const source =
      value && typeof value === "object" && !Array.isArray(value) ? value : {};

    return Object.fromEntries(
      safeSortDays(days).map((day) => [day, safeTimeLabel(source?.[day])])
    );
  }

  function sanitizeEntryForDerivedTables(entry = {}) {
    const plain = entry?.get ? entry.get({ plain: true }) : entry || {};
    const rawDays = Array.isArray(plain.days)
      ? plain.days
      : safeText(plain.days)
        ? safeText(plain.days).split(",")
        : safeText(plain.day)
          ? [plain.day]
          : [];
    const days = safeSortDays(rawDays.map(safeText).filter(Boolean));

    return {
      ...plain,
      day: safeText(plain.day) || days[0] || "",
      days,
      time: safeTimeLabel(plain.time),
      timeSlots: safeArrayInput(plain.timeSlots).map(safeTimeLabel),
      durationLabel: safeText(plain.durationLabel) || "1 hour",
      tuitionName: safeText(plain.tuitionName),
      tutorName: safeText(plain.tutorName),
      groupName: safeText(plain.groupName),
      studentName: safeText(plain.studentName),
      classStartTime: safeTimeLabel(plain.classStartTime || plain.time),
      classEndTime: safeTimeLabel(plain.classEndTime),
      status: safeLower(plain.status) || "class pending",
      reportStatus: safeText(plain.reportStatus) || "pending report",
      notes: safeText(plain.notes),
      rowColor: safeText(plain.rowColor),
    };
  }

  async function resolveTargetUser(req, { forWrite = false } = {}) {
    if (!canUsePortal(req)) {
      return { error: { status: 403, message: "Access denied" } };
    }

    const requestedUserId =
      req.query.userId || req.body.userId || req.params.userId || req.params.entryUserId;

    if (!isAdmin(req)) {
      return { userId: Number(req.user.id), actingUserId: Number(req.user.id) };
    }

    const actingUserId = Number(req.user.id);
    let userId = requestedUserId ? Number(requestedUserId) : null;
    let targetUser = null;

    const shouldAutoPickOtmUser =
      !Number.isFinite(userId) || userId <= 0 || userId === actingUserId;

    if (!shouldAutoPickOtmUser) {
    targetUser = await User.findByPk(userId, {
  attributes: [
    "id",
    "name",
    "email",
    "role",
  ],
});

      if (!targetUser) {
        return { error: { status: 404, message: "Selected user not found" } };
      }

      if (targetUser.role !== "otm") {
        return { error: { status: 400, message: "Selected user is not an OTM user" } };
      }
    }

    if (!targetUser) {
     targetUser = await User.findOne({
  where: {
    role: "otm",
  },
  attributes: [
    "id",
    "name",
    "email",
    "role",
  ],
  order: [
    ["name", "ASC"],
    ["email", "ASC"],
    ["id", "ASC"],
  ],
});

      if (!targetUser) {
        return {
          error: {
            status: 400,
            message: forWrite
              ? "No OTM user available to edit portal data"
              : "No OTM user available to view portal data",
          },
        };
      }

      userId = Number(targetUser.id);
    }

    return { userId, targetUser, actingUserId };
  }

function buildSingleEntryPayload(body = {}) {
  const days = safeSortDays(body.days ?? body.day);

  const timeAssignments = safeTimeAssignments(
    body.timeAssignments,
    days
  );

  const fallbackSlots = safeArrayInput(
    body.timeSlots ?? body.time
  ).map(safeTimeLabel);

  // Har selected day ka respective time.
  const timeSlots = days
    .map((day, index) => {
      return (
        safeTimeLabel(timeAssignments?.[day]) ||
        fallbackSlots[index] ||
        fallbackSlots[0] ||
        safeTimeLabel(body.time)
      );
    })
    .filter(Boolean);

  const schedule = buildScheduleFields({
    days,
    timeSlots,
    durationMinutes:
      body.durationMinutes ??
      body.durationLabel ??
      body.duration ??
      60,
  });

  const rawStatus = safeLower(body.status);

  const normalizedStatus = rawStatus
    ? OTM_STATUS_OPTIONS.includes(rawStatus)
      ? rawStatus
      : rawStatus
    : "class pending";

  const rawStartDate = safeText(
    body.tuitionStartDate || body.tuitionStartMonth
  );

  const tuitionStartDate = /^\d{4}-\d{2}$/.test(rawStartDate)
    ? `${rawStartDate}-01`
    : /^\d{4}-\d{2}-\d{2}$/.test(rawStartDate)
      ? rawStartDate
      : null;

  return {
    // Multiple days display text:
    // "Monday, Tuesday, Wednesday"
    day: days.join(", "),

    // Actual JSON array:
    // ["Monday", "Tuesday", "Wednesday"]
    days,

    // Compatibility ke liye first time.
    time: timeSlots[0] || "",

    // Actual multiple time values.
    timeSlots,

    durationLabel:
      safeText(schedule.durationLabel) || "1 hour",

    durationMinutes:
      toUnsignedInteger(schedule.durationMinutes, 60) || 60,

    tuitionName: safeText(body.tuitionName),
    tutorName: safeText(body.tutorName),
    groupName: safeText(body.groupName),
    studentName: safeText(body.studentName),

    classStartTime:
      safeText(schedule.classStartTime) ||
      timeSlots[0] ||
      "",

    classStartTimes:
      Array.isArray(schedule.classStartTimes) &&
      schedule.classStartTimes.length
        ? schedule.classStartTimes
        : timeSlots,

    classEndTime:
      safeText(schedule.classEndTime),

    classEndTimes:
      Array.isArray(schedule.classEndTimes)
        ? schedule.classEndTimes
        : [],

    status: normalizedStatus,

    reportStatus:
      safeText(body.reportStatus) || "pending report",

    decidedFee: toNullableMoney(body.decidedFee),
    tutorFee: toNullableMoney(body.tutorFee),

    notes: safeText(body.notes),
    rowColor: safeText(body.rowColor),

    sourceTuitionId:
      safeText(body.sourceTuitionId) || null,

    tuitionStartDate,

    tuitionStartWeek:
      safeText(body.tuitionStartWeek) || null,

    pauseNextCycle:
      toBoolean(body.pauseNextCycle),
  };
}

function expandCreatePayload(body = {}) {
  return [buildSingleEntryPayload(body)];
}
function buildEntryUpdatePayload(body = {}, current = {}) {
  const payload = {};

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(body, key);

  const scheduleKeys = [
    "day",
    "days",
    "time",
    "timeSlots",
    "timeAssignments",
    "durationMinutes",
    "durationLabel",
    "duration",
  ];

  const scheduleChanged = scheduleKeys.some(has);

 if (scheduleChanged) {
  let effectiveDays;

  if (has("days")) {
    effectiveDays = safeSortDays(body.days);
  } else if (has("day")) {
    effectiveDays = safeSortDays(body.day);
  } else {
    effectiveDays = safeSortDays(
      current.days ?? current.day
    );
  }

  let effectiveTimeSlots = safeArrayInput(
    current.timeSlots ?? current.time
  ).map(safeTimeLabel);

  if (has("timeAssignments")) {
    effectiveTimeSlots = effectiveDays
      .map((day) =>
        safeTimeLabel(body.timeAssignments?.[day])
      )
      .filter(Boolean);
  } else if (has("timeSlots")) {
    effectiveTimeSlots = safeArrayInput(
      body.timeSlots
    ).map(safeTimeLabel);
  } else if (has("time")) {
    const suppliedTime = safeTimeLabel(body.time);

    effectiveTimeSlots = effectiveDays.length
      ? effectiveDays.map(() => suppliedTime)
      : suppliedTime
        ? [suppliedTime]
        : [];
  }

  const effectiveDuration = has("durationMinutes")
    ? body.durationMinutes
    : has("durationLabel")
      ? body.durationLabel
      : has("duration")
        ? body.duration
        : current.durationMinutes ??
          current.durationLabel ??
          current.duration ??
          60;

  const schedule = buildScheduleFields({
    days: effectiveDays,
    timeSlots: effectiveTimeSlots,
    durationMinutes: effectiveDuration,
  });

  payload.day = effectiveDays.join(", ");
  payload.days = effectiveDays;

  payload.time =
    effectiveTimeSlots[0] || "";

  payload.timeSlots =
    effectiveTimeSlots;

  payload.durationLabel =
    safeText(schedule.durationLabel) ||
    "1 hour";

  payload.durationMinutes =
    toUnsignedInteger(
      schedule.durationMinutes,
      60
    ) || 60;

  payload.classStartTime =
    safeText(schedule.classStartTime) ||
    effectiveTimeSlots[0] ||
    "";

  payload.classStartTimes =
    Array.isArray(schedule.classStartTimes) &&
    schedule.classStartTimes.length
      ? schedule.classStartTimes
      : effectiveTimeSlots;

  payload.classEndTime =
    safeText(schedule.classEndTime);

  payload.classEndTimes =
    Array.isArray(schedule.classEndTimes)
      ? schedule.classEndTimes
      : [];
}

  const textFields = [
    "tuitionName",
    "tutorName",
    "groupName",
    "studentName",
    "notes",
    "rowColor",
    "sourceTuitionId",
    "tuitionStartWeek",
  ];

  textFields.forEach((field) => {
    if (has(field)) {
      payload[field] = safeText(body[field]);
    }
  });

  if (has("status")) {
    payload.status = safeLower(body.status);
  }

  if (has("reportStatus")) {
    payload.reportStatus = safeText(
      body.reportStatus
    );
  }

  if (has("decidedFee")) {
    payload.decidedFee = toNullableMoney(
      body.decidedFee
    );
  }

  if (has("tutorFee")) {
    payload.tutorFee = toNullableMoney(
      body.tutorFee
    );
  }

  if (
    has("tuitionStartDate") ||
    has("tuitionStartMonth")
  ) {
    payload.tuitionStartDate =
      normalizeDateOnly(
        body.tuitionStartDate ??
          body.tuitionStartMonth
      );
  }

  if (has("pauseNextCycle")) {
    payload.pauseNextCycle = toBoolean(
      body.pauseNextCycle
    );
  }

  // Direct start-time cell edit
  if (
    !scheduleChanged &&
    has("classStartTime")
  ) {
    payload.classStartTime = safeTimeLabel(
      body.classStartTime
    );

    payload.classStartTimes =
      payload.classStartTime
        ? [payload.classStartTime]
        : [];
  }

  // Direct end-time cell edit
  if (
    !scheduleChanged &&
    has("classEndTime")
  ) {
    payload.classEndTime = safeTimeLabel(
      body.classEndTime
    );

    payload.classEndTimes =
      payload.classEndTime
        ? [payload.classEndTime]
        : [];
  }

  return payload;
}

  async function syncReportTable(userId) {
    const entries = await OtmTuitionEntry.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });
    const plainEntries = toPlainEntries(entries).map(sanitizeEntryForDerivedTables);
    const reportRows = buildReportRows(plainEntries);

    await OtmPortalReport.destroy({ where: { userId } });

    if (reportRows.length > 0) {
      await OtmPortalReport.bulkCreate(
        reportRows.map((row) => ({
          userId,
          teacherName: row.teacherName,
          tuitionName: row.tuitionName,
          groupName: row.groupName,
          reportStatus: row.reportStatus || "pending report",
          totalClasses: row.totalClasses,
          classDoneCount: row.classDoneCount,
          classPendingCount: row.classPendingCount,
          missedByTeacherCount: row.missedByTeacherCount,
          missedByStudentCount: row.missedByStudentCount,
          lastSyncedAt: new Date(),
        }))
      );
    }
    return reportRows;
  }
  function normalizeTotalClassDays(value, fallbackDay = "") {
    const days = safeSortDays(value ?? fallbackDay);
    return days.length ? days : safeText(fallbackDay) ? [safeText(fallbackDay)] : [];
  }

  function toUnsignedInteger(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return fallback;
    return Math.trunc(number);
  }

  function toNullableMoney(value) {
    if (value === "" || value === null || value === undefined) return null;
    return parseDecidedFee(value);
  }

  function toBoolean(value) {
    return value === true || value === 1 || value === "1" || value === "true";
  }

  function normalizeDateOnly(value) {
    const text = safeText(value);
    if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    return null;
  }

  function buildTotalClassSyncPayload(entry, sortOrder) {
    const plain = entry?.get ? entry.get({ plain: true }) : entry || {};
    const days = normalizeTotalClassDays(plain.days, plain.day);
    const durationLabel =
      safeText(plain.durationLabel) || safeText(plain.duration) || "1 hour";
    const status = safeLower(plain.status) || "class pending";

    return {
      userId: Number(plain.userId),
      sourceEntryId: Number(plain.id),
      day: days[0] || safeText(plain.day) || null,
      days: days.join(", "),
      time: safeTimeLabel(plain.time || plain.classStartTime),
      duration: durationLabel,
      durationTime: durationLabel,
      durationMinutes: toUnsignedInteger(plain.durationMinutes, 60) || 60,
      tuitionName: safeText(plain.tuitionName),
      tutorName: safeText(plain.tutorName) || null,
      groupName: safeText(plain.groupName) || null,
      studentName: safeText(plain.studentName) || null,
      classStartTime: safeTimeLabel(plain.classStartTime || plain.time) || null,
      classEndTime: safeTimeLabel(plain.classEndTime) || null,
      status,
      reportStatus: safeText(plain.reportStatus) || "pending report",
      decidedFee: toNullableMoney(plain.decidedFee),
      tutorFee: toNullableMoney(plain.tutorFee),
      notes: safeText(plain.notes) || null,
      rowColor: safeText(plain.rowColor) || null,
      sourceTuitionId: safeText(plain.sourceTuitionId) || null,
      tuitionStartDate: normalizeDateOnly(plain.tuitionStartDate),
      tuitionStartWeek: safeText(plain.tuitionStartWeek) || null,
      numberOfDecidedDays: days.length,
      totalDoneClasses: status === "class done" ? 1 : 0,
      missedByStudentClasses: status === "missed by student" ? 1 : 0,
      missedByTeacherClass: status === "missed by teacher" ? 1 : 0,
      totalClasses: 1,
      pauseNextCycle: toBoolean(plain.pauseNextCycle),
      sortOrder,
      lastSyncedAt: new Date(),
    };
  }

  function buildTotalClassWritePayload(body = {}, current = {}) {
    const payload = {};
    const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

    if (has("day") || has("days")) {
      const days = normalizeTotalClassDays(body.days, body.day);
      payload.day = days[0] || null;
      payload.days = days.join(", ");
      payload.numberOfDecidedDays = days.length;
    }

    const stringFields = [
      "time",
      "duration",
      "durationTime",
      "tuitionName",
      "tutorName",
      "groupName",
      "studentName",
      "classStartTime",
      "classEndTime",
      "status",
      "reportStatus",
      "notes",
      "rowColor",
      "sourceTuitionId",
      "tuitionStartWeek",
    ];

    stringFields.forEach((field) => {
      if (!has(field)) return;
      const normalized = safeText(body[field]);
      payload[field] = normalized || (field === "tuitionName" ? "" : null);
    });

    if (has("tuitionStartDate") || has("tuitionStartMonth")) {
      payload.tuitionStartDate = normalizeDateOnly(body.tuitionStartDate || body.tuitionStartMonth);
    }

    if (has("durationMinutes")) {
      payload.durationMinutes = toUnsignedInteger(body.durationMinutes, 60) || 60;
    }
    if (has("decidedFee")) payload.decidedFee = toNullableMoney(body.decidedFee);
    if (has("tutorFee")) payload.tutorFee = toNullableMoney(body.tutorFee);
    if (has("totalFee")) payload.totalFee = toNullableMoney(body.totalFee);

    [
      "numberOfDecidedDays",
      "classesInAMonth",
      "totalDoneClasses",
      "missedByStudentClasses",
      "missedByTeacherClass",
      "totalClasses",
      "newTuitionCount",
      "sortOrder",
    ].forEach((field) => {
      if (has(field)) payload[field] = toUnsignedInteger(body[field], Number(current[field] || 0));
    });

    if (has("pauseNextCycle")) payload.pauseNextCycle = toBoolean(body.pauseNextCycle);
    if (has("isDeleted")) payload.isDeleted = toBoolean(body.isDeleted);

    if (payload.duration && !payload.durationTime) payload.durationTime = payload.duration;
    if (payload.durationTime && !payload.duration) payload.duration = payload.durationTime;
    if (payload.classStartTime && !payload.time) payload.time = payload.classStartTime;
    payload.lastSyncedAt = new Date();

    return payload;
  }

  function totalClassRowToEntryBody(row, sourceEntry) {
    const plainSource = sourceEntry?.get ? sourceEntry.get({ plain: true }) : sourceEntry || {};
    const plainRow = row?.get ? row.get({ plain: true }) : row || {};
    const days = normalizeTotalClassDays(plainRow.days, plainRow.day || plainSource.day);

    return {
      ...plainSource,
      day: days[0] || plainSource.day,
      days,
      time: plainRow.time || plainRow.classStartTime || plainSource.time,
      timeSlots: [plainRow.time || plainRow.classStartTime || plainSource.time].filter(Boolean),
      timeAssignments: days[0]
        ? { [days[0]]: plainRow.time || plainRow.classStartTime || plainSource.time }
        : {},
      durationMinutes:
        plainRow.durationMinutes || plainRow.durationTime || plainRow.duration || plainSource.durationMinutes,
      durationLabel: plainRow.durationTime || plainRow.duration || plainSource.durationLabel,
      tuitionName: plainRow.tuitionName,
      tutorName: plainRow.tutorName,
      groupName: plainRow.groupName,
      studentName: plainRow.studentName,
      status: plainRow.status,
      reportStatus: plainRow.reportStatus,
      decidedFee: plainRow.decidedFee,
      tutorFee: plainRow.tutorFee,
      notes: plainRow.notes,
      rowColor: plainRow.rowColor,
      sourceTuitionId: plainRow.sourceTuitionId,
      tuitionStartDate: plainRow.tuitionStartDate,
      tuitionStartWeek: plainRow.tuitionStartWeek,
      pauseNextCycle: plainRow.pauseNextCycle,
    };
  }

  async function fetchTotalClassRows(userId, { includeDeleted = false } = {}) {
    const where = { userId };
    if (!includeDeleted) where.isDeleted = false;

    const rows = await OtmTotalClass.findAll({
      where,
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });

    return rows.map((row) => row.get({ plain: true }));
  }

  async function syncTotalClassTable(userId) {
    const entries = await OtmTuitionEntry.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });
    const existingRows = await OtmTotalClass.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });

    const existingBySource = new Map(
      existingRows
        .filter((row) => Number(row.sourceEntryId) > 0)
        .map((row) => [Number(row.sourceEntryId), row])
    );
    const legacyRows = existingRows.filter(
      (row) => Number(row.sourceEntryId || 0) === 0 && !row.isManual
    );
    const claimedLegacyIds = new Set();
    const liveSourceIds = new Set(entries.map((entry) => Number(entry.id)));
    let nextSortOrder = existingRows.reduce(
      (max, row) => Math.max(max, Number(row.sortOrder || 0)),
      0
    );

    for (const entry of entries) {
      let existing = existingBySource.get(Number(entry.id));

      if (!existing) {
        const plainEntry = entry.get({ plain: true });
        const entryDays = normalizeTotalClassDays(plainEntry.days, plainEntry.day);
        existing = legacyRows.find((row) => {
          if (claimedLegacyIds.has(Number(row.id))) return false;
          const rowDays = normalizeTotalClassDays(row.days, row.day);
          return (
            safeLower(row.tuitionName) ===
              safeLower(plainEntry.tuitionName) &&
            safeLower(row.tutorName) ===
              safeLower(plainEntry.tutorName) &&
            safeLower(row.time) ===
              safeLower(plainEntry.time || plainEntry.classStartTime) &&
            safeLower(rowDays[0]) ===
              safeLower(entryDays[0])
          );
        });
        if (existing) claimedLegacyIds.add(Number(existing.id));
      }

      const sortOrder = existing?.sortOrder || ++nextSortOrder;
      const payload = buildTotalClassSyncPayload(entry, sortOrder);

      if (existing) {
        await existing.update({
          ...payload,
          // Spreadsheet-only totals remain editable and are not reset by tuition sync.
          classesInAMonth: existing.classesInAMonth,
          totalDoneClasses: existing.totalDoneClasses,
          missedByStudentClasses: existing.missedByStudentClasses,
          missedByTeacherClass: existing.missedByTeacherClass,
          totalFee: existing.totalFee,
          totalClasses: existing.totalClasses || payload.totalClasses,
          newTuitionCount: existing.newTuitionCount,
          // A user-deleted synced row stays hidden until explicitly restored.
          isManual: false,
          isDeleted: existing.isDeleted,
        });
      } else {
        await OtmTotalClass.create({ ...payload, isManual: false, isDeleted: false });
      }
    }

    for (const row of existingRows) {
      const sourceEntryId = Number(row.sourceEntryId || 0);
      if (sourceEntryId > 0 && !liveSourceIds.has(sourceEntryId)) {
        await row.destroy();
      }
    }

    for (const legacyRow of legacyRows) {
      if (!claimedLegacyIds.has(Number(legacyRow.id))) {
        await legacyRow.destroy();
      }
    }

    return fetchTotalClassRows(userId);
  }

  async function getClassTimes() {
    if (!OtmClassTime || typeof OtmClassTime.findAll !== "function") {
      return OTM_TIME_OPTIONS.map((label, index) => ({
        id: `default-${index + 1}`,
        label,
        startTime: label,
        durationMinutes: 60,
        endTime:
          buildScheduleFields({
            days: [],
            timeSlots: [label],
            durationMinutes: 60,
          }).classEndTimes[0] || label,
        sortOrder: index + 1,
        isActive: true,
      }));
    }

    const rows = await OtmClassTime.findAll({
      where: { isActive: true },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });

    if (rows.length > 0) {
      return rows.map((row) => row.get({ plain: true }));
    }

    return OTM_TIME_OPTIONS.map((label, index) => ({
      id: `default-${index + 1}`,
      label,
      startTime: label,
      durationMinutes: 60,
      endTime:
        buildScheduleFields({
          days: [],
          timeSlots: [label],
          durationMinutes: 60,
        }).classEndTimes[0] || label,
      sortOrder: index + 1,
      isActive: true,
    }));
  }

  async function fetchUserEntries(userId) {
    const entries = await OtmTuitionEntry.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });

    return toPlainEntries(entries)
      .map(sanitizeEntryForDerivedTables)
      .sort((left, right) => {
        const orderDifference =
          Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
        if (orderDifference !== 0) return orderDifference;
        return Number(left.id || 0) - Number(right.id || 0);
      });
  }

  async function syncAllTables(userId) {
    const [reportRows, totalClassRows] = await Promise.all([
      syncReportTable(userId),
      syncTotalClassTable(userId),
    ]);
    return { reportRows, totalClassRows };
  }

  return {
    async meta(req, res) {
      if (!canUsePortal(req)) {
        return res.status(403).json({ message: "Access denied" });
      }
      try {
        const classTimes = await getClassTimes();
        const users = isAdmin(req)
          ? await User.findAll({
              where: { role: "otm" },
              attributes: ["id", "name", "email", "role"],
              order: [["name", "ASC"], ["email", "ASC"]],
            })
          : [];

        return res.json({
          dayOptions: OTM_DAY_OPTIONS,
          statusOptions: OTM_STATUS_OPTIONS,
          durationOptions: OTM_DURATION_OPTIONS,
          classTimes,
          otmUsers: users.map((user) => ({
            id: user.id,
            name: getDisplayName(user),
            email: user.email,
            role: user.role,
          })),
        });
      } catch (error) {
        console.error("OTM META ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch OTM meta" });
      }
    },

    async listUsers(req, res) {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Only admin can view OTM users" });
      }
      try {
        const users = await User.findAll({
          where: { role: "otm" },
          attributes: ["id", "name", "email", "role"],
          order: [["name", "ASC"], ["email", "ASC"]],
        });
        return res.json({
          users: users.map((user) => ({
            id: user.id,
            name: getDisplayName(user),
            email: user.email,
            role: user.role,
          })),
        });
      } catch (error) {
        console.error("OTM USERS ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch OTM users" });
      }
    },

    async listEntries(req, res) {
      const target = await resolveTargetUser(req);
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }
      try {
        const entries = await fetchUserEntries(target.userId);
        return res.json({
          selectedUser: target.targetUser
            ? {
                id: target.targetUser.id,
                name: getDisplayName(target.targetUser),
                email: target.targetUser.email,
                role: target.targetUser.role,
              }
            : {
                id: req.user.id,
                name: getDisplayName(req.user),
                email: req.user.email,
                role: req.user.role,
              },
          entries,
        });
      } catch (error) {
        console.error("OTM LIST ENTRIES ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch entries" });
      }
    },

async createEntry(req, res) {
  const target = await resolveTargetUser(req, {
    forWrite: true,
  });

  if (target.error) {
    return res
      .status(target.error.status)
      .json({
        message: target.error.message,
      });
  }

  try {
    const payloads = expandCreatePayload(req.body);

    const lastEntry =
      await OtmTuitionEntry.findOne({
        where: {
          userId: target.userId,
        },
        order: [
          ["sortOrder", "DESC"],
          ["id", "DESC"],
        ],
      });

    let nextSortOrder = Number(
      lastEntry?.sortOrder || 0
    );

    const createdEntries = [];

    for (const payload of payloads) {
      nextSortOrder += 1;

      const entry =
        await OtmTuitionEntry.create({
          userId: target.userId,
          ...payload,
          sortOrder: nextSortOrder,
          createdBy: target.actingUserId,
          updatedBy: target.actingUserId,
        });

      createdEntries.push(
        entry.get({ plain: true })
      );
    }

    // Reports aur Total Classes dono sync rahenge.
    const {
      reportRows,
      totalClassRows,
    } = await syncAllTables(target.userId);

    return res.json({
      success: true,
      message: `${createdEntries.length} row(s) created successfully`,
      entry: createdEntries[0] || null,
      entries: createdEntries,
      reportRows,
      totalClassRows,
    });
  } catch (error) {
    console.error(
      "OTM CREATE ENTRY ERROR:",
      error
    );

    console.error(
      "OTM CREATE ENTRY SQL ERROR:",
      error?.parent?.sqlMessage
    );

    return res.status(500).json({
      message:
        error?.parent?.sqlMessage ||
        error?.message ||
        "Failed to create row(s)",
    });
  }
},

async updateEntry(req, res) {
  const target = await resolveTargetUser(req, {
    forWrite: true,
  });

  if (target.error) {
    return res
      .status(target.error.status)
      .json({
        message: target.error.message,
      });
  }

  try {
    const entry =
      await OtmTuitionEntry.findOne({
        where: {
          id: req.params.entryId,
          userId: target.userId,
        },
      });

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
      });
    }

    // Sirf request mein bheje gaye fields update honge.
    const payload = buildEntryUpdatePayload(
      req.body,
      entry.get({ plain: true })
    );

    await entry.update({
      ...payload,
      updatedBy: target.actingUserId,
    });

    // Har edit ke baad reports aur total classes sync.
    const {
      reportRows,
      totalClassRows,
    } = await syncAllTables(target.userId);

    return res.json({
      success: true,
      message: "Entry updated successfully",
      entry: entry.get({ plain: true }),
      reportRows,
      totalClassRows,
    });
  } catch (error) {
    console.error(
      "OTM UPDATE ENTRY ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error?.parent?.sqlMessage ||
        error?.message ||
        "Failed to update entry",
    });
  }
},

    async reorderEntries(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const orderedIds = Array.isArray(req.body.orderedIds)
          ? req.body.orderedIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
          : [];

        if (orderedIds.length === 0) {
          return res.status(400).json({ message: "orderedIds array is required" });
        }

        const entries = await OtmTuitionEntry.findAll({
          where: { userId: target.userId },
          order: [["sortOrder", "ASC"], ["id", "ASC"]],
        });

        const entryMap = new Map(entries.map((item) => [Number(item.id), item]));
        if (orderedIds.some((id) => !entryMap.has(id))) {
          return res.status(400).json({ message: "orderedIds contains invalid row ids" });
        }

        const remainingIds = entries
          .map((item) => Number(item.id))
          .filter((id) => !orderedIds.includes(id));

        const finalIds = [...orderedIds, ...remainingIds];

        await Promise.all(
          finalIds.map((id, index) =>
            entryMap.get(id).update({
              sortOrder: index + 1,
              updatedBy: target.actingUserId,
            })
          )
        );

        const sortedEntries = await fetchUserEntries(target.userId);
        const { reportRows, totalClassRows } = await syncAllTables(target.userId);

        return res.json({
          success: true,
          message: "Rows reordered successfully",
          entries: sortedEntries,
          reportRows,
          totalClassRows,
        });
      } catch (error) {
        console.error("OTM REORDER ENTRIES ERROR:", error);
        return res.status(500).json({ message: "Failed to reorder rows" });
      }
    },

    async deleteEntry(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const deleted = await OtmTuitionEntry.destroy({
          where: {
            id: req.params.entryId,
            userId: target.userId,
          },
        });

        if (!deleted) {
          return res.status(404).json({ message: "Entry not found" });
        }

        const entries = await OtmTuitionEntry.findAll({
          where: { userId: target.userId },
          order: [["sortOrder", "ASC"], ["id", "ASC"]],
        });

        await Promise.all(
          entries.map((item, index) =>
            item.update({
              sortOrder: index + 1,
              updatedBy: target.actingUserId,
            })
          )
        );

        const { reportRows, totalClassRows } = await syncAllTables(target.userId);

        return res.json({
          success: true,
          message: "Entry deleted successfully",
          reportRows,
          totalClassRows,
        });
      } catch (error) {
        console.error("OTM DELETE ENTRY ERROR:", error);
        return res.status(500).json({ message: "Failed to delete entry" });
      }
    },

    async createTotalClass(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const lastRow = await OtmTotalClass.findOne({
          where: { userId: target.userId },
          order: [["sortOrder", "DESC"], ["id", "DESC"]],
        });
        const payload = buildTotalClassWritePayload(req.body);
        const days = normalizeTotalClassDays(payload.days, payload.day);
        const tuitionName = normalizeString(payload.tuitionName || req.body.tuitionName);

        if (!tuitionName) {
          return res.status(400).json({ message: "Tuition Name is required" });
        }

        const row = await OtmTotalClass.create({
          userId: target.userId,
          sourceEntryId: null,
          day: days[0] || null,
          days: days.join(", "),
          time: safeTimeLabel(payload.time || req.body.time) || null,
          duration: payload.duration || payload.durationTime || "1 hour",
          durationTime: payload.durationTime || payload.duration || "1 hour",
          durationMinutes: payload.durationMinutes || 60,
          tuitionName,
          tutorName: payload.tutorName || null,
          groupName: payload.groupName || null,
          studentName: payload.studentName || null,
          classStartTime: payload.classStartTime || payload.time || null,
          classEndTime: payload.classEndTime || null,
          status: payload.status || "",
          reportStatus: payload.reportStatus || "pending report",
          decidedFee: payload.decidedFee ?? null,
          tutorFee: payload.tutorFee ?? null,
          notes: payload.notes || null,
          rowColor: payload.rowColor || null,
          sourceTuitionId: payload.sourceTuitionId || null,
          tuitionStartDate: payload.tuitionStartDate || null,
          tuitionStartWeek: payload.tuitionStartWeek || null,
          numberOfDecidedDays: payload.numberOfDecidedDays ?? days.length,
          classesInAMonth: payload.classesInAMonth || 0,
          totalDoneClasses: payload.totalDoneClasses || 0,
          missedByStudentClasses: payload.missedByStudentClasses || 0,
          missedByTeacherClass: payload.missedByTeacherClass || 0,
          totalFee: payload.totalFee ?? null,
          totalClasses: payload.totalClasses || 0,
          newTuitionCount: payload.newTuitionCount || 0,
          pauseNextCycle: payload.pauseNextCycle || false,
          sortOrder: Number(lastRow?.sortOrder || 0) + 1,
          isManual: true,
          isDeleted: false,
          lastSyncedAt: new Date(),
        });

        const rows = await fetchTotalClassRows(target.userId);
        return res.json({ success: true, row: row.get({ plain: true }), rows });
      } catch (error) {
        console.error("OTM CREATE TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: error?.message || "Failed to create total class row" });
      }
    },

    async updateTotalClass(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const row = await OtmTotalClass.findOne({
          where: { id: req.params.totalClassId, userId: target.userId },
        });
        if (!row) return res.status(404).json({ message: "Total class row not found" });

        const payload = buildTotalClassWritePayload(req.body, row.get({ plain: true }));

        await row.update(payload);

        if (Number(row.sourceEntryId) > 0) {
          const sourceEntry = await OtmTuitionEntry.findOne({
            where: { id: row.sourceEntryId, userId: target.userId },
          });

          if (sourceEntry) {
            const entryPayload = buildSingleEntryPayload(totalClassRowToEntryBody(row, sourceEntry));
           await sourceEntry.update({
  ...entryPayload,
  updatedBy: target.actingUserId,
});
          }
        }

        const rows = await fetchTotalClassRows(target.userId);
        const entries = await fetchUserEntries(target.userId);
        return res.json({
          success: true,
          row: rows.find((item) => Number(item.id) === Number(row.id)) || row.get({ plain: true }),
          rows,
          entries,
        });
      } catch (error) {
        console.error("OTM UPDATE TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: error?.message || "Failed to update total class row" });
      }
    },

    async bulkUpdateTotalClasses(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const updates = Array.isArray(req.body.rows) ? req.body.rows : [];
        if (updates.length === 0) {
          return res.status(400).json({ message: "rows array is required" });
        }

        for (const update of updates) {
          const row = await OtmTotalClass.findOne({
            where: { id: update.id, userId: target.userId },
          });
          if (!row) continue;

          await row.update(buildTotalClassWritePayload(update, row.get({ plain: true })));

          if (Number(row.sourceEntryId) > 0) {
            const sourceEntry = await OtmTuitionEntry.findOne({
              where: { id: row.sourceEntryId, userId: target.userId },
            });
            if (sourceEntry) {
              const entryPayload = buildSingleEntryPayload(totalClassRowToEntryBody(row, sourceEntry));
              if (entryPayload.day && entryPayload.time && entryPayload.tuitionName) {
                await sourceEntry.update({
                  ...entryPayload,
                  updatedBy: target.actingUserId,
                });
              }
            }
          }
        }

        await syncReportTable(target.userId);
        await syncTotalClassTable(target.userId);
        const rows = await fetchTotalClassRows(target.userId);
        const entries = await fetchUserEntries(target.userId);
        return res.json({ success: true, rows, entries });
      } catch (error) {
        console.error("OTM BULK UPDATE TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: error?.message || "Failed to paste total class rows" });
      }
    },

    async reorderTotalClasses(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const orderedIds = Array.isArray(req.body.orderedIds)
          ? req.body.orderedIds.map(Number).filter((id) => Number.isFinite(id) && id > 0)
          : [];
        if (orderedIds.length === 0) {
          return res.status(400).json({ message: "orderedIds array is required" });
        }

        const rows = await OtmTotalClass.findAll({
          where: { userId: target.userId, isDeleted: false },
          order: [["sortOrder", "ASC"], ["id", "ASC"]],
        });
        const rowMap = new Map(rows.map((row) => [Number(row.id), row]));
        if (orderedIds.some((id) => !rowMap.has(id))) {
          return res.status(400).json({ message: "orderedIds contains invalid row ids" });
        }

        const remainingIds = rows
          .map((row) => Number(row.id))
          .filter((id) => !orderedIds.includes(id));
        const finalIds = [...orderedIds, ...remainingIds];

        await Promise.all(
          finalIds.map((id, index) => rowMap.get(id).update({ sortOrder: index + 1 }))
        );

        return res.json({ success: true, rows: await fetchTotalClassRows(target.userId) });
      } catch (error) {
        console.error("OTM REORDER TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: "Failed to reorder total class rows" });
      }
    },

    async deleteTotalClass(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const row = await OtmTotalClass.findOne({
          where: { id: req.params.totalClassId, userId: target.userId },
        });
        if (!row) return res.status(404).json({ message: "Total class row not found" });

        if (Number(row.sourceEntryId) > 0) {
          await row.update({ isDeleted: true });
        } else {
          await row.destroy();
        }

        const rows = await fetchTotalClassRows(target.userId);
        await Promise.all(rows.map((item, index) =>
          OtmTotalClass.update(
            { sortOrder: index + 1 },
            { where: { id: item.id, userId: target.userId } }
          )
        ));

        return res.json({ success: true, rows: await fetchTotalClassRows(target.userId) });
      } catch (error) {
        console.error("OTM DELETE TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: "Failed to delete total class row" });
      }
    },

    async reports(req, res) {
      const target = await resolveTargetUser(req);
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const plainEntries = await fetchUserEntries(target.userId);
        const reportRows = buildReportRows(plainEntries);

        if (plainEntries.length > 0) {
          await syncReportTable(target.userId);
        }

        return res.json({
          summary: buildSummary(plainEntries),
          rows: reportRows,
        });
      } catch (error) {
        console.error("OTM REPORTS ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch reports" });
      }
    },

    async totalClass(req, res) {
      const target = await resolveTargetUser(req);
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const rows = await syncTotalClassTable(target.userId);
        const plainEntries = await fetchUserEntries(target.userId);

        return res.json({
          summary: {
            totalScheduled: rows.reduce((sum, row) => sum + Number(row.totalClasses || 0), 0),
            totalHours: rows.reduce(
              (sum, row) => sum + Number(row.durationMinutes || 0) / 60,
              0
            ),
            completedClasses: rows.reduce(
              (sum, row) => sum + Number(row.totalDoneClasses || 0),
              0
            ),
            totalClasses: rows.reduce((sum, row) => sum + Number(row.totalClasses || 0), 0),
            byStatus: countBy(plainEntries.map((item) => item.status)),
          },
          rows,
        });
      } catch (error) {
        console.error("OTM TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: error?.message || "Failed to fetch total class" });
      }
    },

    async adminUserDetails(req, res) {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Only admin can view this data" });
      }

      try {
        const target = await resolveTargetUser({
          ...req,
          params: { ...req.params, userId: req.params.userId },
        });

        if (target.error) {
          return res.status(target.error.status).json({ message: target.error.message });
        }

        const plainEntries = await fetchUserEntries(target.userId);
        const totalClassRows = await syncTotalClassTable(target.userId);
        return res.json({
          user: {
            id: target.targetUser.id,
            name: getDisplayName(target.targetUser),
            email: target.targetUser.email,
            role: target.targetUser.role,
          },
          entries: plainEntries,
          reports: {
            summary: buildSummary(plainEntries),
            rows: buildReportRows(plainEntries),
          },
          totalClass: {
            summary: {
              totalScheduled: totalClassRows.reduce(
                (sum, row) => sum + Number(row.totalClasses || 0),
                0
              ),
              totalHours: totalClassRows.reduce(
                (sum, row) => sum + Number(row.durationMinutes || 0) / 60,
                0
              ),
              completedClasses: totalClassRows.reduce(
                (sum, row) => sum + Number(row.totalDoneClasses || 0),
                0
              ),
              byStatus: countBy(plainEntries.map((item) => item.status)),
            },
            rows: totalClassRows,
          },
        });
      } catch (error) {
        console.error("ADMIN OTM USER DETAILS ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch admin OTM details" });
      }
    },
  };
}
