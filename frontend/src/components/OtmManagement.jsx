import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api.js";
import OtmPortalSheet from "../components/OtmPortalSheet.jsx";

const styles = {
  empty: {
    padding: "32px 24px",
    textAlign: "center",
    color: "#64748b",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
  },
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  topCard: {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    padding: 18,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900,
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#475569",
    fontSize: 14,
    fontWeight: 600,
  },
  controls: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  search: {
    minWidth: 280,
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    outline: "none",
    fontSize: 14,
  },
  badge: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 800,
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 900,
  },
  th: {
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 900,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 10px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    color: "#0f172a",
    verticalAlign: "middle",
  },
  openBtn: {
    border: "1px solid #1d4ed8",
    background: "#1d4ed8",
    color: "#fff",
    borderRadius: 10,
    padding: "9px 12px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  roleBadge: (role) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    background:
      role === "admin"
        ? "#fee2e2"
        : role === "hod"
          ? "#ede9fe"
          : role === "otm"
            ? "#dcfce7"
            : "#f1f5f9",
    color:
      role === "admin"
        ? "#b91c1c"
        : role === "hod"
          ? "#6d28d9"
          : role === "otm"
            ? "#166534"
            : "#334155",
    border: "1px solid rgba(148, 163, 184, 0.3)",
  }),
  accessBadge: (enabled) => ({
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: enabled ? "#dcfce7" : "#f8fafc",
    color: enabled ? "#166534" : "#64748b",
    border: `1px solid ${enabled ? "#86efac" : "#e2e8f0"}`,
  }),
};

function UserDirectory({ users, search, onSearch, onOpen }) {
  const filteredUsers = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      return [user.name, user.email, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [users, search]);

  return (
    <div style={styles.topCard}>
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Management Users Portal</h2>
        </div>
        <div style={styles.controls}>
          <input
            style={styles.search}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by name, email or role"
          />
          <div style={styles.badge}>{filteredUsers.length} user(s)</div>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>OTM Access</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={6}>No registered users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}><u onClick={() => onOpen(user.id)} style={{cursor:'pointer'}}>{user.name || "Unnamed User"}</u></td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}><span style={styles.roleBadge(user.role)}>{user.role}</span></td>
                  <td style={styles.td}><span style={styles.accessBadge(Boolean(user.access_otm_management || user.role === "admin" || user.role === "otm"))}>{Boolean(user.access_otm_management || user.role === "admin" || user.role === "otm") ? "Enabled" : "Disabled"}</span></td>
                  <td style={styles.td}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "--"}</td>
                  <td style={styles.td}>
                    <button type="button" className="bg-theme text-light shadow rounded-pill" onClick={() => onOpen(user.id)}>
                      Open Portal
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OtmManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [totalClassRows, setTotalClassRows] = useState([]);
  const [totalClassSummary, setTotalClassSummary] = useState(null);
  const [meta, setMeta] = useState({
    dayOptions: [],
    statusOptions: [],
    durationOptions: [],
    classTimes: [],
    portalUsers: [],
    otmUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [directorySearch, setDirectorySearch] = useState("");

  const requestedUserId = searchParams.get("userId");
  const isAdmin = user?.role === "admin";
  const showDirectory = isAdmin && !requestedUserId;

  const portalUsers = useMemo(
    () => meta.portalUsers?.length ? meta.portalUsers : meta.otmUsers || [],
    [meta]
  );

  async function loadPortalData(targetUserId, shell = null) {
    const query = targetUserId ? `?userId=${targetUserId}` : "";
    const [entriesRes, reportsRes, totalClassRes] = await Promise.all([
      api.get(`/otm-management/entries${query}`),
      api.get(`/otm-management/reports${query}`),
      api.get(`/otm-management/total-class${query}`),
    ]);

    const baseUser = shell?.meUser || user;
    const selected = entriesRes.data?.selectedUser || baseUser || null;

    setSelectedUser(selected);
    setEntries(entriesRes.data?.entries || []);
    setReportRows(reportsRes.data?.rows || []);
    setReportSummary(reportsRes.data?.summary || null);
    setTotalClassRows(totalClassRes.data?.rows || []);
    setTotalClassSummary(totalClassRes.data?.summary || null);
  }

  async function bootstrap() {
    try {
      setLoading(true);

      const [meRes, metaRes, usersRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/otm-management/meta"),
        api.get("/otm-management/users").catch(() => ({ data: { users: [] } })),
      ]);

      const meUser = meRes.data?.user || null;
      const metaData = metaRes.data || {};
      const mergedPortalUsers = usersRes.data?.users?.length
        ? usersRes.data.users
        : metaData.portalUsers || metaData.otmUsers || [];

      setUser(meUser);
      setMeta({
        ...metaData,
        portalUsers: mergedPortalUsers,
        otmUsers: mergedPortalUsers,
      });

      if (meUser?.role === "admin") {
        if (!requestedUserId) {
          setSelectedUser(null);
          setEntries([]);
          setReportRows([]);
          setReportSummary(null);
          setTotalClassRows([]);
          setTotalClassSummary(null);
          return;
        }
        await loadPortalData(requestedUserId, { meUser });
        return;
      }

      await loadPortalData(meUser?.id, { meUser });
    } catch (error) {
      console.error("Failed to load OTM portal:", error);
      setEntries([]);
      setReportRows([]);
      setReportSummary(null);
      setTotalClassRows([]);
      setTotalClassSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, [requestedUserId]);

  useEffect(() => {
    const sessionId = localStorage.getItem("session_id") || sessionStorage.getItem("session_id");
    if (!sessionId) return;

    const ping = async () => {
      try {
        await api.put("/auth/presence/heartbeat", {
          session_id: sessionId,
          current_sheet: requestedUserId ? "otm-management-portal" : "otm-management-directory",
        });
      } catch (error) {
        console.error("OTM heartbeat failed:", error);
      }
    };

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [requestedUserId]);

  async function createEntry(payload) {
    const targetUserId = isAdmin ? Number(requestedUserId || selectedUser?.id || 0) : null;
    const body = isAdmin ? { ...payload, userId: targetUserId } : payload;
    const res = await api.post("/otm-management/entries", body);
    await bootstrap();
    return res.data?.entry || res.data?.data;
  }

  async function updateEntry(entryId, payload) {
    const targetUserId = isAdmin ? Number(requestedUserId || selectedUser?.id || 0) : null;
    const body = isAdmin ? { ...payload, userId: targetUserId } : payload;
    const res = await api.put(`/otm-management/entries/${entryId}`, body);
    await bootstrap();
    return res.data?.entry || res.data?.data;
  }

  async function reorderEntries(orderedIds) {
    const targetUserId = isAdmin ? Number(requestedUserId || selectedUser?.id || 0) : null;
    const body = isAdmin ? { orderedIds, userId: targetUserId } : { orderedIds };
    await api.post("/otm-management/entries/reorder", body);
    await bootstrap();
  }

  async function deleteEntry(entryId) {
    const suffix = isAdmin ? `?userId=${requestedUserId || selectedUser?.id}` : "";
    await api.delete(`/otm-management/entries/${entryId}${suffix}`);
    await bootstrap();
  }

  function handleOpenPortal(userId) {
    setSearchParams({ userId: String(userId) });
  }

  function handleBackToDirectory() {
    setSearchParams({});
  }

  function handleAdminUserChange(nextUserId) {
    if (!nextUserId) {
      handleBackToDirectory();
      return;
    }
    setSearchParams({ userId: String(nextUserId) });
  }

  if (loading && !user) {
    return <div style={styles.empty}>Loading management portal...</div>;
  }

  if (showDirectory) {
    return (
      <div style={styles.page}>
        <UserDirectory
          users={portalUsers}
          search={directorySearch}
          onSearch={setDirectorySearch}
          onOpen={handleOpenPortal}
        />
      </div>
    );
  }

  return (
    <OtmPortalSheet
      user={user}
      portalUser={selectedUser || user}
      isAdmin={isAdmin}
      title={isAdmin ? `OTM Portal - ${selectedUser?.name || "User"}` : "OTM Management"}
      subtitle={
        isAdmin
          ? `Admin mode: ${selectedUser?.name || "User"} ka portal bina reload ke edit ho sakta hai.`
          : `Logged in as ${user?.name || user?.email || "OTM User"}`
      }
      initialEntries={entries}
      loading={loading}
      meta={meta}
      reportRows={reportRows}
      reportSummary={reportSummary}
      totalClassRows={totalClassRows}
      totalClassSummary={totalClassSummary}
      onCreateEntry={createEntry}
      onUpdateEntry={updateEntry}
      onReorderEntries={reorderEntries}
      onDeleteEntry={deleteEntry}
      onAdminUserChange={handleAdminUserChange}
      onBackToDirectory={isAdmin ? handleBackToDirectory : undefined}
    />
  );
}
