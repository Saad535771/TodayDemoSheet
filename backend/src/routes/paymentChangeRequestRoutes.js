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

function applyLast24HoursHistoryQuery(req) {
  req.query = {
    ...(req.query || {}),
    today: undefined,
    hours: "24",
    strictLast24: "1",
    historyWindow: "last-24-hours",
  };
  return req;
}

export function createPaymentChangeRequestRoutes(deps) {
  const router = Router();
  const controller = makePaymentChangeRequestController(deps);

  // Complete permanent history routes.
  router.get("/summary", controller.summary);
  router.get("/logs", controller.listLogs);
  router.get("/history", controller.listLogs);

  // Today-only routes, if needed separately.
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
  // These must NOT fall back to today or complete history.
  router.get("/summary/last-24-hours", (req, res) =>
    controller.summary(applyLast24HoursHistoryQuery(req), res)
  );
  router.get("/logs/last-24-hours", (req, res) =>
    controller.listLogs(applyLast24HoursHistoryQuery(req), res)
  );
  router.get("/history/last-24-hours", (req, res) =>
    controller.listLogs(applyLast24HoursHistoryQuery(req), res)
  );

  return router;
}
