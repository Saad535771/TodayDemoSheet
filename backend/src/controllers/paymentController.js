export function makePaymentController({ Payment }) {
  return {
    async list(req, res) {
      try {
        const items = await Payment.findAll({
          order: [["updatedAt", "DESC"]],
        });

        res.json({ items });
      } catch (err) {
        console.error("PAYMENT LIST ERROR:", err);
        res.status(500).json({ message: "Error fetching payments" });
      }
    },

    async create(req, res) {
      try {
        const item = await Payment.create(req.body);
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

        await row.update(req.body);

        res.json({ success: true, item: row });
      } catch (err) {
        console.error("PAYMENT UPDATE ERROR:", err);
        res.status(500).json({ message: "Error updating payment row" });
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