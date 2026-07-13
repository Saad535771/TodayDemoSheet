import { Router } from "express";
import { makePaymentChangeRequestController } from "../controllers/paymentChangeRequestController.js";

// Helper function to force module name for Team B
function applyTeamBModule(req) {
  req.query = {
    ...(req.query || {}),
    moduleName: "payment_sheet_clone_team_b",
  };
  return req;
}

function applyTodayHistoryQuery(req) {
  req = applyTeamBModule(req);
  req.query.today = "1";
  req.query.historyWindow = "today";
  return req;
}

function applyLast24HoursHistoryQuery(req) {
  req = applyTeamBModule(req);
  req.query.today = undefined;
  req.query.hours = "24";
  req.query.strictLast24 = "1";
  req.query.historyWindow = "last-24-hours";
  return req;
}

export function createPaymentChangeRequestTeamBRoutes(deps) {
  const router = Router();
  const controller = makePaymentChangeRequestController(deps); // Uses the same controller!

  // Complete permanent history routes.
  router.get("/summary", (req, res) => controller.summary(applyTeamBModule(req), res));
  router.get("/logs", (req, res) => controller.listLogs(applyTeamBModule(req), res));
  router.get("/history", (req, res) => controller.listLogs(applyTeamBModule(req), res));

  // Today-only routes.
  router.get("/summary/today", (req, res) => controller.summary(applyTodayHistoryQuery(req), res));
  router.get("/logs/today", (req, res) => controller.listLogs(applyTodayHistoryQuery(req), res));
  router.get("/history/today", (req, res) => controller.listLogs(applyTodayHistoryQuery(req), res));

  // Rolling previous 24 hours routes.
  router.get("/summary/last-24-hours", (req, res) => controller.summary(applyLast24HoursHistoryQuery(req), res));
  router.get("/logs/last-24-hours", (req, res) => controller.listLogs(applyLast24HoursHistoryQuery(req), res));
  router.get("/history/last-24-hours", (req, res) => controller.listLogs(applyLast24HoursHistoryQuery(req), res));

  return router;
}