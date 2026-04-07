import dotenv from "dotenv";
dotenv.config();

import { makeSequelize } from "./config/db.js";
import { initModels } from "./models/index.js";

import { makeAuthController } from "./controllers/authController.js";
import { makeTuitionController } from "./controllers/tuitionController.js";
import { makeTargetController } from "./controllers/targetController.js";
import { makePaymentController } from "./controllers/paymentController.js";
import { makePaymentCloneController } from "./controllers/paymentCloneController.js";
import { makeOtmManagementController } from "./controllers/otmManagementController.js";

import { makeAuthRoutes } from "./routes/authRoutes.js";
import { makeTuitionRoutes } from "./routes/tuitionRoutes.js";
import { makeTargetRoutes } from "./routes/targetRoutes.js";
import { makePaymentRoutes } from "./routes/paymentRoutes.js";
import { makePaymentCloneRoutes } from "./routes/paymentCloneRoutes.js";
import { makeOtmManagementRoutes } from "./routes/otmManagementRoutes.js";
import { createPaymentChangeRequestRoutes } from "./routes/paymentChangeRequestRoutes.js";

import { requireAuth } from "./middleware/auth.js";
import { makeApp } from "./app.js";
import { startDailyJob } from "./jobs/dailyJob.js";
import { startPaymentChangeRequestCleanup } from "./jobs/startPaymentChangeRequestCleanup.js";

const sequelize = makeSequelize();
const models = initModels(sequelize);

async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const {
      PaymentClone,
      PaymentCloneTrash,
      PaymentChangeRequest,
      User,
      OtmTuitionEntry,
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
    });

    const otmManagementController = makeOtmManagementController({
      User,
      OtmTuitionEntry,
    });
    const authRoutes = makeAuthRoutes(authController);
    const tuitionRoutes = makeTuitionRoutes(tuitionController, requireAuth);
    const targetRoutes = makeTargetRoutes(targetController, requireAuth);
    const paymentRoutes = makePaymentRoutes(paymentController);
    const paymentCloneRoutes = makePaymentCloneRoutes(paymentCloneController,requireAuth);
    const otmManagementRoutes = makeOtmManagementRoutes(otmManagementController);
    const paymentChangeRequestRoutes = createPaymentChangeRequestRoutes({
      PaymentClone,
      PaymentCloneTrash,
      PaymentChangeRequest,
    });
    const app = makeApp({
      authRoutes,
      tuitionRoutes,
      targetRoutes,
      paymentRoutes,
      paymentCloneRoutes,
      otmManagementRoutes,
      paymentChangeRequestRoutes,
    });
    const port = process.env.PORT ? Number(process.env.PORT) : 5000;
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
    startDailyJob();
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