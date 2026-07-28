import ReportModel from '../models/reportModel.js';


function safeParseJsonArray(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "object") {
    return Object.values(value);
  }

  try {
    const parsed = JSON.parse(
      String(value)
    );

    return Array.isArray(parsed)
      ? parsed
      : parsed
        ? [parsed]
        : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function mapReportRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,

    tuitionName:
      row.tuition_name ??
      row.tuitionName ??
      "",

    groupName:
      safeParseJsonArray(
        row.group_name ??
        row.groupName
      ),

    tutorName:
      safeParseJsonArray(
        row.tutor_name ??
        row.tutorName
      ),

    reportStatus:
      row.report_status ??
      row.reportStatus ??
      "report pending",

    displayOrder:
      row.display_order ??
      row.displayOrder ??
      0,

    rowColor:
      row.row_color ??
      row.rowColor ??
      "",

    createdAt:
      row.created_at ??
      row.createdAt ??
      null,
  };
}
// Save or Update Report
export const saveReport = async (
  req,
  res
) => {
  try {
    const {
      id,
      tuitionName,
      groupName,
      tutorName,
      reportStatus,
      displayOrder,
      rowColor,
    } = req.body || {};

    if (id) {
      const affectedRows =
        await ReportModel.update(id, {
          tuitionName,
          groupName,
          tutorName,
          reportStatus,
          displayOrder,
          rowColor,
        });

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Report not found",
        });
      }

      const updated =
        await ReportModel.findById(id);

      return res.status(200).json({
        success: true,
        message:
          "Report updated successfully",
        data: mapReportRow(updated),
      });
    }

    const insertId =
      await ReportModel.create({
        tuitionName,
        groupName,
        tutorName,
        reportStatus,
        displayOrder,
        rowColor,
      });

    const created =
      await ReportModel.findById(
        insertId
      );

    return res.status(201).json({
      success: true,
      id: insertId,
      message:
        "Report saved successfully",
      data: mapReportRow(created),
    });
  } catch (error) {
    console.error(
      "Report Save Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Fetch All Reports
export const getAllReports = async (
  req,
  res
) => {
  try {
    const rows =
      await ReportModel.findAll();

    return res.status(200).json({
      success: true,
      data: rows.map(mapReportRow),
    });
  } catch (error) {
    console.error(
      "Fetch Reports Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Full Update Report (PUT)
export const updateReport = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid report ID",
      });
    }

    const affectedRows =
      await ReportModel.update(
        id,
        req.body || {}
      );

    if (affectedRows === 0) {
      const existing =
        await ReportModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Report not found",
        });
      }
    }

    const updated =
      await ReportModel.findById(id);

    return res.status(200).json({
      success: true,
      message:
        "Report updated successfully",
      data: mapReportRow(updated),
    });
  } catch (error) {
    console.error(
      "Update Report Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Partial Update Report (PATCH)
export const patchReport = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);

    const affectedRows =
      await ReportModel.patch(
        id,
        req.body || {}
      );

    if (affectedRows === 0) {
      const existing =
        await ReportModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Report not found",
        });
      }
    }

    const updated =
      await ReportModel.findById(id);

    return res.status(200).json({
      success: true,
      message:
        "Report patched successfully",
      data: mapReportRow(updated),
    });
  } catch (error) {
    console.error(
      "Patch Report Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete Report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await ReportModel.delete(id);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    return res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error("Delete Report Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Reorder Reports
export const reorderReports = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, error: 'Invalid orderedIds' });
    }
    await ReportModel.reorder(orderedIds);
    return res.status(200).json({ success: true, message: 'Reordered successfully' });
  } catch (error) {
    console.error('Reorder Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};