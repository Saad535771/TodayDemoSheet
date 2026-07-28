import ReportModel from '../models/reportModel.js';

// Save or Update Report
export const saveReport = async (req, res) => {
  try {
    const { id, tuitionName, groupName, tutorName, reportStatus, displayOrder, rowColor } = req.body;

    if (id) {
      // Update logic
      const affectedRows = await ReportModel.update(id, { tuitionName, groupName, tutorName, reportStatus, displayOrder, rowColor });
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }
      return res.status(200).json({ success: true, message: 'Report updated successfully' });
    } else {
      // Create logic
      const insertId = await ReportModel.create({ tuitionName, groupName, tutorName, reportStatus, displayOrder, rowColor });
      return res.status(201).json({ success: true, id: insertId, message: 'Report saved successfully' });
    }
  } catch (error) {
    console.error('Report Save Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch All Reports
export const getAllReports = async (req, res) => {
  try {
    const rows = await ReportModel.findAll();
    
    const reports = rows.map(row => ({
      id: row.id,
      tuitionName: row.tuition_name,
      groupName: typeof row.group_name === 'string' ? JSON.parse(row.group_name) : row.group_name,
      tutorName: typeof row.tutor_name === 'string' ? JSON.parse(row.tutor_name) : row.tutor_name,
      reportStatus: row.report_status,
      displayOrder: row.display_order, // Naya field added
      rowColor: row.row_color,           // Naya field added
      createdAt: row.created_at
    }));

    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Fetch Reports Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Full Update Report (PUT)
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await ReportModel.update(id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    return res.status(200).json({ success: true, message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update Report Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Partial Update Report (PATCH)
export const patchReport = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await ReportModel.patch(id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Report not found or no changes made' });
    }
    return res.status(200).json({ success: true, message: 'Report patched successfully' });
  } catch (error) {
    console.error('Patch Report Error:', error);
    return res.status(500).json({ success: false, error: error.message });
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