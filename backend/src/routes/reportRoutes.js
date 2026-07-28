import express from 'express';
import { 
  saveReport, 
  getAllReports, 
  updateReport, 
  patchReport, 
  deleteReport,
  reorderReports
} from '../controllers/reportController.js';
const router = express.Router();
// GET /api/reports - Fetch all
router.get('/', getAllReports);
// POST /api/reports - Create
router.post('/', saveReport);
// PUT /api/reports/:id - Full Update
router.put('/:id', updateReport);
router.post('/reorder', reorderReports);
// PATCH /api/reports/:id - Partial Edit (e.g., Status change)
router.patch('/:id', patchReport);
router.delete('/:id', deleteReport);

export default router;