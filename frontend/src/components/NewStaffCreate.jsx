import React, { useMemo, useState } from "react";
import { api } from "../api/api.js";

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "hod", label: "HOD" },
  { value: "otm", label: "OTM" },
  { value: "admin", label: "Admin" },
];

const PERMISSION_FIELDS = [
  { key: "access_monthly", label: "Monthly Tuitions" },
  { key: "access_demo", label: "Today Demo" },
  { key: "access_payment_sheet", label: "Payment Sheet" },
  { key: "access_hod_approvals", label: "HOD Approvals" },
  { key: "access_trash", label: "Recycle Bin" },
  { key: "access_staff", label: "Staff Panel" },
  { key: "access_otm_management", label: "Management Portal" },
  { key: "access_chat", label: "Team Chat View" },
  { key: "access_chat_send", label: "Team Chat Send" },
  { key: "access_tutor_share", label: "Tutor Share" },
  { key: "access_lacas_share", label: "LACAS Share" },
  { key: "access_total_fees", label: "Total Fees" },
];

const defaultPermissions = PERMISSION_FIELDS.reduce((acc, item) => {
  acc[item.key] = 0;
  return acc;
}, {});

function getUserIdFromResponse(data) {
  return (
    data?.user?.id ||
    data?.user?.user_id ||
    data?.createdUser?.id ||
    data?.createdUser?.user_id ||
    data?.id ||
    data?.userId ||
    data?.user_id ||
    null
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
  },
  badge: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(30, 60, 114, 0.2)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: 800,
  },
  input: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 13px",
    outline: "none",
    fontSize: 14,
    color: "#111827",
    background: "#f8fafc",
    boxSizing: "border-box",
  },
  sectionTitle: {
    margin: "20px 0 12px",
    fontSize: 15,
    fontWeight: 900,
    color: "#1e3c72",
  },
  permissionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 10,
  },
  permissionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "11px 12px",
    background: "#f8fafc",
  },
  permissionLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
  },
  switch: {
    width: 18,
    height: 18,
    accentColor: "#1e3c72",
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },
  resetBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "11px 15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  submitBtn: {
    border: "none",
    background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(234, 88, 12, 0.25)",
  },
  alert: (type) => ({
    marginTop: 14,
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    background: type === "success" ? "#ecfdf5" : "#fef2f2",
    color: type === "success" ? "#047857" : "#b91c1c",
    border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
  }),
};

export default function NewStaffCreate({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isAdminRole = form.role === "admin";

  const finalPermissions = useMemo(() => {
    if (!isAdminRole) return permissions;

    return PERMISSION_FIELDS.reduce((acc, item) => {
      acc[item.key] = 1;
      return acc;
    }, {});
  }, [isAdminRole, permissions]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  }

  function togglePermission(field) {
    setPermissions((prev) => ({
      ...prev,
      [field]: Number(prev[field] || 0) === 1 ? 0 : 1,
    }));
    setMessage(null);
  }

  function resetForm() {
    setForm({ name: "", email: "", password: "", role: "staff" });
    setPermissions(defaultPermissions);
    setMessage(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    };

    if (!payload.email || !payload.password || !payload.role) {
      setMessage({ type: "error", text: "Email, password aur role required hain." });
      return;
    }

    if (payload.password.length < 6) {
      setMessage({ type: "error", text: "Password minimum 6 characters ka hona chahiye." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const registerResponse = await api.post("/auth/register", payload);
      const userId = getUserIdFromResponse(registerResponse.data);

      if (userId) {
        await api.put(`/auth/users/${userId}/permissions`, finalPermissions);
      }

      setMessage({
        type: "success",
        text: userId
          ? "New staff successfully create ho gaya aur permissions assign ho gayi hain."
          : "New staff create ho gaya. User ID response me nahi mili, permissions Staff Manager se set kar dein.",
      });

      resetForm();
      if (typeof onCreated === "function") onCreated(registerResponse.data);
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0]?.msg ||
        error?.message ||
        "Staff create karte waqt error aa gaya.";

      setMessage({ type: "error", text: serverMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h2 style={styles.title}>Create New Staff</h2>
        </div>
        <div style={styles.badge}>Admin Access Required</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.label}>Staff Name</span>
            <input
              style={styles.input}
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="e.g. Ali Khan"
              autoComplete="name"
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Email Address</span>
            <input
              style={styles.input}
              type="email"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              placeholder="staff@lacas.com"
              autoComplete="email"
              required
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Password</span>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Role</span>
            <select
              style={styles.input}
              value={form.role}
              onChange={(event) => updateForm("role", event.target.value)}
              required
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={styles.sectionTitle}>Dashboard Permissions</div>
        <div style={styles.permissionGrid}>
          {PERMISSION_FIELDS.map((item) => (
            <label key={item.key} style={styles.permissionItem}>
              <span style={styles.permissionLabel}>{item.label}</span>
              <input
                type="checkbox"
                style={styles.switch}
                checked={Number(finalPermissions[item.key] || 0) === 1}
                disabled={isAdminRole || loading}
                onChange={() => togglePermission(item.key)}
              />
            </label>
          ))}
        </div>

        {isAdminRole ? (
          <div style={styles.alert("success")}>
            Admin role ko dashboard ka full access automatically milta hai.
          </div>
        ) : null}

        {message ? <div style={styles.alert(message.type)}>{message.text}</div> : null}

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.resetBtn}
            onClick={resetForm}
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Staff"}
          </button>
        </div>
      </form>
    </div>
  );
}
