import cron from "node-cron";
export function startDailyJob() {
  const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
  cron.schedule("3 0 * * *", () => {
    console.log(`[DailyJob] ${new Date().toISOString()} (tz=${tz})`);
  }, { timezone: tz });

  console.log(`[DailyJob] scheduled at 00:03 (${tz})`);
}
