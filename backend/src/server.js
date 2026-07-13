import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import { makeSequelize } from "./config/db.js";
import { initModels } from "./models/index.js";
import { makeAuthController } from "./controllers/authController.js";
import { makeTuitionController } from "./controllers/tuitionController.js";
import { makeTargetController } from "./controllers/targetController.js";
import { makePaymentController } from "./controllers/paymentController.js";
import { makePaymentCloneController } from "./controllers/paymentCloneController.js";
import { makePaymentCloneTeamBController } from "./controllers/paymentCloneTeamBController.js";
import { makeOtmManagementController } from "./controllers/otmManagementController.js";
import { makeChatController } from "./controllers/chatController.js";
import { makeAuthRoutes } from "./routes/authRoutes.js";
import { makeTuitionRoutes } from "./routes/tuitionRoutes.js";
import { makeTargetRoutes } from "./routes/targetRoutes.js";
import { makePaymentRoutes } from "./routes/paymentRoutes.js";
import { makePaymentCloneRoutes } from "./routes/paymentCloneRoutes.js";
import { makePaymentCloneTeamBRoutes } from "./routes/paymentCloneTeamBRoutes.js";
import { makeOtmManagementRoutes } from "./routes/otmManagementRoutes.js";
import { createPaymentChangeRequestRoutes } from "./routes/paymentChangeRequestRoutes.js";
import { createPaymentChangeRequestTeamBRoutes } from "./routes/paymentChangeRequestTeamBRoutes.js";
import { makeChatRoutes } from "./routes/chatRoutes.js";
import { makeNotificationController } from "./controllers/notificationController.js";
import { makeNotificationRoutes } from "./routes/notificationRoutes.js";
import { createNotificationService } from "./utils/notificationService.js";
import { registerNotificationSocket } from "./socket/notificationSocket.js";
import { requireAuth } from "./middleware/auth.js";
import { makeApp, socketCorsOptions } from "./app.js";
import { startDailyJob } from "./jobs/dailyJob.js";
import { startPaymentChangeRequestCleanup } from "./jobs/startPaymentChangeRequestCleanup.js";
import { registerChatSocket } from "./socket/chatSocket.js";

const sequelize = makeSequelize();

async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const models = initModels(sequelize);
    const notificationService = createNotificationService({ sequelize });
    const {
      PaymentClone,
      PaymentCloneTrash,
      PaymentCloneTeamB,
      PaymentCloneTrashTeamB,
      PaymentChangeRequest,
      User,
      OtmTuitionEntry,
      OtmPortalReport,
      OtmClassTime,
      OtmTotalClass,
      ChatGroup,
      ChatGroupMember,
      ChatMessage,
      ChatMessageSeen,
    } = models;

    if (!PaymentClone) {
      throw new Error("PaymentClone model not found in initModels(sequelize)");
    }

    if (!PaymentChangeRequest) {
      throw new Error("PaymentChangeRequest model not found in initModels(sequelize)");
    }
    const authController = makeAuthController(models);
    const tuitionController = makeTuitionController(models);
    const targetController = makeTargetController(models);
    const paymentController = makePaymentController(models);
    const paymentCloneController = makePaymentCloneController({
      PaymentClone,
      PaymentCloneTrash,
      PaymentChangeRequest,
      User,
    });
    const paymentCloneTeamBController = makePaymentCloneTeamBController({
      PaymentCloneTeamB,
      PaymentCloneTrashTeamB,
      PaymentChangeRequest,
      User,
    });
    const otmManagementController = makeOtmManagementController({
      User,
      OtmTuitionEntry,
      OtmPortalReport,
      OtmClassTime,
      OtmTotalClass,
    });
    const chatController = makeChatController({
      sequelize,
      User,
      ChatGroup,
      ChatGroupMember,
      ChatMessage,
      ChatMessageSeen,
    });
    const authRoutes = makeAuthRoutes(authController);
    const tuitionRoutes = makeTuitionRoutes(tuitionController, requireAuth);
    const targetRoutes = makeTargetRoutes(targetController, requireAuth);
    const paymentRoutes = makePaymentRoutes(paymentController);
    const paymentCloneRoutes = makePaymentCloneRoutes(paymentCloneController, requireAuth);
    const paymentCloneTeamBRoutes = makePaymentCloneTeamBRoutes(paymentCloneTeamBController, requireAuth);
    const otmManagementRoutes = makeOtmManagementRoutes(otmManagementController);
    const chatRoutes = makeChatRoutes(chatController);
    const paymentChangeRequestRoutes = createPaymentChangeRequestRoutes({
      PaymentClone,
      PaymentCloneTrash,
      PaymentChangeRequest,
      User,
    });
    const paymentChangeRequestTeamBRoutes = createPaymentChangeRequestTeamBRoutes({
      PaymentCloneTeamB,
      PaymentCloneTrashTeamB,
      PaymentChangeRequest,
      User,
    });
    const notificationController = makeNotificationController({ notificationService });
const notificationRoutes = makeNotificationRoutes(notificationController);
    const app = makeApp({
      authRoutes,
      tuitionRoutes,
      targetRoutes,
      paymentRoutes,
      paymentCloneRoutes,
      paymentCloneTeamBRoutes,
      otmManagementRoutes,
      paymentChangeRequestRoutes,
      paymentChangeRequestTeamBRoutes,
      chatRoutes,
      notificationRoutes,
      notificationService,
    });
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: socketCorsOptions,
    });
    registerChatSocket(io, {
      User,
      ChatGroupMember,
      ChatMessage,
      ChatMessageSeen,
      notificationService,
    });
    const port = process.env.PORT ? Number(process.env.PORT) : 5000;
    httpServer.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
   startDailyJob({
      onRun: () => {
        paymentCloneController.syncCurrentPakistanPaymentCycle({ source: "daily-job" });
        paymentCloneTeamBController.syncCurrentPakistanPaymentCycle({ source: "daily-job" });
      },
      runOnStart: true,
    });
    startPaymentChangeRequestCleanup({
      PaymentChangeRequest,
      intervalMs: 60 * 60 * 1000,
    });
  } catch (e) {
    console.error("❌ Failed to start server", e);
    process.exit(1);
  }
}
main();