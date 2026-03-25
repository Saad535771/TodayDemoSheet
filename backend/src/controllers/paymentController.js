function toBool(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE"
  );
}

function toNullableInt(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableString(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str ? str : null;
}

function toNullableDate(value) {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}

function normalizePaymentPayload(payload = {}) {
  const data = { ...payload };

  // backward compatibility / aliases
  if (!("date" in data) && "paymentDate" in data) data.date = data.paymentDate;
  if (!("tuitionName" in data) && "tuition_name" in data) {
    data.tuitionName = data.tuition_name;
  }
  if (!("className" in data) && "class_name" in data) {
    data.className = data.class_name;
  }
  if (!("daysPerWeek" in data) && "days_per_week" in data) {
    data.daysPerWeek = data.days_per_week;
  }
  if (!("tutorName" in data) && "tutor_name" in data) {
    data.tutorName = data.tutor_name;
  }
  if (!("tutorFee" in data) && "tutor_fee" in data) {
    data.tutorFee = data.tutor_fee;
  }
  if (!("tutorFee" in data) && "tutorShare" in data) {
    data.tutorFee = data.tutorShare;
  }
  if (!("totalFee" in data) && "total_fee" in data) {
    data.totalFee = data.total_fee;
  }
  if (!("totalFee" in data) && "totalFees" in data) {
    data.totalFee = data.totalFees;
  }
  if (!("otmName" in data) && "otm_name" in data) {
    data.otmName = data.otm_name;
  }

  // normalize new payment fields
  if ("date" in data) data.date = toNullableDate(data.date);
  if ("tuitionId" in data) data.tuitionId = toNullableString(data.tuitionId);
  if ("tuitionName" in data) data.tuitionName = toNullableString(data.tuitionName);
  if ("country" in data) data.country = toNullableString(data.country);
  if ("className" in data) data.className = toNullableString(data.className);
  if ("daysPerWeek" in data) data.daysPerWeek = toNullableInt(data.daysPerWeek);
  if ("tutorName" in data) data.tutorName = toNullableString(data.tutorName);
  if ("tutorFee" in data) data.tutorFee = toNullableNumber(data.tutorFee);
  if ("lacasShare" in data) data.lacasShare = toNullableNumber(data.lacasShare);
  if ("totalFee" in data) data.totalFee = toNullableNumber(data.totalFee);
  if ("feedback" in data) data.feedback = toNullableString(data.feedback);
  if ("otmName" in data) data.otmName = toNullableString(data.otmName);
  if ("notes" in data) data.notes = toNullableString(data.notes);

  // existing internal fields
  if ("assignedTo" in data) data.assignedTo = toNullableString(data.assignedTo);
  if ("syncFlag" in data) data.syncFlag = toBool(data.syncFlag);
  if ("isDeleted" in data) data.isDeleted = toBool(data.isDeleted);
  if ("deletedFromTodayDemo" in data) {
    data.deletedFromTodayDemo = toBool(data.deletedFromTodayDemo);
  }

  if ("assignedStaffId" in data) {
    data.assignedStaffId = toNullableInt(data.assignedStaffId);
  }

  if ("orderIndex" in data) {
    const n = Number(data.orderIndex);
    data.orderIndex = Number.isFinite(n) ? n : 0;
  }

  if ("rowColor" in data) data.rowColor = toNullableString(data.rowColor);
  if ("tuitionNameColor" in data) {
    data.tuitionNameColor = toNullableString(data.tuitionNameColor);
  }

  // old alias keys remove
  delete data.paymentDate;
  delete data.tutorShare;
  delete data.totalFees;
  delete data.tuition_name;
  delete data.class_name;
  delete data.days_per_week;
  delete data.tutor_name;
  delete data.tutor_fee;
  delete data.total_fee;
  delete data.otm_name;

  return data;
}

export function makePaymentController({ Payment }) {
  return {
    async list(req, res) {
      try {
        const items = await Payment.findAll({
          order: [
            ["orderIndex", "ASC"],
            ["updatedAt", "DESC"],
          ],
        });

        res.json({ items });
      } catch (err) {
        console.error("PAYMENT LIST ERROR:", err);
        res.status(500).json({ message: "Error fetching payments" });
      }
    },

    async create(req, res) {
      try {
        const maxOrderIndex = await Payment.max("orderIndex");
        const nextOrderIndex = (maxOrderIndex ?? -1) + 1;

        const payload = normalizePaymentPayload({
          ...req.body,
          orderIndex:
            req.body?.orderIndex !== undefined &&
            req.body?.orderIndex !== null &&
            req.body?.orderIndex !== ""
              ? req.body.orderIndex
              : nextOrderIndex,
          syncFlag: req.body?.syncFlag ?? false,
          isDeleted: req.body?.isDeleted ?? false,
          deletedFromTodayDemo: req.body?.deletedFromTodayDemo ?? false,
        });

        const item = await Payment.create(payload);
        res.json({ item });
      } catch (err) {
        console.error("PAYMENT CREATE ERROR:", err);
        res.status(500).json({ message: "Error creating payment row" });
      }
    },

    async update(req, res) {
      try {
        const { id } = req.params;

        const row = await Payment.findByPk(id);
        if (!row) {
          return res.status(404).json({ message: "Payment row not found" });
        }

        const payload = normalizePaymentPayload(req.body);

        await row.update(payload);

        const freshRow = await Payment.findByPk(id);

        res.json({ success: true, item: freshRow });
      } catch (err) {
        console.error("PAYMENT UPDATE ERROR:", err);
        res.status(500).json({ message: "Error updating payment row" });
      }
    },

    async reorder(req, res) {
      const transaction = await Payment.sequelize.transaction();

      try {
        const list = Array.isArray(req.body?.items) ? req.body.items : [];

        if (!list.length) {
          await transaction.rollback();
          return res.status(400).json({ message: "No reorder items received" });
        }

        for (const entry of list) {
          const rowId = entry?.id ?? entry?.paymentId ?? entry?.rowId;
          if (rowId === undefined || rowId === null) continue;

          const orderIndex = Number(entry?.orderIndex);

          await Payment.update(
            {
              orderIndex: Number.isFinite(orderIndex) ? orderIndex : 0,
            },
            {
              where: { id: rowId },
              transaction,
            }
          );
        }

        await transaction.commit();
        res.json({ success: true, message: "Rows reordered successfully" });
      } catch (err) {
        await transaction.rollback();
        console.error("PAYMENT REORDER ERROR:", err);
        res.status(500).json({ message: "Error reordering payment rows" });
      }
    },

    async remove(req, res) {
      try {
        const { id } = req.params;

        const deleted = await Payment.destroy({ where: { id } });
        if (!deleted) {
          return res.status(404).json({ message: "Payment row not found" });
        }

        res.json({ success: true, message: "Payment row deleted" });
      } catch (err) {
        console.error("PAYMENT DELETE ERROR:", err);
        res.status(500).json({ message: "Error deleting payment row" });
      }
    },
  };
}