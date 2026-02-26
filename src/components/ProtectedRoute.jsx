// ── ProtectedRoute.jsx ────────────────────────────────────────────────────────
// Place at: src/components/ProtectedRoute.jsx
//
// Blocks access to protected routes until auth state is confirmed.
// Shows a centered spinner while localStorage is being read (avoids flash).

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  // Still reading from localStorage — render nothing to avoid redirect flash
  if (loading) {
    return (
      <div style={{
        minHeight:      "100vh",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     "#f4f6fb",
        flexDirection:  "column",
        gap:            20,
      }}>
        <div className="preloader-ring">
          <span /><span /><span />
        </div>
        <p style={{
          fontFamily:     "'Space Mono', monospace",
          fontSize:       11,
          letterSpacing:  "0.14em",
          textTransform:  "uppercase",
          color:          "#8b8fa8",
        }}>
          Loading…
        </p>
      </div>
    );
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}