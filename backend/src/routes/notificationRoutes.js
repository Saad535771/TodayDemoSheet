import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";

export function makeNotificationRoutes(notificationController) {
  const router = Router();

  router.use(requireAuth);

  router.get("/unread-summary", notificationController.unreadSummary);

  router.post(
    "/mark-seen",
    [body("module_key").optional().isString(), body("moduleKey").optional().isString()],
    notificationController.markSeen
  );

  router.post(
    "/test",
    [body("module_key").optional().isString(), body("moduleKey").optional().isString()],
    notificationController.test
  );

  return router;
}
