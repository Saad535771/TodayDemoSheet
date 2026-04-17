This patch adds two things:

1. Monthly Tuition sheet OTM Name dropdown now loads all users whose role is OTM from /api/tuitions/otm-users.
2. When a monthly tuition row is created or updated with an OTM Name, a linked row is created or updated in that user's OTM portal. The linked row stores the monthly tuition name in the New Tuition column.

Files changed:
- tuitionController.js
- tuitionRoutes.js
- MonthlyTuition.jsx
- MonthlyTuitionTable.jsx
- OtmTuitionEntry.js
- otmManagementController.js
- otmManagementRoutes.js
- OtmPortalSheet.jsx
- otmScheduleUtils.js

Database migration still required for new OTM portal fields. Run the SQL in otm_monthly_sync_migration.sql.
