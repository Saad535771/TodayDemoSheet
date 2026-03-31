import { Router } from "express";
import { body } from "express-validator";

export function makeTuitionRoutes(tuitionController, requireAuth) {
  const router = Router();

  router.get("/", requireAuth, tuitionController.list);
  router.get("/search", requireAuth, tuitionController.search);

  router.get(
    "/payment-approvals",
    requireAuth,
    tuitionController.getPaymentApprovals
  );

  router.get(
    "/payment-approvals/count",
    requireAuth,
    tuitionController.getPaymentApprovalsCount
  );

  router.post("/reorder", requireAuth, tuitionController.reorder);
  router.get("/trash", requireAuth, tuitionController.getTrash);
  router.post("/assign", requireAuth, tuitionController.assignStaff);
  router.put("/:id/restore", requireAuth, tuitionController.restore);
  router.delete("/:id/force", requireAuth, tuitionController.forceDelete);

  router.post(
    "/",
    requireAuth,
    body("tuitionId").isString().notEmpty(),
    tuitionController.create
  );

  router.post(
    "/:tuitionId/payment-approval",
    requireAuth,
    tuitionController.decidePaymentApproval
  );

  router.get("/:tuitionId", requireAuth, tuitionController.getByTuitionId);
  router.patch("/:tuitionId", requireAuth, tuitionController.update);
  router.delete("/:tuitionId", requireAuth, tuitionController.remove);

  return router;
}