import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";

export function makeAuthRoutes(authController) {
  const router = Router();

  router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isString().isLength({ min: 3 }).withMessage("Password required"),
    body("role").isIn(["admin", "staff"]).withMessage("Invalid role selected") // Yeh add karein
  ],
  authController.login
);

  // 👇 New Route for Registering Staff
  router.post(
    "/register",
    requireAuth, // Sirf logged-in banda access kare (aur controller mein admin check hai)
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
    authController.register
  );
// routes/authRoutes.js mein add karein:
router.get("/users", requireAuth, authController.listUsers);
router.put("/users/:userId/permissions", requireAuth, authController.updatePermissions);
router.delete("/users/:userId", requireAuth, authController.deleteUser);
  router.get("/me", requireAuth, authController.me);

  return router;
}