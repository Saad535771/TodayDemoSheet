import React, { useState, useRef } from 'react';
// Yahan hum apna MultiTagInput import kar rahe hain jo badges banata hai
import { MultiTagInput } from "./OtmPortalEntryForm.jsx"; 

export default function ReportEntryForm({ onUpdateReport }) {
  // URL ke end se extra slash (/) hatane ke liye replace ka use kiya gaya hai
  const BaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  
  const [reportDraft, setReportDraft] = useState({
    tuitionName: '',
    groupName: [],
    tutorName: []
  });

  const tuitionInputRef = useRef(null);

  const handleChange = (field, value) => {
    setReportDraft(prev => ({ ...prev, [field]: value }));
  };

  // Backend par data send karne ki logic
  const handleSave = async () => {
    // Agar required field (Tuition Name) khali ho to rok dein
    if (!reportDraft.tuitionName) {
      alert("Tuition Name is required!");
      return;
    }

    try {
      const response = await fetch(`${BaseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tuitionName: reportDraft.tuitionName,
          groupName: reportDraft.groupName,
          tutorName: reportDraft.tutorName
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Report saved successfully!');
        
        // Parent component ko naya data bhejien taake UI update ho sakay
        if (onUpdateReport) {
          onUpdateReport(result);
        }

        // Save hone ke baad form ko wapis khali (clear) kar dein
        setReportDraft({
          tuitionName: "",
          groupName: [],
          tutorName: []
        });

        tuitionInputRef.current?.focus();
      } else {
        alert('Error saving report: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('API Request failed:', error);
      alert('Server connection failed! Please check if backend is running.');
    }
  };

  // Excel Spreadsheet ki professional styling
  const styles = {
    excelContainer: {
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      marginBottom: '20px',
      overflow: 'hidden',
    },
    excelHeaderBar: {
      backgroundColor: '#107c41', // Excel green accent
      color: 'white',
      padding: '10px 14px',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
    },
    th: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #cbd5e1',
      borderRight: '1px solid #e2e8f0',
      padding: '8px 10px',
      fontSize: '12px',
      fontWeight: '600',
      color: '#475569',
      textAlign: 'center',
    },
    tdRowHeader: {
      backgroundColor: '#f1f5f9',
      borderBottom: '1px solid #cbd5e1',
      borderRight: '1px solid #cbd5e1',
      textAlign: 'center',
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      width: '45px',
    },
    tdCell: {
      borderBottom: '1px solid #e2e8f0',
      borderRight: '1px solid #e2e8f0',
      padding: '6px 8px',
      backgroundColor: '#ffffff',
      verticalAlign: 'middle',
    },
    cellInput: {
      width: '100%',
      padding: '8px 10px',
      border: '1px solid #cbd5e1',
      borderRadius: '4px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#ffffff',
      boxSizing: 'border-box',
    },
    actionBar: {
      padding: '12px 14px',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    saveButton: {
      backgroundColor: '#107c41',
      color: 'white',
      border: 'none',
      padding: '8px 20px',
      borderRadius: '4px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    }
  };

  return (
    <div style={styles.excelContainer}>
      {/* Excel Title / Header Bar */}
      <div style={styles.excelHeaderBar}>
        <span>📊 Spreadsheet Entry Sheet - Report Data</span>
        <span style={{ fontSize: '11px', opacity: 0.9 }}>Type freely in cells • Use Tab to navigate</span>
      </div>

      {/* Spreadsheet Grid Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: '45px' }}>#</th>
              <th style={styles.th}>A (Tuition Name)</th>
              <th style={styles.th}>B (Group Name)</th>
              <th style={styles.th}>C (Tutor Name)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Row Number 1 */}
              <td style={styles.tdRowHeader}>1</td>

              {/* Cell A1: Tuition Name */}
              <td style={styles.tdCell}>
                <input
                  ref={tuitionInputRef}
                  style={styles.cellInput}
                  value={reportDraft.tuitionName}
                  onChange={(e) =>handleChange('tuitionName', e.target.value)}
                  placeholder="Enter Tuition Name..."
                />
              </td>

              {/* Cell B1: Group Name */}
              <td style={styles.tdCell}>
                <div style={{ ...styles.cellInput, padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                  <MultiTagInput
                    value={reportDraft.groupName}
                    onChange={(val) => handleChange('groupName', val)}
                    placeholder="Type & press Enter..."
                  />
                </div>
              </td>

              {/* Cell C1: Tutor Name */}
              <td style={styles.tdCell}>
                <div style={{ ...styles.cellInput, padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                  <MultiTagInput
                    value={reportDraft.tutorName}
                    onChange={(val) => handleChange('tutorName', val)}
                    placeholder="Type & press Enter..."
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Toolbar */}
      <div style={styles.actionBar}>
        <button style={styles.saveButton} onClick={handleSave}>
          💾 Save Report
        </button>
      </div>
    </div>
  );
}