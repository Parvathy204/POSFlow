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
    const response = await api.post("/auth/login", { email, password });
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
