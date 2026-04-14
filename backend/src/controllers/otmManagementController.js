import {
  OTM_DAY_OPTIONS,
  OTM_DURATION_OPTIONS,
  OTM_STATUS_OPTIONS,
  OTM_TIME_OPTIONS,
  buildScheduleFields,
  normalizeArrayInput,
  normalizeBoolean,
  normalizeMonthValue,
  normalizeString,
  normalizeTimeAssignments,
  normalizeTimeLabel,
  countBy,
  sortDays,
  getDayOrderIndex,
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
      targetUser = await User.findByPk(userId);

      if (!targetUser) {
        return { error: { status: 404, message: "Selected user not found" } };
      }

      if (targetUser.role !== "otm") {
        return { error: { status: 400, message: "Selected user is not an OTM user" } };
      }
    }

    if (!targetUser) {
      targetUser = await User.findOne({
        where: { role: "otm" },
        order: [["name", "ASC"], ["email", "ASC"], ["id", "ASC"]],
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
    const requestedDays = sortDays(body.days ?? body.day);
    const day = normalizeString(body.day) || requestedDays[0] || null;

    const timeAssignments = normalizeTimeAssignments(body.timeAssignments, day ? [day] : []);
    const fallbackSlots = normalizeArrayInput(body.timeSlots ?? body.time).map((slot) => normalizeTimeLabel(slot));
    const time = timeAssignments?.[day] || fallbackSlots[0] || normalizeTimeLabel(body.time);

    const schedule = buildScheduleFields({
      days: day ? [day] : [],
      timeSlots: time ? [time] : [],
      durationMinutes: body.durationMinutes ?? body.durationLabel ?? body.duration,
    });

    const status = (normalizeString(body.status) || "class pending").toLowerCase();
    const normalizedStatus = OTM_STATUS_OPTIONS.includes(status) ? status : "class pending";

    return {
      day: schedule.day,
      days: schedule.days,
      time: schedule.time,
      timeSlots: schedule.timeSlots,
      durationLabel: schedule.durationLabel,
      durationMinutes: schedule.durationMinutes,
      tuitionName: normalizeString(body.tuitionName),
      tutorName: normalizeString(body.tutorName),
      groupName: normalizeString(body.groupName),
      studentName: normalizeString(body.studentName),
      classStartTime: schedule.classStartTime,
      classStartTimes: schedule.classStartTimes,
      classEndTime: schedule.classEndTime,
      classEndTimes: schedule.classEndTimes,
      status: normalizedStatus,
      reportStatus: normalizeString(body.reportStatus),
      notes: normalizeString(body.notes),
      newTuition: normalizeBoolean(body.newTuition),
      rowColor: normalizeString(body.rowColor),
      tuitionStartMonth: normalizeMonthValue(body.tuitionStartMonth),
      tuitionEndMonth: normalizeMonthValue(body.tuitionEndMonth),
    };
  }

  function expandCreatePayload(body = {}) {
    const days = sortDays(body.days ?? body.day);
    const timeAssignments = normalizeTimeAssignments(body.timeAssignments, days);
    const fallbackSlots = normalizeArrayInput(body.timeSlots ?? body.time).map((slot) => normalizeTimeLabel(slot));

    return days.map((day, index) => {
      const time =
        timeAssignments?.[day] ||
        fallbackSlots[index] ||
        fallbackSlots[0] ||
        normalizeTimeLabel(body.time);
      return buildSingleEntryPayload({
        ...body,
        day,
        days: [day],
        time,
        timeSlots: time ? [time] : [],
        timeAssignments: { [day]: time },
      });
    });
  }
  function toPlainEntries(entries = []) {
    return entries.map((item) => item.get({ plain: true }));
  }
  function sortEntries(entries = []) {
    return [...entries].sort((a, b) => {
      const orderA = Number(a.sortOrder || 0);
      const orderB = Number(b.sortOrder || 0);
      if (orderA !== orderB) return orderA - orderB;
      const dayCompare = getDayOrderIndex(a.day) - getDayOrderIndex(b.day);
      if (dayCompare !== 0) return dayCompare;
      return Number(a.id || 0) - Number(b.id || 0);
    });
  }
  function buildSummary(entries = []) {
    return {
      totalEntries: entries.length,
      byStatus: countBy(entries.map((item) => item.status)),
      byDay: countBy(entries.flatMap((item) => (Array.isArray(item.days) ? item.days : normalizeArrayInput(item.day)))),
      byTeacher: countBy(entries.map((item) => item.tutorName || "Unassigned")),
    };
  }
  function buildReportRows(entries = []) {
    const map = new Map();
    for (const item of entries) {
      const teacherName = normalizeString(item.tutorName) || "Unassigned";
      const tuitionName = normalizeString(item.tuitionName) || "Untitled Tuition";
      const key = `${teacherName}__${tuitionName}`;
      if (!map.has(key)) {
        map.set(key, {
          teacherName,
          tuitionName,
          totalClasses: 0,
          classDoneCount: 0,
          classPendingCount: 0,
          missedByTeacherCount: 0,
          missedByStudentCount: 0,
          newTuitionCount: 0,
          days: [],
          tuitionStartMonth: normalizeMonthValue(item.tuitionStartMonth),
          tuitionEndMonth: normalizeMonthValue(item.tuitionEndMonth),
          rowColor: normalizeString(item.rowColor),
        });
      }
      const row = map.get(key);
row.totalClasses += 1;
row.rowColor = row.rowColor || normalizeString(item.rowColor);
row.tuitionStartMonth = row.tuitionStartMonth || normalizeMonthValue(item.tuitionStartMonth);
row.tuitionEndMonth = row.tuitionEndMonth || normalizeMonthValue(item.tuitionEndMonth);
row.sortOrder = Math.min(row.sortOrder, Number(item.sortOrder || 0));
if (item.newTuition) row.newTuitionCount += 1;
if (item.status === "class done") row.classDoneCount += 1;
if (item.status === "class pending") row.classPendingCount += 1;
if (item.status === "missed by teacher") row.missedByTeacherCount += 1;
if (item.status === "missed by student") row.missedByStudentCount += 1;
    }
    return [...map.values()]
      .map((row) => ({
        ...row,
        day: row.days.join(", "),
      }))
      .sort((a, b) => {
        if (a.teacherName === b.teacherName) {
          return a.tuitionName.localeCompare(b.tuitionName);
        }
        return a.teacherName.localeCompare(b.teacherName);
      });
  }
  function buildTotalClassRows(entries = []) {
    const map = new Map();
    for (const item of entries) {
      const tuitionName = normalizeString(item.tuitionName) || "Untitled Tuition";
      const tutorName = normalizeString(item.tutorName) || "Unassigned";
      const dayText = normalizeString(item.day) || "No Day";
      const timeText = normalizeString(item.time) || "No Time";
      const key = `${tuitionName}__${tutorName}__${dayText}__${timeText}`;
      if (!map.has(key)) {
        map.set(key, {
          tuitionName,
          tutorName,
          days: dayText,
          time: timeText,
          duration: item.durationLabel || "1 hour",
          status: item.status || "class pending",
          totalClasses: 0,
          classDoneCount: 0,
          classPendingCount: 0,
          missedByTeacherCount: 0,
          missedByStudentCount: 0,
          newTuitionCount: 0,
          tuitionStartMonth: normalizeMonthValue(item.tuitionStartMonth),
          tuitionEndMonth: normalizeMonthValue(item.tuitionEndMonth),
          rowColor: normalizeString(item.rowColor),
          sortOrder: Number(item.sortOrder || 0),
        });
      }
      const row = map.get(key);
      row.rowColor = row.rowColor || normalizeString(item.rowColor);
      row.tuitionStartMonth = row.tuitionStartMonth || normalizeMonthValue(item.tuitionStartMonth);
      row.tuitionEndMonth = row.tuitionEndMonth || normalizeMonthValue(item.tuitionEndMonth);
      row.sortOrder = Math.min(row.sortOrder, Number(item.sortOrder || 0));
      if (item.newTuition) row.newTuitionCount += 1;
      if (item.status === "class done") row.classDoneCount += 1;
      if (item.status === "class pending") row.classPendingCount += 1;
      if (item.status === "missed by teacher") row.missedByTeacherCount += 1;
      if (item.status === "missed by student") row.missedByStudentCount += 1;
    }
    return [...map.values()]
      .map((row) => ({
        ...row,
        totalClasses: row.totalClasses,
        status:
  row.classPendingCount > 0
    ? "class pending"
    : row.missedByTeacherCount > 0
      ? "missed by teacher"
      : row.missedByStudentCount > 0
        ? "missed by student"
        : row.classDoneCount > 0
          ? "class done"
          : row.status,
      }))
     .sort((a, b) => 
  a.sortOrder - b.sortOrder || getDayOrderIndex(a.days) - getDayOrderIndex(b.days)
);
  }
  async function syncReportTable(userId) {
    const entries = await OtmTuitionEntry.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });
    const reportRows = buildReportRows(toPlainEntries(entries));
    await OtmPortalReport.destroy({ where: { userId } });
    if (reportRows.length > 0) {
      await OtmPortalReport.bulkCreate(
        reportRows.map((row) => ({
          userId,
          teacherName: row.teacherName,
          tuitionName: row.tuitionName,
          totalClasses: row.totalClasses,
          classDoneCount: row.classDoneCount,
          classPendingCount: row.classPendingCount,
          missedByTeacherCount: row.missedByTeacherCount,
          missedByStudentCount: row.missedByStudentCount,
          newTuitionCount: row.newTuitionCount,
          lastSyncedAt: new Date(),
        }))
      );
    }
    return reportRows;
  }
  async function syncTotalClassTable(userId) {
    const entries = await OtmTuitionEntry.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
    });
    const rows = buildTotalClassRows(toPlainEntries(entries));
    await OtmTotalClass.destroy({ where: { userId } });
    if (rows.length > 0) {
      await OtmTotalClass.bulkCreate(
        rows.map((row) => ({
          userId,
          tuitionName: row.tuitionName,
          tutorName: row.tutorName,
          days: row.days,
          time: row.time,
          duration: row.duration,
          status: row.status,
          totalClasses: row.totalClasses,
          newTuitionCount: row.newTuitionCount,
          lastSyncedAt: new Date(),
        }))
      );
    }
    return rows;
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

    return sortEntries(toPlainEntries(entries));
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
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const payloads = expandCreatePayload(req.body);

        if (payloads.length === 0) {
          return res.status(400).json({ message: "At least one day is required" });
        }

        if (payloads.some((item) => !item.day || !item.tuitionName || !item.time)) {
          return res.status(400).json({ message: "Day, time and Tuition Name are required for each row" });
        }

        const lastEntry = await OtmTuitionEntry.findOne({
          where: { userId: target.userId },
          order: [["sortOrder", "DESC"], ["id", "DESC"]],
        });

        let nextSortOrder = Number(lastEntry?.sortOrder || 0);
        const createdEntries = [];

        for (const payload of payloads) {
          nextSortOrder += 1;
          const entry = await OtmTuitionEntry.create({
            userId: target.userId,
            ...payload,
            sortOrder: nextSortOrder,
            createdBy: target.actingUserId,
            updatedBy: target.actingUserId,
          });
          createdEntries.push(entry.get({ plain: true }));
        }

        const { reportRows, totalClassRows } = await syncAllTables(target.userId);

        return res.json({
          success: true,
          message: `${createdEntries.length} row(s) created successfully`,
          entry: createdEntries[0] || null,
          entries: createdEntries,
          reportRows,
          totalClassRows,
        });
      }  catch (error) {
  console.error("OTM CREATE ENTRY ERROR:", error);
  console.error("OTM CREATE ENTRY ERROR MESSAGE:", error?.message);
  console.error("OTM CREATE ENTRY SQL ERROR:", error?.parent?.sqlMessage);
  console.error("OTM CREATE ENTRY STACK:", error?.stack);

  return res.status(500).json({
    message:
      error?.parent?.sqlMessage ||
      error?.message ||
      "Failed to create row(s)",
  });}},

    async updateEntry(req, res) {
      const target = await resolveTargetUser(req, { forWrite: true });
      if (target.error) {
        return res.status(target.error.status).json({ message: target.error.message });
      }

      try {
        const entry = await OtmTuitionEntry.findOne({
          where: {
            id: req.params.entryId,
            userId: target.userId,
          },
        });

        if (!entry) {
          return res.status(404).json({ message: "Entry not found" });
        }

        const payload = buildSingleEntryPayload(req.body);
        if (!payload.day || !payload.tuitionName || !payload.time) {
          return res.status(400).json({ message: "Day, time and Tuition Name are required" });
        }

        await entry.update({
          ...payload,
          updatedBy: target.actingUserId,
        });

        const { reportRows, totalClassRows } = await syncAllTables(target.userId);

        return res.json({
          success: true,
          message: "Entry updated successfully",
          entry: entry.get({ plain: true }),
          reportRows,
          totalClassRows,
        });
      } catch (error) {
        console.error("OTM UPDATE ENTRY ERROR:", error);
        return res.status(500).json({ message: "Failed to update entry" });
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
        const plainEntries = await fetchUserEntries(target.userId);
        const rows = buildTotalClassRows(plainEntries);

        if (plainEntries.length > 0) {
          await syncTotalClassTable(target.userId);
        }

        return res.json({
          summary: {
            totalClasses: rows.reduce((sum, row) => sum + Number(row.totalClasses || 0), 0),
            byStatus: countBy(plainEntries.map((item) => item.status)),
          },
          rows,
        });
      } catch (error) {
        console.error("OTM TOTAL CLASS ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch total class" });
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
              totalClasses: buildTotalClassRows(plainEntries).reduce(
                (sum, row) => sum + Number(row.totalClasses || 0),
                0
              ),
              byStatus: countBy(plainEntries.map((item) => item.status)),
            },
            rows: buildTotalClassRows(plainEntries),
          },
        });
      } catch (error) {
        console.error("ADMIN OTM USER DETAILS ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch admin OTM details" });
      }
    },
  };
}
