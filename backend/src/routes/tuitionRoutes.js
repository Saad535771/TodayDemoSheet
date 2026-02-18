import { Router } from "express";
import { body } from "express-validator";

export function makeTuitionRoutes(tuitionController, requireAuth) {
  const router = Router();

  // 1. Static/Specific Routes FIRST
  router.get("/", requireAuth, tuitionController.list);
  
  // Trash Routes
  router.get("/trash", requireAuth, tuitionController.getTrash);
  
  // Assignment Route
  router.post("/assign", requireAuth, tuitionController.assignStaff);

  // Restore & Force Delete (Using Database ID)
  router.put("/:id/restore", requireAuth, tuitionController.restore);
  router.delete("/:id/force", requireAuth, tuitionController.forceDelete);

  // 2. Create Route
  router.post(
    "/",
    requireAuth,
    body("tuitionId").isString().notEmpty(),
    body("time").exists().withMessage("time required"),
    tuitionController.create
  );

  // 3. Dynamic Routes (/:tuitionId) LAST
  // Kyunki agar yeh upar hota, to "/trash" ko yeh "tuitionId='trash'" samajh leta
  router.get("/:tuitionId", requireAuth, tuitionController.getByTuitionId);
  router.patch("/:tuitionId", requireAuth, tuitionController.update);
  router.delete("/:tuitionId", requireAuth, tuitionController.remove); // Soft Delete

  return router;
}