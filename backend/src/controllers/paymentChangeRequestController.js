import { Op } from "sequelize";
import { movePaymentCloneWithDateToTrash } from "../utils/syncPaymentClonewithdateToTrash.js";

const REVIEW_ROLES = new Set(["admin", "hod"]);
const APPROVE_ROLES = new Set(["admin"]);
const DEFAULT_MODULE_NAME = "payment_sheet_with_date";
const REQUEST_TTL_DAYS = Number(process.env.PAYMENT_CHANGE_REQUEST_TTL_DAYS || 10);

const PAYMENT_ALLOWED_FIELDS = [
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

function canReview(role) {
  return REVIEW_ROLES.has(String(role || "").toLowerCase());
}

function canApprove(role) {
  return APPROVE_ROLES.has(String(role || "").toLowerCase());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pickAllowedPaymentFields(body = {}) {
  const out = {};
  for (const key of PAYMENT_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      out[key] = body[key];
    }
  }
  return out;
}

function normalizePaymentPayload(body = {}) {
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

  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.created_at;
  delete data.updated_at;

  return data;
}

function getRequestTargetId(request) {
  return (
    request?.paymentCloneId ??
    request?.beforeData?.id ??
    request?.afterData?.id ??
    null
  );
}

function normalizeChangedColumns(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
}

async function getNextOrderIndex(PaymentClone, transaction) {
  const lastRow = await PaymentClone.findOne({
    order: [["orderIndex", "DESC"]],
    transaction,
  });

  return lastRow ? Number(lastRow.orderIndex || 0) + 1 : 0;
}

export function makePaymentChangeRequestController({
  PaymentClone,
  PaymentCloneTrash,
  PaymentChangeRequest,
}) {
  return {
    async createRequest(req, res) {
      try {
        const {
          moduleName = DEFAULT_MODULE_NAME,
          actionType,
          paymentCloneId = null,
          changedColumns = [],
          beforeData = null,
          afterData = null,
          metadata = null,
        } = req.body || {};

        if (!["create", "update", "delete", "reorder"].includes(actionType)) {
          return res.status(400).json({ message: "Invalid actionType" });
        }

        const normalizedBefore =
          beforeData && typeof beforeData === "object"
            ? normalizePaymentPayload(pickAllowedPaymentFields(beforeData))
            : null;

        const normalizedAfter =
          afterData && typeof afterData === "object"
            ? normalizePaymentPayload(pickAllowedPaymentFields(afterData))
            : null;

        const item = await PaymentChangeRequest.create({
          moduleName,
          paymentCloneId:
            paymentCloneId ??
            normalizedBefore?.id ??
            normalizedAfter?.id ??
            null,
          actionType,
          actorUserId: req.user.id,
          actorRole: req.user.role,
          actorName: req.user.name || null,
          actorEmail: req.user.email || null,
          requestStatus: "pending",
          changedColumns: normalizeChangedColumns(changedColumns),
          beforeData: normalizedBefore,
          afterData: normalizedAfter,
          metadata: metadata && typeof metadata === "object" ? metadata : null,
          expiresAt: addDays(new Date(), REQUEST_TTL_DAYS),
        });

        return res.status(201).json({
          success: true,
          message: "Request submitted for admin approval",
          item,
        });
      } catch (err) {
        console.error("PAYMENT CHANGE REQUEST CREATE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to create payment change request",
        });
      }
    },

    async summary(req, res) {
      if (!canReview(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const pendingCount = await PaymentChangeRequest.count({
          where: {
            moduleName: DEFAULT_MODULE_NAME,
            requestStatus: "pending",
            expiresAt: {
              [Op.gt]: new Date(),
            },
          },
        });

        return res.json({
          pending_count: pendingCount,
        });
      } catch (err) {
        console.error("PAYMENT CHANGE REQUEST SUMMARY ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to fetch change request summary",
        });
      }
    },

    async listPending(req, res) {
      if (!canReview(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const items = await PaymentChangeRequest.findAll({
          where: {
            moduleName: DEFAULT_MODULE_NAME,
            requestStatus: "pending",
            expiresAt: {
              [Op.gt]: new Date(),
            },
          },
          order: [["created_at", "DESC"]],
        });

        return res.json({ items });
      } catch (err) {
        console.error("PAYMENT CHANGE REQUEST LIST PENDING ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to fetch pending change requests",
        });
      }
    },

    async listHistory(req, res) {
      if (!canReview(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const limit = Math.min(Math.max(Number(req.query?.limit || 50), 1), 500);
        const paymentCloneIdRaw = req.query?.payment_clone_id ?? req.query?.paymentCloneId;
        const requestStatus = String(req.query?.request_status || "").trim().toLowerCase();

        const where = {
          moduleName: DEFAULT_MODULE_NAME,
        };

        if (paymentCloneIdRaw !== undefined && paymentCloneIdRaw !== null && paymentCloneIdRaw !== "") {
          const parsedPaymentCloneId = Number(paymentCloneIdRaw);
          where.paymentCloneId = Number.isFinite(parsedPaymentCloneId)
            ? parsedPaymentCloneId
            : paymentCloneIdRaw;
        }

        if (["pending", "approved", "rejected", "expired"].includes(requestStatus)) {
          where.requestStatus = requestStatus;
        }

        const items = await PaymentChangeRequest.findAll({
          where,
          order: [["created_at", "DESC"]],
          limit,
        });

        return res.json({ items });
      } catch (err) {
        console.error("PAYMENT CHANGE REQUEST LIST HISTORY ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to fetch change request history",
        });
      }
    },

    async approveRequest(req, res) {
      if (!canApprove(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const transaction = await PaymentClone.sequelize.transaction();

      try {
        const request = await PaymentChangeRequest.findByPk(req.params.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!request) {
          await transaction.rollback();
          return res.status(404).json({ message: "Request not found" });
        }

        if (request.requestStatus !== "pending") {
          await transaction.rollback();
          return res.status(400).json({ message: "Request is already processed" });
        }

        if (new Date(request.expiresAt).getTime() <= Date.now()) {
          await request.destroy({ transaction });
          await transaction.commit();
          return res.status(410).json({ message: "Request already expired and removed" });
        }

        let appliedItem = null;

        if (request.actionType === "create") {
          const payload = normalizePaymentPayload(
            pickAllowedPaymentFields(request.afterData || {})
          );

          if (
            payload.orderIndex === undefined ||
            payload.orderIndex === null ||
            payload.orderIndex === ""
          ) {
            payload.orderIndex = await getNextOrderIndex(PaymentClone, transaction);
          }

          if (!payload.tuitionId) {
            payload.tuitionId = `approved-${Date.now()}`;
          }

          appliedItem = await PaymentClone.create(payload, { transaction });

          await request.update(
            {
              paymentCloneId: appliedItem.id,
              requestStatus: "approved",
              approvedBy: req.user.id,
              approvedAt: new Date(),
              reviewNote: req.body?.review_note || null,
            },
            { transaction }
          );
        } else if (request.actionType === "update") {
          const targetId = getRequestTargetId(request);

          if (!targetId) {
            await transaction.rollback();
            return res.status(400).json({ message: "Target row id is missing in request" });
          }

          const row = await PaymentClone.findByPk(targetId, { transaction });
          if (!row) {
            await transaction.rollback();
            return res.status(404).json({ message: "Payment row not found" });
          }

          const patch = normalizePaymentPayload(
            pickAllowedPaymentFields(request.afterData || {})
          );

          await row.update(patch, { transaction });
          appliedItem = row;

          await request.update(
            {
              requestStatus: "approved",
              approvedBy: req.user.id,
              approvedAt: new Date(),
              reviewNote: req.body?.review_note || null,
            },
            { transaction }
          );
        } else if (request.actionType === "delete") {
          const targetId = getRequestTargetId(request);

          if (!targetId) {
            await transaction.rollback();
            return res.status(400).json({ message: "Target row id is missing in request" });
          }

          const moved = await movePaymentCloneWithDateToTrash({
            PaymentClone,
            PaymentCloneTrash,
            id: targetId,
            transaction,
          });

          if (!moved) {
            await transaction.rollback();
            return res.status(404).json({ message: "Payment row not found" });
          }

          await request.update(
            {
              requestStatus: "approved",
              approvedBy: req.user.id,
              approvedAt: new Date(),
              reviewNote: req.body?.review_note || null,
            },
            { transaction }
          );
        } else if (request.actionType === "reorder") {
          const items = Array.isArray(request.metadata?.afterOrder)
            ? request.metadata.afterOrder
            : [];

          for (const entry of items) {
            const id = entry.id ?? entry.paymentId ?? entry.rowId;
            if (id === undefined || id === null) continue;

            await PaymentClone.update(
              { orderIndex: Number(entry.orderIndex) || 0 },
              { where: { id }, transaction }
            );
          }

          await request.update(
            {
              requestStatus: "approved",
              approvedBy: req.user.id,
              approvedAt: new Date(),
              reviewNote: req.body?.review_note || null,
            },
            { transaction }
          );
        }

        await transaction.commit();

        return res.json({
          success: true,
          message: "Change request approved successfully",
          item: appliedItem,
        });
      } catch (err) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        console.error("PAYMENT CHANGE REQUEST APPROVE ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to approve change request",
        });
      }
    },

    async rejectRequest(req, res) {
      if (!canApprove(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const request = await PaymentChangeRequest.findByPk(req.params.id);

        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        if (request.requestStatus !== "pending") {
          return res.status(400).json({ message: "Request is already processed" });
        }

        await request.update({
          requestStatus: "rejected",
          reviewNote: req.body?.review_note || null,
          rejectedBy: req.user.id,
          rejectedAt: new Date(),
        });

        return res.json({
          success: true,
          message: "Change request rejected successfully",
        });
      } catch (err) {
        console.error("PAYMENT CHANGE REQUEST REJECT ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to reject change request",
        });
      }
    },

    async cleanupExpired(req, res) {
      if (!canApprove(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const deletedCount = await PaymentChangeRequest.destroy({
          where: {
            moduleName: DEFAULT_MODULE_NAME,
            requestStatus: "pending",
            expiresAt: {
              [Op.lte]: new Date(),
            },
          },
        });

        return res.json({
          success: true,
          deleted_count: deletedCount,
          message: "Expired pending requests removed successfully",
        });
      } catch (err) {
        console.error("PAYMENT CHANGE REQUEST CLEANUP ERROR:", err);
        return res.status(500).json({
          message: err?.message || "Failed to cleanup expired requests",
        });
      }
    },
  };
}