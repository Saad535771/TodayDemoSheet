export function makeNotificationController({ notificationService }) {
  return {
    async unreadSummary(req, res) {
      try {
        const summary = await notificationService.getUnreadSummary(req.user.id);
        return res.json(summary);
      } catch (error) {
        console.error("UNREAD NOTIFICATION SUMMARY ERROR:", error);
        return res.status(500).json({ message: "Failed to load notifications" });
      }
    },

    async markSeen(req, res) {
      try {
        const moduleKey = req.body?.module_key || req.body?.moduleKey || req.query?.module_key || null;
        const result = await notificationService.markSeen(req.user.id, moduleKey);
        const summary = await notificationService.getUnreadSummary(req.user.id);
        return res.json({ ...result, summary });
      } catch (error) {
        console.error("MARK NOTIFICATION SEEN ERROR:", error);
        return res.status(500).json({ message: "Failed to mark notification as seen" });
      }
    },

    async test(req, res) {
      try {
        if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Only admin can send test notifications" });
        }

        const moduleKey = req.body?.module_key || req.body?.moduleKey || "target";
        const notification = await notificationService.createNotification({
          moduleKey,
          actionType: "system",
          entityType: moduleKey,
          actorUserId: req.user.id,
          title: req.body?.title || `Test notification in ${moduleKey}`,
          message: req.body?.message || "This is a test notification.",
          payload: { source: "manual-test" },
        });

        return res.json({ success: true, notification });
      } catch (error) {
        console.error("TEST NOTIFICATION ERROR:", error);
        return res.status(500).json({ message: "Failed to send test notification" });
      }
    },
  };
}
