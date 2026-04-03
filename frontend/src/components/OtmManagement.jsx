import React, { useEffect, useState } from "react";
import { api } from "../api/api.js";
import OtmPortalSheet from "../components/OtmPortalSheet.jsx";

export default function OtmManagement() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    try {
      setLoading(true);

      const [meRes, entriesRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/otm-management/entries"),
      ]);

      setUser(meRes.data?.user || null);
      setEntries(entriesRes.data?.entries || []);
    } catch (err) {
      console.error("Failed to load OTM data:", err);
      setUser(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

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
      } catch (err) {
        console.error("OTM heartbeat failed:", err);
      }
    };

    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  async function createEntry(payload) {
    const res = await api.post("/otm-management/entries", payload);
    return res.data?.entry || res.data?.data || { id: Date.now(), ...payload };
  }

  async function updateEntry(entryId, payload) {
    const res = await api.put(`/otm-management/entries/${entryId}`, payload);
    return res.data?.entry || res.data?.data || { id: entryId, ...payload };
  }

  async function deleteEntry(entryId) {
    await api.delete(`/otm-management/entries/${entryId}`);
  }

  return (
    <OtmPortalSheet
      user={user}
      userId={user?.id}
      title="Otm Management"
      subtitle={user ? `Logged in as ${user.name || user.email || "OTM User"}` : "Loading user..."}
      initialEntries={entries}
      loading={loading}
      onCreateEntry={createEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
    />
  );
}