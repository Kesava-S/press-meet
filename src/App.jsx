import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./pages/DashboardLayout";
import PressMeetNow from "./pages/PressMeetNow";
import DocumentsPage from "./pages/DocumentsPage";
import QAPage from "./pages/QAPage";

export default function App() {
  const isLoggedIn = !!localStorage.getItem("auth");

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/app"
        element={isLoggedIn ? <DashboardLayout /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="pressmeet" />} />
        <Route path="pressmeet" element={<PressMeetNow />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="qa" element={<QAPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
