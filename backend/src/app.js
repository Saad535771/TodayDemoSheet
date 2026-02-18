import express from "express";
import cors from "cors";
import morgan from "morgan";
export function makeApp({ authRoutes, tuitionRoutes, targetRoutes }) {
  const app = express();
 app.use(cors({
  origin: ["http://172.16.3.133:5173", "http://localhost:5173"], // Filhal sab allow karne ke liye, baad mein apni frontend URL daal dein
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/tuitions", tuitionRoutes);
  app.use("/api/target", targetRoutes);

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Server error", detail: process.env.NODE_ENV === "development" ? String(err) : undefined });
  });

  return app;
}
