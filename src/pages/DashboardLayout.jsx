import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">PressPilot AI</div>

        <nav className="dash-menu">
          <NavLink to="/app/pressmeet">PressMeet Now</NavLink>
          <NavLink to="/app/documents">Documents</NavLink>
          <NavLink to="/app/qa">Q&A</NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
