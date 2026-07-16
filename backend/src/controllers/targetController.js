import {
  computeFilterStatus,
  hourToDisplayRange,
  hourToSlotHeader,
  hourToPrettyTime,
  FILTER_VALUES,
  parseHourFromValue,
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
    demoTime: "demoTime",
    time: "demoTime",
    classTime: "classTime",   
    class_time: "classTime",  
    demoDate: "demoDate",
    tuitionName: "tuitionName",
    source: "source",
    country: "country",
    parentsContact: "parentsContact",
    parentContact: "parentsContact",
    className: "className",
    class: "className",
    subjects: "subjects",
    subject: "subjects",
    daysPerWeek: "daysPerWeek",
    days_per_week: "daysPerWeek",
    tutorName: "tutorName",
    tutorFee: "tutorFee",
    tutorFees: "tutorFee",
    rejectedTutor: "rejectedTutor",
    status: "status",
    feedback: "feedback",
    demoRating: "demoRating",
    syncFlag: "syncFlag",
    sync: "syncFlag",
    rowColor: "rowColor",
    tuitionNameColor: "tuitionNameColor",
    tutorNameColor: "tutorNameColor",
    orderIndex: "orderIndex",
  };

  return {
    async list(req, res) {
      const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
      const filter = (req.query.filter || "").toString().trim();
      const now = new Date();

      const items = await TodayDemo.findAll({
        where: {
          timeHour: {
            [Op.between]: [0, 23],
          },
        },
        attributes: [
          "id",
          "tuitionId",
          "demoTime",
          "classTime", // Added: Taaky list API mein class time frontend ko mile
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
      for (let hour = 0; hour <= 23; hour++) {
        const slotItems = items
          .filter((t) => t.timeHour === hour)
          .map((t) => {
            const computed = t.demoDate
              ? computeFilterStatus(t.demoDate, now, tz)
              : { status: "", color: "#ffffff", fontColor: "#000000" };

            return {
              ...t,
              timePretty: hourToPrettyTime(hour),
              filterStatus: computed.status,
              filterColor: computed.color,
              filterFontColor: computed.fontColor,
            };
          })
          .filter((t) => {
            if (!filter) return true;
            if (!FILTER_VALUES.includes(filter)) return true;
            return t.filterStatus === filter;
          });

        slots.push({
          hour,
          slotHeader: hourToSlotHeader(hour),
          displayRange: hourToDisplayRange(hour),
          items: slotItems,
        });
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
        const oldData = targetItem.toJSON();
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

        if (Object.prototype.hasOwnProperty.call(targetUpdates, "demoTime")) {
          const parsedHour = parseHourFromValue(targetUpdates.demoTime);
          targetUpdates.timeHour = parsedHour;
          tuitionUpdates.timeHour = parsedHour;
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
        try {
            const fieldsToTrack = [
                "demoTime", "classTime", "tuitionName", "source", "country", 
                "parentsContact", "className", "subjects", "daysPerWeek", 
                "tutorName", "tutorFee", "rejectedTutor", "status", "feedback", 
                "demoDate", "demoRating", "syncFlag", "rowColor", "tuitionNameColor", "orderIndex"
            ];
            const changes = [];
            const newData = targetItem.toJSON();

            fieldsToTrack.forEach((field) => {
                const oldVal = String(oldData[field] || "");
                const newVal = String(newData[field] || "");
                
                if (oldVal !== newVal) {
                    changes.push([
                        targetItem.tuitionId,            
                        req.user.id,          
                        "UPDATE",
                        field,                
                        oldVal,
                        newVal
                    ]);
                }
            });

            if (changes.length > 0) {
                const placeholders = changes.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
                const flatValues = changes.flat();
                await TodayDemo.sequelize.query(
                    `INSERT INTO today_demo_histories (tuition_id, user_id, action_type, field_name, old_value, new_value) VALUES ${placeholders}`,
                    { replacements: flatValues }
                );
            }
        } catch (historyErr) {
            console.error("TARGET HISTORY SAVE ERROR:", historyErr);
        }
        // -----------------------------------------------------------------
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

    async getTargetHistory(req, res) {
      try {
        const { search, startDate, endDate, sort = "DESC", page = 1, limit = 50, tuitionId, fieldName } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
          SELECT th.*, u.name as edited_by, td.tuition_name 
          FROM today_demo_histories th
          LEFT JOIN users u ON th.user_id = u.id
          LEFT JOIN today_demo td ON th.tuition_id = td.tuition_id
          WHERE 1=1
        `;
        const replacements = [];

        if (tuitionId) {
          query += ` AND th.tuition_id = ?`;
          replacements.push(tuitionId);
        }
        if (fieldName) {
          query += ` AND th.field_name = ?`;
          replacements.push(fieldName);
        }

        if (!startDate && !endDate && !tuitionId) {
          query += ` AND th.created_at >= NOW() - INTERVAL 24 HOUR`;
        } else {
          if (startDate) {
            query += ` AND th.created_at >= ?`;
            replacements.push(`${startDate} 00:00:00`);
          }
          if (endDate) {
            query += ` AND th.created_at <= ?`;
            replacements.push(`${endDate} 23:59:59`);
          }
        }

        if (search) {
          query += ` AND (td.tuition_name LIKE ? OR th.field_name LIKE ? OR u.name LIKE ? OR th.tuition_id LIKE ? OR th.old_value LIKE ? OR th.new_value LIKE ?)`;
          const searchPattern = `%${search}%`;
          replacements.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const sortOrder = sort.toUpperCase() === "ASC" ? "ASC" : "DESC";
        query += ` ORDER BY th.created_at ${sortOrder} LIMIT ? OFFSET ?`;
        replacements.push(Number(limit), Number(offset));

        const historyData = await TodayDemo.sequelize.query(query, {
          replacements,
          type: TodayDemo.sequelize.QueryTypes.SELECT
        });

        res.json({ success: true, data: historyData });
      } catch (error) {
        console.error("Fetch Target History Error:", error);
        res.status(500).json({ message: "Error fetching history" });
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