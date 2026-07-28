import { makeSequelize } from '../config/db.js';
import { QueryTypes } from 'sequelize';

const sequelize = makeSequelize();

const ReportModel = {
  // 1. Fetch All Reports
  findAll: async () => {
    const rows = await sequelize.query('SELECT * FROM tuition_reports ORDER BY id DESC', {
      type: QueryTypes.SELECT
    });
    return rows;
  },

  // 2. Create New Report
  create: async ({ tuitionName, groupName, tutorName, reportStatus,displayOrder, rowColor }) => {
    const groupNameStr = typeof groupName === 'object' ? JSON.stringify(groupName) : groupName;
    const tutorNameStr = typeof tutorName === 'object' ? JSON.stringify(tutorName) : tutorName;

    const [result] = await sequelize.query(
      `INSERT INTO tuition_reports (tuition_name, group_name, tutor_name, report_status,display_order, row_color) VALUES (?,?,?,?,?,?)`,
      {
        // FIX: tutorName ki jagah tutorNameStr pass hoga taake array string ban kar jaye
        replacements: [tuitionName, groupNameStr, tutorNameStr || '', reportStatus || 'report pending', displayOrder || 0, rowColor || null]
      }
    );
    return result; 
  },

  // 3. Find By ID
  findById: async (id) => {
    const rows = await sequelize.query('SELECT * FROM tuition_reports WHERE id = ?', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    return rows[0];
  },

// 4. Update Full Report (PUT)
  update: async (id, data) => {
    const { tuitionName, groupName, tutorName, reportStatus, displayOrder, rowColor } = data;
    
    // Fix: Ensure groupName and tutorName are safely converted to JSON string or null
    let groupNameStr = null;
    if (groupName !== undefined && groupName !== null && groupName !== '') {
      groupNameStr = typeof groupName === 'object' ? JSON.stringify(groupName) : JSON.stringify(String(groupName).split(',').map(s => s.trim()).filter(Boolean));
    }

    let tutorNameStr = null;
    if (tutorName !== undefined && tutorName !== null && tutorName !== '') {
      tutorNameStr = typeof tutorName === 'object' ? JSON.stringify(tutorName) : JSON.stringify(String(tutorName).split(',').map(s => s.trim()).filter(Boolean));
    }

    const [results, metadata] = await sequelize.query(
      `UPDATE tuition_reports SET 
        tuition_name = COALESCE(?, tuition_name), 
        group_name = COALESCE(?, group_name), 
        tutor_name = COALESCE(?, tutor_name), 
        report_status = COALESCE(?, report_status),
        display_order = COALESCE(?, display_order),
        row_color = COALESCE(?, row_color)
       WHERE id = ?`,
      {
        replacements: [tuitionName, groupNameStr, tutorNameStr, reportStatus, displayOrder, rowColor, id]
      }
    );
    return metadata.affectedRows;
  },
  // 5. Partial Update (PATCH)
  patch: async (id, fields) => {
    const keys = [];
    const values = [];

    if (fields.tuitionName !== undefined) {
      keys.push('tuition_name = ?');
      values.push(fields.tuitionName);
    }
    if (fields.groupName !== undefined) {
      keys.push('group_name = ?');
      values.push(typeof fields.groupName === 'object' ? JSON.stringify(fields.groupName) : fields.groupName);
    }
    if (fields.tutorName !== undefined) {
      keys.push('tutor_name = ?');
      values.push(typeof fields.tutorName === 'object' ? JSON.stringify(fields.tutorName) : fields.tutorName);
    }
    if (fields.reportStatus !== undefined) {
      keys.push('report_status = ?');
      values.push(fields.reportStatus);
    }

    if (keys.length === 0) return 0;

    values.push(id);
    const query = `UPDATE tuition_reports SET ${keys.join(', ')} WHERE id = ?`;
    const [results, metadata] = await sequelize.query(query, {
      replacements: values
    });
    return metadata.affectedRows;
  },

  // 6. Delete Report (DELETE)
  delete: async (id) => {
    // FIX: 'reports' ki jagah sahi table name 'tuition_reports' kar diya gaya hai
    const [results, metadata] = await sequelize.query('DELETE FROM tuition_reports WHERE id = ?', {
      replacements: [id]
    });
    return metadata.affectedRows;
  },
  reorder: async (orderedIds) => {
  for (let i = 0; i < orderedIds.length; i++) {
    await sequelize.query(
      'UPDATE tuition_reports SET display_order = ? WHERE id = ?',
      { replacements: [i, orderedIds[i]] }
    );
  }
  return true;
},
  
};
export default ReportModel;