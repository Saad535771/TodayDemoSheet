export async function movePaymentCloneTeamBWithDateToTrash({
  PaymentCloneTeamB,
  PaymentCloneTrashTeamB,
  id,
  transaction,
}) {
  const row = await PaymentCloneTeamB.findByPk(id, { transaction });
  if (!row) return false;
  const raw = typeof row.get === "function" ? row.get({ plain: true }) : row;
  await PaymentCloneTrashTeamB.create(
    {
      originalPaymentCloneTeamBId: raw.id,
      tuitionId: raw.tuitionId,
      paymentDate: raw.paymentDate,
      date: raw.date,
      dateWithMonth: raw.dateWithMonth,
      tuitionName: raw.tuitionName,
      totalStudents: raw.totalStudents,
      country: raw.country,
      subjects: raw.subjects,
      className: raw.className,
      tutorName: raw.tutorName,
      tutorFee: raw.tutorFee || raw.tutorShare,
      lacasShare: raw.lacasShare,
      totalFees: raw.totalFees,
      status: raw.status,
      feedback: raw.feedback,
      notes: raw.notes,
      otmName: raw.otmName,
      syncFlag: raw.syncFlag,
      assignedStaffId: raw.assignedStaffId,
      deletedFromTodayDemo: raw.deletedFromTodayDemo,
      assignedTo: raw.assignedTo,
      orderIndex: raw.orderIndex,
      rowColor: raw.rowColor,
      tuitionNameColor: raw.tuitionNameColor,
      daysPerWeek: raw.daysPerWeek,
    },
    { transaction }
  );
  await row.destroy({ transaction });
  return true;
}