import { movePaymentCloneWithDateToTrash } from "../utils/syncPaymentClonewithdateToTrash.js";

function toPlain(instanceOrObject) {
  if (!instanceOrObject) return null;
  if (typeof instanceOrObject.get === "function") {
    return instanceOrObject.get({ plain: true });
  }
  return JSON.parse(JSON.stringify(instanceOrObject));
}

function valuesAreSame(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}


function normalizeStatusValue(value) {
  if (Array.isArray(value)) {
    const clean = [...new Set(value.map((v) => String(v || "").trim()).filter(Boolean))];
    return clean.length ? clean.join(", ") : null;
  }

  const clean = [
    ...new Set(
      String(value || "")
        .split(/[|,]/)
        .map((v) => v.trim())
        .filter(Boolean)
    ),
  ];

  return clean.length ? clean.join(", ") : null;
}

const PAKISTAN_TIME_ZONE = "Asia/Karachi";

function getPakistanDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value || String(new Date().getFullYear()),
    month: parts.find((part) => part.type === "month")?.value || String(new Date().getMonth() + 1).padStart(2, "0"),
    day: parts.find((part) => part.type === "day")?.value || "01",
  };
}

function getPakistanMonthStartDateString(date = new Date()) {
  const { year, month } = getPakistanDateParts(date);
  return `${year}-${month}-01`;
}

function toMonthStartDateString(value, fallback = getPakistanMonthStartDateString()) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const isoMatch = raw.match(/\b(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = String(Number(isoMatch[2])).padStart(2, "0");
    return `${year}-${month}-01`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const { year, month } = getPakistanDateParts(parsed);
    return `${year}-${month}-01`;
  }

  return fallback;
}

function statusHasTuitionCancelled(value) {
  return String(normalizeStatusValue(value) || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .includes("tuition cancelled");
}

function applyPaymentCycleFields(payload = {}, beforeData = null) {
  const currentCycleDate = getPakistanMonthStartDateString();
  const hasStatusPatch = Object.prototype.hasOwnProperty.call(payload, "status");
  const beforeCancelled = statusHasTuitionCancelled(beforeData?.status);
  const nextStatus = hasStatusPatch ? payload.status : beforeData?.status;
  const nextCancelled = statusHasTuitionCancelled(nextStatus);

  if (nextCancelled) {
    const frozenCycle =
      beforeCancelled && (beforeData?.paymentDate || beforeData?.date)
        ? toMonthStartDateString(beforeData.paymentDate || beforeData.date, currentCycleDate)
        : currentCycleDate;

    payload.paymentDate = frozenCycle;
    payload.date = frozenCycle;
    return payload;
  }

  payload.paymentDate = currentCycleDate;
  payload.date = currentCycleDate;
  return payload;
}

const FIELD_ALIASES = {
  paymentDate: "dateWithMonth",
  date: "dateWithMonth",
  dateWithMonth: "dateWithMonth",
  className: "subjects",
  subjects: "subjects",
  tutorShare: "tutorFee",
  tutorFee: "tutorFee",
  lacasShare: "lacasShare",
  totalFees: "totalFees",
  tuitionName: "tuitionName",
  totalStudents: "totalStudents",
  country: "country",
  tutorName: "tutorName",
  status: "status",
  feedback: "feedback",
  notes: "notes",
  tuitionId: "tuitionId",
  rowColor: "rowColor",
  tuitionNameColor: "tuitionNameColor",
  daysPerWeek: "daysPerWeek",
  orderIndex: "orderIndex",
};

function normalizeFieldKey(field) {
  return FIELD_ALIASES[String(field || "").trim()] || String(field || "").trim();
}

function readCellValue(row, key) {
  if (!row || !key) return null;
  switch (key) {
    case "dateWithMonth":
      return row.dateWithMonth ?? row.paymentDate ?? row.date ?? null;
    case "subjects":
      return row.subjects ?? row.className ?? null;
    case "tutorFee":
      return row.tutorFee ?? row.tutorShare ?? null;
    default:
      return row[key] ?? null;
  }
}

function buildRowSnapshot(actionType, beforeData = null, afterData = null) {
  const action = String(actionType || "update").toLowerCase();

  if (action === "delete") {
    return beforeData ? { ...beforeData } : {};
  }

  if (action === "create") {
    return afterData ? { ...afterData } : {};
  }

  return {
    ...(beforeData || {}),
    ...(afterData || {}),
  };
}

function buildChangedCellDetails(beforeData = null, afterData = null, changedColumns = []) {
  const details = {};

  for (const rawKey of changedColumns) {
    const key = normalizeFieldKey(rawKey);
    if (!key || details[key]) continue;

    details[key] = {
      key,
      before: readCellValue(beforeData, key),
      after: readCellValue(afterData, key),
    };
  }

  return details;
}

export function makePaymentCloneController({
  PaymentClone,
  PaymentCloneTrash,
  PaymentChangeRequest,
  User,
}) {
  const allowedFields = [
    "tuitionId",
    "paymentDate",
    "date",
    "dateWithMonth",
    "tuitionName",
    "totalStudents",
    "country",
    "subjects",
    "className",
    "tutorName",
    "tutorFee",
    "tutorShare",
    "lacasShare",
    "totalFees",
    "status",
    "feedback",
    "notes",
    "otmName",
    "syncFlag",
    "assignedStaffId",
    "isDeleted",
    "deletedFromTodayDemo",
    "assignedTo",
    "orderIndex",
    "rowColor",
    "tuitionNameColor",
    "daysPerWeek",
  ];

  function pickAllowed(body = {}) {
    const out = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        out[key] = body[key];
      }
    }
    return out;
  }

  function normalizePayload(body = {}) {
    const data = { ...body };

    if (
      Object.prototype.hasOwnProperty.call(data, "tutorShare") &&
      !Object.prototype.hasOwnProperty.call(data, "tutorFee")
    ) {
      data.tutorFee = data.tutorShare;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "className") &&
      !Object.prototype.hasOwnProperty.call(data, "subjects")
    ) {
      data.subjects = data.className;
    }

    if (Object.prototype.hasOwnProperty.call(data, "subjects")) {
      data.className = data.subjects;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "date") &&
      !Object.prototype.hasOwnProperty.call(data, "paymentDate")
    ) {
      data.paymentDate = data.date;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "paymentDate") &&
      !Object.prototype.hasOwnProperty.call(data, "date")
    ) {
      data.date = data.paymentDate;
    }

    if (Object.prototype.hasOwnProperty.call(data, "status")) {
      data.status = normalizeStatusValue(data.status);
    }

    const nullIfEmpty = [
      "paymentDate",
      "date",
      "dateWithMonth",
      "tuitionName",
      "country",
      "subjects",
      "className",
      "tutorName",
      "feedback",
      "notes",
      "otmName",
      "syncFlag",
      "assignedTo",
      "rowColor",
      "tuitionNameColor",
    ];

    const numberNullIfEmpty = [
      "totalStudents",
      "tutorFee",
      "lacasShare",
      "totalFees",
      "assignedStaffId",
      "orderIndex",
      "daysPerWeek",
    ];

    for (const key of nullIfEmpty) {
      if (data[key] === "") data[key] = null;
    }

    for (const key of numberNullIfEmpty) {
      if (data[key] === "") data[key] = null;
      if (data[key] !== null && data[key] !== undefined && data[key] !== "") {
        data[key] = Number(data[key]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "isDeleted")) {
      data.isDeleted = !!data.isDeleted;
    }

    if (Object.prototype.hasOwnProperty.call(data, "deletedFromTodayDemo")) {
      data.deletedFromTodayDemo = !!data.deletedFromTodayDemo;
    }

    delete data.tutorShare;
    return data;
  }

  function serializeRow(row) {
    const raw = toPlain(row);
    if (!raw) return null;

    const subjects = raw.subjects ?? raw.className ?? null;
    const tutorFee = raw.tutorFee ?? raw.tutorShare ?? null;
    const date = raw.date ?? raw.paymentDate ?? null;
    const paymentDate = raw.paymentDate ?? raw.date ?? null;
    const status = normalizeStatusValue(raw.status);

    return {
      id: raw.id ?? null,
      tuitionId: raw.tuitionId ?? null,
      paymentDate,
      date,
      dateWithMonth: raw.dateWithMonth ?? null,
      tuitionName: raw.tuitionName ?? null,
      totalStudents: raw.totalStudents ?? null,
      country: raw.country ?? null,
      subjects,
      className: subjects,
      tutorName: raw.tutorName ?? null,
      tutorFee,
      tutorShare: tutorFee,
      lacasShare: raw.lacasShare ?? null,
      totalFees: raw.totalFees ?? null,
      status,
      feedback: raw.feedback ?? null,
      notes: raw.notes ?? null,
      otmName: raw.otmName ?? null,
      syncFlag: raw.syncFlag ?? null,
      assignedStaffId: raw.assignedStaffId ?? null,
      isDeleted: !!raw.isDeleted,
      deletedFromTodayDemo: !!raw.deletedFromTodayDemo,
      assignedTo: raw.assignedTo ?? null,
      orderIndex: raw.orderIndex ?? 0,
      rowColor: raw.rowColor ?? null,
      tuitionNameColor: raw.tuitionNameColor ?? null,
      daysPerWeek: raw.daysPerWeek ?? null,
      createdAt: raw.createdAt ?? raw.created_at ?? null,
      updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    };
  }

  function getChangedColumns(beforeData = null, afterData = null, explicitKeys = []) {
    const keys = new Set([
      ...allowedFields,
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {}),
      ...explicitKeys,
    ]);

    return [...keys]
      .filter((key) => key !== "id")
      .filter((key) => !valuesAreSame(beforeData?.[key], afterData?.[key]))
      .map((key) => normalizeFieldKey(key));
  }

  async function resolveActor(req) {
    const actor = {
      id: req.user?.id ?? null,
      role: req.user?.role ?? null,
      name: req.user?.name ?? null,
      email: req.user?.email ?? null,
    };

    if (!actor.id) return actor;
    if (actor.name && actor.email) return actor;
    if (!User) return actor;

    try {
      const dbUser = await User.findByPk(actor.id);
      if (dbUser) {
        actor.name = actor.name || dbUser.name || null;
        actor.email = actor.email || dbUser.email || null;
        actor.role = actor.role || dbUser.role || null;
      }
    } catch (err) {
      console.error("AUDIT ACTOR RESOLVE ERROR:", err);
    }

    return actor;
  }

  async function createAuditLog({
    req,
    actionType,
    paymentCloneId = null,
    changedColumns = [],
    beforeData = null,
    afterData = null,
    metadata = null,
  }) {
    if (!PaymentChangeRequest) return;

    const actor = await resolveActor(req);
    if (!actor.id) return;

    try {
      await PaymentChangeRequest.create({
        moduleName: "payment_sheet_with_date",
        paymentCloneId,
        actionType,
        actorUserId: actor.id,
        actorRole: actor.role || "staff",
        actorName: actor.name || actor.email || `User-${actor.id}`,
        actorEmail: actor.email || null,
        requestStatus: "approved",
        changedColumns,
        beforeData,
        afterData,
        metadata,
        expiresAt: new Date("2099-12-31T23:59:59.000Z"),
      });
    } catch (err) {
      console.error("PAYMENT AUDIT LOG ERROR:", err);
    }
  }

  function buildAuditMetadata({ actionType, rowId = null, beforeData = null, afterData = null, message }) {
    const snapshot = buildRowSnapshot(actionType, beforeData, afterData);
    const changedColumns = getChangedColumns(beforeData, afterData, []);

    return {
      historyLabel:
        actionType === "create"
          ? "Create Row"
          : actionType === "delete"
            ? "Delete Row"
            : actionType === "restore"
              ? "Restore Row"
              : actionType === "reorder"
                ? "Reorder Rows"
                : "Update Row",
      message,
      historyRowId: rowId,
      originalPaymentCloneId: rowId,
      tuitionId: snapshot?.tuitionId ?? beforeData?.tuitionId ?? afterData?.tuitionId ?? null,
      tuitionName: snapshot?.tuitionName ?? beforeData?.tuitionName ?? afterData?.tuitionName ?? null,
      dateWithMonth:
        snapshot?.dateWithMonth ??
        snapshot?.paymentDate ??
        beforeData?.dateWithMonth ??
        beforeData?.paymentDate ??
        afterData?.dateWithMonth ??
        afterData?.paymentDate ??
        null,
      rowSnapshot: snapshot,
      changedCellDetails: buildChangedCellDetails(beforeData, afterData, changedColumns),
    };
  }

  async function syncCurrentPakistanPaymentCycle() {
    const rows = await PaymentClone.findAll();
    const currentCycleDate = getPakistanMonthStartDateString();

    for (const row of rows) {
      const raw = toPlain(row);
      const cancelled = statusHasTuitionCancelled(raw?.status);
      let nextCycleDate = currentCycleDate;

      if (cancelled) {
        nextCycleDate = toMonthStartDateString(
          raw?.paymentDate || raw?.date || raw?.createdAt || raw?.created_at || raw?.updatedAt || raw?.updated_at,
          currentCycleDate
        );
      }

      const currentPaymentDate = raw?.paymentDate || raw?.payment_date || null;
      const currentDate = raw?.date || null;

      if (currentPaymentDate !== nextCycleDate || currentDate !== nextCycleDate) {
        await row.update({ paymentDate: nextCycleDate, date: nextCycleDate }, { silent: true });
      }
    }
  }

  return {
    async list(req, res) {
      try {
        await syncCurrentPakistanPaymentCycle();
        const rows = await PaymentClone.findAll({
          order: [
            ["orderIndex", "ASC"],
            ["updated_at", "DESC"],
          ],
        });
        return res.json({ items: rows.map(serializeRow) });
      } catch (err) {
        console.error("PAYMENT CLONE LIST ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error fetching payment clone rows",
        });
      }
    },

    async create(req, res) {
      try {
        const payload = applyPaymentCycleFields(normalizePayload(pickAllowed(req.body)), null);

        let orderIndex = payload.orderIndex;
        if (orderIndex === undefined || orderIndex === null || orderIndex === "") {
          const lastRow = await PaymentClone.findOne({
            order: [["orderIndex", "DESC"]],
          });
          orderIndex = lastRow ? Number(lastRow.orderIndex || 0) + 1 : 0;
        }

        payload.orderIndex = orderIndex;
        if (!payload.tuitionId) {
          payload.tuitionId = `manual-${Date.now()}`;
        }

        const item = await PaymentClone.create(payload);
        const afterData = serializeRow(item);

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: item.id,
          changedColumns: getChangedColumns(null, afterData, Object.keys(payload)),
          beforeData: null,
          afterData,
          metadata: buildAuditMetadata({
            actionType: "create",
            rowId: item.id,
            beforeData: null,
            afterData,
            message: "Row created directly in payment sheet",
          }),
        });

        return res.json({ item: afterData });
      } catch (err) {
        console.error("PAYMENT CLONE CREATE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error creating payment clone row",
        });
      }
    },

    async update(req, res) {
      try {
        const { id } = req.params;
        const row = await PaymentClone.findByPk(id);

        if (!row) {
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        const beforeData = serializeRow(row);
        const payload = applyPaymentCycleFields(normalizePayload(pickAllowed(req.body)), beforeData);

        await row.update(payload);

        const afterData = serializeRow(row);
        const changedColumns = getChangedColumns(beforeData, afterData, Object.keys(payload));

        if (changedColumns.length) {
          await createAuditLog({
            req,
            actionType: "update",
            paymentCloneId: row.id,
            changedColumns,
            beforeData,
            afterData,
            metadata: buildAuditMetadata({
              actionType: "update",
              rowId: row.id,
              beforeData,
              afterData,
              message: "Row updated directly in payment sheet",
            }),
          });
        }

        return res.json({ success: true, item: afterData });
      } catch (err) {
        console.error("PAYMENT CLONE UPDATE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error updating payment clone row",
        });
      }
    },

    async remove(req, res) {
      const transaction = await PaymentClone.sequelize.transaction();

      try {
        const { id } = req.params;

        const row = await PaymentClone.findByPk(id, { transaction });
        if (!row) {
          await transaction.rollback();
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        const beforeData = serializeRow(row);

        const moved = await movePaymentCloneWithDateToTrash({
          PaymentClone,
          PaymentCloneTrash,
          id,
          transaction,
        });

        if (!moved) {
          await transaction.rollback();
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        await transaction.commit();

        await createAuditLog({
          req,
          actionType: "delete",
          paymentCloneId: null,
          changedColumns: getChangedColumns(beforeData, null, Object.keys(beforeData || {})),
          beforeData,
          afterData: null,
          metadata: buildAuditMetadata({
            actionType: "delete",
            rowId: row.id,
            beforeData,
            afterData: null,
            message: "Row deleted from payment sheet and moved to trash",
          }),
        });

        return res.json({
          success: true,
          message: "Payment clone row moved to trash",
        });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE DELETE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error deleting payment clone row",
        });
      }
    },

    async reorder(req, res) {
      try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        const currentRows = await PaymentClone.findAll({
          attributes: ["id", "orderIndex"],
          order: [["orderIndex", "ASC"]],
        });

        const beforeOrder = currentRows.map((row) => ({
          id: row.id,
          orderIndex: Number(row.orderIndex) || 0,
        }));

        for (const entry of items) {
          const id = entry.id ?? entry.paymentId ?? entry.rowId;
          if (id === undefined || id === null) continue;

          await PaymentClone.update(
            { orderIndex: Number(entry.orderIndex) || 0 },
            { where: { id } }
          );
        }

        const updatedRows = await PaymentClone.findAll({
          attributes: ["id", "orderIndex"],
          order: [["orderIndex", "ASC"]],
        });

        const afterOrder = updatedRows.map((row) => ({
          id: row.id,
          orderIndex: Number(row.orderIndex) || 0,
        }));

        if (!valuesAreSame(beforeOrder, afterOrder)) {
          await createAuditLog({
            req,
            actionType: "reorder",
            paymentCloneId: null,
            changedColumns: ["orderIndex"],
            beforeData: null,
            afterData: null,
            metadata: {
              historyLabel: "Reorder Rows",
              beforeOrder,
              afterOrder,
              message: "Rows reordered in payment sheet",
            },
          });
        }

        return res.json({ success: true, message: "Reordered successfully" });
      } catch (err) {
        console.error("PAYMENT CLONE REORDER ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error reordering payment clone rows",
        });
      }
    },

    async listTrash(req, res) {
      try {
        const rows = await PaymentCloneTrash.findAll({
          order: [["updated_at", "DESC"]],
        });

        return res.json({ items: rows.map(serializeRow) });
      } catch (err) {
        console.error("PAYMENT CLONE TRASH LIST ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error fetching payment clone trash rows",
        });
      }
    },

    async restoreTrash(req, res) {
      const transaction = await PaymentClone.sequelize.transaction();

      try {
        const { id } = req.params;

        const trashRow = await PaymentCloneTrash.findByPk(id, { transaction });
        if (!trashRow) {
          await transaction.rollback();
          return res.status(404).json({ message: "Trash row not found" });
        }

        const payload = normalizePayload({
          tuitionId: trashRow.tuitionId || `restored-${Date.now()}-${trashRow.id}`,
          paymentDate: trashRow.paymentDate ?? trashRow.date ?? null,
          date: trashRow.date ?? trashRow.paymentDate ?? null,
          dateWithMonth: trashRow.dateWithMonth ?? null,
          tuitionName: trashRow.tuitionName ?? null,
          totalStudents: trashRow.totalStudents ?? null,
          country: trashRow.country ?? null,
          subjects: trashRow.subjects ?? trashRow.className ?? null,
          className: trashRow.subjects ?? trashRow.className ?? null,
          tutorName: trashRow.tutorName ?? null,
          tutorFee: trashRow.tutorFee ?? trashRow.tutorShare ?? null,
          lacasShare: trashRow.lacasShare ?? null,
          totalFees: trashRow.totalFees ?? null,
          status: trashRow.status ?? null,
          feedback: trashRow.feedback ?? null,
          notes: trashRow.notes ?? null,
          otmName: trashRow.otmName ?? null,
          syncFlag: trashRow.syncFlag ?? null,
          assignedStaffId: trashRow.assignedStaffId ?? null,
          deletedFromTodayDemo: !!trashRow.deletedFromTodayDemo,
          assignedTo: trashRow.assignedTo ?? null,
          orderIndex: trashRow.orderIndex ?? 0,
          rowColor: trashRow.rowColor ?? null,
          tuitionNameColor: trashRow.tuitionNameColor ?? null,
          daysPerWeek: trashRow.daysPerWeek ?? 0,
        });

        const restored = await PaymentClone.create(payload, { transaction });
        await trashRow.destroy({ transaction });
        await transaction.commit();

        const afterData = serializeRow(restored);

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: restored.id,
          changedColumns: getChangedColumns(null, afterData, Object.keys(payload)),
          beforeData: null,
          afterData,
          metadata: {
            ...buildAuditMetadata({
              actionType: "restore",
              rowId: restored.id,
              beforeData: null,
              afterData,
              message: "Row restored from trash to payment sheet",
            }),
            restoredFromTrashId: trashRow.id,
          },
        });

        return res.json({
          success: true,
          item: afterData,
          message: "Trash row restored successfully",
        });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE RESTORE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error restoring trash row",
        });
      }
    },

    async forceDeleteTrash(req, res) {
      try {
        const { id } = req.params;
        const row = await PaymentCloneTrash.findByPk(id);

        if (!row) {
          return res.status(404).json({ message: "Trash row not found" });
        }

        await row.destroy();

        return res.json({
          success: true,
          message: "Trash row permanently deleted",
        });
      } catch (err) {
        console.error("PAYMENT CLONE FORCE DELETE TRASH ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error deleting trash row permanently",
        });
      }
    },
  };
}
