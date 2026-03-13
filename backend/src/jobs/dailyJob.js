import cron from "node-cron";

/**
 * Sheet script had a daily trigger at 00:03 Asia/Karachi.
 * In this web app we compute Filter (Followup / Today Demo / Future Demo) on the fly,
 * so we don't need to write anything to DB.
 *
 * This job is kept for parity + future extensions (notifications, cleanup, etc.).
 */
export function startDailyJob() {
  const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
  cron.schedule("3 0 * * *", () => {
    console.log(`[DailyJob] ${new Date().toISOString()} (tz=${tz})`);
  }, { timezone: tz });

  console.log(`[DailyJob] scheduled at 00:03 (${tz})`);
}
