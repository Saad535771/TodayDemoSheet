import dotenv from "dotenv";
dotenv.config();

import { makeSequelize } from "./config/db.js";
import { initModels } from "./models/index.js";
import { makeAuthController } from "./controllers/authController.js";
import { makeTuitionController } from "./controllers/tuitionController.js";
import { makeTargetController } from "./controllers/targetController.js";
import { makeAuthRoutes } from "./routes/authRoutes.js";
import { makeTuitionRoutes } from "./routes/tuitionRoutes.js";
import { makeTargetRoutes } from "./routes/targetRoutes.js";
import { requireAuth } from "./middleware/auth.js";
import { makeApp } from "./app.js";
import { startDailyJob } from "./jobs/dailyJob.js";

const sequelize = makeSequelize();
const models = initModels(sequelize);

async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const authController = makeAuthController(models);
    const tuitionController = makeTuitionController(models);
    const targetController = makeTargetController(models);

    const authRoutes = makeAuthRoutes(authController);
    const tuitionRoutes = makeTuitionRoutes(tuitionController, requireAuth);
    const targetRoutes = makeTargetRoutes(targetController, requireAuth);

    const app = makeApp({ authRoutes, tuitionRoutes, targetRoutes });

    const port = process.env.PORT ? Number(process.env.PORT) : 5000;
    app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));

    startDailyJob();
  } catch (e) {
    console.error("❌ Failed to start server", e);
    process.exit(1);
  }
}

main();
