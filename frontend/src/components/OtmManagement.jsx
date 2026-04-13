import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api.js";
import OtmPortalSheet from "../components/OtmPortalSheet.jsx";

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
    otmUsers: [],
  });
  const [loading, setLoading] = useState(true);

  const requestedUserId = searchParams.get("userId");
  const isAdmin = user?.role === "admin";

  const selectedPortalUserId = useMemo(() => {
    if (isAdmin && requestedUserId) return Number(requestedUserId);
    if (selectedUser?.id) return Number(selectedUser.id);
    return Number(user?.id || 0);
  }, [isAdmin, requestedUserId, selectedUser, user]);

  async function loadAll(targetUserId) {
    try {
      setLoading(true);
      const query = targetUserId ? `?userId=${targetUserId}` : "";

      const [meRes, metaRes, entriesRes, reportsRes, totalClassRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/otm-management/meta"),
        api.get(`/otm-management/entries${query}`),
        api.get(`/otm-management/reports${query}`),
        api.get(`/otm-management/total-class${query}`),
      ]);

      const meUser = meRes.data?.user || null;
      const nextMeta = metaRes.data || {};
      const selected = entriesRes.data?.selectedUser || null;
      const otmUsers = nextMeta.otmUsers || [];

      setUser(meUser);
      setMeta(nextMeta);
      setSelectedUser(selected || meUser);
      setEntries(entriesRes.data?.entries || []);
      setReportRows(reportsRes.data?.rows || []);
      setReportSummary(reportsRes.data?.summary || null);
      setTotalClassRows(totalClassRes.data?.rows || []);
      setTotalClassSummary(totalClassRes.data?.summary || null);

      if (meUser?.role === "admin" && !targetUserId && otmUsers.length > 0) {
        setSearchParams({ userId: String(otmUsers[0].id) }, { replace: true });
      }
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
    loadAll(requestedUserId);
  }, [requestedUserId]);

  useEffect(() => {
    const sessionId = localStorage.getItem("session_id") || sessionStorage.getItem("session_id");
    if (!sessionId) return;

    const ping = async () => {
      try {
        await api.put("/auth/presence/heartbeat", {
          session_id: sessionId,
          current_sheet: "otm-management",
        });
      } catch (error) {
        console.error("OTM heartbeat failed:", error);
      }
    };

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  async function createEntry(payload) {
    const body = isAdmin ? { ...payload, userId: selectedPortalUserId } : payload;
    const res = await api.post("/otm-management/entries", body);
    await loadAll(selectedPortalUserId);
    return res.data?.entries || res.data?.entry || null;
  }

  async function updateEntry(entryId, payload) {
    const body = isAdmin ? { ...payload, userId: selectedPortalUserId } : payload;
    const res = await api.put(`/otm-management/entries/${entryId}`, body);
    await loadAll(selectedPortalUserId);
    return res.data?.entry || null;
  }

  async function reorderEntries(orderedIds) {
    const body = isAdmin ? { orderedIds, userId: selectedPortalUserId } : { orderedIds };
    await api.post("/otm-management/entries/reorder", body);
    await loadAll(selectedPortalUserId);
  }

  async function deleteEntry(entryId) {
    const suffix = isAdmin ? `?userId=${selectedPortalUserId}` : "";
    await api.delete(`/otm-management/entries/${entryId}${suffix}`);
    await loadAll(selectedPortalUserId);
  }

  function handleAdminUserChange(nextUserId) {
    if (!nextUserId) return;
    setSearchParams({ userId: String(nextUserId) });
  }

  const title = isAdmin
    ? `OTM Portal - ${selectedUser?.name || "Select User"}`
    : "OTM Management";

  const subtitle = isAdmin
    ? `Admin mode: you can view and edit ${selectedUser?.name || "OTM user"} even when the user is offline.`
    : `Logged in as ${user?.name || user?.email || "OTM User"}`;

  return (
    <OtmPortalSheet
      user={user}
      portalUser={selectedUser || user}
      isAdmin={isAdmin}
      title={title}
      subtitle={subtitle}
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
    />
  );
}
