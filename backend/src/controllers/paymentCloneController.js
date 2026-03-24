export function makePaymentCloneController({ PaymentClone }) {
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
        if (
          orderIndex === undefined ||
          orderIndex === null ||
          orderIndex === ""
        ) {
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

        const payload = normalizePayload(pickAllowed(req.body));
        await row.update(payload);

        res.json({ success: true, item: row });
      } catch (err) {
        console.error("PAYMENT CLONE UPDATE ERROR:", err);
        res.status(500).json({
          message: err?.message || "Error updating payment clone row",
        });
      }
    },

    async remove(req, res) {
      try {
        const { id } = req.params;

        const deleted = await PaymentClone.destroy({ where: { id } });
        if (!deleted) {
          return res.status(404).json({ message: "Payment clone row not found" });
        }

        res.json({ success: true, message: "Payment clone row deleted" });
      } catch (err) {
        console.error("PAYMENT CLONE DELETE ERROR:", err);
        res.status(500).json({
          message: err?.message || "Error deleting payment clone row",
        });
      }
    },

    async reorder(req, res) {
      try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        for (const entry of items) {
          const id = entry.id ?? entry.paymentId ?? entry.rowId;
          if (id === undefined || id === null) continue;

          await PaymentClone.update(
            { orderIndex: Number(entry.orderIndex) || 0 },
            { where: { id } }
          );
        }

        res.json({ success: true, message: "Reordered successfully" });
      } catch (err) {
        console.error("PAYMENT CLONE REORDER ERROR:", err);
        res.status(500).json({
          message: err?.message || "Error reordering payment clone rows",
        });
      }
    },
  };
}