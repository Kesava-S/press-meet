import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icons = {
  pressmeet: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  data: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  criticism: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  documents: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  partydata: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  qa: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  qaview: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  chevron: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ── Nav structure ──────────────────────────────────────────────────────────────
// Groups: flat item | collapsible group with children
const NAV_GROUPS = [
  {
    type:  "item",
    to:    "/app/pressmeet",
    label: "PressMeet Now",
    icon:  "pressmeet",
    badge: "LIVE",
    badgeColor: "#ef4444",
  },
  {
    type:  "group",
    label: "Data Section",
    icon:  "data",
    key:   "data",
    children: [
      { to: "/app/data/criticism", label: "Criticism",   icon: "criticism" },
      { to: "/app/data/documents", label: "Documents",   icon: "documents" },
      { to: "/app/data/party",     label: "Party Data",  icon: "partydata" },
    ],
  },
  {
    type:  "item",
    to:    "/app/qa",
    label: "Q&A Manager",
    icon:  "qa",
  },
  {
    type:  "item",
    to:    "/app/qaview",
    label: "Q&A Viewer",
    icon:  "qaview",
  },
];

// ── Collapsible nav group ──────────────────────────────────────────────────────
function NavGroup({ group, isOpen, onToggle }) {
  const location = useLocation();
  const isChildActive = group.children?.some(c => location.pathname.startsWith(c.to));

  return (
    <div className={`dash-nav-group ${isOpen || isChildActive ? "open" : ""}`}>

      {/* Group trigger */}
      <button
        className={`dash-nav-item dash-nav-group-trigger ${isChildActive ? "child-active" : ""}`}
        onClick={onToggle}
      >
        <span className="dash-nav-icon">{Icons[group.icon]}</span>
        <span className="dash-nav-label-text">{group.label}</span>
        <span className={`dash-group-chevron ${isOpen || isChildActive ? "open" : ""}`}>
          {Icons.chevron}
        </span>
        {isChildActive && <span className="dash-nav-active-bar" />}
      </button>

      {/* Children */}
      <div className="dash-nav-children">
        {group.children.map(child => (
          <NavLink
            key={child.to}
            to={child.to}
            className={({ isActive }) =>
              `dash-nav-child ${isActive ? "active" : ""}`
            }
          >
            <span className="dash-child-dot" />
            <span className="dash-nav-child-icon">{Icons[child.icon]}</span>
            <span>{child.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ── Global search bar ──────────────────────────────────────────────────────────
function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="dash-search-overlay" onClick={onClose}>
      <div className="dash-search-box" onClick={e => e.stopPropagation()}>
        <div className="dash-search-input-wrap">
          {Icons.search}
          <input
            ref={inputRef}
            className="dash-search-input"
            placeholder="Search criticisms, documents, Q&A…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="dash-search-esc" onClick={onClose}>ESC</kbd>
        </div>
        {query && (
          <div className="dash-search-hint">
            Press Enter to search across all modules
          </div>
        )}
        <div className="dash-search-shortcuts">
          <span>🎙️ PressMeet</span>
          <span>📊 Criticism</span>
          <span>📄 Documents</span>
          <span>❓ Q&amp;A</span>
        </div>
      </div>
    </div>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { logout, user } = useAuth();

  const [openGroups, setOpenGroups]     = useState({ data: true }); // data open by default
  const [showSearch, setShowSearch]     = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl+K → open search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") setShowSearch(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebar(false); }, [location.pathname]);

  const toggleGroup = (key) =>
    setOpenGroups(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  // Which page title to show in mobile top bar
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("pressmeet"))  return "PressMeet Now";
    if (path.includes("criticism"))  return "Criticism";
    if (path.includes("documents"))  return "Documents";
    if (path.includes("party"))      return "Party Data";
    if (path.includes("qa") && !path.includes("view")) return "Q&A Manager";
    if (path.includes("qaview"))     return "Q&A Viewer";
    if (path.includes("settings"))   return "Settings";
    return "PressPilot AI";
  };

  return (
    <>
      {/* Global search overlay */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Mobile overlay backdrop */}
      {mobileSidebar && (
        <div className="dash-mobile-backdrop" onClick={() => setMobileSidebar(false)} />
      )}

      <div className="dash-layout">

        {/* ── Mobile top bar ── */}
        <div className="dash-mobile-bar">
          <button className="dash-hamburger" onClick={() => setMobileSidebar(p => !p)}>
            <span /><span /><span />
          </button>
          <span className="dash-mobile-title">{getPageTitle()}</span>
          <button className="dash-mobile-search" onClick={() => setShowSearch(true)}>
            {Icons.search}
          </button>
        </div>

        {/* ── Sidebar ── */}
        <aside className={`dash-sidebar ${mobileSidebar ? "open" : ""}`}>

          {/* Brand */}
          <div className="dash-brand">
            <div className="dash-brand-icon">🧩</div>
            <div className="dash-brand-text">
              <span className="dash-brand-name">PressPilot</span>
              <span className="dash-brand-tag">AI</span>
            </div>
          </div>

          {/* Global search button */}
          {/* <button className="dash-search-trigger" onClick={() => setShowSearch(true)}>
            <span className="dash-search-trigger-icon">{Icons.search}</span>
            <span className="dash-search-trigger-text">Search…</span>
            <kbd className="dash-search-kbd">⌘K</kbd>
          </button> */}

          {/* Nav label */}
          <div className="dash-nav-label">MAIN MENU</div>

          {/* Scrollable nav area */}
          <nav className="dash-nav">
            {NAV_GROUPS.map(group => {
              if (group.type === "item") {
                return (
                  <NavLink
                    key={group.to}
                    to={group.to}
                    className={({ isActive }) =>
                      `dash-nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="dash-nav-icon">{Icons[group.icon]}</span>
                    <span className="dash-nav-label-text">{group.label}</span>
                    {group.badge && (
                      <span className="dash-nav-badge" style={{ background: group.badgeColor }}>
                        {group.badge}
                      </span>
                    )}
                    <span className="dash-nav-active-bar" />
                  </NavLink>
                );
              }

              return (
                <NavGroup
                  key={group.key}
                  group={group}
                  isOpen={!!openGroups[group.key]}
                  onToggle={() => toggleGroup(group.key)}
                />
              );
            })}
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
            <span className="dash-nav-icon">{Icons.settings}</span>
            <span className="dash-nav-label-text">Settings</span>
            <span className="dash-nav-active-bar" />
          </NavLink>

          {/* User card */}
          <div className="dash-user-card">
            <div className="dash-user-avatar">{initials}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.name ?? "User"}</span>
              <span className="dash-user-email">{user?.email ?? ""}</span>
            </div>
            <button className="dash-logout-btn" onClick={handleLogout} title="Log out">
              {Icons.logout}
            </button>
          </div>

        </aside>

        {/* ── Main content ── */}
        <main className="dash-main">
          <Outlet />
        </main>

      </div>
    </>
  );
}