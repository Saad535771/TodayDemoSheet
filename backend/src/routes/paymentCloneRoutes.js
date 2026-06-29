import { Router } from "express";

export function makePaymentCloneRoutes(paymentCloneController, requireAuth) {
  const router = Router();

  if (!paymentCloneController) {
    throw new Error("paymentCloneController is required in makePaymentCloneRoutes");
  }

  if (typeof requireAuth !== "function") {
    throw new Error("requireAuth middleware is required in makePaymentCloneRoutes");
  }

  const call = (handlerName) => async (req, res, next) => {
    try {
      const handler = paymentCloneController?.[handlerName];

      if (typeof handler !== "function") {
        return res.status(501).json({
          message: `paymentCloneController.${handlerName} is not defined`,
        });
      }

      return await handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };

  // Notification routes
  // Final URLs:
  // GET  /payments-clone/notifications/count
  // POST /payments-clone/notifications/read
  router.get("/notifications/count", requireAuth, call("notificationCount"));
  router.post("/notifications/read", requireAuth, call("markNotificationsRead"));

  // Reorder route
  // POST /payments-clone/reorder
  router.post("/reorder", requireAuth, call("reorder"));

  // Trash routes
  // GET    /payments-clone/trash/all
  // PUT    /payments-clone/trash/:id/restore
  // POST   /payments-clone/trash/:id/restore
  // DELETE /payments-clone/trash/:id/force
  router.get("/trash/all", requireAuth, call("listTrash"));
  router.put("/trash/:id/restore", requireAuth, call("restoreTrash"));
  router.post("/trash/:id/restore", requireAuth, call("restoreTrash"));
  router.delete("/trash/:id/force", requireAuth, call("forceDeleteTrash"));

  // Main routes
  // GET    /payments-clone/
  // POST   /payments-clone/
  // PATCH  /payments-clone/:id
  // PUT    /payments-clone/:id
  // DELETE /payments-clone/:id
  router.get("/", requireAuth, call("list"));
  router.post("/", requireAuth, call("create"));
  router.patch("/:id", requireAuth, call("update"));
  router.put("/:id", requireAuth, call("update"));
  router.delete("/:id", requireAuth, call("remove"));

  return router;
}

export default makePaymentCloneRoutes;
