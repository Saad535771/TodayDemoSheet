import {
  computeFilterStatus,
  hourToDisplayRange,
  hourToSlotHeader,
  hourToPrettyTime,
  FILTER_VALUES
} from "../utils/time.js";
import { syncPaymentFromTarget } from "../utils/syncPaymentFromTarget.js";

function normalizeTuitionId(v) {
  if (v === null || v === undefined) return "";
  let s = String(v).trim();
  if (!s) return "";
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, "");
  return s;
}

export function makeTargetController({ Tuition, Payment }) {
  return {
    async list(req, res) {
      const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
      const filter = (req.query.filter || "").toString().trim();
      const now = new Date();

      const items = await Tuition.findAll({
        order: [["time_hour", "ASC"], ["orderIndex", "ASC"], ["id", "DESC"]]
      });

      const slots = [];
      for (let hour = 8; hour <= 23; hour++) {
        const slotItems = items
          .filter((t) => t.timeHour === hour)
          .map((t) => {
            if (!t.demoDate) return null;
            const d = new Date(t.demoDate);
            if (isNaN(d.getTime())) return null;

            const { status, color, fontColor } = computeFilterStatus(t.demoDate, now, tz);
            return {
              ...t.toJSON(),
              timePretty: hourToPrettyTime(hour),
              filterStatus: status,
              filterColor: color,
              filterFontColor: fontColor
            };
          })
          .filter(Boolean)
          .filter((t) => {
            if (!filter) return true;
            if (!FILTER_VALUES.includes(filter)) return true;
            return t.filterStatus === filter;
          });

        slots.push({
          hour,
          slotHeader: hourToSlotHeader(hour),
          displayRange: hourToDisplayRange(hour),
          items: slotItems
        });
      }

      res.json({ slots });
    },

    async update(req, res) {
      try {
        const tuitionId = normalizeTuitionId(req.params.tuitionId);
        const item = await Tuition.findOne({ where: { tuitionId } });

        if (!item) {
          return res.status(404).json({ message: "Not found" });
        }

        const allowed = new Set([
          "date",
          "demoTime",
          "tuitionName",
          "source",
          "country",
          "parentsContact",
          "className",
          "subjects",
          "daysPerWeek",
          "estimatedFee",
          "tutorName",
          "tutorFee",
          "rejectedTutor",
          "status",
          "feedback",
          "demoDate",
          "satisfactionRating",
          "demoRating",
          "syncFlag",
          "rowColor",
          "tuitionNameColor",
          "orderIndex"
        ]);

        for (const [k, v] of Object.entries(req.body || {})) {
          let modelKey = k;

          if (k === "tutorFees") modelKey = "tutorFee";
          if (k === "sync") modelKey = "syncFlag";
          if (k === "parentContact") modelKey = "parentsContact";
          if (k === "subject") modelKey = "subjects";
          if (k === "class") modelKey = "className";

          if (!allowed.has(modelKey)) continue;
          item[modelKey] = v === "" || v === null || v === undefined ? null : v;
        }

        await item.save();

        // Tuition Done hote hi payment sheet me auto create/update
        await syncPaymentFromTarget({
          Payment,
          item: item.toJSON()
        });

        res.json({ item });
      } catch (error) {
        console.error("TARGET UPDATE ERROR:", error);
        res.status(500).json({ message: "Update failed", error: error.message });
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
        res.status(500).json({
          message: "Could not save order sequence",
          error: error.message
        });
      }
    }
  };
}