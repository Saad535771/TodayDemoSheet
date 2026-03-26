import { validationResult } from "express-validator";
import { parseHourFromValue } from "../utils/time.js";
import { Op } from "sequelize";
import { syncPaymentFromTuition } from "../utils/syncPaymentFromTuition.js";
import {
  upsertTodayDemoFromTuition,
  removeTodayDemoByTuitionId,
} from "../utils/syncTodayDemoFromTuition.js";
const PRESERVE_IF_EMPTY = new Set(["status", "satisfactionRating", "demoRating"]);

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

export function makeTuitionController({ Tuition,TodayDemo, Payment }) {
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
          order: [["orderIndex", "ASC"], ["id", "DESC"]]
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
        const sortDir = (req.query.sortDir || "ASC").toString().toUpperCase() === "DESC" ? "DESC" : "ASC";
        const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);

        const allowedFields = [
          "tuitionId", "tuitionName", "tutorName", "rejectedTutor", "feedback",
          "country", "parentsContact", "className", "subjects", "source", "otmName",
          "status", "demoRating", "syncFlag", "estimatedFee", "tutorFee",
          "demoTime", "demoDate"
        ];

        const fields = fieldsParam
          ? fieldsParam.split(",").map(f => f.trim()).filter(f => allowedFields.includes(f))
          : allowedFields;

        const where = { isDeleted: 0 };

        if (assignedTo !== undefined && assignedTo !== "") {
          where.assignedTo = isNaN(Number(assignedTo)) ? assignedTo : Number(assignedTo);
        }

        if (q) {
          where[Op.or] = fields.map((f) => ({
            [f]: { [Op.like]: `%${q}%` }
          }));
        }

        const allowedSorts = ["orderIndex", "tuitionId", "tuitionName", "tutorName", "demoDate", "timeHour"];
        const finalSortField = allowedSorts.includes(sortField) ? sortField : "orderIndex";

        const items = await Tuition.findAll({
          where,
          order: [
            [finalSortField, sortDir],
            ["orderIndex", "ASC"],
            ["id", "DESC"]
          ],
          limit
        });

        return res.json({ items });
      } catch (err) {
        console.error("SEARCH ERROR:", err);
        return res.status(500).json({ message: "Error performing search", error: err.message });
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
      if (timeHour === null || isNaN(timeHour)) {
        timeHour = 12;
      }

      try {
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
          status: body.status || null,
          feedback: body.feedback || null,
          demoDate: normalizeDate(body.demoDate),
          satisfactionRating: body.satisfactionRating || body.satisfactionRationg || null,
          demoRating: body.demoRating || null,
          syncFlag: body.syncFlag || body.sync || null,
          isDeleted: 0,
          orderIndex: 0
        });
await upsertTodayDemoFromTuition({
  TodayDemo,
  item: item.toJSON(),
});
        if (item.status === "Tuition Done") {
          await syncPaymentFromTuition({
            Payment,
            item: item.toJSON()
          });
        }

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
          tuitionNameColor: "tuitionNameColor"
        };

        for (const [incoming, field] of Object.entries(map)) {
          if (body[incoming] === undefined) continue;
          let v = body[incoming];
          if (field === "date" || field === "demoDate") v = normalizeDate(v);
          const isEmpty = v === "" || v === null;
          if (preserveEmpty && isEmpty && PRESERVE_IF_EMPTY.has(field)) continue;
          item[field] = isEmpty ? null : v;
        }
        await item.save();
await upsertTodayDemoFromTuition({
  TodayDemo,
  item: item.toJSON(),
});
        await syncPaymentFromTuition({
          Payment,
          item: item.toJSON()
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
    await upsertTodayDemoFromTuition({
      TodayDemo,
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
      if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
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
          items.map(async (item) => {
            if (item.tuitionId && item.orderIndex !== undefined) {
              await Tuition.update(
                { orderIndex: item.orderIndex },
                { where: { tuitionId: item.tuitionId } }
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