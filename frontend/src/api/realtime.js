import { io } from "socket.io-client";
import { getStoredToken, SOCKET_BASE_URL } from "./api.js";

let socketInstance = null;

function getNotificationSocketUrl() {
  return `${String(SOCKET_BASE_URL || "").replace(/\/$/, "")}/notifications`;
}

export function getRealtimeSocket() {
  const token = getStoredToken();
  if (!token) return null;

  if (socketInstance) {
    socketInstance.auth = { token };
    return socketInstance;
  }

  socketInstance = io(getNotificationSocketUrl(), {
    autoConnect: false,
    transports: [ "polling"],
    withCredentials: true,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  socketInstance.on("connect", () => {
    console.log("Realtime notification socket connected:", socketInstance.id);
  });

  socketInstance.on("connect_error", (error) => {
    console.warn("Realtime notification socket connect error:", error?.message || error);
  });

  return socketInstance;
}

export function disconnectRealtimeSocket() {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
}
