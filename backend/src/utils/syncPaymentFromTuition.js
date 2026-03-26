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

function splitHalf(value) {
  if (value === null || value === undefined) return null;

  const num = Number(value);
  if (!Number.isFinite(num)) return null;

  return num / 2;
}

export async function syncPaymentFromTuition({ Payment, item }) {
  const normalizedStatus = normalizeStatus(item.status);

  // sirf Tuition Done par payment sheet me create/update karo
  if (normalizedStatus !== "tuition done") return;

  // Estimated Fee ko Total Fee maan lo
  const totalFee = toNumberOrNull(
    item.estimatedFee || item.totalFee || item.totalFees
  );

  // 50 / 50 split
  const tutorFee = splitHalf(totalFee);
  const lacasShare = splitHalf(totalFee);

  const payload = {
    tuitionId: item.tuitionId || "",
    date: item.date || item.demoDate || null,
    tuitionName: item.tuitionName || "",
    country: item.country || "",
    className: item.className || item.class || "",
    daysPerWeek: toIntegerOrNull(item.daysPerWeek || item.days_per_week),
    tutorName: item.tutorName || "",
    tutorFee,
    lacasShare,
    totalFee,
    feedback: item.feedback || "",
    otmName: item.otmName || item.source || "",
    notes: item.notes || item.secondTutors || "",
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