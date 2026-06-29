import cron from "node-cron";

export function startDailyJob({ onRun = null, runOnStart = true } = {}) {
  const tz = process.env.APP_TIMEZONE || "Asia/Karachi";
  const expression = process.env.DAILY_JOB_CRON || "0 0 * * *";

  const runJob = async (source = "cron") => {
    console.log(`[DailyJob] ${new Date().toISOString()} (tz=${tz}, source=${source})`);

    if (typeof onRun !== "function") return;

    try {
      await onRun({ source });
    } catch (err) {
      console.error("[DailyJob] job failed:", err);
    }
  };

  cron.schedule(expression, () => {
    void runJob("cron");
  }, { timezone: tz });

  console.log(`[DailyJob] scheduled (${expression}) (${tz})`);

  if (runOnStart) {
    void runJob("startup");
  }
}
