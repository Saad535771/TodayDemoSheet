import { Router } from "express";

export function makePaymentCloneRoutes(paymentCloneController, requireAuth) {
  const router = Router();

  // sab payment clone routes protected
  router.get("/", requireAuth, paymentCloneController.list);
  router.post("/", requireAuth, paymentCloneController.create);
  router.patch("/:id", requireAuth, paymentCloneController.update);
  router.delete("/:id", requireAuth, paymentCloneController.remove);
  router.post("/reorder", requireAuth, paymentCloneController.reorder);

  // trash routes bhi protected
  router.get("/trash/all", requireAuth, paymentCloneController.listTrash);
  router.put("/trash/:id/restore", requireAuth, paymentCloneController.restoreTrash);
  router.delete("/trash/:id/force", requireAuth, paymentCloneController.forceDeleteTrash);

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