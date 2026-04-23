import { io } from "socket.io-client";
import { getStoredToken } from "../api/api.js";

let socketInstance = null;

export function getChatSocket() {
  if (socketInstance) return socketInstance;

  const token = getStoredToken();

  socketInstance = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", {
    transports: ["websocket", "polling"],
    auth: {
      token,
    },
  });

  return socketInstance;
}
