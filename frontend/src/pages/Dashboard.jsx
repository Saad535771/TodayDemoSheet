import React, { useEffect, useMemo, useRef, useState } from "react";
import MainTuitions from "../components/MainTuitions.jsx";
import TargetBoard from "../components/TargetBoard.jsx";
import StaffManager from "../components/StaffManager.jsx";
import TrashBin from "../components/TrashBin.jsx";
import PaymentSheet from "../components/PaymentSheet.jsx";
import HodApprovals from "../components/HodApprovals.jsx";
import ActiveUsersPanel from "../components/ActiveUsersPanel.jsx";
import { api, clearToken, getStoredToken, setAuthToken } from "../api/api.js";
import Logo from "../assets/Logo-1-Blue.png";
import OtmManagement from "../components/OtmManagement.jsx";

// Agar ye components project me already mojood hain to uncomment kar den:
// import TutorShare from "../components/TutorShare.jsx";
// import LacasShare from "../components/LacasShare.jsx";
// import TotalFees from "../components/TotalFees.jsx";

const LAST_TAB_KEY = "dashboard_active_tab";
const TAB_SCROLL_KEY = "dashboard_tab_scroll_positions";
const SESSION_KEY = "dashboard_session_id";
const HEARTBEAT_MS = 20000;
const BADGE_POLL_MS = 15000;

function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

const styles = {
  dashboardContainer: {
    minHeight: "100vh",
    background: "#f8f9fc",
    fontFamily: "'Inter', sans-serif",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    transition: "all 0.3s ease",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "800",
    fontSize: "20px",
    color: "#1e3c72",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  logoIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    borderRadius: "50px",
    boxShadow: "0 4px 12px rgba(30, 60, 114, 0.3)",
    display: "flex",
    padding: "2px",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    flexShrink: 0,
  },
  tabsWrap: {
    flex: 1,
    minWidth: 0,
    overflowX: "auto",
  },
  tabsContainer: {
    display: "flex",
    background: "#f0f2f5",
    padding: "4px",
    borderRadius: "12px",
    gap: "5px",
    width: "max-content",
    minWidth: "100%",
    flexWrap: "nowrap",
  },
  tab: (isActive) => ({
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: isActive ? "#fff" : "#666",
    background: isActive ? "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" : "transparent",
    boxShadow: isActive ? "0 4px 12px rgba(30, 60, 114, 0.2)" : "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    userSelect: "none",
  }),
  badge: {
    minWidth: "20px",
    height: "20px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    padding: "0 6px",
  },
  actionSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  userInfo: {
    textAlign: "right",
    lineHeight: "1.2",
  },
  userEmail: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  userRole: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  iconBtn: {
    background: "#fff",
    border: "1px solid #e1e4e8",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    color: "#555",
    transition: "0.2s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
  },
  logoutBtn: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)",
    padding: "16px",
  },
  modalCard: {
    background: "white",
    width: "100%",
    maxWidth: "400px",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.2s ease-out",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    background: "#1e3c72",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
  },
  fallbackCard: {
    margin: "24px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  },
};

function getSavedScrollPositions() {
  try {
    const raw = sessionStorage.getItem(TAB_SCROLL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function hasAccessByRoleOrFlag(userData, permissionKey, rolesAllowed = []) {
  const role = normalizeRole(userData?.role);
  if (rolesAllowed.includes(role)) return true;
  return Boolean(userData?.[permissionKey]);
}

function DashboardFallback({ title }) {
  return (
    <div style={styles.fallbackCard}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginBottom: 0, color: "#666" }}>
        Is tab ka access aur topbar ab enable hai. Ab yahan aap apna actual component mount kar sakte hain.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("target");
  const [me, setMe] = useState(null);
  const [mountedTabs, setMountedTabs] = useState({});
  const [badgeCounts, setBadgeCounts] = useState({
    hod_approvals: 0,
    main: 0,
    target: 0,
    payment: 0,
    trash: 0,
    tutor_share: 0,
    lacas_share: 0,
    total_fees: 0,
    staff: 0,
    otm_management: 0,
  });

  const [showRegModal, setShowRegModal] = useState(false);
  const [regData, setRegData] = useState({ email: "", password: "", role: "staff" });
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState("");

  const contentRefs = useRef({});
  const scrollPositionsRef = useRef(getSavedScrollPositions());
  const heartbeatIntervalRef = useRef(null);
  const badgeIntervalRef = useRef(null);

  const role = normalizeRole(me?.role);

  const tabsConfig = useMemo(() => {
    const base = [
      {
        key: "main",
        label: "📅 Monthly Tuitions",
        permissionKey: "access_monthly",
        rolesAllowed: ["admin", "hod"],
        component: <MainTuitions />,
      },
      {
        key: "target",
        label: "🔥 Today Demo",
        permissionKey: "access_demo",
        rolesAllowed: ["admin", "hod"],
        component: <TargetBoard />,
      },
      {
        key: "payment",
        label: "💳 Payment Sheet",
        permissionKey: "access_payment_sheet",
        rolesAllowed: ["admin", "hod"],
        component: <PaymentSheet me={me} />,
      },
      {
        key: "hod_approvals",
        label: "✅ HOD Approvals",
        permissionKey: "access_hod_approvals",
        rolesAllowed: ["admin", "hod"],
        component: <HodApprovals me={me} onCountChange={(count) => updateSingleBadge("hod_approvals", count)} />,
      },
      {
        key: "trash",
        label: "🗑️ Recycle Bin",
        permissionKey: "access_trash",
        rolesAllowed: ["admin"],
        component: <TrashBin />,
      },
      {
        key: "staff",
        label: "👥 Staff",
        permissionKey: "access_staff",
        rolesAllowed: ["admin", "hod"],
        component: (
          <div style={{ padding: "24px" }}>
            <ActiveUsersPanel />
            <StaffManager />
          </div>
        ),
      },
      {
        key: "otm_management",
        label: "📘 Otm Management",
        permissionKey: "access_otm_management",
        rolesAllowed: ["otm","admin"],
        component: <OtmManagement />,
      },
    ];
    return base.map((item) => ({
      ...item,
      allowed: hasAccessByRoleOrFlag(me, item.permissionKey, item.rolesAllowed),
    }));
  }, [me]);
  const allowedTabs = useMemo(() => tabsConfig.filter((tabItem) => tabItem.allowed), [tabsConfig]);
  function getPreferredTab(userData) {
    const savedTab = sessionStorage.getItem(LAST_TAB_KEY);
    const roleNow = normalizeRole(userData?.role);
    const nextAllowedTabs = tabsConfig
      .map((t) => ({
        ...t,
        allowed:
          t.rolesAllowed.includes(roleNow) || Boolean(userData?.[t.permissionKey]),
      }))
      .filter((t) => t.allowed)
      .map((t) => t.key);

    if (savedTab && nextAllowedTabs.includes(savedTab)) {
      return savedTab;
    }

    return nextAllowedTabs[0] || "no_access";
  }

  function updateSingleBadge(key, count) {
    setBadgeCounts((prev) => ({
      ...prev,
      [key]: Number(count || 0),
    }));
  }

  async function loadAllTabBadges() {
    if (!me) return;

    const requests = [
      {
        key: "hod_approvals",
        enabled: allowedTabs.some((t) => t.key === "hod_approvals"),
        url: "/tuitions/payment-approvals/count",
        map: (data) => Number(data?.count || 0),
      },

      // Neeche apne existing APIs laga den:
      // {
      //   key: "main",
      //   enabled: allowedTabs.some((t) => t.key === "main"),
      //   url: "/tuitions/monthly/count",
      //   map: (data) => Number(data?.count || 0),
      // },
      // {
      //   key: "target",
      //   enabled: allowedTabs.some((t) => t.key === "target"),
      //   url: "/tuitions/demo/count",
      //   map: (data) => Number(data?.count || 0),
      // },
      // {
      //   key: "payment",
      //   enabled: allowedTabs.some((t) => t.key === "payment"),
      //   url: "/payment-sheet/count",
      //   map: (data) => Number(data?.count || 0),
      // },
      // {
      //   key: "trash",
      //   enabled: allowedTabs.some((t) => t.key === "trash"),
      //   url: "/trash/count",
      //   map: (data) => Number(data?.count || 0),
      // },
      // {
      //   key: "tutor_share",
      //   enabled: allowedTabs.some((t) => t.key === "tutor_share"),
      //   url: "/tutor-share/count",
      //   map: (data) => Number(data?.count || 0),
      // },
      // {
      //   key: "lacas_share",
      //   enabled: allowedTabs.some((t) => t.key === "lacas_share"),
      //   url: "/lacas-share/count",
      //   map: (data) => Number(data?.count || 0),
      // },
      // {
      //   key: "total_fees",
      //   enabled: allowedTabs.some((t) => t.key === "total_fees"),
      //   url: "/total-fees/count",
      //   map: (data) => Number(data?.count || 0),
      // },
    ];

    const enabledRequests = requests.filter((r) => r.enabled);

    if (!enabledRequests.length) return;

    await Promise.all(
      enabledRequests.map(async (item) => {
        try {
          const { data } = await api.get(item.url);
          updateSingleBadge(item.key, item.map(data));
        } catch (error) {
          console.error(`Failed to load badge count for ${item.key}:`, error?.response?.data || error.message);
        }
      })
    );
  }

  async function sendHeartbeat(currentTab) {
    try {
      const session_id = getOrCreateSessionId();
      await api.put("/auth/presence/heartbeat", {
        session_id,
        current_sheet: currentTab || "dashboard",
      });
    } catch (err) {
      console.error("Heartbeat failed:", err?.response?.data || err.message);
    }
  }

  async function markOffline() {
    try {
      const session_id = sessionStorage.getItem(SESSION_KEY);
      if (!session_id) return;

      await api.post("/auth/presence/logout", {
        session_id,
      });
    } catch (err) {
      console.error("Presence logout failed:", err?.response?.data || err.message);
    }
  }

  function saveTabPosition(tabKey) {
    if (!tabKey) return;

    const wrapper = contentRefs.current[tabKey];
    const nextPositions = {
      ...scrollPositionsRef.current,
      [tabKey]: {
        windowScroll: window.scrollY,
        innerScroll: wrapper ? wrapper.scrollTop : 0,
      },
    };

    scrollPositionsRef.current = nextPositions;
    sessionStorage.setItem(TAB_SCROLL_KEY, JSON.stringify(nextPositions));
    sessionStorage.setItem(LAST_TAB_KEY, tabKey);
  }

  function handleTabChange(nextTab) {
    if (nextTab === tab) return;
    saveTabPosition(tab);
    setTab(nextTab);
  }

  async function logout() {
    saveTabPosition(tab);
    await markOffline();
    clearToken();
    window.location.href = "/login";
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegLoading(true);
    setRegMsg("");

    try {
      await api.post("/auth/register", regData);
      setRegMsg("✅ User created successfully!");
      setRegData({ email: "", password: "", role: "staff" });

      setTimeout(() => {
        setShowRegModal(false);
        setRegMsg("");
        if (tab === "staff") {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      setRegMsg(`❌ ${err?.response?.data?.message || "Failed to create user"}`);
    } finally {
      setRegLoading(false);
    }
  }

  useEffect(() => {
    const token = getStoredToken();
    if (token) setAuthToken(token);

    api.get("/auth/me")
      .then((r) => {
        const userData = r.data.user || {};
        setMe(userData);
        const firstTab = getPreferredTab(userData);
        setTab(firstTab);
      })
      .catch((err) => {
        console.log("ME ERROR:", err.response?.data || err.message);
        setMe(null);
      });
  }, []);

  useEffect(() => {
    if (!tab) return;

    setMountedTabs((prev) => {
      if (prev[tab]) return prev;
      return { ...prev, [tab]: true };
    });
  }, [tab]);

  useEffect(() => {
    if (!tab) return;

    const restore = () => {
      const saved = scrollPositionsRef.current[tab];
      if (!saved) return;

      const wrapper = contentRefs.current[tab];

      if (wrapper && typeof saved.innerScroll === "number") {
        wrapper.scrollTop = saved.innerScroll;
      }

      window.scrollTo({
        top: typeof saved.windowScroll === "number" ? saved.windowScroll : 0,
        left: 0,
        behavior: "auto",
      });
    };

    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(restore);
      contentRefs.current.__raf2 = id2;
    });

    contentRefs.current.__raf1 = id1;

    return () => {
      if (contentRefs.current.__raf1) cancelAnimationFrame(contentRefs.current.__raf1);
      if (contentRefs.current.__raf2) cancelAnimationFrame(contentRefs.current.__raf2);
    };
  }, [tab]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveTabPosition(tab);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [tab]);

  useEffect(() => {
    if (!me || !tab || tab === "no_access") return;
    sendHeartbeat(tab);
  }, [me, tab]);

  useEffect(() => {
    if (!me) return;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat(tab);
    }, HEARTBEAT_MS);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [me, tab]);

  useEffect(() => {
    if (!me) return;

    loadAllTabBadges();

    if (badgeIntervalRef.current) {
      clearInterval(badgeIntervalRef.current);
    }

    badgeIntervalRef.current = setInterval(() => {
      loadAllTabBadges();
    }, BADGE_POLL_MS);

    return () => {
      if (badgeIntervalRef.current) {
        clearInterval(badgeIntervalRef.current);
      }
    };
  }, [me, role, allowedTabs.length]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && me) {
        sendHeartbeat(tab);
        loadAllTabBadges();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [me, tab]);

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.topbar}>
        <a href="/" style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <img src={Logo} alt="Logo" className="w-100 h-100 img-fluid" />
          </div>
        </a>

        <div style={styles.tabsWrap}>
          <div style={styles.tabsContainer}>
            {allowedTabs.map((item) => (
              <div
                key={item.key}
                style={styles.tab(tab === item.key)}
                onClick={() => handleTabChange(item.key)}
              >
                <span>{item.label}</span>
                {badgeCounts[item.key] > 0 && (
                  <span style={styles.badge}>{badgeCounts[item.key]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.actionSection}>
          {role === "admin" && (
            <button
              style={styles.iconBtn}
              onClick={() => setShowRegModal(true)}
              title="Add New Staff"
            >
              <span>➕ New Staff</span>
            </button>
          )}

          <div style={{ width: 1, height: 24, background: "#ddd" }} />

          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{me?.email || "Guest"}</span>
            <span style={styles.userRole}>{me?.role || "Admin"}</span>
          </div>

          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        {allowedTabs.map((item) => (
          mountedTabs[item.key] && (
            <div
              key={item.key}
              ref={(el) => {
                contentRefs.current[item.key] = el;
              }}
              className="fade-in"
              style={{ display: tab === item.key ? "block" : "none" }}
            >
              {item.component}
            </div>
          )
        ))}

        {tab === "no_access" && (
          <div className="fade-in" style={{ textAlign: "center", padding: 40, color: "#666" }}>
            <h3>⛔ Access Restricted</h3>
            <p>You do not have permission to view any sheets. Please contact the Admin.</p>
          </div>
        )}
      </div>

      {showRegModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRegModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0 }}>Register New Staff</h3>
              <button
                onClick={() => setShowRegModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  required
                  type="email"
                  style={styles.input}
                  placeholder="staff@portal.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  required
                  type="password"
                  style={styles.input}
                  placeholder="Create a password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <select
                  style={styles.input}
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="hod">Hod</option>
                  <option value="otm">OTM Manager</option>
                </select>
              </div>
              {regMsg && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 13,
                    marginBottom: 10,
                    background: regMsg.includes("✅") ? "#e6fffa" : "#fff5f5",
                    color: regMsg.includes("✅") ? "#2c7a7b" : "#c53030",
                  }}
                >
                  {regMsg}
                </div>
              )}

              <button type="submit" style={styles.primaryBtn} disabled={regLoading}>
                {regLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @media (max-width: 1024px) {
          .overflow-auto {
            overflow-x: hidden;
          }
        }

        @media (max-width: 768px) {
          .topbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}