import { Router } from "express";

export function makePaymentCloneRoutes(paymentCloneController) {
  const router = Router();
  router.get("/", paymentCloneController.list);
  router.post("/", paymentCloneController.create);
  router.patch("/:id", paymentCloneController.update);
  router.patch("/:id", paymentCloneController.update);
  router.delete("/:id", paymentCloneController.remove);
  router.post("/reorder", paymentCloneController.reorder);
  return router;
}