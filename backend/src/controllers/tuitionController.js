import { validationResult } from "express-validator";
import { parseHourFromValue } from "../utils/time.js";
import { Op } from "sequelize";
import {
  syncPaymentFromTuition,
  removePaymentByTuitionId
} from "../utils/syncPaymentFromTuition.js";
import {
  upsertTodayDemoFromTuition,
  removeTodayDemoByTuitionId
} from "../utils/syncTodayDemoFromTuition.js";

const PRESERVE_IF_EMPTY = new Set(["status", "satisfactionRating", "demoRating"]);
const PAYMENT_APPROVAL_PENDING = "pending";
const PAYMENT_APPROVAL_APPROVED = "approved";
const PAYMENT_APPROVAL_REJECTED = "rejected";

function normalizeTuitionId(v) {
  if (v === null || v === undefined) return "";
  let s = String(v).trim();
  if (!s) return "";
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, "");
  return s;
}

function normalizeDate(v) {
  if (!v) return null;

  const s = String(v).trim();
  if (!s || s.toLowerCase() === "invalid date") return null;

  let match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = String(match[1]).padStart(2, "0");
    const month = String(match[2]).padStart(2, "0");
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = String(match[2]).padStart(2, "0");
    const day = String(match[3]).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  match = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = String(match[2]).padStart(2, "0");
    const day = String(match[3]).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parsePositiveInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const parsed = Number.parseInt(String(v), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildMonthRange(year, month) {
  if (!year || !month || month < 1 || month > 12) return null;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const end = nextMonthDate.toISOString().slice(0, 10);
  return { start, end };
}

function applyMonthYearFilter(where, monthValue, yearValue) {
  const month = parsePositiveInt(monthValue);
  const year = parsePositiveInt(yearValue);
  if (!month || !year) return null;

  const range = buildMonthRange(year, month);
  if (!range) return null;

  where.date = {
    [Op.gte]: range.start,
    [Op.lt]: range.end
  };

  return { month, year };
}

function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((entry) => String(entry || "").trim()).filter(Boolean))];
  }

  if (value === null || value === undefined) return [];

  const raw = String(value).trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [
          ...new Set(parsed.map((entry) => String(entry || "").trim()).filter(Boolean))
        ];
      }
    } catch {
      // fallback to comma split
    }
  }

  return [...new Set(raw.split(",").map((entry) => entry.trim()).filter(Boolean))];
}

function hasStatus(value, target) {
  return normalizeMultiValue(value).includes(target);
}

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned || null;
}

function setApprovalPending(item) {
  item.paymentApprovalStatus = PAYMENT_APPROVAL_PENDING;
  item.paymentApprovalRequestedAt = item.paymentApprovalRequestedAt || new Date();
  item.paymentApprovedAt = null;
  item.paymentApprovedBy = null;
  item.paymentRejectionReason = null;
}

function clearApprovalState(item) {
  item.paymentApprovalStatus = null;
  item.paymentApprovalRequestedAt = null;
  item.paymentApprovedAt = null;
  item.paymentApprovedBy = null;
  item.paymentRejectionReason = null;
}

async function syncPaymentByApprovalState({ Payment, item }) {
  const isTuitionDone = hasStatus(item?.status, "Tuition Done");

  if (!isTuitionDone) {
    if (item?.tuitionId) {
      await removePaymentByTuitionId({ Payment, tuitionId: item.tuitionId });
    }
    return;
  }

  if (item?.paymentApprovalStatus === PAYMENT_APPROVAL_APPROVED) {
    await syncPaymentFromTuition({ Payment, item });
    return;
  }

  if (item?.tuitionId) {
    await removePaymentByTuitionId({ Payment, tuitionId: item.tuitionId });
  }
}

function requireHodOrAdmin(req, res) {
  if (req.user?.role !== "admin" && req.user?.role !== "hod") {
    res.status(403).json({ message: "Only Admin or HOD can perform this action" });
    return false;
  }
  return true;
}

export function makeTuitionController({ Tuition, TodayDemo, Payment, User, OtmTuitionEntry }) {
  const getDisplayName = (user) => {
    const explicit = normalizeText(user?.name);
    if (explicit) return explicit;
    const prefix = String(user?.email || "").split("@")[0] || "User";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  async function listAvailableOtmUsers() {
    if (!User || typeof User.findAll !== "function") return [];
    const users = await User.findAll({
      where: { role: "otm" },
      attributes: ["id", "name", "email", "role"],
      order: [["name", "ASC"], ["email", "ASC"]],
    });

    return users.map((user) => ({
      id: user.id,
      name: getDisplayName(user),
      email: user.email,
      role: user.role,
    }));
  }

  async function findOtmUserByName(otmName) {
    const needle = normalizeText(otmName)?.toLowerCase();
    if (!needle) return null;

    const users = await listAvailableOtmUsers();
    return (
      users.find((user) => String(user.name || "").toLowerCase() === needle) ||
      users.find((user) => String(user.email || "").toLowerCase() === needle) ||
      users.find((user) => String(user.name || "").toLowerCase().includes(needle)) ||
      null
    );
  }

  async function getNextPortalSortOrder(userId) {
    if (!OtmTuitionEntry || typeof OtmTuitionEntry.findOne !== "function") return 1;

    const lastEntry = await OtmTuitionEntry.findOne({
      where: { userId },
      order: [["sortOrder", "DESC"], ["id", "DESC"]],
    });

    return Number(lastEntry?.sortOrder || 0) + 1;
  }

  async function syncLinkedOtmPortalEntry({ tuition }) {
    if (!OtmTuitionEntry || typeof OtmTuitionEntry.findOne !== "function") return;

    const sourceTuitionId = normalizeTuitionId(tuition?.tuitionId);
    if (!sourceTuitionId) return;

    const targetUser = await findOtmUserByName(tuition?.otmName);
    const existingEntry = await OtmTuitionEntry.findOne({ where: { sourceTuitionId } });

    if (!targetUser) {
      if (existingEntry) {
        await existingEntry.destroy();
      }
      return;
    }

    const nextTuitionName = normalizeText(tuition?.tuitionName);
    const basePatch = {
      userId: Number(targetUser.id),
      sourceTuitionId,
      tuitionName: nextTuitionName || existingEntry?.tuitionName || "",
      newTuition: Boolean(nextTuitionName),
      newTuitionName: nextTuitionName,
    };

    if (existingEntry) {
      const nextSortOrder =
        Number(existingEntry.userId) === Number(targetUser.id)
          ? Number(existingEntry.sortOrder || 0)
          : await getNextPortalSortOrder(Number(targetUser.id));

      await existingEntry.update({
        ...basePatch,
        sortOrder: nextSortOrder,
      });
      return;
    }

    const nextSortOrder = await getNextPortalSortOrder(Number(targetUser.id));
    await OtmTuitionEntry.create({
      userId: Number(targetUser.id),
      day: "",
      days: [],
      time: "",
      timeSlots: [],
      durationLabel: "1 hour",
      durationMinutes: 60,
      tuitionName: nextTuitionName || "",
      tutorName: null,
      groupName: null,
      studentName: null,
      classStartTime: "",
      classStartTimes: [],
      classEndTime: "",
      classEndTimes: [],
      status: "",
      reportStatus: null,
      notes: "",
      newTuition: Boolean(nextTuitionName),
      newTuitionName: nextTuitionName,
      sourceTuitionId,
      sortOrder: nextSortOrder,
    });
  }

  async function safeSync(label, fn) {
    try {
      await fn();
      return null;
    } catch (syncError) {
      const detail =
        syncError?.parent?.sqlMessage ||
        syncError?.original?.sqlMessage ||
        syncError?.message ||
        "Unknown sync error";

      console.error(`${label} SYNC ERROR:`, {
        name: syncError?.name,
        message: syncError?.message,
        detail,
        fields: syncError?.fields,
        errors: syncError?.errors?.map((e) => ({
          message: e.message,
          path: e.path,
          value: e.value,
        })),
      });

      return {
        label,
        error: detail,
      };
    }
  }

  return {
    async list(req, res) {
      const q = (req.query.q || "").toString().trim();
      const where = { isDeleted: 0 };

      if (q) {
        where.tuitionId = q;
      }

      const appliedMonthYear = applyMonthYearFilter(where, req.query.month, req.query.year);

      try {
        const items = await Tuition.findAll({
          where,
          order: [["orderIndex", "ASC"], ["id", "DESC"]]
        });

        res.json({
          items,
          selectedMonth: appliedMonthYear?.month ?? null,
          selectedYear: appliedMonthYear?.year ?? null
        });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error fetching data" });
      }
    },

    async search(req, res) {
      try {
        const q = (req.query.q || "").toString().trim();
        const fieldsParam = (req.query.fields || "").toString().trim();
        const assignedTo = req.query.assignedTo;
        const sortField = (req.query.sortField || "orderIndex").toString();
        const sortDir = (req.query.sortDir || "ASC").toString().toUpperCase() === "DESC" ? "DESC" : "ASC";
        const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);

        const allowedFields = [
          "tuitionId",
          "tuitionName",
          "tutorName",
          "rejectedTutor",
          "feedback",
          "country",
          "parentsContact",
          "className",
          "subjects",
          "source",
          "otmName",
          "status",
          "demoRating",
          "syncFlag",
          "estimatedFee",
          "tutorFee",
          "demoTime",
          "classTime", // Added: Taaky classTime par search chal sakay
          "demoDate",
          "paymentApprovalStatus"
        ];

        const fields = fieldsParam
          ? fieldsParam
              .split(",")
              .map((field) => field.trim())
              .filter((field) => allowedFields.includes(field))
          : allowedFields;

        const where = { isDeleted: 0 };

        if (assignedTo !== undefined && assignedTo !== "") {
          where.assignedTo = Number.isNaN(Number(assignedTo)) ? assignedTo : Number(assignedTo);
        }

        const appliedMonthYear = applyMonthYearFilter(where, req.query.month, req.query.year);

        if (q) {
          where[Op.or] = fields.map((field) => ({
            [field]: { [Op.like]: `%${q}%` }
          }));
        }

        const allowedSorts = [
          "orderIndex",
          "tuitionId",
          "tuitionName",
          "tutorName",
          "demoDate",
          "timeHour",
          "paymentApprovalStatus",
          "paymentApprovalRequestedAt"
        ];

        const finalSortField = allowedSorts.includes(sortField) ? sortField : "orderIndex";

        const items = await Tuition.findAll({
          where,
          order: [[finalSortField, sortDir], ["orderIndex", "ASC"], ["id", "DESC"]],
          limit
        });

        return res.json({
          items,
          selectedMonth: appliedMonthYear?.month ?? null,
          selectedYear: appliedMonthYear?.year ?? null
        });
      } catch (error) {
        console.error("SEARCH ERROR:", error);
        return res.status(500).json({ message: "Error performing search", error: error.message });
      }
    },

    async listOtmUsers(req, res) {
      try {
        const users = await listAvailableOtmUsers();
        return res.json({ users });
      } catch (error) {
        console.error("OTM USER LIST ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch OTM users", error: error.message });
      }
    },

    async getPaymentApprovals(req, res) {
      if (!requireHodOrAdmin(req, res)) return;

      try {
        const items = await Tuition.findAll({
          where: { isDeleted: 0, paymentApprovalStatus: PAYMENT_APPROVAL_PENDING },
          order: [["paymentApprovalRequestedAt", "DESC"], ["updatedAt", "DESC"], ["id", "DESC"]]
        });

        return res.json({ items });
      } catch (error) {
        console.error("PAYMENT APPROVAL LIST ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch payment approvals", error: error.message });
      }
    },

    async getPaymentApprovalsCount(req, res) {
      if (!requireHodOrAdmin(req, res)) return;

      try {
        const count = await Tuition.count({
          where: { isDeleted: 0, paymentApprovalStatus: PAYMENT_APPROVAL_PENDING }
        });

        return res.json({ count });
      } catch (error) {
        console.error("PAYMENT APPROVAL COUNT ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch payment approval count", error: error.message });
      }
    },

    async decidePaymentApproval(req, res) {
      if (!requireHodOrAdmin(req, res)) return;

      try {
        const tuitionId = normalizeTuitionId(req.params.tuitionId);
        const action = String(req.body?.action || "").trim().toLowerCase();
        const reason = String(req.body?.reason || "").trim();

        if (!["approve", "reject"].includes(action)) {
          return res.status(400).json({ message: "action must be approve or reject" });
        }

        const item = await Tuition.findOne({ where: { tuitionId, isDeleted: 0 } });
        if (!item) return res.status(404).json({ message: "Tuition not found" });

        if (!hasStatus(item.status, "Tuition Done")) {
          return res.status(400).json({
            message: "Only Tuition Done records can be approved for payment"
          });
        }

        if (action === "approve") {
          item.paymentApprovalStatus = PAYMENT_APPROVAL_APPROVED;
          item.paymentApprovalRequestedAt = item.paymentApprovalRequestedAt || new Date();
          item.paymentApprovedAt = new Date();
          item.paymentApprovedBy = req.user.id;
          item.paymentRejectionReason = null;
          await item.save();
          await syncPaymentFromTuition({ Payment, item: item.toJSON() });
        } else {
          item.paymentApprovalStatus = PAYMENT_APPROVAL_REJECTED;
          item.paymentApprovalRequestedAt = item.paymentApprovalRequestedAt || new Date();
          item.paymentApprovedAt = null;
          item.paymentApprovedBy = null;
          item.paymentRejectionReason = reason || null;
          await item.save();
          await removePaymentByTuitionId({ Payment, tuitionId: item.tuitionId });
        }

        return res.json({ success: true, item });
      } catch (error) {
        console.error("PAYMENT APPROVAL ACTION ERROR:", error);
        return res.status(500).json({ message: "Failed to process payment approval", error: error.message });
      }
    },

    async getByTuitionId(req, res) {
      const tuitionId = normalizeTuitionId(req.params.tuitionId);
      const item = await Tuition.findOne({ where: { tuitionId, isDeleted: 0 } });
      if (!item) return res.status(404).json({ message: "Not found or deleted" });
      res.json({ item });
    },

    async create(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const body = req.body || {};
      const tuitionId = normalizeTuitionId(body.tuitionId);
      if (!tuitionId) return res.status(400).json({ message: "tuitionId is required" });

      let timeHour = parseHourFromValue(body.time || body.demoTime || "12:00");
      if (timeHour === null || Number.isNaN(timeHour)) timeHour = 12;

      try {
        const existingTuition = await Tuition.findOne({ where: { tuitionId } });
        if (existingTuition) {
          return res.status(200).json({
            item: existingTuition,
            alreadyExists: true,
            message: "Tuition already exists. Existing row returned."
          });
        }

        const maxOrderIndex = await Tuition.max("orderIndex", { where: { isDeleted: 0 } });
        const nextOrderIndex = (Number.isFinite(maxOrderIndex) ? maxOrderIndex : -1) + 1;

        const initialStatus = body.status || null;
        const initialApproval = hasStatus(initialStatus, "Tuition Done")
          ? {
              paymentApprovalStatus: PAYMENT_APPROVAL_PENDING,
              paymentApprovalRequestedAt: new Date(),
              paymentApprovedAt: null,
              paymentApprovedBy: null,
              paymentRejectionReason: null
            }
          : {
              paymentApprovalStatus: null,
              paymentApprovalRequestedAt: null,
              paymentApprovedAt: null,
              paymentApprovedBy: null,
              paymentRejectionReason: null
            };

        const item = await Tuition.create({
          tuitionId,
          date: normalizeDate(body.date),
          timeHour,
          demoTime: body.demoTime || null,
          tuitionName: body.tuitionName || null,
          source: body.source || null,
          otmName: body.otmName || null,
          country: body.country || null,
          parentsContact: body.parentsContact || null,
          className: body.className || null,
          subjects: body.subjects || null,
          daysPerWeek: body.daysPerWeek || null,
          estimatedFee: body.estimatedFee || null,
          tutorName: body.tutorName || null,
          tutorFee: body.tutorFee || body.tutorFees || null,
          classTime: body.classTime || body.class_time || null, // Enhanced: Handle both camelCase and snake_case safely
          secondTutors: body.secondTutors || null,
          rejectedTutor: body.rejectedTutor || null,
          status: initialStatus,
          feedback: body.feedback || null,
          demoDate: normalizeDate(body.demoDate),
          satisfactionRating: body.satisfactionRating || body.satisfactionRationg || null,
          demoRating: body.demoRating || null,
          syncFlag: body.syncFlag || body.sync || null,
          isDeleted: 0,
          orderIndex: nextOrderIndex,
          ...initialApproval
        });

        const itemJson = item.toJSON();
        const syncWarnings = [];

        const otmWarning = await safeSync("OTM PORTAL", () =>
          syncLinkedOtmPortalEntry({ tuition: itemJson })
        );
        if (otmWarning) syncWarnings.push(otmWarning);

        const todayDemoWarning = await safeSync("TODAY DEMO", () =>
          upsertTodayDemoFromTuition({ TodayDemo, item: itemJson })
        );
        if (todayDemoWarning) syncWarnings.push(todayDemoWarning);

        const paymentWarning = await safeSync("PAYMENT", () =>
          syncPaymentByApprovalState({ Payment, item: itemJson })
        );
        if (paymentWarning) syncWarnings.push(paymentWarning);

        return res.status(201).json({
          item,
          syncWarnings,
        });
      } catch (error) {
        console.error("CREATE ERROR:", error);
        res.status(500).json({ message: "Database Error", error: error.message });
      }
    },

    async update(req, res) {
      try {
        const tuitionId = normalizeTuitionId(req.params.tuitionId);
        const item = await Tuition.findOne({ where: { tuitionId } });
        if (!item) return res.status(404).json({ message: "Not found" });

        const previousHadTuitionDone = hasStatus(item.status, "Tuition Done");
        const previousOtmName = item.otmName;
        const previousTuitionName = item.tuitionName;

        const body = req.body || {};
        const source = (body._source || "").toString().toLowerCase();
        const preserveEmpty = source === "main";

        const map = {
          date: "date",
          demoTime: "demoTime",
          time: "demoTime",
          classTime: "classTime",      // Added: Handle camelCase update
          class_time: "classTime",     // Added: Handle snake_case update
          tuitionName: "tuitionName",
          source: "source",
          otmName: "otmName",
          country: "country",
          parentsContact: "parentsContact",
          parentContact: "parentsContact",
          className: "className",
          class: "className",
          subjects: "subjects",
          subject: "subjects",
          daysPerWeek: "daysPerWeek",
          days_per_week: "daysPerWeek",
          estimatedFee: "estimatedFee",
          tutorName: "tutorName",
          tutorFees: "tutorFee",
          tutorFee: "tutorFee",
          secondTutors: "secondTutors",
          rejectedTutor: "rejectedTutor",
          status: "status",
          feedback: "feedback",
          demoDate: "demoDate",
          satisfactionRating: "satisfactionRating",
          demoRating: "demoRating",
          sync: "syncFlag",
          syncFlag: "syncFlag",
          rowColor: "rowColor",
          tuitionNameColor: "tuitionNameColor"
        };

        let demoTimeWasTouched = false;

        for (const [incoming, field] of Object.entries(map)) {
          if (body[incoming] === undefined) continue;
          let value = body[incoming];
          if (field === "date" || field === "demoDate") value = normalizeDate(value);

          const isEmpty = value === "" || value === null;
          if (preserveEmpty && isEmpty && PRESERVE_IF_EMPTY.has(field)) continue;
          item[field] = isEmpty ? null : value;

          if (field === "demoTime") demoTimeWasTouched = true;
        }

        if (demoTimeWasTouched) {
          item.timeHour = parseHourFromValue(item.demoTime);
        }

        const nowHasTuitionDone = hasStatus(item.status, "Tuition Done");

        if (!nowHasTuitionDone) {
          clearApprovalState(item);
        } else if (!previousHadTuitionDone || !item.paymentApprovalStatus) {
          setApprovalPending(item);
        }

        await item.save();

        const itemJson = item.toJSON();
        const syncWarnings = [];

        const otmWarning = await safeSync("OTM PORTAL", () =>
          syncLinkedOtmPortalEntry({ tuition: itemJson })
        );
        if (otmWarning) syncWarnings.push(otmWarning);

        const todayDemoWarning = await safeSync("TODAY DEMO", () =>
          upsertTodayDemoFromTuition({ TodayDemo, item: itemJson })
        );
        if (todayDemoWarning) syncWarnings.push(todayDemoWarning);

        const paymentWarning = await safeSync("PAYMENT", () =>
          syncPaymentByApprovalState({ Payment, item: itemJson })
        );
        if (paymentWarning) syncWarnings.push(paymentWarning);

        return res.json({ item, syncWarnings });
      } catch (error) {
        console.error("TUITION UPDATE ERROR:", error);
        res.status(500).json({ message: "Update failed", error: error.message });
      }
    },

    async remove(req, res) {
      const tuitionId = normalizeTuitionId(req.params.tuitionId);
      const result = await Tuition.update({ isDeleted: 1 }, { where: { tuitionId } });
      if (result[0] === 0) return res.status(404).json({ message: "Not found" });

      if (OtmTuitionEntry) {
        await safeSync("OTM PORTAL REMOVE", () =>
          OtmTuitionEntry.destroy({ where: { sourceTuitionId: tuitionId } })
        );
      }
      await safeSync("TODAY DEMO REMOVE", () =>
        removeTodayDemoByTuitionId({ TodayDemo, tuitionId })
      );
      await safeSync("PAYMENT REMOVE", () =>
        removePaymentByTuitionId({ Payment, tuitionId })
      );
      res.json({ ok: true, message: "Moved to Recycle Bin" });
    },

    async getTrash(req, res) {
      const items = await Tuition.findAll({
        where: { isDeleted: 1 },
        order: [["updatedAt", "DESC"]]
      });
      res.json(items);
    },

    async restore(req, res) {
      const { id } = req.params;
      await Tuition.update({ isDeleted: 0 }, { where: { id } });
      const item = await Tuition.findByPk(id);

      if (item) {
        const hasTuitionDoneStatus = hasStatus(item.status, "Tuition Done");
        if (!hasTuitionDoneStatus) {
          clearApprovalState(item);
          await item.save();
        } else if (!item.paymentApprovalStatus) {
          setApprovalPending(item);
          await item.save();
        }

        const itemJson = item.toJSON();
        await safeSync("OTM PORTAL", () =>
          syncLinkedOtmPortalEntry({ tuition: itemJson })
        );
        await safeSync("TODAY DEMO", () =>
          upsertTodayDemoFromTuition({ TodayDemo, item: itemJson })
        );
        await safeSync("PAYMENT", () =>
          syncPaymentByApprovalState({ Payment, item: itemJson })
        );
      }

      res.json({ success: true, message: "Restored successfully" });
    },

    async forceDelete(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only Admin can delete permanently" });
      }

      const { id } = req.params;
      const item = await Tuition.findByPk(id);
      if (item?.tuitionId && OtmTuitionEntry) {
        await safeSync("OTM PORTAL FORCE DELETE", () =>
          OtmTuitionEntry.destroy({ where: { sourceTuitionId: item.tuitionId } })
        );
      }
      await Tuition.destroy({ where: { id } });
      res.json({ success: true, message: "Permanently deleted" });
    },

    async assignStaff(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { tuitionIds, staffId } = req.body;
      try {
        await Tuition.update({ assignedTo: staffId }, { where: { id: tuitionIds } });
        res.json({ success: true, message: "Staff assigned successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error assigning staff" });
      }
    },

    async reorder(req, res) {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid payload format" });
      }

      try {
        await Promise.all(
          items.map(async (entry) => {
            if (entry.tuitionId && entry.orderIndex !== undefined) {
              await Tuition.update(
                { orderIndex: entry.orderIndex },
                { where: { tuitionId: entry.tuitionId } }
              );
            }
          })
        );

        res.json({ success: true, message: "Order sequence updated!" });
      } catch (error) {
        console.error("REORDER ERROR:", error);
        res.status(500).json({ message: "Could not save order sequence", error: error.message });
      }
    }
  };
}