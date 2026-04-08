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

      const mePromise = api.get("/auth/me");
      const metaPromise = api.get("/otm-management/meta");
      const query = targetUserId ? `?userId=${targetUserId}` : "";
      const entriesPromise = api.get(`/otm-management/entries${query}`);
      const reportsPromise = api.get(`/otm-management/reports${query}`);
      const totalClassPromise = api.get(`/otm-management/total-class${query}`);

      const [meRes, metaRes, entriesRes, reportsRes, totalClassRes] = await Promise.all([
        mePromise,
        metaPromise,
        entriesPromise,
        reportsPromise,
        totalClassPromise,
      ]);

      const meUser = meRes.data?.user || null;
      setUser(meUser);
      setMeta(metaRes.data || {});

      const selected = entriesRes.data?.selectedUser || null;
      setSelectedUser(selected || meUser);
      setEntries(entriesRes.data?.entries || []);
      setReportRows(reportsRes.data?.rows || []);
      setReportSummary(reportsRes.data?.summary || null);
      setTotalClassRows(totalClassRes.data?.rows || []);
      setTotalClassSummary(totalClassRes.data?.summary || null);

      const otmUsers = metaRes.data?.otmUsers || [];
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
    const sessionId =
      localStorage.getItem("session_id") || sessionStorage.getItem("session_id");

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
    const body = isAdmin
      ? { ...payload, userId: selectedPortalUserId }
      : payload;

    const res = await api.post("/otm-management/entries", body);
    const entry = res.data?.entry || res.data?.data;
    await loadAll(selectedPortalUserId);
    return entry;
  }

  async function updateEntry(entryId, payload) {
    const body = isAdmin
      ? { ...payload, userId: selectedPortalUserId }
      : payload;

    const res = await api.put(`/otm-management/entries/${entryId}`, body);
    const entry = res.data?.entry || res.data?.data;
    await loadAll(selectedPortalUserId);
    return entry;
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
    : "Otm Management";

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
      onDeleteEntry={deleteEntry}
      onAdminUserChange={handleAdminUserChange}
    />
  );
}
