import { Router } from "express";
import { makePaymentChangeRequestController } from "../controllers/paymentChangeRequestController.js";

function applyTodayHistoryQuery(req) {
  req.query = {
    ...(req.query || {}),
    today: "1",
    historyWindow: "today",
  };
  return req;
}

function applyLast24HoursQuery(req) {
  req.query = {
    ...(req.query || {}),
    hours: "24",
    last24Hours: "1",
    strictLast24: "1",
    historyWindow: "last-24-hours",
  };
  return req;
}

export function createPaymentChangeRequestRoutes(deps) {
  const router = Router();
  const controller = makePaymentChangeRequestController(deps);

  // Permanent complete history routes.
  router.get("/summary", controller.summary);
  router.get("/logs", controller.listLogs);
  router.get("/history", controller.listLogs);

  // Today-only routes.
  router.get("/summary/today", (req, res) =>
    controller.summary(applyTodayHistoryQuery(req), res)
  );
  router.get("/logs/today", (req, res) =>
    controller.listLogs(applyTodayHistoryQuery(req), res)
  );
  router.get("/history/today", (req, res) =>
    controller.listLogs(applyTodayHistoryQuery(req), res)
  );

  // Rolling previous 24 hours routes.
  router.get("/summary/last-24-hours", (req, res) =>
    controller.summary(applyLast24HoursQuery(req), res)
  );
  router.get("/logs/last-24-hours", (req, res) =>
    controller.listLogs(applyLast24HoursQuery(req), res)
  );
  router.get("/history/last-24-hours", (req, res) =>
    controller.listLogs(applyLast24HoursQuery(req), res)
  );

  return router;
}
