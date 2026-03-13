import { Router } from "express";
import { body } from "express-validator";
export function makeTuitionRoutes(tuitionController, requireAuth) {
  const router = Router();
  // 1. Static/Specific Routes FIRST
  router.get("/", requireAuth, tuitionController.list);
  // 👇 NAYA ROUTE: DRAG & DROP SEQUENCE SAVE KARNE KE LIYE 👇
  router.post("/reorder", requireAuth, tuitionController.reorder);
  // Trash Routes
  router.get("/trash", requireAuth, tuitionController.getTrash);
  // Assignment Route
  router.post("/assign", requireAuth, tuitionController.assignStaff);
  // Restore & Force Delete (Using Database ID)
  router.put("/:id/restore", requireAuth, tuitionController.restore);
  // file: routes/tuition.routes.js (your existing makeTuitionRoutes)
router.get("/search", requireAuth, tuitionController.search);
  router.delete("/:id/force", requireAuth, tuitionController.forceDelete);
  router.post(
    "/",
    requireAuth,
    body("tuitionId").isString().notEmpty(),
    tuitionController.create
  );
  // 3. Dynamic Routes (/:tuitionId) LAST
  router.get("/:tuitionId", requireAuth, tuitionController.getByTuitionId);
  router.patch("/:tuitionId", requireAuth, tuitionController.update);
  router.delete("/:tuitionId", requireAuth, tuitionController.remove);
  return router;
}