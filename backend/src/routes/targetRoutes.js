import { Router } from "express";
export function makeTargetRoutes(targetController, requireAuth) {
  const router = Router();
  router.get("/", requireAuth, targetController.list);
  router.post("/reorder", requireAuth, targetController.reorder);
  
  router.patch("/:tuitionId", requireAuth, targetController.update);
  return router;
}