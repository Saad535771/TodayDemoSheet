import { validationResult } from "express-validator";
import { parseHourFromValue } from "../utils/time.js";

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

export function makeTuitionController({ Tuition }) {
  return {
    
    // --- 1. LIST (Active Items Only) ---
    async list(req, res) {
      const q = (req.query.q || "").toString().trim();
      
      // Default: Sirf woh jo deleted nahi hain
      const where = { isDeleted: 0 };

      // 🔴 UPDATE: Staff filter comment kar diya hai taake unhe sab data nazar aaye
      // Jab aap assignment feature completely implement kar lein, tab isse uncomment kar sakte hain
      /*
      if (req.user.role === 'staff') {
         where.assignedTo = req.user.id;
      }
      */

      if (q) {
        where.tuitionId = q;
      }

      try {
        const items = await Tuition.findAll({ where, order: [["id", "DESC"]] });
        res.json({ items });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error fetching data" });
      }
    },

    // --- 2. GET SINGLE ---
    async getByTuitionId(req, res) {
      const tuitionId = normalizeTuitionId(req.params.tuitionId);
      // Sirf active item dhundo
      const item = await Tuition.findOne({ where: { tuitionId, isDeleted: 0 } });
      if (!item) return res.status(404).json({ message: "Not found or deleted" });
      res.json({ item });
    },

    // --- 3. CREATE ---
    async create(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const body = req.body || {};
      const tuitionId = normalizeTuitionId(body.tuitionId);
      if (!tuitionId) return res.status(400).json({ message: "tuitionId is required" });

      const timeHour = parseHourFromValue(body.time);
      if (timeHour === null || timeHour < 8 || timeHour > 23) {
        return res.status(400).json({ message: "Allowed Time: 8:00 AM — 11:59 PM" });
      }

      // Default assignedTo Admin or NULL, isDeleted is 0 by default
      const item = await Tuition.create({
        tuitionId,
        date: normalizeDate(body.date),
        timeHour,
        tuitionName: body.tuitionName || null,
        source: body.source || null,
        country: body.country || null,
        parentsContact: body.parentsContact || null,
        className: body.className || null,
        subjects: body.subjects || null,
        daysPerWeek: body.daysPerWeek || null,
        estimatedFee: body.estimatedFee || null,
        tutorName: body.tutorName || null,
        tutorFee: body.tutorFee || null,
        secondTutors: body.secondTutors || null,
        rejectedTutor: body.rejectedTutor || null,
        status: body.status || null,
        feedback: body.feedback || null,
        demoDate: normalizeDate(body.demoDate),
        satisfactionRating: body.satisfactionRating || body.satisfactionRationg || null,
        demoRating: body.demoRating || null,
        syncFlag: body.syncFlag || null,
        isDeleted: 0
      });

      res.status(201).json({ item });
    },

    // --- 4. UPDATE ---
    async update(req, res) {
      const tuitionId = normalizeTuitionId(req.params.tuitionId);
      const item = await Tuition.findOne({ where: { tuitionId } });
      if (!item) return res.status(404).json({ message: "Not found" });

      const body = req.body || {};
      const source = (body._source || "").toString().toLowerCase(); 
      const preserveEmpty = source === "main";

      if (body.time !== undefined) {
        const hour = parseHourFromValue(body.time);
        if (hour === null || hour < 8 || hour > 23) {
          return res.status(400).json({ message: "Allowed Time: 8:00 AM — 11:59 PM" });
        }
        item.timeHour = hour;
      }

      const map = {
        date: "date",
        tuitionName: "tuitionName",
        source: "source",
        country: "country",
        parentsContact: "parentsContact",
        className: "className",
        subjects: "subjects",
        daysPerWeek: "daysPerWeek",
        estimatedFee: "estimatedFee",
        tutorName: "tutorName",
        tutorFee: "tutorFee",
        secondTutors: "secondTutors",
        rejectedTutor: "rejectedTutor",
        status: "status",
        feedback: "feedback",
        demoDate: "demoDate",
        satisfactionRating: "satisfactionRating",
        satisfactionRationg: "satisfactionRating",
        demoRating: "demoRating",
        syncFlag: "syncFlag"
      };

      for (const [incoming, field] of Object.entries(map)) {
        if (body[incoming] === undefined) continue;
        let v = body[incoming];

        if (field === "date" || field === "demoDate") {
          v = normalizeDate(v);
        }

        const isEmpty = v === "" || v === null;
        if (preserveEmpty && isEmpty && PRESERVE_IF_EMPTY.has(field)) {
          continue; 
        }
        item[field] = isEmpty ? null : v;
      }
      await item.save();
      res.json({ item });
    },

    // --- 5. SOFT DELETE (Move to Trash) ---
    async remove(req, res) {
      const tuitionId = normalizeTuitionId(req.params.tuitionId);
      // Soft Delete: isDeleted = 1
      const result = await Tuition.update(
        { isDeleted: 1 }, 
        { where: { tuitionId } }
      );
      
      if (result[0] === 0) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true, message: "Moved to Recycle Bin" });
    },

    // --- 6. GET TRASH (Deleted Items) ---
    async getTrash(req, res) {
        // Trash access control check route level pe ya yahan kar sakte hain
        const items = await Tuition.findAll({ 
            where: { isDeleted: 1 },
            order: [['updatedAt', 'DESC']]
        });
        res.json(items);
    },

    // --- 7. RESTORE (From Trash) ---
    async restore(req, res) {
        const { id } = req.params; // Using Internal ID for safety in trash operations
        await Tuition.update({ isDeleted: 0 }, { where: { id } });
        res.json({ success: true, message: "Restored successfully" });
    },

    // --- 8. FORCE DELETE (Permanent) ---
    async forceDelete(req, res) {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only Admin can delete permanently" });
        }
        const { id } = req.params;
        await Tuition.destroy({ where: { id } });
        res.json({ success: true, message: "Permanently deleted" });
    },

    // --- 9. ASSIGN STAFF ---
    async assignStaff(req, res) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied" });
        
        const { tuitionIds, staffId } = req.body; // Expecting array of IDs
        
        try {
            await Tuition.update(
                { assignedTo: staffId },
                { where: { id: tuitionIds } }
            );
            res.json({ success: true, message: "Staff assigned successfully" });
        } catch (e) {
            res.status(500).json({ message: "Error assigning staff" });
        }
    }
  };
}