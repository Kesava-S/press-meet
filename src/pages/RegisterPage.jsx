import { useNavigate } from "react-router-dom";
import { useState } from "react";
import './Auth.css'

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "login-spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// Password strength checker
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  const levels = [
    { label: "",         color: "" },
    { label: "Weak",     color: "#ef4444" },
    { label: "Fair",     color: "#f59e0b" },
    { label: "Good",     color: "#3b82f6" },
    { label: "Strong",   color: "#10b981" },
  ];
  return { score, ...levels[score] };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const strength = getStrength(password);

  const handleRegister = async () => {
    setError("");

    // ── Client-side validation ──
    if (!name.trim())    return setError("Please enter your full name");
    if (!email.trim())   return setError("Please enter your email address");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                         return setError("Please enter a valid email address");
    if (!password)       return setError("Please enter a password");
    if (password.length < 6)
                         return setError("Password must be at least 6 characters");
    if (password !== confirm)
                         return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/meet-register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     name.trim(),
          email:    email.trim().toLowerCase(),
          password,
        }),
      });

      let data = {};
      try { data = await res.json(); } catch { /* empty body */ }

      if (!res.ok || !data.success) {
        throw new Error(data.message ?? data.error ?? "Registration failed. Please try again.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleRegister();
  };

  // ── Success state ──
  if (success) {
    return (
      <div className="login-root">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-card" style={{ textAlign: "center", padding: "52px 36px" }}>
          <div className="reg-success-icon">✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1d2e", margin: "16px 0 8px" }}>
            Account Created!
          </h2>
          <p style={{ fontSize: 13.5, color: "#8b8fa8", lineHeight: 1.6 }}>
            Welcome to PressPilot AI.<br />Redirecting you to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-root">
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <div className="login-card">

        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo">🧩</div>
          <div className="login-logo-ring" />
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Create Account</h1>
          <p>Join PressPilot AI — it's free</p>
        </div>

        {/* Form */}
        <div className="login-form">

          {/* Full Name */}
          <div className="login-field">
            <label className="login-label">Full Name</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                className="login-input"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                className="login-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                className="login-input"
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="new-password"
                disabled={loading}
              />
              <button className="login-show-pass" type="button" tabIndex={-1}
                onClick={() => setShowPass(p => !p)}>
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="reg-strength">
                <div className="reg-strength-bar">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="reg-strength-seg"
                      style={{ background: i <= strength.score ? strength.color : "#eef0f8" }}
                    />
                  ))}
                </div>
                <span className="reg-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="login-field">
            <label className="login-label">Confirm Password</label>
            <div className={`login-input-wrap ${confirm && confirm !== password ? "error" : ""}`}>
              <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <input
                className="login-input"
                type={showConf ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="new-password"
                disabled={loading}
              />
              <button className="login-show-pass" type="button" tabIndex={-1}
                onClick={() => setShowConf(p => !p)}>
                {showConf ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {/* Inline match indicator */}
            {confirm && (
              <span className={`reg-match-hint ${confirm === password ? "match" : "no-match"}`}>
                {confirm === password ? "✓ Passwords match" : "✗ Passwords do not match"}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="login-btn-primary"
            onClick={handleRegister}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? <><SpinnerIcon /> Creating account…</> : "Create Account"}
          </button>

        </div>

        {/* Footer */}
        <div className="login-footer">
          Already have an account?{" "}
          <a href="#" onClick={e => { e.preventDefault(); navigate("/login"); }}>
            Sign in
          </a>
        </div>

      </div>
    </div>
  );
}