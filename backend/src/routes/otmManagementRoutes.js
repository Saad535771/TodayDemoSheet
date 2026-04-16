import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middleware/auth.js";

export function makeOtmManagementRoutes(otmManagementController) {
  const router = Router();

  const entryValidators = [
    body("day").optional().isString(),
    body("days").optional().isArray(),
    body("time").optional().isString(),
    body("timeSlots").optional().isArray(),
    body("timeAssignments").optional().isObject(),
    body("durationLabel").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 1 }),
    body("tuitionName").trim().notEmpty().withMessage("Tuition Name is required"),
    body("tutorName").optional({ nullable: true }).isString(),
    body("groupName").optional({ nullable: true }).isString(),
    body("studentName").optional({ nullable: true }).isString(),
    body("classStartTime").optional({ nullable: true }).isString(),
    body("classEndTime").optional({ nullable: true }).isString(),
    body("status").optional({ nullable: true }).isString(),
    body("reportStatus").optional({ nullable: true }).isString(),
    body("notes").optional({ nullable: true }).isString(),
    body("rowColor").optional({ nullable: true }).isString(),
    body("tuitionStartDate").optional({ nullable: true }).isISO8601(),
    body("tuitionStartMonth").optional({ nullable: true }).isString(),
    body("tuitionEndMonth").optional({ nullable: true }).isString(),
    body("userId").optional().isInt({ min: 1 }),
  ];

  router.get("/meta", requireAuth, otmManagementController.meta);
  router.get("/users", requireAuth, otmManagementController.listUsers);

  router.get("/entries", requireAuth, otmManagementController.listEntries);
  router.post("/entries", requireAuth, entryValidators, otmManagementController.createEntry);
  router.post(
    "/entries/reorder",
    requireAuth,
    [body("orderedIds").isArray({ min: 1 }), body("orderedIds.*").isInt({ min: 1 })],
    otmManagementController.reorderEntries
  );

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
