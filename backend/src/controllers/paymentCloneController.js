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

export function makePaymentCloneController({
  PaymentClone,
  PaymentCloneTrash,
  PaymentChangeRequest,
  User,
}) {
  const allowedFields = [
    "tuitionId",
    "paymentDate",
    "dateWithMonth",
    "tuitionName",
    "country",
    "className",
    "tutorName",
    "tutorShare",
    "lacasShare",
    "totalFees",
    "status",
    "feedback",
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
    "date",
    "notes",
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

    const nullIfEmpty = [
      "paymentDate",
      "dateWithMonth",
      "tuitionName",
      "country",
      "className",
      "tutorName",
      "feedback",
      "otmName",
      "syncFlag",
      "assignedTo",
      "rowColor",
      "tuitionNameColor",
      "date",
      "notes",
    ];

    const numberNullIfEmpty = [
      "tutorShare",
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

    return data;
  }

  function serializeRow(row) {
    const raw = toPlain(row);
    if (!raw) return null;

    return {
      id: raw.id ?? null,
      tuitionId: raw.tuitionId ?? null,
      paymentDate: raw.paymentDate ?? null,
      dateWithMonth: raw.dateWithMonth ?? null,
      tuitionName: raw.tuitionName ?? null,
      country: raw.country ?? null,
      className: raw.className ?? null,
      tutorName: raw.tutorName ?? null,
      tutorShare: raw.tutorShare ?? null,
      lacasShare: raw.lacasShare ?? null,
      totalFees: raw.totalFees ?? null,
      status: raw.status ?? null,
      feedback: raw.feedback ?? null,
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
      date: raw.date ?? null,
      notes: raw.notes ?? null,
    };
  }

  function getChangedColumns(beforeData = null, afterData = null, explicitKeys = []) {
    const keys = new Set([
      ...allowedFields,
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {}),
      ...explicitKeys,
    ]);

    return [...keys].filter((key) => {
      if (key === "id") return false;
      return !valuesAreSame(beforeData?.[key], afterData?.[key]);
    });
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

  return {
    async list(req, res) {
      try {
        const items = await PaymentClone.findAll({
          order: [
            ["orderIndex", "ASC"],
            ["updated_at", "DESC"],
          ],
        });

        return res.json({ items });
      } catch (err) {
        console.error("PAYMENT CLONE LIST ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error fetching payment clone rows",
        });
      }
    },

    async create(req, res) {
      try {
        const payload = normalizePayload(pickAllowed(req.body));

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
          metadata: {
            historyLabel: "Create Row",
            message: "Row created directly in payment sheet",
          },
        });

        return res.json({ item });
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
        const payload = normalizePayload(pickAllowed(req.body));

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
            metadata: {
              historyLabel: "Update Row",
              message: "Row updated directly in payment sheet",
            },
          });
        }

        return res.json({ success: true, item: row });
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
          paymentCloneId: row.id,
          changedColumns: getChangedColumns(beforeData, null, Object.keys(beforeData || {})),
          beforeData,
          afterData: null,
          metadata: {
            historyLabel: "Delete Row",
            message: "Row deleted from payment sheet and moved to trash",
          },
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
        const items = await PaymentCloneTrash.findAll({
          order: [["updated_at", "DESC"]],
        });

        return res.json({ items });
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

        const payload = {
          tuitionId: trashRow.tuitionId || `restored-${Date.now()}-${trashRow.id}`,
          paymentDate: trashRow.paymentDate,
          dateWithMonth: trashRow.dateWithMonth,
          tuitionName: trashRow.tuitionName,
          country: trashRow.country,
          className: trashRow.className,
          tutorName: trashRow.tutorName,
          tutorShare: trashRow.tutorShare,
          lacasShare: trashRow.lacasShare,
          totalFees: trashRow.totalFees,
          status: trashRow.status || "Tuition Pending",
          feedback: trashRow.feedback,
          otmName: trashRow.otmName,
          syncFlag: trashRow.syncFlag,
          assignedStaffId: trashRow.assignedStaffId,
          deletedFromTodayDemo: trashRow.deletedFromTodayDemo,
          assignedTo: trashRow.assignedTo,
          orderIndex: trashRow.orderIndex ?? 0,
          rowColor: trashRow.rowColor,
          tuitionNameColor: trashRow.tuitionNameColor,
          daysPerWeek: trashRow.daysPerWeek ?? 0,
          date: trashRow.date ?? null,
          notes: trashRow.notes ?? null,
        };

        const restored = await PaymentClone.create(payload, { transaction });
        await trashRow.destroy({ transaction });

        await transaction.commit();

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: restored.id,
          changedColumns: getChangedColumns(null, serializeRow(restored), Object.keys(payload)),
          beforeData: null,
          afterData: serializeRow(restored),
          metadata: {
            historyLabel: "Restore Row",
            message: "Row restored from trash to payment sheet",
            restoredFromTrashId: id,
          },
        });

        return res.json({ success: true, message: "Payment clone row restored" });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE TRASH RESTORE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error restoring payment clone row",
        });
      }
    },

    async forceDeleteTrash(req, res) {
      try {
        const { id } = req.params;

        const deleted = await PaymentCloneTrash.destroy({ where: { id } });
        if (!deleted) {
          return res.status(404).json({ message: "Trash row not found" });
        }

        return res.json({
          success: true,
          message: "Payment clone trash row permanently deleted",
        });
      } catch (err) {
        console.error("PAYMENT CLONE FORCE DELETE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Error deleting trash row permanently",
        });
      }
    },
  };
}