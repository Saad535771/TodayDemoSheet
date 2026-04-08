import {
  OTM_DAY_OPTIONS,
  OTM_DURATION_OPTIONS,
  OTM_STATUS_OPTIONS,
  OTM_TIME_OPTIONS,
  buildScheduleFields,
  normalizeArrayInput,
  normalizeBoolean,
  normalizeString,
  countBy,
} from "../utils/otmScheduleUtils.js";

export function makeOtmManagementController({
  User,
  OtmTuitionEntry,
  OtmPortalReport,
  OtmClassTime,
}) {
  const canUsePortal = (req) => req.user?.role === "otm" || req.user?.role === "admin";
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

    const userId = requestedUserId ? Number(requestedUserId) : Number(req.user.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return { error: { status: 400, message: "Valid userId is required" } };
    }

    if (userId === Number(req.user.id) && forWrite) {
      return { error: { status: 400, message: "Admin should select an OTM user to edit portal data" } };
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return { error: { status: 404, message: "Selected user not found" } };
    }

    if (targetUser.role !== "otm") {
      return { error: { status: 400, message: "Selected user is not an OTM user" } };
    }

    return { userId, targetUser, actingUserId: Number(req.user.id) };
  }

  function buildEntryPayload(body = {}) {
    const days = normalizeArrayInput(body.days ?? body.day);
    const timeSlots = normalizeArrayInput(body.timeSlots ?? body.time);
    const schedule = buildScheduleFields({
      days,
      timeSlots,
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
    };
  }

  function buildSummary(entries = []) {
    return {
      totalEntries: entries.length,
      byStatus: countBy(entries.map((item) => item.status)),
      byDay: countBy(entries.flatMap((item) => Array.isArray(item.days) ? item.days : normalizeArrayInput(item.day))),
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
        });
      }

      const row = map.get(key);
      row.totalClasses += 1;

      if (item.status === "class done") row.classDoneCount += 1;
      if (item.status === "class pending") row.classPendingCount += 1;
      if (item.status === "missed by teacher") row.missedByTeacherCount += 1;
      if (item.status === "missed by student") row.missedByStudentCount += 1;
      if (item.newTuition) row.newTuitionCount += 1;
    }

    return [...map.values()].sort((a, b) => {
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
          newTuitionCount: 0,
        });
      }

      const row = map.get(key);
      row.totalClasses += 1;
      if (item.newTuition) row.newTuitionCount += 1;
    }

    return [...map.values()].sort((a, b) => a.tuitionName.localeCompare(b.tuitionName));
  }

  async function syncReportTable(userId) {
    const entries = await OtmTuitionEntry.findAll({
      where: { userId },
      order: [["sortOrder", "ASC"], ["id", "DESC"]],
    });

    const reportRows = buildReportRows(entries.map((item) => item.get({ plain: true })));

    await OtmPortalReport.destroy({ where: { userId } });

    if (reportRows.length > 0) {
      await OtmPortalReport.bulkCreate(
        reportRows.map((row) => ({
          userId,
          ...row,
          lastSyncedAt: new Date(),
        }))
      );
    }

    return reportRows;
  }

  async function getClassTimes() {
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
      endTime: buildScheduleFields({
        days: [],
        timeSlots: [label],
        durationMinutes: 60,
      }).classEndTimes[0] || label,
      sortOrder: index + 1,
      isActive: true,
    }));
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
        const entries = await OtmTuitionEntry.findAll({
          where: { userId: target.userId },
          order: [["sortOrder", "ASC"], ["id", "DESC"]],
        });

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
        const payload = buildEntryPayload(req.body);

        if (!payload.day || !payload.tuitionName) {
          return res.status(400).json({ message: "Day and Tuition Name are required" });
        }

        const lastEntry = await OtmTuitionEntry.findOne({
          where: { userId: target.userId },
          order: [["sortOrder", "DESC"], ["id", "DESC"]],
        });

        const entry = await OtmTuitionEntry.create({
          userId: target.userId,
          ...payload,
          sortOrder: (lastEntry?.sortOrder || 0) + 1,
          createdBy: target.actingUserId,
          updatedBy: target.actingUserId,
        });

        const reportRows = await syncReportTable(target.userId);

        return res.json({
          success: true,
          message: "Entry created successfully",
          entry,
          reportRows,
        });
      } catch (error) {
        console.error("OTM CREATE ENTRY ERROR:", error);
        return res.status(500).json({ message: "Failed to create entry" });
      }
    },

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

        const payload = buildEntryPayload(req.body);
        if (!payload.day || !payload.tuitionName) {
          return res.status(400).json({ message: "Day and Tuition Name are required" });
        }

        await entry.update({
          ...payload,
          updatedBy: target.actingUserId,
        });

        const reportRows = await syncReportTable(target.userId);

        return res.json({
          success: true,
          message: "Entry updated successfully",
          entry,
          reportRows,
        });
      } catch (error) {
        console.error("OTM UPDATE ENTRY ERROR:", error);
        return res.status(500).json({ message: "Failed to update entry" });
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

        const reportRows = await syncReportTable(target.userId);

        return res.json({
          success: true,
          message: "Entry deleted successfully",
          reportRows,
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
        const entries = await OtmTuitionEntry.findAll({
          where: { userId: target.userId },
          order: [["sortOrder", "ASC"], ["id", "DESC"]],
        });

        let reportRows = await OtmPortalReport.findAll({
          where: { userId: target.userId },
          order: [["teacherName", "ASC"], ["tuitionName", "ASC"]],
        });

        if (reportRows.length === 0 && entries.length > 0) {
          await syncReportTable(target.userId);
          reportRows = await OtmPortalReport.findAll({
            where: { userId: target.userId },
            order: [["teacherName", "ASC"], ["tuitionName", "ASC"]],
          });
        }

        const plainEntries = entries.map((item) => item.get({ plain: true }));

        return res.json({
          summary: buildSummary(plainEntries),
          rows: reportRows.map((row) => row.get({ plain: true })),
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
        const entries = await OtmTuitionEntry.findAll({
          where: { userId: target.userId },
          order: [["sortOrder", "ASC"], ["id", "DESC"]],
        });

        const plainEntries = entries.map((item) => item.get({ plain: true }));
        return res.json({
          summary: {
            totalClasses: plainEntries.length,
            byStatus: countBy(plainEntries.map((item) => item.status)),
          },
          rows: buildTotalClassRows(plainEntries),
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

        const entries = await OtmTuitionEntry.findAll({
          where: { userId: target.userId },
          order: [["sortOrder", "ASC"], ["id", "DESC"]],
        });

        const plainEntries = entries.map((item) => item.get({ plain: true }));
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
              totalClasses: plainEntries.length,
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
