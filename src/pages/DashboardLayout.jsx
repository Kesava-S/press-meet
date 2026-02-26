import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

// ── Nav items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: "/app/pressmeet",
    label: "PressMeet Now",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    to: "/app/documents",
    label: "Documents",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    to: "/app/qa",
    label: "Q&A Manager",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    to: "/app/qaview",
    label: "Q&A Viewer",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function DashboardLayout() {
  const navigate        = useNavigate();
  const { logout, user } = useAuth();              // ← useAuth instead of raw localStorage

  const handleLogout = () => {
    logout();                                       // clears auth state + localStorage
    navigate("/login");
  };

  // Derive initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="dash-layout">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">

        {/* Brand */}
        <div className="dash-brand">
          <div className="dash-brand-icon">🧩</div>
          <div className="dash-brand-text">
            <span className="dash-brand-name">PressPilot</span>
            <span className="dash-brand-tag">AI</span>
          </div>
        </div>

        {/* Nav label */}
        <div className="dash-nav-label">NAVIGATION</div>

        {/* Main nav */}
        <nav className="dash-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `dash-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span className="dash-nav-label-text">{item.label}</span>
              <span className="dash-nav-active-bar" />
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="dash-spacer" />

        {/* Settings */}
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            `dash-nav-item dash-settings-item ${isActive ? "active" : ""}`
          }
        >
          <span className="dash-nav-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="dash-nav-label-text">Settings</span>
          <span className="dash-nav-active-bar" />
        </NavLink>

        {/* User card + logout */}
        <div className="dash-user-card">
          <div className="dash-user-avatar">{initials}</div>
          <div className="dash-user-info">
            <span className="dash-user-name">{user?.name ?? "User"}</span>
            <span className="dash-user-email">{user?.email ?? ""}</span>
          </div>
          <button
            className="dash-logout-btn"
            onClick={handleLogout}
            title="Log out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

      </aside>

      {/* ── Main content ── */}
      <main className="dash-main">
        <Outlet />
      </main>

    </div>
  );
}