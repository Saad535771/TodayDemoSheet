import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middleware/auth.js";

const permissionValueValidator = (fieldName) =>
  body(fieldName)
    .optional()
    .custom((value) => {
      const validValues = [true, false, 1, 0, "1", "0", "true", "false"];
      if (!validValues.includes(value)) {
        throw new Error(`${fieldName} must be boolean or 0/1`);
      }
      return true;
    });
export function makeAuthRoutes(authController) {
  const router = Router();
  // --- LOGIN ---
  router.post(
    "/login",
    [
      body("email")
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage("Valid email required"),

      body("password")
        .isString()
        .isLength({ min: 3 })
        .withMessage("Password required"),

      body("role")
        .trim()
        .isIn(["admin", "staff", "hod", "otm"])
        .withMessage("Invalid role selected"),

      body("session_id")
        .optional()
        .isString()
        .isLength({ min: 6 })
        .withMessage("session_id must be a valid string")
    ],
    authController.login
  );

  // --- REGISTER ---
  router.post(
    "/register",
    requireAuth,
    [
      body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Name must be 2 to 120 characters"),
      body("email")
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage("Valid email required"),

      body("password")
        .isString()
        .isLength({ min: 6 })
        .withMessage("Password min 6 chars"),

      body("role")
        .trim()
        .isIn(["admin", "staff", "hod", "otm"])
        .withMessage("Invalid role")
    ],
    authController.register
  );

  // --- CURRENT USER PROFILE ---
  router.get("/me", requireAuth, authController.me);

  // --- LIST USERS ---
  router.get("/users", requireAuth, authController.listUsers);

  // --- ACTIVE USERS FOR ADMIN ---
  router.get("/active-users", requireAuth, authController.activeUsers);

  // --- PRESENCE HEARTBEAT ---
  router.put(
    "/presence/heartbeat",
    requireAuth,
    [
      body("session_id")
        .trim()
        .isString()
        .isLength({ min: 6 })
        .withMessage("session_id is required"),

      body("current_sheet")
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage("current_sheet must be a valid string")
    ],
    authController.presenceHeartbeat
  );

  // --- PRESENCE LOGOUT ---
  router.post(
    "/presence/logout",
    requireAuth,
    [
      body("session_id")
        .trim()
        .isString()
        .isLength({ min: 6 })
        .withMessage("session_id is required")
    ],
    authController.presenceLogout
  );

  // --- UPDATE USER PERMISSIONS ---
  router.put(
    "/users/:userId/permissions",
    requireAuth,
    [
      param("userId")
        .isInt({ min: 1 })
        .withMessage("Valid userId is required"),

      permissionValueValidator("access_monthly"),
      permissionValueValidator("access_demo"),
      permissionValueValidator("access_trash"),
      permissionValueValidator("access_payment_sheet"),
      permissionValueValidator("access_tutor_share"),
      permissionValueValidator("access_lacas_share"),
      permissionValueValidator("access_total_fees"),
      permissionValueValidator("access_hod_approvals"),
      permissionValueValidator("access_staff"),
      permissionValueValidator("access_otm_management"),
      permissionValueValidator("access_chat"),
      permissionValueValidator("access_chat_send"),
      
      permissionValueValidator("access_payment_sheet_clone_team_b"),
      permissionValueValidator("access_tutor_share_clone_team_b"),
      permissionValueValidator("access_lacas_share_clone_team_b"),
      permissionValueValidator("access_total_fees_clone_team_b"),
      permissionValueValidator("access_payment_actions_clone_team_b"),
      permissionValueValidator("access_trash_clone_team_b")
    ],
    authController.updatePermissions
  );

  // --- DELETE USER ---
  router.delete(
    "/users/:userId",
    requireAuth,
    [
      param("userId")
        .isInt({ min: 1 })
        .withMessage("Valid userId is required")
    ],
    authController.deleteUser
  );

  return router;
}