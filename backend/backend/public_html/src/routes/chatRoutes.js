import { Router } from "express";
import { body, param, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

export function makeChatRoutes(chatController) {
  const router = Router();

  router.use(requireAuth, chatController.requireChatAccess);

  router.get("/groups", chatController.listGroups);

  router.post(
    "/groups",
    [
      body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Valid group name is required"),
      body("description").optional().trim().isLength({ max: 255 }),
      body("member_ids").optional().isArray(),
    ],
    chatController.createGroup
  );

  router.get(
    "/groups/:groupId/members",
    [param("groupId").isInt({ min: 1 }).withMessage("Valid groupId is required")],
    chatController.groupMembers
  );

  router.post(
    "/groups/:groupId/members",
    [
      param("groupId").isInt({ min: 1 }).withMessage("Valid groupId is required"),
      body("user_id").isInt({ min: 1 }).withMessage("Valid user_id is required"),
      body("can_send").optional().isBoolean().toBoolean(),
      body("is_active").optional().isBoolean().toBoolean(),
    ],
    chatController.upsertGroupMember
  );

  router.get(
    "/groups/:groupId/messages",
    [
      param("groupId").isInt({ min: 1 }).withMessage("Valid groupId is required"),
     query("limit").optional().isInt({ min: 1, max: 10 }),
query("before_id").optional().isInt({ min: 1 }),
    ],
    chatController.listMessages
  );

  router.post(
    "/groups/:groupId/messages",
    [
      param("groupId").isInt({ min: 1 }).withMessage("Valid groupId is required"),
      body("message_text").trim().isLength({ min: 1 }).withMessage("message_text is required"),
    ],
    chatController.sendMessage
  );

  router.post(
    "/groups/:groupId/seen",
    [
      param("groupId").isInt({ min: 1 }).withMessage("Valid groupId is required"),
      body("message_id").isInt({ min: 1 }).withMessage("Valid message_id is required"),
    ],
    chatController.markSeen
  );

  router.post(
    "/groups/:groupId/upload",
    upload.single("file"),
    chatController.uploadFile
  );
  
  router.post(
    "/dm/:userId",
    [param("userId").isInt({ min: 1 }).withMessage("Valid userId is required")],
    chatController.findOrCreateDM
  );

  router.get("/unread-total", chatController.getTotalUnread);

  return router;
}
