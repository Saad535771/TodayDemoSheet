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

function normalizeStatusList(value) {
  if (Array.isArray(value)) {
    return [
      ...new Set(value.map((entry) => normalizeStatus(entry)).filter(Boolean)),
    ];
  }

  if (value === null || value === undefined) return [];

  const raw = String(value).trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [
          ...new Set(parsed.map((entry) => normalizeStatus(entry)).filter(Boolean)),
        ];
      }
    } catch (error) {
      // ignore and fall back to comma-separated parsing
    }
  }

  return [
    ...new Set(
      raw
        .split(",")
        .map((entry) => normalizeStatus(entry))
        .filter(Boolean)
    ),
  ];
}

function hasStatus(value, targetStatus) {
  return normalizeStatusList(value).includes(normalizeStatus(targetStatus));
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
  const tuitionId = item?.tuitionId || "";
  if (!tuitionId) return null;

  const existing = await Payment.findOne({
    where: { tuitionId },
  });

  const isTuitionDone = hasStatus(item?.status, "Tuition Done");

  if (!isTuitionDone) {
    if (existing) {
      await existing.destroy();
    }
    return null;
  }

  const totalFee = toNumberOrNull(
    item.estimatedFee ?? item.totalFee ?? item.totalFees
  );

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
    lacasShare,
    totalFee,
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