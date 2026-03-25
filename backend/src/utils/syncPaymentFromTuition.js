function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);

  return Number.isFinite(num) ? num : null;
}

export async function syncPaymentFromTuition({ Payment, item }) {
  const status = String(item.status || "").trim();

  if (status !== "Tuition Done") return;

  const totalFees = toNumberOrNull(item.estimatedFee || item.totalFees);
  const tutorShare = toNumberOrNull(item.tutorFee || item.tutorFees);
  const lacasShare =
    totalFees !== null && tutorShare !== null ? totalFees - tutorShare : null;

  const payload = {
    tuitionId: item.tuitionId,
    paymentDate: item.date || item.demoDate || null,
    tuitionName: item.tuitionName || "",
    country: item.country || "",
    className: item.className || item.class || "",
    daysPerWeek: item.daysPerWeek || item.days_per_week || null,
    tutorName: item.tutorName || "",
    tutorShare,
    lacasShare,
    totalFees,
    feedback: item.feedback || "",
    otmName: item.otmName || item.source || "",
  };

  const existing = await Payment.findOne({
    where: { tuitionId: item.tuitionId },
  });

  if (existing) {
    await existing.update({
      ...payload,
      status: existing.status || "Tuition Pending",
    });
  } else {
    await Payment.create({
      ...payload,
      status: "Tuition Pending",
    });
  }
}