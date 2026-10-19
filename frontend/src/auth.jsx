import { createContext, useContext, useState } from "react";
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
  const [user, setUser] = useState(readStoredUser);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const { token, user: loggedIn } = response.data;

    localStorage.setItem("posToken", token);
    localStorage.setItem("posUser", JSON.stringify(loggedIn));
    setUser(loggedIn);
    return loggedIn;
  }

  function logout() {
    localStorage.removeItem("posToken");
    localStorage.removeItem("posUser");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
