import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({ baseURL });

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken();              // token delete
      window.location.href = "/login"; // redirect to login
    }
    return Promise.reject(error);
  }
);