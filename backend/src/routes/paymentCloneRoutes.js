import { Router } from "express";

export function makePaymentCloneRoutes(paymentCloneController) {
  const router = Router();

  router.get("/", paymentCloneController.list);
  router.post("/", paymentCloneController.create);
  router.patch("/:id", paymentCloneController.update);
  router.delete("/:id", paymentCloneController.remove);
  router.post("/reorder", paymentCloneController.reorder);

  // trash routes isi router mein
  router.get("/trash/all", paymentCloneController.listTrash);
  router.put("/trash/:id/restore", paymentCloneController.restoreTrash);
  router.delete("/trash/:id/force", paymentCloneController.forceDeleteTrash);

  return router;
}


// *********************************************
// payment clone ending point

// GET    /payments-clone/
// POST   /payments-clone/
// PATCH  /payments-clone/:id
// DELETE /payments-clone/:id
// POST   /payments-clone/reorder
// *********************************************
// trash ending point
// GET    /payments-clone/trash/all
// PUT    /payments-clone/trash/:id/restore
// DELETE /payments-clone/trash/:id/force