import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export function makePaymentRoutes(paymentController) {
  const router = Router();

  router.get("/", requireAuth, paymentController.list);
  router.post("/", requireAuth, paymentController.create);
  router.patch("/:id", requireAuth, paymentController.update);
  router.delete("/:id", requireAuth, paymentController.remove);

  return router;
}