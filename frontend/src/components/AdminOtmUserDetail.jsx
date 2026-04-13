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
      const [detailsRes, metaRes] = await Promise.all([
        api.get(`/otm-management/admin/${userId}`),
        api.get(`/otm-management/meta`),
      ]);

      setData({
        ...(detailsRes.data || {}),
        meta: metaRes.data || {},
      });
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
    const res = await api.post(`/otm-management/entries`, { ...payload, userId: Number(userId) });
    await loadDetails();
    return res.data?.entry || res.data?.entries || null;
  }

  async function updateEntry(entryId, payload) {
    const res = await api.put(`/otm-management/entries/${entryId}`, { ...payload, userId: Number(userId) });
    await loadDetails();
    return res.data?.entry || null;
  }

  async function reorderEntries(orderedIds) {
    await api.post(`/otm-management/entries/reorder`, { orderedIds, userId: Number(userId) });
    await loadDetails();
  }

  async function deleteEntry(entryId) {
    await api.delete(`/otm-management/entries/${entryId}?userId=${Number(userId)}`);
    await loadDetails();
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
      portalUser={data?.user || null}
      isAdmin={true}
      title={`${data?.user?.name || "OTM User"} Portal`}
      subtitle={`Admin view • ${data?.user?.email || "--"}`}
      initialEntries={data?.entries || []}
      loading={false}
      meta={data?.meta || {}}
      reportRows={data?.reports?.rows || []}
      reportSummary={data?.reports?.summary || null}
      totalClassRows={data?.totalClass?.rows || []}
      totalClassSummary={data?.totalClass?.summary || null}
      onCreateEntry={createEntry}
      onUpdateEntry={updateEntry}
      onReorderEntries={reorderEntries}
      onDeleteEntry={deleteEntry}
    />
  );
}
