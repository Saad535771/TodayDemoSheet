import React, { useEffect, useMemo, useRef, useState } from "react";
import MainTuitions from "../components/MainTuitions.jsx";
import TargetBoard from "../components/TargetBoard.jsx";
import StaffManager from "../components/StaffManager.jsx";
import TrashBin from "../components/TrashBin.jsx";
import PaymentSheet from "../components/PaymentSheet.jsx";
import HodApprovals from "../components/HodApprovals.jsx";
import ActiveUsersPanel from "../components/ActiveUsersPanel.jsx";
import FloatingChatWidget from "../components/FloatingChatWidget.jsx";
import { api, clearToken, getStoredToken, setAuthToken } from "../api/api.js";
import { getRealtimeSocket } from "../api/realtime.js";
import NewStaffCreate from "../components/NewStaffCreate.jsx";
import Logo from "../assets/Logo-1-Blue.png";
import OtmManagement from "../components/OtmManagement.jsx";
import TeamChat from "../components/TeamChat.jsx";
const LAST_TAB_KEY = "dashboard_active_tab";
const TAB_SCROLL_KEY = "dashboard_tab_scroll_positions";
const SESSION_KEY = "dashboard_session_id";
const HEARTBEAT_MS = 20000;
const BADGE_POLL_MS = 15000;
const BADGE_META_KEY = "dashboard_badge_meta_v2";

const DEFAULT_BADGE_META = {
  hod_approvals: { total: 0, newCount: 0 },
  main: { total: 0, newCount: 0 },
  target: { total: 0, newCount: 0 },
  payment: { total: 0, newCount: 0 },
  trash: { total: 0, newCount: 0 },
  staff: { total: 0, newCount: 0 },
  otm_management: { total: 0, newCount: 0 },
  chat: { total: 0, newCount: 0 },
};

function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getSavedScrollPositions() {
  try {
    const raw = sessionStorage.getItem(TAB_SCROLL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getSavedBadgeMeta() {
  try {
    const raw = localStorage.getItem(BADGE_META_KEY);
    if (!raw) return { ...DEFAULT_BADGE_META };
    return { ...DEFAULT_BADGE_META, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_BADGE_META };
  }
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function hasAccessByRoleOrFlag(userData, permissionKey) {
  const role = normalizeRole(userData?.role);
  if (role === "admin") return true;
  return Number(userData?.[permissionKey] || 0) === 1;
}

function readCountFromResponse(data) {
  if (typeof data === "number") return data;
  if (typeof data?.count === "number") return data.count;
  if (typeof data?.total === "number") return data.total;
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data?.items)) return data.items.length;
  if (Array.isArray(data?.rows)) return data.rows.length;
  if (Array.isArray(data?.groups)) return data.groups.length;
  if (Array.isArray(data?.messages)) return data.messages.length;
  if (Array.isArray(data?.slots)) {
    return data.slots.reduce(
      (sum, slot) => sum + (Array.isArray(slot?.items) ? slot.items.length : 0),
      0
    );
  }
  if (Array.isArray(data?.users)) return data.users.length;
  if (Array.isArray(data?.entries)) return data.entries.length;
  if (Array.isArray(data?.otmUsers)) return data.otmUsers.length;
  return 0;
}

async function fetchBadgeCountByKey(key) {
  switch (key) {
    case "hod_approvals": {
      const { data } = await api.get("/tuitions/payment-approvals/count");
      return readCountFromResponse(data);
    }
    case "main": {
      const { data } = await api.get("/tuitions");
      return readCountFromResponse(data);
    }
    case "target": {
      const { data } = await api.get("/target");
      return readCountFromResponse(data);
    }
    case "payment": {
      const { data } = await api.get("/payments");
      return readCountFromResponse(data);
    }
    case "chat": {
      const { data } = await api.get("/chat/unread-total");
      return data?.total_unread || 0;
    }
    case "trash": {
      const [monthlyTrashResult, paymentTrashResult] = await Promise.allSettled([
        api.get("/tuitions/trash"),
        api.get("/payments-clone/trash/all"),
      ]);

      const monthlyCount =
        monthlyTrashResult.status === "fulfilled"
          ? readCountFromResponse(monthlyTrashResult.value?.data)
          : 0;

      const paymentCount =
        paymentTrashResult.status === "fulfilled"
          ? readCountFromResponse(paymentTrashResult.value?.data)
          : 0;

      return monthlyCount + paymentCount;
    }
    case "staff": {
      const { data } = await api.get("/auth/active-users");
      return readCountFromResponse(data);
    }
    case "otm_management": {
      const { data } = await api.get("/otm-management/entries");
      return readCountFromResponse(data);
    }
    default:
      return 0;
  }
}

function DashboardFallback({ title }) {
  return (
    <div
      style={{
        margin: "24px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginBottom: 0, color: "#666" }}>
        Is tab ka component available nahin hai.
      </p>
    </div>
  );
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
    background: isActive
      ? "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
      : "transparent",
    boxShadow: isActive ? "0 4px 12px rgba(30, 60, 114, 0.2)" : "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    userSelect: "none",
    position: "relative",
    border: "none",
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
  userName: {
    fontWeight: 700,
    color: "#1f2937",
    fontSize: 14,
  },
  userRole: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "capitalize",
  },
  logoutBtn: {
    border: "none",
    background: "#ef4444",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  contentWrap: {
    padding: 18,
  },
  contentCard: {
    background: "#ffffff",
    borderRadius: 18,
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
    minHeight: "calc(100vh - 120px)",
  },
};

export default function Dashboard() {
  const [tab, setTab] = useState("target");
  const [me, setMe] = useState(null);
  const [badgeMeta, setBadgeMeta] = useState(getSavedBadgeMeta);

  const badgeMetaRef = useRef(getSavedBadgeMeta());
  const contentRefs = useRef({});
  const scrollPositionsRef = useRef(getSavedScrollPositions());
  const heartbeatIntervalRef = useRef(null);
  const badgeIntervalRef = useRef(null);
  const hasBadgeBaselineRef = useRef(false);

  const role = normalizeRole(me?.role);

  function persistBadgeMeta(next) {
    badgeMetaRef.current = next;
    setBadgeMeta(next);
    localStorage.setItem(BADGE_META_KEY, JSON.stringify(next));
  }

  function syncTabCount(key, total) {
    const safeTotal = Math.max(0, Number(total || 0));
    const prev = badgeMetaRef.current[key] || { total: 0, newCount: 0 };
    const increment = safeTotal > prev.total ? safeTotal - prev.total : 0;
    const shouldResetNew = tab === key;

    const next = {
      ...badgeMetaRef.current,
      [key]: {
        total: safeTotal,
        newCount: shouldResetNew ? 0 : prev.newCount + increment,
      },
    };

    persistBadgeMeta(next);
  }

  function clearTabNewCount(key) {
    const prev = badgeMetaRef.current[key] || { total: 0, newCount: 0 };
    persistBadgeMeta({
      ...badgeMetaRef.current,
      [key]: {
        total: prev.total,
        newCount: 0,
      },
    });
  }


  function applyNotificationSummary(summary = {}, activeKey = tab) {
    const modules = summary?.modules || {};
    const next = { ...DEFAULT_BADGE_META, ...badgeMetaRef.current };

    Object.keys(DEFAULT_BADGE_META).forEach((key) => {
      if (key === "chat") return; // chat ka apna unread system already hai

      const moduleMeta = modules[key] || {};
      const unread = Number(
        moduleMeta.newCount ?? moduleMeta.unread_count ?? moduleMeta.total ?? 0
      ) || 0;
      const prev = next[key] || { total: 0, newCount: 0 };

      next[key] = {
        ...prev,
        newCount: key === activeKey ? 0 : Math.max(0, unread),
      };
    });

    persistBadgeMeta(next);
  }

  async function loadNotificationSummary(activeKey = tab) {
    try {
      const { data } = await api.get("/notifications/unread-summary");
      applyNotificationSummary(data, activeKey);
    } catch (error) {
      console.error("Notification summary failed:", error?.response?.data || error.message);
    }
  }

  async function markNotificationSeen(moduleKey) {
    if (!moduleKey || moduleKey === "chat") return;

    try {
      const { data } = await api.post("/notifications/mark-seen", {
        module_key: moduleKey,
      });
      applyNotificationSummary(data?.summary || {}, moduleKey);
    } catch (error) {
      console.error("Mark notification seen failed:", error?.response?.data || error.message);
      clearTabNewCount(moduleKey);
    }
  }

  const tabsConfig = useMemo(() => {
    return [
      {
        key: "main",
        label: "📅 Monthly Tuitions",
        permissionKey: "access_monthly",
        component: (
          <MainTuitions
            isActive={tab === "main"}
            onCountChange={(count) => syncTabCount("main", count)}
          />
        ),
      },
      {
        key: "target",
        label: "🔥 Today Demo",
        permissionKey: "access_demo",
        component: (
          <TargetBoard
            isActive={tab === "target"}
            onCountChange={(count) => syncTabCount("target", count)}
          />
        ),
      },
      {
        key: "payment",
        label: "💳 Payment Sheet",
        permissionKey: "access_payment_sheet",
        component: (
          <PaymentSheet
            me={me}
            isActive={tab === "payment"}
            onCountChange={(count) => syncTabCount("payment", count)}
          />
        ),
      },
      {
        key: "hod_approvals",
        label: "✅ HOD Approvals",
        permissionKey: "access_hod_approvals",
        component: (
          <HodApprovals
            me={me}
            onCountChange={(count) => syncTabCount("hod_approvals", count)}
          />
        ),
      },
      {
        key: "trash",
        label: "🗑️ Recycle Bin",
        permissionKey: "access_trash",
        component: (
          <TrashBin
            isActive={tab === "trash"}
            onCountChange={(count) => syncTabCount("trash", count)}
          />
        ),
      },
      {
        key: "chat",
        label: "💬 Team Chat",
        permissionKey: "access_chat",
        component: <TeamChat me={me} />,
      },
      {
        key: "staff",
        label: "👥 Staff",
        permissionKey: "access_staff",
        component: (
          <div style={{ padding: "24px" }}>
            <NewStaffCreate />
            <ActiveUsersPanel />
            <StaffManager />
          </div>
        ),
      },
      {
        key: "otm_management",
        label: "📘 Management Portal",
        permissionKey: "access_otm_management",
        component: (
          <OtmManagement
            isActive={tab === "otm_management"}
            onCountChange={(count) => syncTabCount("otm_management", count)}
          />
        ),
      },
    ];
  }, [me, tab]);

  const allowedTabs = useMemo(() => {
    return tabsConfig.filter((item) => {
      if (item.key === "chat") {
        return (
          normalizeRole(me?.role) === "admin" ||
          Number(me?.access_chat || 0) === 1 ||
          Number(me?.access_chat_send || 0) === 1
        );
      }
      return hasAccessByRoleOrFlag(me, item.permissionKey);
    });
  }, [me, tabsConfig]);

  const activeTabConfig = useMemo(
    () => allowedTabs.find((item) => item.key === tab) || allowedTabs[0] || null,
    [allowedTabs, tab]
  );

  function getAllowedTabKeys(userData) {
    return tabsConfig
      .filter((item) => hasAccessByRoleOrFlag(userData, item.permissionKey))
      .map((item) => item.key);
  }

  function getPreferredTab(userData) {
    const savedTab = sessionStorage.getItem(LAST_TAB_KEY);
    const nextAllowedTabs = tabsConfig
      .filter((t) => hasAccessByRoleOrFlag(userData, t.permissionKey))
      .map((t) => t.key);

    if (savedTab && nextAllowedTabs.includes(savedTab)) {
      return savedTab;
    }

    return nextAllowedTabs[0] || "no_access";
  }

  async function loadAllTabBadgesForUser(userData, activeTabKey, options = {}) {
    if (!userData) return;

    const { initialize = false } = options;
    const allowedKeys = getAllowedTabKeys(userData);

    const requests = [
      "hod_approvals",
      "main",
      "target",
      "payment",
      "trash",
      "staff",
      "otm_management",
      "chat",
    ].filter((key) => allowedKeys.includes(key));

    await Promise.all(
      requests.map(async (key) => {
        try {
          const count = await fetchBadgeCountByKey(key);
          const safeTotal = Math.max(0, Number(count || 0));
          const prev = badgeMetaRef.current[key] || { total: 0, newCount: 0 };

          if (initialize) {
            persistBadgeMeta({
              ...badgeMetaRef.current,
              [key]: {
                total: safeTotal,
                newCount: 0,
              },
            });
            return;
          }

          const increment = safeTotal > prev.total ? safeTotal - prev.total : 0;

          persistBadgeMeta({
            ...badgeMetaRef.current,
            [key]: {
              total: safeTotal,
              newCount: activeTabKey === key ? 0 : prev.newCount + increment,
            },
          });
        } catch (error) {
          console.error(
            `Failed to load badge count for ${key}:`,
            error?.response?.data || error.message
          );
        }
      })
    );
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
    clearTabNewCount(nextTab);
    void markNotificationSeen(nextTab);
    setTab(nextTab);
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
      await api.post("/auth/presence/logout", { session_id });
    } catch (err) {
      console.error("Presence logout failed:", err?.response?.data || err.message);
    }
  }

  async function logout() {
    saveTabPosition(tab);
    await markOffline();
    clearToken();
    window.location.href = "/login";
  }

  useEffect(() => {
    const token = getStoredToken();
    if (token) setAuthToken(token);

    api
      .get("/auth/me")
      .then(async (r) => {
        const userData = r.data.user || {};
        const firstTab = getPreferredTab(userData);

        setMe(userData);
        setTab(firstTab);

        hasBadgeBaselineRef.current = false;
        clearTabNewCount(firstTab);

        await markNotificationSeen(firstTab);
        await loadNotificationSummary(firstTab);
        hasBadgeBaselineRef.current = true;
      })
      .catch((err) => {
        console.log("ME ERROR:", err.response?.data || err.message);
        setMe(null);
      });
  }, []);

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
    if (!me) return undefined;

    const socket = getRealtimeSocket();
    if (!socket) return undefined;

    const requestSummary = () => {
      socket.emit("notifications:summary");
    };

    const handleSummary = (summary) => {
      applyNotificationSummary(summary, tab);
    };

    const handleNewNotification = (payload = {}) => {
      const moduleKey = payload.module_key || payload.moduleKey;

      if (!moduleKey) {
        requestSummary();
        return;
      }

      if (moduleKey === tab) {
        void markNotificationSeen(moduleKey);
        return;
      }

      const prev = badgeMetaRef.current[moduleKey] || { total: 0, newCount: 0 };
      persistBadgeMeta({
        ...badgeMetaRef.current,
        [moduleKey]: {
          ...prev,
          newCount: Number(prev.newCount || 0) + 1,
        },
      });

      requestSummary();
    };

    const handleSeen = (payload = {}) => {
      const moduleKey = payload.module_key || payload.moduleKey;
      if (!moduleKey || moduleKey === tab) {
        requestSummary();
      }
    };

    socket.on("connect", requestSummary);
    socket.on("notifications:summary", handleSummary);
    socket.on("notifications:new", handleNewNotification);
    socket.on("notification:new", handleNewNotification);
    socket.on("notifications:seen", handleSeen);

    if (!socket.connected) {
      socket.connect();
    } else {
      requestSummary();
    }

    return () => {
      socket.off("connect", requestSummary);
      socket.off("notifications:summary", handleSummary);
      socket.off("notifications:new", handleNewNotification);
      socket.off("notification:new", handleNewNotification);
      socket.off("notifications:seen", handleSeen);
    };
  }, [me, tab]);

  useEffect(() => {
    if (!me || !tab) return;

    void sendHeartbeat(tab);

    heartbeatIntervalRef.current = window.setInterval(() => {
      void sendHeartbeat(tab);
    }, HEARTBEAT_MS);

    // Realtime notifications now come from Socket.IO + /notifications/unread-summary.
    // Old 15-second badge polling is disabled to avoid duplicate counts.

    const handleBeforeUnload = () => {
      saveTabPosition(tab);
      void markOffline();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
      }
      if (badgeIntervalRef.current) {
        window.clearInterval(badgeIntervalRef.current);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [me, tab]);

  const currentTitle = activeTabConfig?.label || "Dashboard";
{me && (role === "admin" || Number(me?.access_chat || 0) === 1) ? (
  <FloatingChatWidget me={me} />
) : null}
  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.topbar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <img
              src={Logo}
              alt="LACAS"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 999,
              }}
            />
          </div>
          <div>LACAS Dashboard</div>
        </div>

        <div style={styles.tabsWrap}>
          <div style={styles.tabsContainer}>
            {allowedTabs.map((item) => {
              const meta =
                badgeMeta[item.key] ||
                DEFAULT_BADGE_META[item.key] ||
                { total: 0, newCount: 0 };

              const isActive = item.key === tab;
              const shouldShowBadge = !isActive && meta.newCount > 0;
              const tooltip = shouldShowBadge
                ? `${meta.newCount} new record(s) added`
                : "No new records";

              return (
                <button
                  key={item.key}
                  type="button"
                  style={styles.tab(isActive)}
                  onClick={() => handleTabChange(item.key)}
                  title={tooltip}
                  aria-label={`${item.label} - ${tooltip}`}
                >
                  <span>{item.label}</span>
                  {item.key === "chat" ? (
                    meta.total > 0 && !isActive ? (
                      <span style={{ ...styles.badge, background: "#ef4444" }}>{meta.total}</span>
                    ) : null
                  ) : (
                    shouldShowBadge ? (
                      <span style={styles.badge}>{meta.newCount}</span>
                    ) : null
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.actionSection}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{me?.email || "User"}</div>
            <div style={styles.userRole}>{role || "staff"}</div>
          </div>
          <button type="button" style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.contentWrap}>
        <div style={styles.contentCard}>
          <div style={{ padding: "16px 20px 0", fontWeight: 800, color: "#1f2937" }}>
            {currentTitle}
          </div>

          <div
            ref={(node) => {
              if (activeTabConfig?.key) {
                contentRefs.current[activeTabConfig.key] = node;
              }
            }}
            style={{ minHeight: "calc(100vh - 180px)" }}
          >
            {activeTabConfig ? (
              activeTabConfig.component
            ) : (
              <DashboardFallback title="No access" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}