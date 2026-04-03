export function makeOtmManagementController({ User, OtmTuitionEntry }) {
  const normalize = (value) => {
    if (value === undefined || value === null) return null;
    const v = String(value).trim();
    return v === "" ? null : v;
  };

  const getDisplayName = (user) => {
    if (user?.name) return user.name;
    const emailPrefix = user?.email?.split("@")[0] || "User";
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const buildReports = (entries) => {
    const byStatus = {};
    const byDay = {};

    for (const item of entries) {
      const status = item.status || "Unknown";
      const day = item.day || "Unknown";

      byStatus[status] = (byStatus[status] || 0) + 1;
      byDay[day] = (byDay[day] || 0) + 1;
    }

    return {
      totalEntries: entries.length,
      byStatus,
      byDay,
    };
  };

  const buildTotalClass = (entries) => {
    const byTuition = {};

    for (const item of entries) {
      const key = item.tuitionName || "Untitled Tuition";
      byTuition[key] = (byTuition[key] || 0) + 1;
    }

    return {
      totalClasses: entries.length,
      byTuition,
    };
  };

  const cleanPayload = (body) => ({
    day: normalize(body.day),
    time: normalize(body.time),
    tuitionName: normalize(body.tuitionName),
    groupName: normalize(body.groupName),
    classStartTime: normalize(body.classStartTime),
    classEndTime: normalize(body.classEndTime),
    status: normalize(body.status) || "Pending",
    notes: normalize(body.notes),
  });

  const isOtm = (req) => req.user.role === "otm";
  const isAdmin = (req) => req.user.role === "admin";

  return {
    async listEntries(req, res) {
      if (!isOtm(req) && !isAdmin(req)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const userId = isAdmin(req) && req.query.userId ? Number(req.query.userId) : req.user.id;

        const entries = await OtmTuitionEntry.findAll({
          where: { userId },
          order: [["createdAt", "DESC"]],
        });

        return res.json({ entries });
      } catch (e) {
        console.error("OTM LIST ENTRIES ERROR:", e);
        return res.status(500).json({ message: "Failed to fetch entries" });
      }
    },

    async createEntry(req, res) {
      if (!isOtm(req)) {
        return res.status(403).json({ message: "Only OTM can create entries" });
      }

      try {
        const payload = cleanPayload(req.body);

        if (!payload.day || !payload.tuitionName) {
          return res.status(400).json({ message: "Day and Tuition Name are required" });
        }

        const entry = await OtmTuitionEntry.create({
          userId: req.user.id,
          ...payload,
        });

        return res.json({
          success: true,
          message: "Entry created successfully",
          entry,
        });
      } catch (e) {
        console.error("OTM CREATE ENTRY ERROR:", e);
        return res.status(500).json({ message: "Failed to create entry" });
      }
    },

    async updateEntry(req, res) {
      if (!isOtm(req)) {
        return res.status(403).json({ message: "Only OTM can update entries" });
      }

      try {
        const entry = await OtmTuitionEntry.findOne({
          where: {
            id: req.params.entryId,
            userId: req.user.id,
          },
        });

        if (!entry) {
          return res.status(404).json({ message: "Entry not found" });
        }

        const payload = cleanPayload(req.body);

        if (!payload.day || !payload.tuitionName) {
          return res.status(400).json({ message: "Day and Tuition Name are required" });
        }

        await entry.update(payload);

        return res.json({
          success: true,
          message: "Entry updated successfully",
          entry,
        });
      } catch (e) {
        console.error("OTM UPDATE ENTRY ERROR:", e);
        return res.status(500).json({ message: "Failed to update entry" });
      }
    },

    async deleteEntry(req, res) {
      if (!isOtm(req)) {
        return res.status(403).json({ message: "Only OTM can delete entries" });
      }

      try {
        const deleted = await OtmTuitionEntry.destroy({
          where: {
            id: req.params.entryId,
            userId: req.user.id,
          },
        });

        if (!deleted) {
          return res.status(404).json({ message: "Entry not found" });
        }

        return res.json({
          success: true,
          message: "Entry deleted successfully",
        });
      } catch (e) {
        console.error("OTM DELETE ENTRY ERROR:", e);
        return res.status(500).json({ message: "Failed to delete entry" });
      }
    },

    async reports(req, res) {
      if (!isOtm(req) && !isAdmin(req)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const userId = isAdmin(req) && req.query.userId ? Number(req.query.userId) : req.user.id;

        const entries = await OtmTuitionEntry.findAll({
          where: { userId },
          order: [["createdAt", "DESC"]],
        });

        return res.json({
          reports: buildReports(entries),
        });
      } catch (e) {
        console.error("OTM REPORTS ERROR:", e);
        return res.status(500).json({ message: "Failed to fetch reports" });
      }
    },

    async totalClass(req, res) {
      if (!isOtm(req) && !isAdmin(req)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const userId = isAdmin(req) && req.query.userId ? Number(req.query.userId) : req.user.id;

        const entries = await OtmTuitionEntry.findAll({
          where: { userId },
          order: [["createdAt", "DESC"]],
        });

        return res.json({
          totalClass: buildTotalClass(entries),
        });
      } catch (e) {
        console.error("OTM TOTAL CLASS ERROR:", e);
        return res.status(500).json({ message: "Failed to fetch total class" });
      }
    },

    async adminUserDetails(req, res) {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Only admin can view this data" });
      }

      try {
        const user = await User.findByPk(req.params.userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "otm") {
          return res.status(400).json({ message: "Selected user is not an OTM user" });
        }

        const entries = await OtmTuitionEntry.findAll({
          where: { userId: user.id },
          order: [["createdAt", "DESC"]],
        });

        return res.json({
          user: {
            id: user.id,
            name: getDisplayName(user),
            email: user.email,
            role: user.role,
          },
          entries,
          reports: buildReports(entries),
          totalClass: buildTotalClass(entries),
        });
      } catch (e) {
        console.error("ADMIN OTM USER DETAILS ERROR:", e);
        return res.status(500).json({ message: "Failed to fetch admin otm details" });
      }
    },
  };
}