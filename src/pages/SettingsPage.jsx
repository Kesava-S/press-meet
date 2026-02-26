import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ── Sun icon ───────────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

// ── Moon icon ──────────────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ── Save spinner ───────────────────────────────────────────────────────────────
function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "sp-spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

export default function SettingsPage() {
  const { user, login } = useAuth();

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === "light" ? "dark" : "light");

  // ── Profile fields (pre-fill from AuthContext) ─────────────────────────────
  const [name, setName]   = useState(user?.name  ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // ── Preferences ───────────────────────────────────────────────────────────
  const [autoSave, setAutoSave]       = useState(
    () => localStorage.getItem("pref_autosave") !== "false"
  );
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("pref_notifications") === "true"
  );

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");   // "success" | "error" | ""

  const showMsg = (type) => {
    setSaveMsg(type);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim())  return;
    setSaving(true);
    setSaveMsg("");

    // Save preferences to localStorage immediately
    localStorage.setItem("pref_autosave",      String(autoSave));
    localStorage.setItem("pref_notifications",  String(notifications));

    try {
      const res = await fetch(`${BASE}/meet-update-profile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          name.trim(),
          email:         email.trim().toLowerCase(),
          autoSave,
          notifications,
        }),
      });

      let data = {};
      try { data = await res.json(); } catch { /* ok */ }

      if (!res.ok || data.success === false) {
        throw new Error(data.message ?? "Failed to save");
      }

      // Update AuthContext with new name/email
      login({ ...user, name: name.trim(), email: email.trim().toLowerCase() });
      showMsg("success");

    } catch {
      showMsg("error");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?";

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="settings-root">

      {/* ── Page header ── */}
      <div className="settings-header">
        <div className="settings-header-left">
          <h2 className="settings-title">Settings</h2>
          <p className="settings-subtitle">Manage your profile and preferences</p>
        </div>

        {/* Theme toggle */}
        {/* <button
          className={`settings-theme-toggle ${theme}`}
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span className="settings-theme-track">
            <span className="settings-theme-thumb">
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </span>
          </span>
          <span className="settings-theme-label">
            {theme === "light" ? "Dark mode" : "Light mode"}
          </span>
        </button> */}
      </div>

      <div className="settings-body">

        {/* ── Profile card ── */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-row">
              <div className="settings-section-dot settings-section-dot--indigo" />
              <h3 className="settings-card-title">Profile</h3>
            </div>
            <p className="settings-card-desc">Your personal information</p>
          </div>

          {/* Avatar + identity */}
          <div className="settings-profile-hero">
            <div className="settings-avatar">{initials}</div>
            <div className="settings-profile-meta">
              <span className="settings-profile-name">{name || "—"}</span>
              <span className="settings-profile-email">{email || "—"}</span>
              {joinDate && (
                <span className="settings-profile-joined">Member since {joinDate}</span>
              )}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Fields */}
          <div className="settings-fields">
            <div className="settings-field">
              <label className="settings-label">Full Name</label>
              <input
                className="settings-input"
                type="text"
                value={name}
                placeholder="Your full name"
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Email Address</label>
              <input
                className="settings-input"
                type="email"
                value={email}
                placeholder="your@email.com"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Preferences card ── */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-row">
              <div className="settings-section-dot settings-section-dot--green" />
              <h3 className="settings-card-title">Preferences</h3>
            </div>
            <p className="settings-card-desc">Customize your experience</p>
          </div>

          <div className="settings-prefs-list">

            <label className="settings-pref-row">
              <div className="settings-pref-info">
                <span className="settings-pref-name">Auto-save answers</span>
                <span className="settings-pref-desc">Automatically save Q&amp;A edits as you type</span>
              </div>
              <div
                className={`settings-toggle ${autoSave ? "on" : ""}`}
                onClick={() => setAutoSave(p => !p)}
                role="switch"
                aria-checked={autoSave}
                tabIndex={0}
                onKeyDown={e => e.key === " " && setAutoSave(p => !p)}
              >
                <div className="settings-toggle-thumb" />
              </div>
            </label>

            <div className="settings-pref-divider" />

            <label className="settings-pref-row">
              <div className="settings-pref-info">
                <span className="settings-pref-name">Enable notifications</span>
                <span className="settings-pref-desc">Receive alerts for new Q&amp;A activity</span>
              </div>
              <div
                className={`settings-toggle ${notifications ? "on" : ""}`}
                onClick={() => setNotifications(p => !p)}
                role="switch"
                aria-checked={notifications}
                tabIndex={0}
                onKeyDown={e => e.key === " " && setNotifications(p => !p)}
              >
                <div className="settings-toggle-thumb" />
              </div>
            </label>

          </div>
        </div>

        {/* ── App info card ── */}
        <div className="settings-card settings-card--muted">
          <div className="settings-card-title-row" style={{ marginBottom: 14 }}>
            <div className="settings-section-dot settings-section-dot--amber" />
            <h3 className="settings-card-title">About</h3>
          </div>
          <div className="settings-about-grid">
            <div className="settings-about-item">
              <span className="settings-about-label">Product</span>
              <span className="settings-about-value">PressPilot AI</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">Module</span>
              <span className="settings-about-value">PressMeet</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">Version</span>
              <span className="settings-about-value">1.0.0</span>
            </div>
            <div className="settings-about-item">
              <span className="settings-about-label">Theme</span>
              <span className="settings-about-value" style={{ textTransform: "capitalize" }}>{theme}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Save bar ── */}
      <div className="settings-save-bar">
        {saveMsg === "success" && (
          <span className="settings-save-feedback success">
            ✓ Changes saved successfully
          </span>
        )}
        {saveMsg === "error" && (
          <span className="settings-save-feedback error">
            ✗ Failed to save — changes stored locally
          </span>
        )}
        <button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? <><SpinnerIcon /> Saving…</> : "Save Changes"}
        </button>
      </div>

    </div>
  );
}