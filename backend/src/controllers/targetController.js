import { computeFilterStatus, hourToDisplayRange, hourToSlotHeader, hourToPrettyTime, FILTER_VALUES } from "../utils/time.js";
function normalizeTuitionId(v) {
  if (v === null || v === undefined) return "";
  let s = String(v).trim();
  if (!s) return "";
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, "");
  return s;
}
export function makeTargetController({ Tuition }) {
  return {
    async list(req, res) {
      const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
      const filter = (req.query.filter || "").toString().trim();
      const now = new Date();
      const items = await Tuition.findAll({ order: [["time_hour", "ASC"], ["id", "DESC"]] });
      // Group into fixed slots 8..23 (same as sheet)
      const slots = [];
      for (let hour = 8; hour <= 23; hour++) {
        const slotItems = items
          .filter(t => t.timeHour === hour)
          .map(t => {
            const { status, color, fontColor } = computeFilterStatus(t.demoDate, now, tz);
            return {
              ...t.toJSON(),
              timePretty: hourToPrettyTime(hour),
              filterStatus: status,
              filterColor: color,
              filterFontColor: fontColor
            };
          })
          .filter(t => {
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
      const tuitionId = normalizeTuitionId(req.params.tuitionId);
      const item = await Tuition.findOne({ where: { tuitionId } });
      if (!item) return res.status(404).json({ message: "Not found" });

      const allowed = new Set(["status", "satisfactionRating", "demoRating", "tutorName", "demoDate", "feedback"]);
      for (const [k, v] of Object.entries(req.body || {})) {
        if (!allowed.has(k)) continue;
        item[k] = (v === "" || v === null || v === undefined) ? null : v;
      }
      await item.save();
      res.json({ item });
    }
  };
}
