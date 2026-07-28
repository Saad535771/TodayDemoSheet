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
    body("tutorName")
      .optional()
      .custom((value) => typeof value === "string" || Array.isArray(value))
      .withMessage("Tutor Name must be text or a list"),
    body("groupName")
      .optional()
      .custom((value) => typeof value === "string" || Array.isArray(value))
      .withMessage("Group Name must be text or a list"),
    body("studentName").optional().isString(),
    body("classStartTime").optional().isString(),
    body("classEndTime").optional().isString(),
    body("status").optional().isString(),
    body("reportStatus").optional().isString(),
    body("decidedFee").optional().isNumeric(),
    body("tutorFee").optional().isNumeric(),
    body("notes").optional().isString(),
    body("rowColor").optional().isString(),
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
  router.post(
    "/total-class",
    requireAuth,
    [
      body("tuitionName").trim().notEmpty().withMessage("Tuition Name is required"),
      body("userId").optional().isInt({ min: 1 }),
    ],
    otmManagementController.createTotalClass
  );
  router.put(
    "/total-class/bulk",
    requireAuth,
    [body("rows").isArray({ min: 1 }), body("rows.*.id").isInt({ min: 1 })],
    otmManagementController.bulkUpdateTotalClasses
  );
  router.post(
    "/total-class/reorder",
    requireAuth,
    [body("orderedIds").isArray({ min: 1 }), body("orderedIds.*").isInt({ min: 1 })],
    otmManagementController.reorderTotalClasses
  );
  router.put(
    "/total-class/:totalClassId",
    requireAuth,
    [param("totalClassId").isInt({ min: 1 })],
    otmManagementController.updateTotalClass
  );
  router.delete(
    "/total-class/:totalClassId",
    requireAuth,
    [param("totalClassId").isInt({ min: 1 })],
    otmManagementController.deleteTotalClass
  );

  router.get("/admin/:userId",requireAuth,[param("userId").isInt({ min: 1 })],otmManagementController.adminUserDetails);
  return router;
}