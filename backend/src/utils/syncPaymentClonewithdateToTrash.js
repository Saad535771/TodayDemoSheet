export function buildPaymentCloneTrashPayload(item) {
  if (!item) return null;

  return {
    originalPaymentCloneId: item.id ?? null,
    tuitionId: item.tuitionId ?? null,
    paymentDate: item.paymentDate ?? null,
    dateWithMonth: item.dateWithMonth ?? null,
    tuitionName: item.tuitionName ?? null,
    country: item.country ?? null,
    className: item.className ?? null,
    tutorName: item.tutorName ?? null,
    tutorShare: item.tutorShare ?? null,
    lacasShare: item.lacasShare ?? null,
    totalFees: item.totalFees ?? null,
    status: item.status ?? null,
    feedback: item.feedback ?? null,
    otmName: item.otmName ?? null,
    syncFlag: item.syncFlag ?? null,
    assignedStaffId: item.assignedStaffId ?? null,
    deletedFromTodayDemo: item.deletedFromTodayDemo ?? false,
    assignedTo: item.assignedTo ?? null,
    orderIndex: item.orderIndex ?? 0,
    rowColor: item.rowColor ?? "#ffffff",
    tuitionNameColor: item.tuitionNameColor ?? "#ffffff",
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