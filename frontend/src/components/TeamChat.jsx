import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";
import { getChatSocket } from "../lib/chatSocket.js";

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    minHeight: "calc(100vh - 180px)",
    background: "#f5f7fb",
  },
  sidebar: {
    borderRight: "1px solid #e5e7eb",
    background: "linear-gradient(180deg, #173a67 0%, #21497a 100%)",
    color: "#fff",
    padding: "18px",
  },
  sidebarTitle: {
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "8px",
  },
  sidebarSub: {
    fontSize: "13px",
    opacity: 0.82,
    marginBottom: "16px",
  },
  groupsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  groupBtn: (active) => ({
    border: "1px solid rgba(255,255,255,0.1)",
    background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
    color: "#fff",
    borderRadius: "16px",
    padding: "14px 14px",
    textAlign: "left",
    cursor: "pointer",
  }),
  unreadBadge: {
    minWidth: "22px",
    height: "22px",
    borderRadius: "999px",
    background: "#22c55e",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "11px",
    padding: "0 6px",
  },
  main: {
    display: "grid",
    gridTemplateRows: "72px 1fr 82px",
    minWidth: 0,
  },
  topbar: {
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    padding: "14px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
  },
  topTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#163b68",
  },
  topMeta: {
    fontSize: "12px",
    color: "#64748b",
  },
  liveBadge: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
  },
  messages: {
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background:
      "radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 18%), #f8fafc",
  },
  bubbleRow: (mine) => ({
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
  }),
  bubble: (mine) => ({
    maxWidth: "72%",
    background: mine ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "#ffffff",
    color: mine ? "#fff" : "#0f172a",
    borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    padding: "12px 14px",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    border: mine ? "none" : "1px solid #e2e8f0",
  }),
  sender: {
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "5px",
    opacity: 0.82,
  },
  time: {
    fontSize: "10px",
    marginTop: "6px",
    opacity: 0.8,
    textAlign: "right",
  },
  composer: {
    background: "#fff",
    borderTop: "1px solid #e5e7eb",
    padding: "14px 18px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderRadius: "16px",
    border: "1px solid #dbe4ee",
    padding: "14px 16px",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "#fff",
    padding: "14px 18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  readOnlyBox: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: "14px",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: 700,
  },
  empty: {
    padding: "26px",
    textAlign: "center",
    color: "#64748b",
  },
};

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TeamChat({ me }) {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesRef = useRef(null);
  const socketRef = useRef(null);

  const activeGroup = useMemo(
    () => groups.find((item) => Number(item.id) === Number(activeGroupId)) || null,
    [groups, activeGroupId]
  );

  const canSend =
    me?.role === "admin" ||
    (Number(me?.access_chat || 0) === 1 &&
      Number(me?.access_chat_send || 0) === 1 &&
      !!activeGroup?.can_send);

  async function loadGroups() {
    const res = await api.get("/chat/groups");
    const rows = res.data?.groups || [];
    setGroups(rows);
    if (!activeGroupId && rows.length) {
      setActiveGroupId(rows[0].id);
    }
  }

  async function loadMessages(groupId) {
    if (!groupId) return;
    const [messagesRes, membersRes] = await Promise.all([
      api.get(`/chat/groups/${groupId}/messages?limit=100`),
      api.get(`/chat/groups/${groupId}/members`),
    ]);
    setMessages(messagesRes.data?.messages || []);
    setMembers(membersRes.data?.members || []);
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (!messagesRef.current) return;
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    });
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !activeGroupId || !canSend || sending) return;

    setSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("chat:send_message", {
          groupId: activeGroupId,
          messageText: text,
        });
      } else {
        await api.post(`/chat/groups/${activeGroupId}/messages`, {
          message_text: text,
        });
        await loadMessages(activeGroupId);
        await loadGroups();
      }
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        setLoading(true);
        await loadGroups();
      } finally {
        if (mounted) setLoading(false);
      }
    }
    boot();
    const socket = getChatSocket();
    socketRef.current = socket;
    socket.on("chat:new_message", (payload) => {
      if (Number(payload.group_id) !== Number(activeGroupId)) return;
      setMessages((prev) => {
        if (prev.some((item) => Number(item.id) === Number(payload.id))) return prev;
        return [...prev, payload];
      });
      scrollToBottom();
    });
    socket.on("chat:seen_update", (payload) => {
      if (Number(payload.group_id) !== Number(activeGroupId)) return;
      setMessages((prev) =>
        prev.map((item) => {
          if (Number(item.id) !== Number(payload.message_id)) return item;
          const already = Array.isArray(item.seen_by)
            ? item.seen_by.some((s) => Number(s.user_id) === Number(payload.user_id))
            : false;
          if (already) return item;
          return {
            ...item,
            seen_by: [...(item.seen_by || []), { user_id: payload.user_id, seen_at: payload.seen_at }],
          };
        })
      );
    });
    socket.on("chat:error", (payload) => {
      console.error("CHAT SOCKET ERROR:", payload);
    });
    return () => {
      mounted = false;
      socket.off("chat:new_message");
      socket.off("chat:seen_update");
      socket.off("chat:error");
    };
  }, [activeGroupId]);
  useEffect(() => {
    if (!activeGroupId) return;
    loadMessages(activeGroupId).then(() => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("chat:join_group", { groupId: activeGroupId });
      }
      scrollToBottom();
    });
  }, [activeGroupId]);

  useEffect(() => {
    if (!activeGroupId || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.id) return;

    api.post(`/chat/groups/${activeGroupId}/seen`, {
      message_id: lastMessage.id,
    }).catch((error) => {
      console.error("MARK SEEN ERROR:", error);
    });

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("chat:mark_seen", {
        groupId: activeGroupId,
        messageId: lastMessage.id,
      });
    }
  }, [activeGroupId, messages]);

  if (loading) {
    return <div style={styles.empty}>Loading chat...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>Team Chat</div>
        <div style={styles.sidebarSub}>Live internal group messaging</div>

        <div style={styles.groupsWrap}>
          {groups.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No groups available.</div>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                type="button"
                style={styles.groupBtn(Number(group.id) === Number(activeGroupId))}
                onClick={() => setActiveGroupId(group.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{group.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.84 }}>
                      {group.total_members} members
                    </div>
                  </div>
                  {group.unread_count > 0 ? (
                    <span style={styles.unreadBadge}>{group.unread_count}</span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <div style={styles.topTitle}>{activeGroup?.name || "Select Group"}</div>
            <div style={styles.topMeta}>
              {members.length} visible members • {activeGroup?.description || "Internal communication"}
            </div>
          </div>
          <div style={styles.liveBadge}>● Live Chat</div>
        </div>

        <div ref={messagesRef} style={styles.messages}>
          {messages.length === 0 ? (
            <div style={styles.empty}>No messages yet.</div>
          ) : (
            messages.map((item) => {
              const mine = Number(item.sender_id) === Number(me?.id);
              return (
                <div key={item.id} style={styles.bubbleRow(mine)}>
                  <div style={styles.bubble(mine)}>
                    {!mine ? (
                      <div style={styles.sender}>{item.sender?.name || item.sender?.email || "User"}</div>
                    ) : null}
                    <div>{item.message_text}</div>
                    <div style={styles.time}>
                      {formatTime(item.created_at)}
                      {mine && Array.isArray(item.seen_by) && item.seen_by.length > 1 ? " • Seen" : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={styles.composer}>
          {canSend ? (
            <>
              <input
                style={styles.input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button type="button" style={styles.sendBtn} onClick={handleSend} disabled={sending}>
                Send
              </button>
            </>
          ) : (
            <div style={styles.readOnlyBox}>
              Read only mode enabled. Aap messages dekh sakte hain lekin send nahi kar sakte.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
