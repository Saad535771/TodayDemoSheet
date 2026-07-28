import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
const TABLE_NAME = "tuition_reports";

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object || {},
    key
  );
}

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}

function normalizeList(value, depth = 0) {
  if (
    depth > 8 ||
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .flatMap((item) =>
            normalizeList(item, depth + 1)
          )
          .map((item) =>
            String(item || "").trim()
          )
          .filter(Boolean)
      ),
    ];
  }

  if (typeof value === "object") {
    return normalizeList(
      Object.values(value),
      depth + 1
    );
  }

  const text = String(value).trim();

  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);

    return normalizeList(
      parsed,
      depth + 1
    );
  } catch {
    return [
      ...new Set(
        text
          .split(/[,|\n]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }
}

function normalizeJsonList(value) {
  return JSON.stringify(
    normalizeList(value)
  );
}

function normalizeInteger(
  value,
  fallback = 0
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.trunc(number)
  );
}

function getAffectedRows(result, metadata) {
  if (
    metadata &&
    typeof metadata.affectedRows === "number"
  ) {
    return metadata.affectedRows;
  }

  if (
    result &&
    typeof result.affectedRows === "number"
  ) {
    return result.affectedRows;
  }

  if (typeof metadata === "number") {
    return metadata;
  }

  if (
    Array.isArray(metadata) &&
    typeof metadata[1] === "number"
  ) {
    return metadata[1];
  }

  return 0;
}

const ReportModel = {
  async create({
    tuitionName,
    groupName,
    tutorName,
    reportStatus,
    displayOrder,
    rowColor,
  } = {}) {
    const replacements = {
      tuitionName: normalizeText(
        tuitionName
      ),

      groupName:
        normalizeJsonList(groupName),

      tutorName:
        normalizeJsonList(tutorName),

      reportStatus:
        normalizeText(
          reportStatus,
          "report pending"
        ) || "report pending",

      displayOrder:
        normalizeInteger(
          displayOrder,
          0
        ),

      rowColor:
        normalizeText(rowColor),
    };

    const [result] =
      await sequelize.query(
        `
          INSERT INTO ${TABLE_NAME}
          (
            tuition_name,
            group_name,
            tutor_name,
            report_status,
            display_order,
            row_color
          )
          VALUES
          (
            :tuitionName,
            :groupName,
            :tutorName,
            :reportStatus,
            :displayOrder,
            :rowColor
          )
        `,
        {
          replacements,
        }
      );

    return Number(
      result?.insertId ||
      result ||
      0
    );
  },

  async findAll() {
    return sequelize.query(
      `
        SELECT
          id,
          tuition_name,
          group_name,
          tutor_name,
          report_status,
          display_order,
          row_color,
          created_at
        FROM ${TABLE_NAME}
        ORDER BY
          COALESCE(display_order, 0) ASC,
          id ASC
      `,
      {
        type: QueryTypes.SELECT,
      }
    );
  },

  async findById(id) {
    const rows =
      await sequelize.query(
        `
          SELECT
            id,
            tuition_name,
            group_name,
            tutor_name,
            report_status,
            display_order,
            row_color,
            created_at
          FROM ${TABLE_NAME}
          WHERE id = :id
          LIMIT 1
        `,
        {
          replacements: {
            id: Number(id),
          },

          type: QueryTypes.SELECT,
        }
      );

    return rows[0] || null;
  },

  async update(id, data = {}) {
    const setParts = [];
    const replacements = {
      id: Number(id),
    };

    /*
     * Dynamic query ban rahi hai:
     * jo field request mein maujood nahi,
     * uska SQL placeholder bhi create nahi hoga.
     */

    if (
      hasOwn(data, "tuitionName") ||
      hasOwn(data, "tuition_name")
    ) {
      setParts.push(
        "tuition_name = :tuitionName"
      );

      replacements.tuitionName =
        normalizeText(
          data.tuitionName ??
          data.tuition_name
        );
    }

    if (
      hasOwn(data, "groupName") ||
      hasOwn(data, "group_name")
    ) {
      setParts.push(
        "group_name = :groupName"
      );

      replacements.groupName =
        normalizeJsonList(
          data.groupName ??
          data.group_name
        );
    }

    if (
      hasOwn(data, "tutorName") ||
      hasOwn(data, "tutor_name")
    ) {
      setParts.push(
        "tutor_name = :tutorName"
      );

      replacements.tutorName =
        normalizeJsonList(
          data.tutorName ??
          data.tutor_name
        );
    }

    if (
      hasOwn(data, "reportStatus") ||
      hasOwn(data, "report_status")
    ) {
      setParts.push(
        "report_status = :reportStatus"
      );

      replacements.reportStatus =
        normalizeText(
          data.reportStatus ??
          data.report_status,
          "report pending"
        ) || "report pending";
    }

    if (
      hasOwn(data, "displayOrder") ||
      hasOwn(data, "display_order")
    ) {
      const rawDisplayOrder =
        data.displayOrder ??
        data.display_order;

      /*
       * Undefined ho to field skip hogi.
       * SQL replacement kabhi undefined nahi hogi.
       */
      if (
        rawDisplayOrder !== undefined &&
        rawDisplayOrder !== null &&
        rawDisplayOrder !== ""
      ) {
        setParts.push(
          "display_order = :displayOrder"
        );

        replacements.displayOrder =
          normalizeInteger(
            rawDisplayOrder,
            0
          );
      }
    }

    if (
      hasOwn(data, "rowColor") ||
      hasOwn(data, "row_color")
    ) {
      setParts.push(
        "row_color = :rowColor"
      );

      replacements.rowColor =
        normalizeText(
          data.rowColor ??
          data.row_color
        );
    }

    if (!setParts.length) {
      const existing =
        await this.findById(id);

      return existing ? 1 : 0;
    }

    const [result, metadata] =
      await sequelize.query(
        `
          UPDATE ${TABLE_NAME}
          SET ${setParts.join(", ")}
          WHERE id = :id
        `,
        {
          replacements,
        }
      );

    return getAffectedRows(
      result,
      metadata
    );
  },

  async patch(id, data = {}) {
    return this.update(id, data);
  },

  async delete(id) {
    const [result, metadata] =
      await sequelize.query(
        `
          DELETE FROM ${TABLE_NAME}
          WHERE id = :id
        `,
        {
          replacements: {
            id: Number(id),
          },
        }
      );

    return getAffectedRows(
      result,
      metadata
    );
  },

  async reorder(orderedIds = []) {
    if (!Array.isArray(orderedIds)) {
      return 0;
    }

    const ids = orderedIds
      .map(Number)
      .filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0
      );

    if (!ids.length) {
      return 0;
    }

    const transaction =
      await sequelize.transaction();

    try {
      for (
        let index = 0;
        index < ids.length;
        index += 1
      ) {
        await sequelize.query(
          `
            UPDATE ${TABLE_NAME}
            SET display_order = :displayOrder
            WHERE id = :id
          `,
          {
            replacements: {
              displayOrder: index,
              id: ids[index],
            },

            transaction,
          }
        );
      }

      await transaction.commit();

      return ids.length;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

export default ReportModel;