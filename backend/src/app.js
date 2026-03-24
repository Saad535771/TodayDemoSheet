import express from "express";
import cors from "cors";
import morgan from "morgan";

export function makeApp({
  authRoutes,
  tuitionRoutes,
  targetRoutes,
  paymentRoutes,
  paymentCloneRoutes,
}) {
  const app = express();

  app.use(
    cors({
      origin: [
        "http://172.16.3.133:5173",
        "http://localhost:5173",
        "https://today-demo-sheet-feedback.vercel.app",
        "http://192.168.100.56:5173",
      ],
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tuitions", tuitionRoutes);
  app.use("/api/target", targetRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/payments-clone", paymentCloneRoutes);

  app.use((err, req, res, next) => {
    console.error("APP ERROR:", err);
    res.status(500).json({
      message: "Server error",
      detail:
        process.env.NODE_ENV === "development" ? String(err?.message || err) : undefined,
    });
  });

  return app;
}