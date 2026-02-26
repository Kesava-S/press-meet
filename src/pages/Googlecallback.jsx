// ── GoogleCallback.jsx ────────────────────────────────────────────────────────
// Route: /auth/google/callback
//
// Flow:
//   1. Google redirects here with ?code=xxx&state=xxx
//   2. We POST the code to n8n: POST /meet-google-auth { code, redirect_uri }
//   3. n8n exchanges with Google → returns { success, user, token }
//   4. Store auth and navigate to app
//
// Add this route in your App.jsx:
//   <Route path="/auth/google/callback" element={<GoogleCallback />} />

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE           = import.meta.env.VITE_N8N_WEBHOOK_URL;
const GOOGLE_REDIRECT = `${window.location.origin}/auth/google/callback`;

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying with Google…");
  const [error, setError]   = useState("");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code   = params.get("code");
      const errMsg = params.get("error");

      // User denied access
      if (errMsg) {
        setError("Google sign-in was cancelled.");
        setTimeout(() => navigate("/login"), 2500);
        return;
      }

      if (!code) {
        setError("No authorization code received from Google.");
        setTimeout(() => navigate("/login"), 2500);
        return;
      }

      try {
        setStatus("Signing you in…");

        const res = await fetch(`${BASE}/meet-google-auth`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ code, redirect_uri: GOOGLE_REDIRECT }),
        });

        let data = {};
        try { data = await res.json(); } catch { /* empty body */ }

        if (!res.ok || data.success === false) {
          throw new Error(data.message ?? data.error ?? "Google authentication failed");
        }

        // Store session
        const token = data.token ?? data.access_token ?? null;
        const user  = data.user  ?? data.profile      ?? {};

        if (token) localStorage.setItem("auth_token", token);
        localStorage.setItem("auth",      "true");
        localStorage.setItem("auth_user", JSON.stringify(user));

        setStatus("Success! Redirecting…");
        setTimeout(() => navigate("/app/pressmeet"), 600);

      } catch (err) {
        console.error("[GoogleCallback]", err.message);
        setError(err.message || "Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="login-root">
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />

      <div className="login-card" style={{ textAlign: "center", padding: "48px 36px" }}>
        <div className="login-logo-wrap" style={{ margin: "0 auto 24px" }}>
          <div className="login-logo">🧩</div>
          <div className="login-logo-ring" />
        </div>

        {!error ? (
          <>
            <div className="preloader-ring" style={{ margin: "0 auto 20px" }}>
              <span /><span /><span />
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b8fa8" }}>
              {status}
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <p style={{ color: "#dc2626", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {error}
            </p>
            <p style={{ color: "#8b8fa8", fontSize: 12 }}>
              Redirecting you back to login…
            </p>
          </>
        )}
      </div>
    </div>
  );
}