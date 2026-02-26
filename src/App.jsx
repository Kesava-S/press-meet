// ── App.jsx ───────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute   from "./components/ProtectedRoute";

import LoginPage       from "./pages/LoginPage";
import RegisterPage    from "./pages/RegisterPage";
import GoogleCallback  from "./pages/Googlecallback";
import DashboardLayout from "./pages/DashboardLayout";
import PressMeetNow    from "./pages/PressMeetNow";
import DocumentsPage   from "./pages/DocumentsPage";
import QAPage          from "./pages/QAPage";
import QAView          from "./pages/QAview";
import SettingsPage    from "./pages/SettingsPage";

export default function App() {
  // Restore theme on every mount / refresh
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    // AuthProvider wraps everything so useAuth() works in any child
    <AuthProvider>
      <Routes>

        {/* ── Public routes ── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Google OAuth callback ── */}
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* ── Protected dashboard routes ── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="pressmeet" replace />} />
          <Route path="pressmeet" element={<PressMeetNow />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="qa"        element={<QAPage />} />
          <Route path="qaview"    element={<QAView />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </AuthProvider>
  );
}