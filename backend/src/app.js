import express from "express";
import morgan from "morgan";
import { requireAuth } from "./middleware/auth.js";

const allowedOrigins = [
  "https://today-demo-sheet-feedback.vercel.app",
  "http://today-demo-sheet-feedback.vercel.app",
  "https://app.excelhometutors.com",
  "http://app.excelhometutors.com",
  "https://sheet.excelhometutors.com",
  "http://sheet.excelhometutors.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://172.16.3.133:5173",
  "http://192.168.100.56:5173",
  "http://192.168.100.74:5173"
];

export function isOriginAllowed(origin) {
  if (!origin) return true;

  const origins = String(origin)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return origins.some((o) => {
    if (allowedOrigins.includes(o)) return true;
    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(o)) return true;
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*excelhometutors\.com(:\d+)?$/.test(o)) return true;
    if (/^http:\/\/localhost:\d+$/.test(o)) return true;
    if (/^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(o)) return true;
    if (/^http:\/\/172\.16\.\d+\.\d+:\d+$/.test(o)) return true;
    return false;
  });
}

function getCorsOrigin(origin) {
  if (!origin) return null;

  const origins = String(origin)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return origins.find((o) => isOriginAllowed(o)) || null;
}

function applyCorsHeaders(req, res) {
  const allowedOrigin = getCorsOrigin(req.headers.origin);

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
}

export const socketCorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST"]
};

export function makeApp({
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
}) {
  const app = express();

  app.use((req, res, next) => {
    applyCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  });

  app.use(express.json({ limit: "5mb" }));
  app.use(morgan("dev"));
  if (notificationService?.responseHook) {
  app.use(notificationService.responseHook());
}
 
  app.use("/uploads", express.static("public/uploads"));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tuitions", tuitionRoutes);
  app.use("/api/target", targetRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/payments-clone", paymentCloneRoutes);
  app.use("/api/payments-clone-team-b", paymentCloneTeamBRoutes);
  app.use("/api/otm-management", otmManagementRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/payment-change-requests", requireAuth, paymentChangeRequestRoutes);
  app.use("/api/payment-change-requests-team-b", requireAuth, paymentChangeRequestTeamBRoutes);
 app.use("/api/notifications", notificationRoutes);
  app.use((err, req, res, next) => {
    applyCorsHeaders(req, res);
    console.error("APP ERROR:", err);
    res.status(500).json({
      message: "Server error",
      detail:
        process.env.NODE_ENV === "development" ? String(err?.message || err) : undefined,
    });
  });

  return app;
}
