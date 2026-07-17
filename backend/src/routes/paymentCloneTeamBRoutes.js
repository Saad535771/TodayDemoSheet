import { Router } from "express";

export function makePaymentCloneTeamBRoutes(paymentCloneTeamBController, requireAuth) {
  const router = Router();

  if (!paymentCloneTeamBController) {
    throw new Error("paymentCloneTeamBController is required in makePaymentCloneTeamBRoutes");
  }

  if (typeof requireAuth !== "function") {
    throw new Error("requireAuth middleware is required in makePaymentCloneTeamBRoutes");
  }

  const call = (handlerName) => async (req, res, next) => {
    try {
      const handler = paymentCloneTeamBController?.[handlerName];

      if (typeof handler !== "function") {
        return res.status(501).json({
          message: `paymentCloneTeamBController.${handlerName} is not defined`,
        });
      }

      return await handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
  // Notification routes for Team B
  router.get("/notifications/count", requireAuth, call("notificationCount"));
  router.post("/notifications/read", requireAuth, call("markNotificationsRead"));
  router.get("/history/track", requireAuth, call("getPaymentHistory"));
  // Reorder route for Team B
  router.post("/reorder", requireAuth, call("reorder"));
  // Trash routes for Team B
  router.get("/trash/all", requireAuth, call("listTrash"));
  router.put("/trash/:id/restore", requireAuth, call("restoreTrash"));
  router.post("/trash/:id/restore", requireAuth, call("restoreTrash"));
  router.delete("/trash/:id/force", requireAuth, call("forceDeleteTrash"));
  // Main routes for Team B
  router.get("/", requireAuth, call("list"));
  router.post("/", requireAuth, call("create"));
  router.patch("/:id", requireAuth, call("update"));
  router.put("/:id", requireAuth, call("update"));
  router.delete("/:id", requireAuth, call("remove"));
  return router;
}
export default makePaymentCloneTeamBRoutes;