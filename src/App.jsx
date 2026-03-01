// ── App.jsx ───────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider }  from "./context/AuthContext";
import ProtectedRoute    from "./components/ProtectedRoute";

// Layout
import DashboardLayout   from "./pages/DashboardLayout";

// Public
import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import GoogleCallback    from "./pages/Googlecallback";

// App pages
import PressMeetNow      from "./pages/PressMeetNow";
import QAPage            from "./pages/QAPage";
import QAView            from "./pages/QAndAView";
import SettingsPage      from "./pages/SettingsPage";

// ── Data section sub-pages ──
// These are new pages. Create placeholder files if they don't exist yet.
// Each will be a full page component in pages/data/
import CriticismPage     from "./pages/data/CriticismPage";
import DocumentsPage     from "./pages/data/DocumentsPage";
import PartyDataPage     from "./pages/data/PartyDataPage";

export default function App() {
  // Restore theme on mount/refresh
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <AuthProvider>
      <Routes>

        {/* ── Public routes ── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Google OAuth callback ── */}
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* ── Protected dashboard ── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default → PressMeet */}
          <Route index element={<Navigate to="pressmeet" replace />} />

          {/* Main pages */}
          <Route path="pressmeet" element={<PressMeetNow />} />
          <Route path="qa"        element={<QAPage />} />
          <Route path="qaview"    element={<QAView />} />
          <Route path="settings"  element={<SettingsPage />} />

          {/* ── Data Section sub-routes ── */}
          <Route path="data">
            {/* /app/data → redirect to criticism */}
            <Route index element={<Navigate to="criticism" replace />} />
            <Route path="criticism" element={<CriticismPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="party"     element={<PartyDataPage />} />
          </Route>

          {/* Legacy /app/documents redirect */}
          <Route path="documents" element={<Navigate to="/app/data/documents" replace />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </AuthProvider>
  );
}