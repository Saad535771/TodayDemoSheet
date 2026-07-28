import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
export function makeOtmManagementRoutes(otmManagementController) {
  const router = Router();
  router.get("/meta", requireAuth, otmManagementController.meta);
  router.get("/users", requireAuth, otmManagementController.listUsers);
  router.get("/entries", requireAuth, otmManagementController.listEntries);
  router.post("/entries", requireAuth, otmManagementController.createEntry);
  router.post(
    "/entries/reorder",
    requireAuth,
    [body("orderedIds").isArray({ min: 1 }), body("orderedIds.*").isInt({ min: 1 })],
    otmManagementController.reorderEntries
  );
  router.put(
    "/entries/:entryId",
    requireAuth,
    [param("entryId").isInt({ min: 1 })],
    otmManagementController.updateEntry
  );
  router.delete(
    "/entries/:entryId",
    requireAuth,
    [param("entryId").isInt({ min: 1 })],
    otmManagementController.deleteEntry
  );
  router.get("/reports", requireAuth, otmManagementController.reports);
  router.get("/total-class", requireAuth, otmManagementController.totalClass);
  router.get("/admin/:userId",requireAuth,[param("userId").isInt({ min: 1 })],otmManagementController.adminUserDetails);
  return router;
}