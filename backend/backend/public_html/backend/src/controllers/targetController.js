import {
  computeFilterStatus,
  hourToDisplayRange,
  hourToSlotHeader,
  hourToPrettyTime,
  FILTER_VALUES,
} from "../utils/time.js";
import { syncPaymentFromTuition } from "../utils/syncPaymentFromTuition.js";
import {
  REVERSE_SYNC_FIELDS,
  TARGET_ONLY_FIELDS,
  upsertTodayDemoFromTuition,
} from "../utils/syncTodayDemoFromTuition.js";
import { Op } from "sequelize";

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

export function makeTargetController({ TodayDemo, Tuition, Payment }) {
 const editableMap = {
  // reverse-sync fields
  tutorName: "tutorName",
  status: "status",
  feedback: "feedback",
  rejectedTutor: "rejectedTutor",
   demoRating: "demoRating",
  // target-only editable fields
   daysPerWeek: "daysPerWeek",
  days_per_week: "daysPerWeek",
  tuitionName: "tuitionName",
  source: "source",
  country: "country",
  parentsContact: "parentsContact",
  className: "className",
  class: "className",
  subjects: "subjects",
  tutorFee: "tutorFee",
  tutorFees: "tutorFee",
  syncFlag: "syncFlag",
  sync: "syncFlag",
  rowColor: "rowColor",
  tuitionNameColor: "tuitionNameColor",
  orderIndex: "orderIndex",

  // optional: agar frontend abhi bhi isay bhej raha ho
  demoRating: "demoRating",
};

  return {
    async list(req, res) {
      const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
      const filter = (req.query.filter || "").toString().trim();
      const search = (req.query.search || "").toString().trim().toLowerCase();
      const now = new Date();

      const items = await TodayDemo.findAll({
        where: {
          timeHour: {
            [Op.between]: [8, 23],
          },
        },
        attributes: [
          "id",
          "tuitionId",
          "demoTime",
          "timeHour",
          "tuitionName",
          "source",
          "country",
          "parentsContact",
          "className",
          "subjects",
          "daysPerWeek",
          "tutorName",
          "tutorFee",
          "rejectedTutor",
          "status",
          "feedback",
          "demoDate",
          "demoRating",
          "syncFlag",
          "rowColor",
          "tuitionNameColor",
          "orderIndex",
        ],
        order: [
          ["timeHour", "ASC"],
          ["orderIndex", "ASC"],
          ["id", "DESC"],
        ],
        raw: true,
      });

      const slots = [];
      for (let hour = 8; hour <= 23; hour++) {
        const slotHeader = hourToSlotHeader(hour).toLowerCase();
        const headerMatches = search && slotHeader.includes(search);

        const slotItems = items
          .filter((t) => t.timeHour === hour)
          .map((t) => {
            if (!t.demoDate) return null;

            const { status, color, fontColor } = computeFilterStatus(
              t.demoDate,
              now,
              tz
            );

            return {
              ...t,
              timePretty: hourToPrettyTime(hour),
              filterStatus: status,
              filterColor: color,
              filterFontColor: fontColor,
            };
          })
          .filter(Boolean)
          .filter((t) => {
            // Apply filter (Followup, Today Demo, Future Demo)
            if (filter && FILTER_VALUES.includes(filter) && t.filterStatus !== filter) {
              return false;
            }

            // Apply search
            if (search) {
              // If header matches, we show all items in this slot that passed the filter
              if (headerMatches) return true;

              // Otherwise check if item fields match search
              const searchStr = [
                t.tuitionName,
                t.source,
                t.country,
                t.parentsContact,
                t.className,
                t.subjects,
                t.tutorName,
                t.status,
                t.feedback,
                t.tuitionId,
              ]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

              return searchStr.includes(search);
            }

            return true;
          });

        // Only add slot if it has items OR if the header matched and we want to show the empty slot
        if (slotItems.length > 0 || headerMatches) {
          slots.push({
            hour,
            slotHeader: hourToSlotHeader(hour),
            displayRange: hourToDisplayRange(hour),
            items: slotItems,
          });
        }
      }

      return res.json({ slots });
    },

   async update(req, res) {
  const tuitionId = normalizeTuitionId(req.params.tuitionId);
  const transaction = await TodayDemo.sequelize.transaction();

  try {
    let targetItem = await TodayDemo.findOne({
      where: { tuitionId },
      transaction,
    });

    // Safety: agar target row missing ho to monthly se bana lo
    if (!targetItem) {
      const tuitionItem = await Tuition.findOne({
        where: { tuitionId, isDeleted: 0 },
        transaction,
      });

      if (!tuitionItem) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        return res.status(404).json({ message: "Not found" });
      }

      targetItem = await upsertTodayDemoFromTuition({
        TodayDemo,
        item: tuitionItem.toJSON(),
        transaction,
      });
    }

    const targetUpdates = {};
    const tuitionUpdates = {};

    for (const [incomingKey, incomingValue] of Object.entries(req.body || {})) {
      const field = editableMap[incomingKey];
      if (!field) continue;

      let value = incomingValue;
      if (field === "orderIndex") {
        value =
          value === "" || value === null || value === undefined
            ? 0
            : Number(value);
        if (!Number.isFinite(value)) value = 0;
      }

      if (field === "demoDate") value = normalizeDate(value);

      const finalValue =
        value === "" || value === undefined ? null : value;

      targetUpdates[field] = finalValue;

      if (REVERSE_SYNC_FIELDS.includes(field)) {
        tuitionUpdates[field] = finalValue;
      }
    }

    if (Object.keys(targetUpdates).length > 0) {
      await targetItem.update(targetUpdates, { transaction });
    }

    if (Object.keys(tuitionUpdates).length > 0) {
      await Tuition.update(tuitionUpdates, {
        where: { tuitionId },
        transaction,
      });
    }

    await transaction.commit();

    // Payment sync hamesha monthly master se hi karo
    const tuitionFresh = await Tuition.findOne({ where: { tuitionId } });
    if (tuitionFresh) {
      await syncPaymentFromTuition({
        Payment,
        item: tuitionFresh.toJSON(),
      });
    }

    const freshTarget = await TodayDemo.findOne({ where: { tuitionId } });
    return res.json({ item: freshTarget });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("TARGET UPDATE ERROR:", error);
    return res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
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
              await TodayDemo.update(
                { orderIndex: item.orderIndex },
                { where: { tuitionId: item.tuitionId } }
              );
            }
          })
        );

        return res.json({
          success: true,
          message: "Target order sequence updated!",
        });
      } catch (error) {
        console.error("TARGET REORDER ERROR:", error);
        return res.status(500).json({
          message: "Could not save target order sequence",
          error: error.message,
        });
      }
    },
    async remove(req, res) {
  const tuitionId = normalizeTuitionId(req.params.tuitionId);

  try {
    const deleted = await TodayDemo.destroy({
      where: { tuitionId },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Today demo record not found" });
    }

    return res.json({
      success: true,
      message: "Record removed from Today Demo only",
    });
  } catch (error) {
    console.error("TARGET DELETE ERROR:", error);
    return res.status(500).json({
      message: "Could not delete Today Demo record",
      error: error.message,
    });
  }
}
  };
}