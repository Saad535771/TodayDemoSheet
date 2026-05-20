function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);

  return Number.isFinite(num) ? num : null;
}

export async function syncPaymentFromTarget({ Payment, item }) {
  const status = String(item.status || "").trim();

  if (status !== "Tuition Done") return;

  const totalFees = toNumberOrNull(item.estimatedFee || item.totalFees);
  const tutorShare = toNumberOrNull(item.tutorFees || item.tutorFee);
  const lacasShare =
    totalFees !== null && tutorShare !== null ? totalFees - tutorShare : null;

  await Payment.upsert({
    tuitionId: item.tuitionId,
    paymentDate: item.demoDate || null,
    tuitionName: item.tuitionName || "",
    country: item.country || "",
    className: item.className || item.class || "",
    tutorName: item.tutorName || "",
    tutorShare,
    lacasShare,
    totalFees,
    status: "Tuition Pending",
    feedback: item.feedback || "",
    otmName: item.source || "",
  });
}