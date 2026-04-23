
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { api } from "../api/api.js";
import { getChatSocket } from "../lib/chatSocket.js";

const PANEL_WIDTH = 430;
const PANEL_HEIGHT = 640;
const HEADER_HEIGHT = 72;

const styles = {
  launcherWrap:{position:"fixed",right:"24px",bottom:"24px",zIndex:999999},
  launcherBtn:{position:"relative",width:"68px",height:"68px",borderRadius:"999px",border:"1px solid rgba(255,255,255,0.22)",background:"linear-gradient(135deg, rgba(30,60,114,0.95), rgba(42,82,152,0.95))",color:"#fff",cursor:"pointer",boxShadow:"0 18px 40px rgba(30,60,114,0.28)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",fontSize:"26px",fontWeight:800},
  unreadBadge:{position:"absolute",top:"-4px",right:"-4px",minWidth:"24px",height:"24px",borderRadius:"999px",background:"#ef4444",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:800,padding:"0 6px",boxShadow:"0 6px 16px rgba(239,68,68,0.35)"},
  panel:(x,y,minimized)=>({position:"fixed",left:x,top:y,width:PANEL_WIDTH,height:minimized?HEADER_HEIGHT:PANEL_HEIGHT,borderRadius:"24px",overflow:"hidden",zIndex:999999,border:"1px solid rgba(255,255,255,0.18)",background:"linear-gradient(180deg, rgba(255,255,255,0.74), rgba(255,255,255,0.56))",boxShadow:"0 28px 70px rgba(15,23,42,0.22)",backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",display:"grid",gridTemplateRows:minimized?"1fr":"72px 52px 1fr 78px",transition:"height 0.22s ease"}),
  header:{background:"linear-gradient(135deg, rgba(23,58,103,0.94), rgba(33,73,122,0.92))",color:"#fff",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",cursor:"grab",userSelect:"none"},
  title:{fontSize:"18px",fontWeight:800,marginBottom:"3px"},
  subtitle:{fontSize:"12px",opacity:0.84,display:"flex",alignItems:"center",gap:"8px"},
  liveDot:(online)=>({width:"10px",height:"10px",borderRadius:"999px",background:online?"#22c55e":"#94a3b8",boxShadow:online?"0 0 0 4px rgba(34,197,94,0.16)":"none"}),
  headerActions:{display:"flex",alignItems:"center",gap:"8px"},
  iconBtn:{width:"36px",height:"36px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.18)",background:"rgba(255,255,255,0.12)",color:"#fff",cursor:"pointer",fontSize:"18px",fontWeight:800},
  switchBar:{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",borderBottom:"1px solid rgba(148,163,184,0.18)",background:"rgba(255,255,255,0.38)"},
  switchBtn:(active)=>({border:"1px solid rgba(148,163,184,0.22)",background:active?"linear-gradient(135deg, rgba(30,60,114,0.94), rgba(42,82,152,0.92))":"rgba(255,255,255,0.72)",color:active?"#fff":"#163b68",borderRadius:"999px",padding:"8px 12px",fontSize:"12px",fontWeight:800,cursor:"pointer"}),
  groupSelect:{flex:1,minWidth:0,border:"1px solid rgba(148,163,184,0.28)",background:"rgba(255,255,255,0.82)",borderRadius:"12px",padding:"9px 11px",fontSize:"13px",outline:"none"},
  body:{padding:"12px",overflowY:"auto",background:"radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 18%), rgba(248,250,252,0.48)",display:"flex",flexDirection:"column",gap:"10px"},
  loadingTop:{fontSize:"11px",color:"#64748b",textAlign:"center",padding:"6px 0"},
  bubbleRow:(mine)=>({display:"flex",justifyContent:mine?"flex-end":"flex-start"}),
  bubble:(mine)=>({maxWidth:"78%",background:mine?"linear-gradient(135deg, rgba(29,78,216,0.95), rgba(37,99,235,0.92))":"rgba(255,255,255,0.78)",color:mine?"#fff":"#0f172a",border:mine?"none":"1px solid rgba(226,232,240,0.9)",borderRadius:mine?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 12px",boxShadow:"0 8px 20px rgba(15,23,42,0.08)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}),
  sender:{fontSize:"11px",fontWeight:800,marginBottom:"4px",opacity:0.82},
  time:{fontSize:"10px",marginTop:"5px",opacity:0.8,textAlign:"right"},
  memberCard:{display:"flex",alignItems:"center",gap:"10px",background:"rgba(255,255,255,0.72)",border:"1px solid rgba(226,232,240,0.88)",borderRadius:"16px",padding:"10px 12px",boxShadow:"0 8px 18px rgba(15,23,42,0.04)"},
  avatar:{width:"38px",height:"38px",borderRadius:"999px",background:"linear-gradient(135deg, #1e3c72, #2a5298)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"14px",flexShrink:0},
  memberMeta:{minWidth:0,flex:1},
  memberName:{fontSize:"13px",fontWeight:800,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  memberSub:{fontSize:"11px",color:"#64748b",display:"flex",alignItems:"center",gap:"8px",marginTop:"2px"},
  onlineDotSmall:(online)=>({width:"8px",height:"8px",borderRadius:"999px",background:online?"#22c55e":"#cbd5e1",boxShadow:online?"0 0 0 3px rgba(34,197,94,0.14)":"none"}),
  composer:{display:"flex",gap:"10px",alignItems:"center",padding:"12px",borderTop:"1px solid rgba(148,163,184,0.18)",background:"rgba(255,255,255,0.48)"},
  input:{flex:1,border:"1px solid rgba(148,163,184,0.28)",borderRadius:"16px",padding:"13px 14px",fontSize:"14px",outline:"none",background:"rgba(255,255,255,0.84)"},
  sendBtn:{border:"none",borderRadius:"16px",background:"linear-gradient(135deg, rgba(30,60,114,0.96), rgba(42,82,152,0.94))",color:"#fff",padding:"13px 16px",fontWeight:800,cursor:"pointer",boxShadow:"0 10px 24px rgba(30,60,114,0.16)"},
  readOnly:{padding:"14px",fontSize:"12px",fontWeight:700,color:"#9a3412",background:"rgba(255,247,237,0.82)",borderTop:"1px solid rgba(254,215,170,0.7)"},
  empty:{color:"#64748b",textAlign:"center",padding:"20px"}
};

function formatTime(value){if(!value)return"--";const date=new Date(value);if(Number.isNaN(date.getTime()))return"--";return date.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});}
function clamp(val,min,max){return Math.max(min,Math.min(max,val));}
function getInitial(nameOrEmail){return String(nameOrEmail||"U").trim().charAt(0).toUpperCase();}

export default function FloatingChatWidgetPremium({ me }) {
  const [isOpen,setIsOpen]=useState(false);
  const [isMinimized,setIsMinimized]=useState(false);
  const [activeTab,setActiveTab]=useState("groups");
  const [groups,setGroups]=useState([]);
  const [members,setMembers]=useState([]);
  const [activeGroupId,setActiveGroupId]=useState(null);
  const [messages,setMessages]=useState([]);
  const [draft,setDraft]=useState("");
  const [loadingMore,setLoadingMore]=useState(false);
  const [hasMore,setHasMore]=useState(true);
  const [sending,setSending]=useState(false);
  const [isSocketOnline,setIsSocketOnline]=useState(false);
  const [position,setPosition]=useState(()=>({x:Math.max(20,window.innerWidth-PANEL_WIDTH-24),y:Math.max(20,window.innerHeight-PANEL_HEIGHT-24)}));
  const dragRef=useRef({dragging:false,offsetX:0,offsetY:0});
  const bodyRef=useRef(null);
  const socketRef=useRef(null);
  const currentGroupIdRef=useRef(null);
  const isOpenRef=useRef(false);

  const activeGroup=useMemo(()=>groups.find((g)=>Number(g.id)===Number(activeGroupId))||null,[groups,activeGroupId]);
  const totalUnread=groups.reduce((sum,g)=>sum+Number(g.unread_count||0),0);
  const canSee=!!me&&(me.role==="admin"||Number(me.access_chat||0)===1);
  const canSend=me?.role==="admin"||(Number(me?.access_chat||0)===1&&Number(me?.access_chat_send||0)===1&&!!activeGroup?.can_send);

  async function loadGroups(){
    const res=await api.get("/chat/groups");
    const rows=res.data?.groups||[];
    setGroups(rows);
    if(!currentGroupIdRef.current&&rows.length){currentGroupIdRef.current=rows[0].id;setActiveGroupId(rows[0].id);return rows[0].id;}
    if(rows.length&&!rows.some((g)=>Number(g.id)===Number(currentGroupIdRef.current))){currentGroupIdRef.current=rows[0].id;setActiveGroupId(rows[0].id);return rows[0].id;}
    return currentGroupIdRef.current;
  }

  async function loadMembers(groupId){
    if(!groupId)return;
    const res=await api.get(`/chat/groups/${groupId}/members`);
    setMembers(res.data?.members||[]);
  }

  async function loadMessages(groupId, options={}){
    if(!groupId)return;
    const {beforeId=null, prepend=false}=options;
    if(prepend)setLoadingMore(true);
    const prevHeight=bodyRef.current?bodyRef.current.scrollHeight:0;
    const prevScrollTop=bodyRef.current?bodyRef.current.scrollTop:0;
    try{
      const params=new URLSearchParams();
      params.set("limit","50");
      if(beforeId)params.set("before_id",String(beforeId));
      const res=await api.get(`/chat/groups/${groupId}/messages?${params.toString()}`);
      const batch=res.data?.messages||[];
      setHasMore(!!res.data?.has_more);
      setMessages((prev)=>{
        if(!prepend)return batch;
        const existing=new Set(prev.map((m)=>Number(m.id)));
        const older=batch.filter((m)=>!existing.has(Number(m.id)));
        return [...older,...prev];
      });
      requestAnimationFrame(()=>{
        if(!bodyRef.current)return;
        if(prepend){
          const newHeight=bodyRef.current.scrollHeight;
          bodyRef.current.scrollTop=newHeight-prevHeight+prevScrollTop;
        }else{
          bodyRef.current.scrollTop=bodyRef.current.scrollHeight;
        }
      });
    }finally{
      if(prepend)setLoadingMore(false)
    }
  }

  async function loadInitialData(){
    const groupId=await loadGroups();
    if(groupId){await Promise.all([loadMembers(groupId),loadMessages(groupId)]);}
  }

  async function handleSend(){
    const text=draft.trim();
    if(!text||!activeGroupId||!canSend||sending)return;
    setSending(true);
    try{
      const socket=socketRef.current;
      if(socket?.connected){
        socket.emit("chat:send_message",{groupId:activeGroupId,messageText:text});
      }else{
        await api.post(`/chat/groups/${activeGroupId}/messages`,{message_text:text});
        await loadMessages(activeGroupId);
      }
      setDraft("");
    }finally{
      setSending(false);
    }
  }

  function startDrag(e){
    dragRef.current.dragging=true;
    dragRef.current.offsetX=e.clientX-position.x;
    dragRef.current.offsetY=e.clientY-position.y;
    document.body.style.userSelect="none";
  }
  function onDrag(e){
    if(!dragRef.current.dragging)return;
    const height=isMinimized?HEADER_HEIGHT:PANEL_HEIGHT;
    setPosition({
      x:clamp(e.clientX-dragRef.current.offsetX,12,window.innerWidth-PANEL_WIDTH-12),
      y:clamp(e.clientY-dragRef.current.offsetY,12,window.innerHeight-height-12),
    });
  }
  function stopDrag(){dragRef.current.dragging=false;document.body.style.userSelect="";}

  function updateUnreadOnIncoming(payload){
    setGroups((prev)=>prev.map((group)=>{
      if(Number(group.id)!==Number(payload.group_id))return group;
      const isCurrentOpen=isOpenRef.current&&Number(currentGroupIdRef.current)===Number(payload.group_id);
      return {...group, unread_count:isCurrentOpen?0:Number(group.unread_count||0)+(Number(payload.sender_id)!==Number(me?.id)?1:0)};
    }));
  }

  useEffect(()=>{isOpenRef.current=isOpen;},[isOpen]);
  useEffect(()=>{currentGroupIdRef.current=activeGroupId;},[activeGroupId]);

  useEffect(()=>{
    if(!canSee)return;
    loadInitialData();
    const socket=getChatSocket();
    socketRef.current=socket;

    const onConnect=()=>{setIsSocketOnline(true);if(currentGroupIdRef.current){socket.emit("chat:join_group",{groupId:currentGroupIdRef.current});}};
    const onDisconnect=()=>setIsSocketOnline(false);
    const onNewMessage=(payload)=>{
      updateUnreadOnIncoming(payload);
      if(Number(payload.group_id)===Number(currentGroupIdRef.current)){
        setMessages((prev)=>prev.some((m)=>Number(m.id)===Number(payload.id))?prev:[...prev,payload]);
        requestAnimationFrame(()=>{if(bodyRef.current&&isOpenRef.current&&!isMinimized){bodyRef.current.scrollTop=bodyRef.current.scrollHeight;}});
        if(isOpenRef.current){api.post(`/chat/groups/${payload.group_id}/seen`,{message_id:payload.id}).catch(()=>{});}
      }
    };
    const onSeenUpdate=(payload)=>{
      if(Number(payload.group_id)!==Number(currentGroupIdRef.current))return;
      setMessages((prev)=>prev.map((item)=>{
        if(Number(item.id)!==Number(payload.message_id))return item;
        const already=Array.isArray(item.seen_by)?item.seen_by.some((s)=>Number(s.user_id)===Number(payload.user_id)):false;
        if(already)return item;
        return {...item, seen_by:[...(item.seen_by||[]),{user_id:payload.user_id, seen_at:payload.seen_at}]};
      }));
    };

    socket.on("connect",onConnect);
    socket.on("disconnect",onDisconnect);
    socket.on("chat:new_message",onNewMessage);
    socket.on("chat:seen_update",onSeenUpdate);
    setIsSocketOnline(!!socket.connected);
    if(socket.connected&&currentGroupIdRef.current){socket.emit("chat:join_group",{groupId:currentGroupIdRef.current});}

    document.addEventListener("mousemove",onDrag);
    document.addEventListener("mouseup",stopDrag);

    return ()=>{
      socket.off("connect",onConnect);
      socket.off("disconnect",onDisconnect);
      socket.off("chat:new_message",onNewMessage);
      socket.off("chat:seen_update",onSeenUpdate);
      document.removeEventListener("mousemove",onDrag);
      document.removeEventListener("mouseup",stopDrag);
    };
  },[canSee, me?.id, isMinimized]);

  useEffect(()=>{
    if(!canSee||!activeGroupId)return;
    loadMembers(activeGroupId);
    loadMessages(activeGroupId);
    const socket=socketRef.current;
    if(socket?.connected){socket.emit("chat:join_group",{groupId:activeGroupId});}
    setGroups((prev)=>prev.map((g)=>Number(g.id)===Number(activeGroupId)?{...g, unread_count:0}:g));
  },[activeGroupId,canSee]);

  useEffect(()=>{
    if(!isOpen||!activeGroupId||!messages.length)return;
    const lastMessage=messages[messages.length-1];
    if(!lastMessage?.id)return;
    api.post(`/chat/groups/${activeGroupId}/seen`,{message_id:lastMessage.id}).catch(()=>{});
    const socket=socketRef.current;
    if(socket?.connected){socket.emit("chat:mark_seen",{groupId:activeGroupId,messageId:lastMessage.id});}
  },[isOpen,activeGroupId,messages]);

  if(!canSee)return null;

  const portalContent=(
    <>
      {isOpen?(
        <div style={styles.panel(position.x,position.y,isMinimized)}>
          <div style={styles.header} onMouseDown={startDrag}>
            <div>
              <div style={styles.title}>{activeGroup?.name||"Team Chat"}</div>
              <div style={styles.subtitle}><span style={styles.liveDot(isSocketOnline)} />{isSocketOnline?"Live connected":"Reconnecting..."}</div>
            </div>
            <div style={styles.headerActions}>
              <button type="button" style={styles.iconBtn} onClick={()=>setIsMinimized((v)=>!v)}>{isMinimized?"▢":"—"}</button>
              <button type="button" style={styles.iconBtn} onClick={()=>setIsOpen(false)}>×</button>
            </div>
          </div>

          {!isMinimized?(
            <>
              <div style={styles.switchBar}>
                <button type="button" style={styles.switchBtn(activeTab==="groups")} onClick={()=>setActiveTab("groups")}>Groups</button>
                <button type="button" style={styles.switchBtn(activeTab==="users")} onClick={()=>setActiveTab("users")}>Users</button>
                {activeTab==="groups"?(
                  <select style={styles.groupSelect} value={activeGroupId||""} onChange={(e)=>setActiveGroupId(Number(e.target.value))}>
                    {groups.map((group)=><option key={group.id} value={group.id}>{group.name} {group.unread_count?`(${group.unread_count})`:""}</option>)}
                  </select>
                ):(
                  <div style={{marginLeft:"auto",fontSize:12,color:"#64748b",fontWeight:700}}>{members.length} visible members</div>
                )}
              </div>

              <div ref={bodyRef} style={styles.body} onScroll={(e)=>{
                const el=e.currentTarget;
                if(activeTab!=="groups")return;
                if(loadingMore||!hasMore||!messages.length)return;
                if(el.scrollTop>36)return;
                const oldest=messages[0];
                if(!oldest?.id)return;
                loadMessages(activeGroupId,{prepend:true,beforeId:oldest.id});
              }}>
                {activeTab==="groups"?(
                  <>
                    {loadingMore?<div style={styles.loadingTop}>Loading older messages...</div>:null}
                    {!hasMore&&messages.length>0?<div style={styles.loadingTop}>No older messages</div>:null}
                    {messages.length===0?<div style={styles.empty}>No messages yet.</div>:messages.map((item)=>{
                      const mine=Number(item.sender_id)===Number(me?.id);
                      return (
                        <div key={item.id} style={styles.bubbleRow(mine)}>
                          <div style={styles.bubble(mine)}>
                            {!mine?<div style={styles.sender}>{item.sender?.name||item.sender?.email||"User"}</div>:null}
                            <div>{item.message_text}</div>
                            <div style={styles.time}>{formatTime(item.created_at)}{mine&&Array.isArray(item.seen_by)&&item.seen_by.length>1?" • Seen":""}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ):members.length===0?(
                  <div style={styles.empty}>No users visible in this group.</div>
                ):members.map((member)=>(
                  <div key={member.user_id} style={styles.memberCard}>
                    <div style={styles.avatar}>{getInitial(member.user?.name||member.user?.email)}</div>
                    <div style={styles.memberMeta}>
                      <div style={styles.memberName}>{member.user?.name||member.user?.email||"User"}</div>
                      <div style={styles.memberSub}>
                        <span style={styles.onlineDotSmall(!!member.is_online)} />
                        {member.is_online?"Online":"Offline"}
                        <span>•</span>
                        <span>{member.can_send?"Can send":"Read only"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {activeTab==="groups"?(
                canSend?(
                  <div style={styles.composer}>
                    <input style={styles.input} value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Type your message..." onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}} />
                    <button type="button" style={styles.sendBtn} onClick={handleSend} disabled={sending}>Send</button>
                  </div>
                ):<div style={styles.readOnly}>Read only mode enabled. Aap messages dekh sakte hain lekin send nahi kar sakte.</div>
              ):<div style={styles.readOnly}>Users tab current selected group ke members aur online status show karta hai.</div>}
            </>
          ):null}
        </div>
      ):null}

      <div style={styles.launcherWrap}>
        <button type="button" style={styles.launcherBtn} onClick={()=>{setIsOpen((v)=>!v);setIsMinimized(false);}} title="Open chat">
          💬
          {totalUnread>0?<span style={styles.unreadBadge}>{totalUnread}</span>:null}
        </button>
      </div>
    </>
  );
  return ReactDOM.createPortal(portalContent, document.body);
}
