import axios from "axios";

// In dev the Vite proxy forwards /api -> http://localhost:5000 (vite.config.js).
// In production the Express server serves this build, so same-origin /api works.
const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("posToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Automatically log out on expired/invalid sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("posToken")) {
      localStorage.removeItem("posToken");
      localStorage.removeItem("posUser");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
