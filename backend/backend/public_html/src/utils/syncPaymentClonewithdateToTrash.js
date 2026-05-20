export function buildPaymentCloneTrashPayload(item) {
  if (!item) return null;

  return {
    originalPaymentCloneId: item.id ?? null,
    tuitionId: item.tuitionId ?? null,
    paymentDate: item.paymentDate ?? item.date ?? null,
    date: item.date ?? item.paymentDate ?? null,
    dateWithMonth: item.dateWithMonth ?? null,
    tuitionName: item.tuitionName ?? null,
    totalStudents: item.totalStudents ?? null,
    country: item.country ?? null,
    subjects: item.subjects ?? item.className ?? null,
    className: item.subjects ?? item.className ?? null,
    tutorName: item.tutorName ?? null,
    tutorFee: item.tutorFee ?? item.tutorShare ?? null,
    lacasShare: item.lacasShare ?? null,
    totalFees: item.totalFees ?? null,
    status: item.status ?? null,
    feedback: item.feedback ?? null,
    notes: item.notes ?? null,
    otmName: item.otmName ?? null,
    syncFlag: item.syncFlag ?? null,
    assignedStaffId: item.assignedStaffId ?? null,
    deletedFromTodayDemo: item.deletedFromTodayDemo ?? false,
    assignedTo: item.assignedTo ?? null,
    orderIndex: item.orderIndex ?? 0,
    rowColor: item.rowColor ?? "#ffffff",
    tuitionNameColor: item.tuitionNameColor ?? "#ffffff",
    daysPerWeek: item.daysPerWeek ?? 0,
  };
}

export async function movePaymentCloneWithDateToTrash({
  PaymentClone,
  PaymentCloneTrash,
  id,
  transaction,
}) {
  const row = await PaymentClone.findByPk(id, { transaction });

  if (!row) return null;

  const payload = buildPaymentCloneTrashPayload(row.toJSON());

  await PaymentCloneTrash.create(payload, { transaction });
  await row.destroy({ transaction });

  return row;
}