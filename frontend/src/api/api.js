import axios from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
export const API_ORIGIN = new URL(API_BASE_URL).origin;

// Create a custom axios instance pointing to backend /api/v1
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token to all requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// We will register a response interceptor inside the AuthProvider to be able to call logout() on 401.
export default api;
