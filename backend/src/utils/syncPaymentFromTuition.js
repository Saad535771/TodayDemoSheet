function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);

  return Number.isFinite(num) ? num : null;
}

function toIntegerOrNull(value) {
  if (value === null || value === undefined || value === "") return null;

  const match = String(value).match(/\d+/);
  if (!match) return null;

  const num = Number(match[0]);
  return Number.isInteger(num) ? num : null;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function roundMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export async function removePaymentByTuitionId({ Payment, tuitionId }) {
  if (!tuitionId) return 0;
  return Payment.destroy({ where: { tuitionId } });
}

export async function syncPaymentFromTuition({ Payment, item }) {
  const normalizedStatus = normalizeStatus(item.status);
  const tuitionId = item.tuitionId || "";

  const existing = await Payment.findOne({
    where: { tuitionId },
  });

  // Agar Tuition Done remove/change ho jaye to Payment sheet se record hata do
  if (normalizedStatus !== "tuition done") {
    if (existing) {
      await existing.destroy();
    }
    return null;
  }

  // Estimated Fee / Total Fee ko total fee maan lo
  const totalFee = toNumberOrNull(
    item.estimatedFee ?? item.totalFee ?? item.totalFees
  );

  // Tutor fee hamesha Tuition sheet wali exact value se aayegi
  const tutorFee = toNumberOrNull(item.tutorFee ?? item.tutorFees);
  const lacasShare =
    totalFee === null ? null : roundMoney(totalFee - (tutorFee ?? 0));

  const payload = {
    tuitionId,
    date: item.date || item.demoDate || null,
    tuitionName: item.tuitionName || "",
    country: item.country || "",
    className: item.className || item.class || "",
    daysPerWeek: toIntegerOrNull(item.daysPerWeek || item.days_per_week),
    tutorName: item.tutorName || "",
    tutorFee,
    tutorShare: tutorFee,
    lacasShare,
    totalFee,
    totalFees: totalFee,
    feedback: item.feedback || "",
    otmName: item.otmName || item.source || "",
    notes: item.notes || item.secondTutors || "",
  };

  if (existing) {
    await existing.update({
      ...payload,
      status: existing.status || "Tuition Pending",
    });
    return existing;
  }

  return Payment.create({
    ...payload,
    status: "Tuition Pending",
  });
}