import { Router } from "express";
import { makePaymentChangeRequestController } from "../controllers/paymentChangeRequestController.js";

export function createPaymentChangeRequestRoutes(deps) {
  const router = Router();
  const controller = makePaymentChangeRequestController(deps);

  router.get("/summary", controller.summary);
  router.get("/pending", controller.listPending);
  router.get("/history", controller.listHistory);
  router.post("/", controller.createRequest);
  router.post("/cleanup-expired", controller.cleanupExpired);
  router.post("/:id/approve", controller.approveRequest);
  router.post("/:id/reject", controller.rejectRequest);

  return router;
}
