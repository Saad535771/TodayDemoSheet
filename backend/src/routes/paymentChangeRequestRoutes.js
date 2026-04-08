import { Router } from "express";
import { makePaymentChangeRequestController } from "../controllers/paymentChangeRequestController.js";

export function createPaymentChangeRequestRoutes(deps) {
  const router = Router();
  const controller = makePaymentChangeRequestController(deps);

  // audit only
  router.get("/summary", controller.summary);
  router.get("/logs", controller.listLogs);

  return router;
}