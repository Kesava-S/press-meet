// ── AuthContext.jsx ───────────────────────────────────────────────────────────
// Place this at: src/context/AuthContext.jsx
//
// Provides:
//   const { user, isLoggedIn, login, logout, loading } = useAuth();
//
// Usage in any component:
//   import { useAuth } from "../context/AuthContext";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Create context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { name, email, role, ... }
  const [loading, setLoading] = useState(true);   // true while reading localStorage

  // ── Rehydrate from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    try {
      const authFlag = localStorage.getItem("auth");
      const rawUser  = localStorage.getItem("auth_user");

      if (authFlag === "true" || authFlag === "google") {
        const parsed = rawUser ? JSON.parse(rawUser) : {};
        setUser(parsed);
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem("auth");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── login(userData, token?) ──────────────────────────────────────────────────
  // Call this after a successful API response
  const login = useCallback((userData = {}, token = null) => {
    if (token) localStorage.setItem("auth_token", token);
    localStorage.setItem("auth",      "true");
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── logout() ────────────────────────────────────────────────────────────────
  // Clears everything — call from any component, navigation handled by ProtectedRoute
  const logout = useCallback(() => {
    localStorage.removeItem("auth");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    setUser(null);
  }, []);

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth hook ───────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}