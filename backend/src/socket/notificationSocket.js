import jwt from "jsonwebtoken";

export function registerNotificationSocket(io, { User, notificationService }) {
  const nsp = io.of("/notifications");

  notificationService.setNamespace(nsp);

  nsp.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) return next(new Error("Missing notification socket token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const me = await User.findByPk(payload.id);

      if (!me) return next(new Error("User not found"));

      socket.user = {
        id: me.id,
        role: me.role,
        name: me.name || "",
        email: me.email || "",
      };

      return next();
    } catch (error) {
      return next(new Error("Notification socket auth failed"));
    }
  });

  nsp.on("connection", async (socket) => {
    socket.join(`notifications:user:${socket.user.id}`);
    console.log(`[NOTIFICATION SOCKET] ${socket.user.email} connected`);

    try {
      const summary = await notificationService.getUnreadSummary(socket.user.id);
      socket.emit("notifications:summary", summary);
    } catch (error) {
      console.error("NOTIFICATION SOCKET SUMMARY ERROR:", error?.message || error);
    }

    socket.on("notifications:summary", async () => {
      try {
        const summary = await notificationService.getUnreadSummary(socket.user.id);
        socket.emit("notifications:summary", summary);
      } catch (error) {
        socket.emit("notifications:error", { message: "Failed to load notification summary" });
      }
    });

    socket.on("notifications:mark_seen", async ({ module_key, moduleKey } = {}) => {
      try {
        await notificationService.markSeen(socket.user.id, module_key || moduleKey || null);
        const summary = await notificationService.getUnreadSummary(socket.user.id);
        socket.emit("notifications:summary", summary);
      } catch (error) {
        socket.emit("notifications:error", { message: "Failed to mark notification as seen" });
      }
    });
  });
}
