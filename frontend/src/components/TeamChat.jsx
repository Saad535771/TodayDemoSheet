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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    fontSize: 18,
    opacity: 0.8,
    ":hover": {
      opacity: 1,
      background: "rgba(255,255,255,0.1)",
    }
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
  const [allUsers, setAllUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Call States
  const [callState, setCallState] = useState(null); // 'calling', 'ringing', 'active'
  const [incomingCall, setIncomingCall] = useState(null); // { from, groupId, type }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callType, setCallType] = useState('Audio');

  const messagesRef = useRef(null);
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const pcRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  const activeGroup = useMemo(
    () => groups.find((item) => Number(item.id) === Number(activeGroupId)) || null,
    [groups, activeGroupId]
  );

  const canView =
    me?.role === "admin" ||
    Number(me?.access_chat || 0) === 1 ||
    Number(me?.access_chat_send || 0) === 1;

  const canSend =
    me?.role === "admin" ||
    (Number(me?.access_chat_send || 0) === 1 &&
      (activeGroupId ? !!activeGroup?.can_send : true));

  async function loadGroups() {
    if (!canView) return;
    try {
      const res = await api.get("/chat/groups");
      const rows = res.data?.groups || [];
      setGroups(rows);
    } catch (err) {
      console.error("LOAD GROUPS ERROR:", err);
    }
  }

  async function loadAllUsers() {
    if (!canView) return;
    try {
      const res = await api.get("/auth/users");
      const list = res.data?.users || res.data?.data || [];
      setAllUsers(list.filter((u) => u.id !== me?.id));
    } catch (err) {
      console.error("LOAD ALL USERS ERROR:", err);
    }
  }

  async function startDM(userId) {
    try {
      const res = await api.post(`/chat/dm/${userId}`);
      if (res.data?.success) {
        const gid = res.data.groupId;
        await loadGroups();
        setActiveGroupId(gid);
      }
    } catch (err) {
      console.error("START DM ERROR:", err);
      alert("Failed to start private chat");
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
        setDraft("");
      } else {
        await api.post(`/chat/groups/${activeGroupId}/messages`, {
          message_text: text,
        });
        await Promise.all([loadMessages(activeGroupId), loadGroups()]);
        setDraft("");
      }
    } catch (err) {
      console.error("HANDLE SEND ERROR:", err);
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "voice");

        try {
          const res = await api.post(`/chat/groups/${activeGroupId}/upload`, formData);
          if (res.data.success) {
            const socket = socketRef.current;
            if (socket?.connected) {
              socket.emit("chat:send_message", {
                groupId: activeGroupId,
                messageText: res.data.message.message_text,
                messageType: "voice"
              });
            }
            await loadMessages(activeGroupId);
          }
        } catch (err) {
          console.error("VOICE UPLOAD ERROR:", err);
          alert("Failed to send voice message");
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("MIC ACCESS ERROR:", err);
      alert("Microphone access denied");
    }
  }

  function stopRecording() {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  async function handleCall(type) {
    if (!activeGroupId) return;
    setCallType(type);
    setCallState('calling');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'Video'
      });
      setLocalStream(stream);
      
      const socket = socketRef.current;
      if (socket) {
        socket.emit("chat:call_user", { groupId: activeGroupId, type });
      }
    } catch (err) {
      console.error("CALL ACCESS ERROR:", err);
      alert("Camera/Mic access denied");
      setCallState(null);
    }
  }

  async function createPC(groupId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("chat:webrtc_signal", {
          groupId,
          signal: { candidate: e.candidate }
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pcRef.current = pc;
    return pc;
  }

  async function answerCall() {
    if (!incomingCall) return;
    const { groupId, type } = incomingCall;
    setCallType(type);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'Video'
      });
      setLocalStream(stream);
      
      const pc = await createPC(groupId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      socketRef.current?.emit("chat:accept_call", { groupId });
      setCallState('active');
      setIncomingCall(null);
    } catch (err) {
      console.error("ANSWER CALL ERROR:", err);
      setIncomingCall(null);
    }
  }

  function rejectCall() {
    if (incomingCall) {
      socketRef.current?.emit("chat:reject_call", { groupId: incomingCall.groupId });
      setIncomingCall(null);
    }
  }

  function endCall() {
    const groupId = activeGroupId || incomingCall?.groupId;
    if (groupId) {
      socketRef.current?.emit("chat:end_call", { groupId });
    }
    cleanupCall();
  }

  function cleanupCall() {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState(null);
    setIncomingCall(null);
  }

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        setLoading(true);
        await Promise.all([loadGroups(), loadAllUsers()]);
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
      alert("Chat Error: " + (payload.message || "Unknown socket error"));
    });


    socket.on("chat:call_accepted", async () => {
      setCallState('active');
      const pc = await createPC(activeGroupId);
      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("chat:webrtc_signal", {
        groupId: activeGroupId,
        signal: { sdp: pc.localDescription }
      });
    });

    socket.on("chat:call_rejected", () => {
      alert("Call rejected");
      cleanupCall();
    });

    socket.on("chat:webrtc_signal", async ({ signal }) => {
      const pc = pcRef.current;
      if (!pc) return;
      
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (pc.remoteDescription.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("chat:webrtc_signal", {
            groupId: activeGroupId || incomingCall?.groupId,
            signal: { sdp: pc.localDescription }
          });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    socket.on("chat:call_ended", () => {
      cleanupCall();
    });

    return () => {
      mounted = false;
      socket.off("chat:new_message");
      socket.off("chat:seen_update");
      socket.off("chat:error");
    };
  }, [activeGroupId]);

  useEffect(() => {
    const socket = getChatSocket();
    const handleInCall = (p) => {
      console.log("INCOMING CALL SIGNAL RECEIVED:", p);
      setIncomingCall(p);
      // Temporary alert to verify signal reach
      alert(`Incoming Call from ${p.from.name}! Check if the modal appears.`);
    };
    socket.on("chat:incoming_call", handleInCall);
    return () => socket.off("chat:incoming_call", handleInCall);
  }, []);
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

        <div
          style={{
            margin: "15px 0",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginRight: 8, fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search users..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        <div style={styles.groupsWrap}>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.6, textTransform: "uppercase", marginBottom: 8 }}>Users</div>
          
          {allUsers.length === 0 ? (
            <div style={{ opacity: 0.8, fontSize: 12, padding: "10px" }}>No users found.</div>
          ) : (
            allUsers
              .filter(u => u.email.toLowerCase().includes(searchUser.toLowerCase()) || (u.name && u.name.toLowerCase().includes(searchUser.toLowerCase())))
              .map((user) => {
                const dmGroup = groups.find(g => g.name.startsWith("DM:") && g.name.includes(user.email));
                const isActive = dmGroup && Number(dmGroup.id) === Number(activeGroupId);
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    style={styles.groupBtn(isActive)}
                    onClick={() => startDM(user.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ overflow: "hidden", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: "50%", 
                          background: "rgba(255,255,255,0.1)", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 800,
                          position: "relative"
                        }}>
                          {(user.name || user.email)[0].toUpperCase()}
                          <div style={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: "50%", 
                            background: user.is_online ? "#22c55e" : "#94a3b8", 
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            border: "2px solid #173a67"
                          }} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", maxWidth: 160 }}>
                            {user.name || user.email.split('@')[0]}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.6, textTransform: "capitalize" }}>
                            {user.role}
                          </div>
                        </div>
                      </div>
                      {dmGroup && dmGroup.unread_count > 0 ? (
                        <span style={styles.unreadBadge}>{dmGroup.unread_count}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <div style={styles.topTitle}>
              {activeGroupId ? (
                activeGroup?.name?.startsWith("DM:") 
                  ? activeGroup.name.split("&").find(n => !n.includes(me?.name || me?.email))?.replace("DM:", "")?.trim() || activeGroup.name
                  : activeGroup?.name
              ) : (
                "Select a user to chat"
              )}
            </div>
            <div style={styles.topMeta}>
              {activeGroupId ? (activeGroup?.name?.startsWith("DM:") ? "Private Conversation" : `${members.length} visible members`) : "Start a private conversation"}
            </div>
          </div>
          <div style={styles.liveBadge}>● Live Chat</div>
          <div style={{ display: "flex", gap: 12, marginLeft: 20 }}>
            <button onClick={() => handleCall('Audio')} style={styles.iconBtn} title="Audio Call">📞</button>
            <button onClick={() => handleCall('Video')} style={styles.iconBtn} title="Video Call">📹</button>
          </div>
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
                    {item.message_type === "voice" ? (
                      <audio 
                        src={`${import.meta.env.VITE_API_BASE_URL || ""}${item.message_text}`} 
                        controls 
                        style={{ maxWidth: "100%", marginTop: 5, height: 32 }} 
                      />
                    ) : (
                      <div style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{item.message_text}</div>
                    )}
                    <div style={styles.time}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
            <div style={{ display: "flex", gap: 10, width: "100%", alignItems: "center" }}>
              {isRecording ? (
                <div style={{ display: "flex", alignItems: "center", gap: 15, flex: 1, padding: "0 10px", color: "#ef4444", fontWeight: 700 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: "#ef4444", borderRadius: "50%" }}></span>
                  <span>Recording {formatDuration(recordingTime)}</span>
                  <button type="button" onClick={stopRecording} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>Stop & Send</button>
                  <button type="button" onClick={() => { setIsRecording(false); clearInterval(timerRef.current); if(recorderRef.current) { recorderRef.current.stop(); recorderRef.current.onstop = null; } }} style={{ background: "transparent", color: "#64748b", border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
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
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={{ ...styles.iconBtn, fontSize: 20, padding: "0 10px", background: isRecording ? "#fecaca" : "transparent" }}
                  onClick={isRecording ? stopRecording : startRecording}
                  title="Voice Message"
                >
                  🎤
                </button>
                <button type="button" style={styles.sendBtn} onClick={handleSend} disabled={sending || isRecording}>
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.readOnlyBox}>
              Read only mode enabled. Aap messages dekh sakte hain lekin send nahi kar sakte.
            </div>
          )}
        </div>
      </div>
      {/* INCOMING CALL MODAL */}
      {incomingCall && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 20, textAlign: "center", width: 320 }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>{incomingCall.type === 'Video' ? '📹' : '📞'}</div>
            <h3 style={{ margin: 0, color: "#1e293b" }}>{incomingCall.from.name}</h3>
            <p style={{ color: "#64748b" }}>Incoming {incomingCall.type} Call...</p>
            <div style={{ display: "flex", gap: 15, justifyContent: "center", marginTop: 25 }}>
              <button onClick={answerCall} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 12, padding: "12px 25px", fontWeight: 700, cursor: "pointer" }}>Answer</button>
              <button onClick={rejectCall} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 12, padding: "12px 25px", fontWeight: 700, cursor: "pointer" }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE CALL OVERLAY */}
      {callState && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0f172a", zIndex: 10000, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {callType === 'Video' ? (
              <>
                <video 
                  autoPlay 
                  playsInline 
                  ref={el => { if(el && remoteStream) el.srcObject = remoteStream; }} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
                <video 
                  autoPlay 
                  playsInline 
                  muted 
                  ref={el => { if(el && localStream) el.srcObject = localStream; }} 
                  style={{ position: "absolute", top: 20, right: 20, width: 200, height: 150, borderRadius: 12, border: "2px solid #fff", objectFit: "cover" }} 
                />
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 80, marginBottom: 20 }}>👤</div>
                <h2>{callState === 'active' ? 'Ongoing Call' : 'Calling...'}</h2>
                <div className="pulse" style={{ fontSize: 18, opacity: 0.7 }}>{callState === 'active' ? 'Connected' : 'Waiting for answer...'}</div>
              </div>
            )}
          </div>
          <div style={{ height: 100, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
            <button onClick={endCall} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 60, height: 60, fontSize: 24, cursor: "pointer" }}>🔚</button>
          </div>
          {/* Hidden Audio for remote stream when in Audio mode */}
          {callType === 'Audio' && remoteStream && (
            <audio autoPlay ref={el => { if(el) el.srcObject = remoteStream; }} />
          )}
        </div>
      )}
    </div>
  );
}
