import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middleware/auth.js";

export function makeOtmManagementRoutes(otmManagementController) {
  const router = Router();

  const entryValidators = [
    body("day").trim().notEmpty().withMessage("Day is required"),
    body("time").optional().isString(),
    body("tuitionName").trim().notEmpty().withMessage("Tuition Name is required"),
    body("groupName").optional().isString(),
    body("classStartTime").optional().isString(),
    body("classEndTime").optional().isString(),
    body("status").optional().isString(),
    body("notes").optional().isString(),
  ];

  router.get("/entries", requireAuth, otmManagementController.listEntries);
  router.post("/entries", requireAuth, entryValidators, otmManagementController.createEntry);
  router.put(
    "/entries/:entryId",
    requireAuth,
    [param("entryId").isInt({ min: 1 }), ...entryValidators],
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
  router.get(
    "/admin/:userId",
    requireAuth,
    [param("userId").isInt({ min: 1 })],
    otmManagementController.adminUserDetails
  );

  return router;
}