import { Router } from "express";

export function makeTargetRoutes(targetController, requireAuth) {
  const router = Router();

  router.get("/", requireAuth, targetController.list);
  router.patch("/:tuitionId", requireAuth, targetController.update);

  return router;
}
