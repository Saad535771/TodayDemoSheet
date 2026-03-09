import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL
});

// ================= TOKEN FUNCTIONS =================

// token header set karna
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// localStorage se token lena
export function getStoredToken() {
  return localStorage.getItem("tp_token");
}

// token save karna
export function storeToken(token) {
  localStorage.setItem("tp_token", token);
  setAuthToken(token);
}

// token remove karna
export function clearToken() {
  localStorage.removeItem("tp_token");
  setAuthToken(null);
}

// ================= INITIAL TOKEN LOAD =================

const token = getStoredToken();
if (token) {
  setAuthToken(token);
}

// ================= AXIOS INTERCEPTORS =================

// response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// request interceptor (debug)
api.interceptors.request.use((req) => {
  try {
    const stored = localStorage.getItem("tp_token");
    console.log("[API] stored token present:", !!stored);
    console.log(
      "[API] outgoing Authorization header:",
      req.headers?.Authorization || req.headers?.authorization
    );
  } catch (e) {
    console.warn("[API] token debug error", e);
  }

  return req;
});