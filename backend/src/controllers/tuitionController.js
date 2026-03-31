import { validationResult } from "express-validator";
import { parseHourFromValue } from "../utils/time.js";
import { Op } from "sequelize";
import {
  syncPaymentFromTuition,
  removePaymentByTuitionId,
} from "../utils/syncPaymentFromTuition.js";
import {
  upsertTodayDemoFromTuition,
  removeTodayDemoByTuitionId,
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
  if (s === "" || s.toLowerCase() === "invalid date") return null;
  return s;
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
          ...new Set(parsed.map((entry) => String(entry || "").trim()).filter(Boolean)),
        ];
      }
    } catch (error) {
      // fallback
    }
  }

  return [...new Set(raw.split(",").map((entry) => entry.trim()).filter(Boolean))];
}

function hasStatus(value, target) {
  return normalizeMultiValue(value).includes(target);
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

export function makeTuitionController({ Tuition, TodayDemo, Payment }) {
  return {
    async list(req, res) {
      const q = (req.query.q || "").toString().trim();
      const where = { isDeleted: 0 };

      if (q) {
        where.tuitionId = q;
      }

      try {
        const items = await Tuition.findAll({
          where,
          order: [["orderIndex", "ASC"], ["id", "DESC"]],
        });
        res.json({ items });
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
        const sortDir =
          (req.query.sortDir || "ASC").toString().toUpperCase() === "DESC"
            ? "DESC"
            : "ASC";
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
          "demoDate",
          "paymentApprovalStatus",
        ];

        const fields = fieldsParam
          ? fieldsParam
              .split(",")
              .map((f) => f.trim())
              .filter((f) => allowedFields.includes(f))
          : allowedFields;

        const where = { isDeleted: 0 };

        if (assignedTo !== undefined && assignedTo !== "") {
          where.assignedTo = Number.isNaN(Number(assignedTo))
            ? assignedTo
            : Number(assignedTo);
        }

        if (q) {
          where[Op.or] = fields.map((f) => ({
            [f]: { [Op.like]: `%${q}%` },
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
          "paymentApprovalRequestedAt",
        ];

        const finalSortField = allowedSorts.includes(sortField)
          ? sortField
          : "orderIndex";

        const items = await Tuition.findAll({
          where,
          order: [
            [finalSortField, sortDir],
            ["orderIndex", "ASC"],
            ["id", "DESC"],
          ],
          limit,
        });

        return res.json({ items });
      } catch (err) {
        console.error("SEARCH ERROR:", err);
        return res
          .status(500)
          .json({ message: "Error performing search", error: err.message });
      }
    },

    async getPaymentApprovals(req, res) {
      if (!requireHodOrAdmin(req, res)) return;

      try {
        const items = await Tuition.findAll({
          where: {
            isDeleted: 0,
            paymentApprovalStatus: PAYMENT_APPROVAL_PENDING,
          },
          order: [
            ["paymentApprovalRequestedAt", "DESC"],
            ["updatedAt", "DESC"],
            ["id", "DESC"],
          ],
        });

        return res.json({ items });
      } catch (error) {
        console.error("PAYMENT APPROVAL LIST ERROR:", error);
        return res.status(500).json({
          message: "Failed to fetch payment approvals",
          error: error.message,
        });
      }
    },

    async getPaymentApprovalsCount(req, res) {
      if (!requireHodOrAdmin(req, res)) return;

      try {
        const count = await Tuition.count({
          where: {
            isDeleted: 0,
            paymentApprovalStatus: PAYMENT_APPROVAL_PENDING,
          },
        });

        return res.json({ count });
      } catch (error) {
        console.error("PAYMENT APPROVAL COUNT ERROR:", error);
        return res.status(500).json({
          message: "Failed to fetch payment approval count",
          error: error.message,
        });
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

        const item = await Tuition.findOne({
          where: { tuitionId, isDeleted: 0 },
        });

        if (!item) {
          return res.status(404).json({ message: "Tuition not found" });
        }

        if (!hasStatus(item.status, "Tuition Done")) {
          return res.status(400).json({
            message: "Only Tuition Done records can be approved for payment",
          });
        }

        if (action === "approve") {
          item.paymentApprovalStatus = PAYMENT_APPROVAL_APPROVED;
          item.paymentApprovalRequestedAt =
            item.paymentApprovalRequestedAt || new Date();
          item.paymentApprovedAt = new Date();
          item.paymentApprovedBy = req.user.id;
          item.paymentRejectionReason = null;

          await item.save();

          await syncPaymentFromTuition({
            Payment,
            item: item.toJSON(),
          });
        } else {
          item.paymentApprovalStatus = PAYMENT_APPROVAL_REJECTED;
          item.paymentApprovalRequestedAt =
            item.paymentApprovalRequestedAt || new Date();
          item.paymentApprovedAt = null;
          item.paymentApprovedBy = null;
          item.paymentRejectionReason = reason || null;

          await item.save();

          await removePaymentByTuitionId({
            Payment,
            tuitionId: item.tuitionId,
          });
        }

        return res.json({
          success: true,
          item,
        });
      } catch (error) {
        console.error("PAYMENT APPROVAL ACTION ERROR:", error);
        return res.status(500).json({
          message: "Failed to process payment approval",
          error: error.message,
        });
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
      if (!tuitionId) {
        return res.status(400).json({ message: "tuitionId is required" });
      }

      let timeHour = parseHourFromValue(body.time || body.demoTime || "12:00");
      if (timeHour === null || Number.isNaN(timeHour)) {
        timeHour = 12;
      }

      try {
        const maxOrderIndex = await Tuition.max("orderIndex", {
          where: { isDeleted: 0 },
        });
        const nextOrderIndex =
          (Number.isFinite(maxOrderIndex) ? maxOrderIndex : -1) + 1;

        const initialStatus = body.status || null;
        const initialApproval = hasStatus(initialStatus, "Tuition Done")
          ? {
              paymentApprovalStatus: PAYMENT_APPROVAL_PENDING,
              paymentApprovalRequestedAt: new Date(),
              paymentApprovedAt: null,
              paymentApprovedBy: null,
              paymentRejectionReason: null,
            }
          : {
              paymentApprovalStatus: null,
              paymentApprovalRequestedAt: null,
              paymentApprovedAt: null,
              paymentApprovedBy: null,
              paymentRejectionReason: null,
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
          classTime: body.classTime || null,
          secondTutors: body.secondTutors || null,
          rejectedTutor: body.rejectedTutor || null,
          status: initialStatus,
          feedback: body.feedback || null,
          demoDate: normalizeDate(body.demoDate),
          satisfactionRating:
            body.satisfactionRating || body.satisfactionRationg || null,
          demoRating: body.demoRating || null,
          syncFlag: body.syncFlag || body.sync || null,
          isDeleted: 0,
          orderIndex: nextOrderIndex,
          ...initialApproval,
        });

        await upsertTodayDemoFromTuition({
          TodayDemo,
          item: item.toJSON(),
        });

        await syncPaymentByApprovalState({
          Payment,
          item: item.toJSON(),
        });

        res.status(201).json({ item });
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

        const body = req.body || {};
        const source = (body._source || "").toString().toLowerCase();
        const preserveEmpty = source === "main";

        const map = {
          date: "date",
          demoTime: "demoTime",
          tuitionName: "tuitionName",
          source: "source",
          otmName: "otmName",
          country: "country",
          parentsContact: "parentsContact",
          className: "className",
          subjects: "subjects",
          daysPerWeek: "daysPerWeek",
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
          tuitionNameColor: "tuitionNameColor",
        };

        for (const [incoming, field] of Object.entries(map)) {
          if (body[incoming] === undefined) continue;

          let v = body[incoming];
          if (field === "date" || field === "demoDate") v = normalizeDate(v);

          const isEmpty = v === "" || v === null;
          if (preserveEmpty && isEmpty && PRESERVE_IF_EMPTY.has(field)) continue;

          item[field] = isEmpty ? null : v;
        }

        const nowHasTuitionDone = hasStatus(item.status, "Tuition Done");

        if (!nowHasTuitionDone) {
          clearApprovalState(item);
        } else if (!previousHadTuitionDone) {
          setApprovalPending(item);
        } else if (!item.paymentApprovalStatus) {
          setApprovalPending(item);
        }

        await item.save();

        await upsertTodayDemoFromTuition({
          TodayDemo,
          item: item.toJSON(),
        });

        await syncPaymentByApprovalState({
          Payment,
          item: item.toJSON(),
        });

        res.json({ item });
      } catch (error) {
        console.error("TUITION UPDATE ERROR:", error);
        res.status(500).json({ message: "Update failed", error: error.message });
      }
    },

    async remove(req, res) {
      const tuitionId = normalizeTuitionId(req.params.tuitionId);

      const result = await Tuition.update(
        { isDeleted: 1 },
        { where: { tuitionId } }
      );

      if (result[0] === 0) {
        return res.status(404).json({ message: "Not found" });
      }

      await removeTodayDemoByTuitionId({
        TodayDemo,
        tuitionId,
      });

      await removePaymentByTuitionId({
        Payment,
        tuitionId,
      });

      res.json({ ok: true, message: "Moved to Recycle Bin" });
    },

    async getTrash(req, res) {
      const items = await Tuition.findAll({
        where: { isDeleted: 1 },
        order: [["updatedAt", "DESC"]],
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

        await upsertTodayDemoFromTuition({
          TodayDemo,
          item: item.toJSON(),
        });

        await syncPaymentByApprovalState({
          Payment,
          item: item.toJSON(),
        });
      }

      res.json({ success: true, message: "Restored successfully" });
    },

    async forceDelete(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only Admin can delete permanently" });
      }

      const { id } = req.params;
      await Tuition.destroy({ where: { id } });

      res.json({ success: true, message: "Permanently deleted" });
    },

    async assignStaff(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { tuitionIds, staffId } = req.body;

      try {
        await Tuition.update(
          { assignedTo: staffId },
          { where: { id: tuitionIds } }
        );

        res.json({ success: true, message: "Staff assigned successfully" });
      } catch (e) {
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
        res.status(500).json({
          message: "Could not save order sequence",
          error: error.message,
        });
      }
    },
  };
}