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
    const requestToken = error.config?.headers?.Authorization?.replace(
      /^Bearer\s+/i,
      ""
    );
    const currentToken = localStorage.getItem("posToken");

    // Only clear the session if the rejected token is still the active one.
    // This avoids an old validation request wiping out a fresh login.
    if (
      error.response?.status === 401 &&
      requestToken &&
      requestToken === currentToken
    ) {
      localStorage.removeItem("posToken");
      localStorage.removeItem("posUser");

      const path = window.location.pathname;
      const isPortal =
        path.startsWith("/admin") ||
        path.startsWith("/billing") ||
        path.startsWith("/mobile");

      if (isPortal) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
