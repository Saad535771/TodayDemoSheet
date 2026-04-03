import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api.js";
import OtmPortalSheet from "../components/OtmPortalSheet.jsx";

const emptyStyle = {
  padding: "30px 20px",
  textAlign: "center",
  color: "#64748b",
  background: "#f8fafc",
  borderRadius: "16px",
  border: "1px dashed #cbd5e1",
  margin: "20px",
};

export default function AdminOtmUserDetail() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDetails() {
    try {
      setLoading(true);
      const res = await api.get(`/otm-management/admin/${userId}`);
      setData(res.data || null);
    } catch (err) {
      console.error("Failed to load admin OTM details:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [userId]);

  async function createEntry(payload) {
    const res = await api.post(`/otm-management/admin/${userId}/entries`, payload);
    return res.data?.entry || res.data?.data || { id: Date.now(), ...payload };
  }

  async function updateEntry(entryId, payload) {
    const res = await api.put(`/otm-management/admin/${userId}/entries/${entryId}`, payload);
    return res.data?.entry || res.data?.data || { id: entryId, ...payload };
  }

  async function deleteEntry(entryId) {
    await api.delete(`/otm-management/admin/${userId}/entries/${entryId}`);
  }

  if (loading) {
    return <div style={emptyStyle}>Loading OTM user details...</div>;
  }

  if (!data) {
    return <div style={emptyStyle}>No OTM user details found.</div>;
  }

  return (
    <OtmPortalSheet
      user={data?.user || null}
      userId={data?.user?.id || userId}
      title={`${data?.user?.name || "OTM User"} Portal`}
      subtitle={`Admin view • ${data?.user?.email || "--"}`}
      initialEntries={data?.entries || []}
      loading={false}
      onCreateEntry={createEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
    />
  );
}