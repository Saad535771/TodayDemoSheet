import { Op } from "sequelize";

export function startPaymentChangeRequestCleanup({
  PaymentChangeRequest,
  intervalMs = 60 * 60 * 1000,
}) {
  if (!PaymentChangeRequest) {
    throw new Error("PaymentChangeRequest model is required");
  }

  const runCleanup = async () => {
    try {
      const deletedCount = await PaymentChangeRequest.destroy({
        where: {
          requestStatus: "pending",
          expiresAt: {
            [Op.lte]: new Date(),
          },
        },
      });

      if (deletedCount > 0) {
        console.log(
          `[payment-change-request-cleanup] removed ${deletedCount} expired pending request(s)`
        );
      }
    } catch (err) {
      console.error("[payment-change-request-cleanup] cleanup failed:", err);
    }
  };

  void runCleanup();

  const timer = setInterval(() => {
    void runCleanup();
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => clearInterval(timer);
}