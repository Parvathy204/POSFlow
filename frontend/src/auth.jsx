import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("posUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("posToken");

    if (!token) {
      localStorage.removeItem("posUser");
      setChecking(false);
      return undefined;
    }

    api
      .get("/auth/me")
      .then((response) => {
        // A login may have completed while this validation was in flight.
        if (!active || localStorage.getItem("posToken") !== token) return;
        localStorage.setItem("posUser", JSON.stringify(response.data));
        setUser(response.data);
      })
      .catch((error) => {
        if (!active || localStorage.getItem("posToken") !== token) return;

        // Only discard the session when the server explicitly rejects it.
        // Keep the stored session through cold starts or temporary outages.
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("posToken");
          localStorage.removeItem("posUser");
          setUser(null);
        } else {
          setUser(readStoredUser());
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function login(email, password) {
    let response;

    // Render's free tier can briefly reject requests while waking up. Retry
    // start-up/network failures, but never retry a genuine wrong-password 401.
    for (let attempt = 0; ; attempt += 1) {
      try {
        response = await api.post("/auth/login", { email, password });
        break;
      } catch (err) {
        const status = err.response?.status;
        const retryable = !err.response || status >= 500;

        if (!retryable || attempt >= 2) throw err;

        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }

    const { token, user: loggedIn } = response.data;

    localStorage.setItem("posToken", token);
    localStorage.setItem("posUser", JSON.stringify(loggedIn));
    setUser(loggedIn);
    setChecking(false);
    return loggedIn;
  }

  function logout() {
    localStorage.removeItem("posToken");
    localStorage.removeItem("posUser");
    setUser(null);
    setChecking(false);
  }

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
