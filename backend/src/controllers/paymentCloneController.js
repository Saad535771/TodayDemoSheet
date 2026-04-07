import { movePaymentCloneWithDateToTrash } from "../utils/syncPaymentClonewithdateToTrash.js";

function toPlain(instanceOrObject) {
  if (!instanceOrObject) return null;
  if (typeof instanceOrObject.get === "function") {
    return instanceOrObject.get({ plain: true });
  }
  return JSON.parse(JSON.stringify(instanceOrObject));
}

function valuesAreSame(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function makePaymentCloneController({
  PaymentClone,
  PaymentCloneTrash,
  PaymentChangeRequest,
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
    ];

    const numberNullIfEmpty = [
      "tutorShare",
      "lacasShare",
      "totalFees",
      "assignedStaffId",
      "orderIndex",
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

    try {
      await PaymentChangeRequest.create({
        moduleName: "payment_sheet_with_date",
        paymentCloneId,
        actionType,
        actorUserId: req.user?.id || null,
        actorRole: req.user?.role || null,
        actorName: req.user?.name || null,
        actorEmail: req.user?.email || null,
        requestStatus: "approved",
        changedColumns,
        beforeData,
        afterData,
        metadata,
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
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

        res.json({ items });
      } catch (err) {
        console.error("PAYMENT CLONE LIST ERROR:", err);
        res.status(500).json({
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
        const afterData = toPlain(item);

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: item.id,
          changedColumns: Object.keys(payload),
          beforeData: null,
          afterData,
          metadata: {
            message: "Row created directly in payment sheet",
          },
        });

        res.json({ item });
      } catch (err) {
        console.error("PAYMENT CLONE CREATE ERROR:", err);
        res.status(500).json({
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

        const beforeData = toPlain(row);
        const payload = normalizePayload(pickAllowed(req.body));

        await row.update(payload);

        const afterData = toPlain(row);
        const changedColumns = Object.keys(payload).filter(
          (key) => !valuesAreSame(beforeData?.[key], afterData?.[key])
        );

        if (changedColumns.length) {
          await createAuditLog({
            req,
            actionType: "update",
            paymentCloneId: row.id,
            changedColumns,
            beforeData,
            afterData,
            metadata: {
              message: "Row updated directly in payment sheet",
            },
          });
        }

        res.json({ success: true, item: row });
      } catch (err) {
        console.error("PAYMENT CLONE UPDATE ERROR:", err);
        res.status(500).json({
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

        const beforeData = toPlain(row);

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
          changedColumns: Object.keys(beforeData || {}),
          beforeData,
          afterData: null,
          metadata: {
            message: "Row deleted from payment sheet and moved to trash",
          },
        });

        res.json({
          success: true,
          message: "Payment clone row moved to trash",
        });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE DELETE ERROR:", err);
        res.status(500).json({
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
              beforeOrder,
              afterOrder,
              message: "Rows reordered in payment sheet",
            },
          });
        }

        res.json({ success: true, message: "Reordered successfully" });
      } catch (err) {
        console.error("PAYMENT CLONE REORDER ERROR:", err);
        res.status(500).json({
          message: err?.message || "Error reordering payment clone rows",
        });
      }
    },

    async listTrash(req, res) {
      try {
        const items = await PaymentCloneTrash.findAll({
          order: [["created_at", "DESC"]],
        });

        res.json({ items });
      } catch (err) {
        console.error("PAYMENT CLONE TRASH LIST ERROR:", err);
        res.status(500).json({ message: "Error fetching payment clone trash" });
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
          tuitionId:
            trashRow.tuitionId || `restored-${Date.now()}-${trashRow.id}`,
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
        };

        const restored = await PaymentClone.create(payload, { transaction });
        await trashRow.destroy({ transaction });

        await transaction.commit();

        await createAuditLog({
          req,
          actionType: "create",
          paymentCloneId: restored.id,
          changedColumns: Object.keys(payload),
          beforeData: null,
          afterData: toPlain(restored),
          metadata: {
            message: "Row restored from trash to payment sheet",
            restoredFromTrashId: id,
          },
        });

        res.json({ success: true, message: "Payment clone row restored" });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CLONE TRASH RESTORE ERROR:", err);
        res.status(500).json({
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

        res.json({
          success: true,
          message: "Payment clone trash row permanently deleted",
        });
      } catch (err) {
        console.error("PAYMENT CLONE FORCE DELETE ERROR:", err);
        res.status(500).json({
          message: err?.message || "Error deleting trash row permanently",
        });
      }
    },
  };
}