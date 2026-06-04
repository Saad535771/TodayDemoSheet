import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getStoredToken() {
  return localStorage.getItem("tp_token");
}

export function storeToken(token) {
  localStorage.setItem("tp_token", token);
  setAuthToken(token);
}

export function clearToken() {
  localStorage.removeItem("tp_token");
  setAuthToken(null);
}

const token = getStoredToken();
if (token) {
  setAuthToken(token);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // login request par logout/redirect nahi karna
    if (status === 401 && !url.includes("/auth/login")) {
      clearToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);