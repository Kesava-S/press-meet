import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "sp-spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user, login } = useAuth();

  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  // ── Profile fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const showMsg = (type) => {
    setSaveMsg(type);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${BASE}/meet-update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* ok */ }
      if (!res.ok || data.success === false) throw new Error();
      login({ ...user, name: name.trim(), email: email.trim().toLowerCase() });
      showMsg("success");
    } catch {
      showMsg("error");
    } finally {
      setSaving(false);
    }
  };

  const initials = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?";

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    })
    : null;

  return (
    <div className="settings-root">

      {/* ── Page header ── */}
      <div className="settings-header">
        <div className="settings-header-left">
          <h2 className="settings-title">Settings</h2>
          <p className="settings-subtitle">Manage your profile and app information</p>
        </div>
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

          {/* Editable fields */}
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

        {/* ── About card ── */}
        <div className="settings-card settings-card--muted">
          <div className="settings-card-title-row" style={{ marginBottom: 14, padding: "20px 22px 0" }}>
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
              <span className="settings-about-value" style={{ textTransform: "capitalize" }}>
                {theme}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Save bar ── */}
      <div className="settings-save-bar">
        {saveMsg === "success" && (
          <span className="settings-save-feedback success">✓ Changes saved successfully</span>
        )}
        {saveMsg === "error" && (
          <span className="settings-save-feedback error">✗ Failed to save — try again</span>
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