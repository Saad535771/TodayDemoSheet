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

export function createPaymentChangeRequestRoutes(deps) {
  const router = Router();
  const controller = makePaymentChangeRequestController(deps);

  // Original permanent history routes - kept exactly as your previous concept.
  router.get("/summary", controller.summary);
  router.get("/logs", controller.listLogs);

  // Today / 24-hours button routes.
  // Requirement: show only those records which were entered/changed today.
  router.get("/summary/today", (req, res) =>
    controller.summary(applyTodayHistoryQuery(req), res)
  );
  router.get("/logs/today", (req, res) =>
    controller.listLogs(applyTodayHistoryQuery(req), res)
  );

  // Backward-compatible aliases if frontend still calls last-24-hours.
  // This also returns today's records only, not old previous-day records.
  router.get("/summary/last-24-hours", (req, res) =>
    controller.summary(applyTodayHistoryQuery(req), res)
  );
  router.get("/logs/last-24-hours", (req, res) =>
    controller.listLogs(applyTodayHistoryQuery(req), res)
  );

  // Frontend fallback aliases.
  router.get("/history", controller.listLogs);
  router.get("/history/today", (req, res) =>
    controller.listLogs(applyTodayHistoryQuery(req), res)
  );
  router.get("/history/last-24-hours", (req, res) =>
    controller.listLogs(applyTodayHistoryQuery(req), res)
  );

  return router;
}
