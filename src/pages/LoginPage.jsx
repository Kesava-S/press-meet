import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const DEMO_EMAIL = "test@gmail.com";
  const DEMO_PASSWORD = "123456";

  const handleLogin = () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("auth", "true");
      navigate("/app/pressmeet");   // 👈 IMPORTANT: route must match your App.jsx
    } else {
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("auth", "google");
    navigate("/app/pressmeet");     // 👈 same route
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>PressPilot AI</h1>
        <p className="subtitle">Sign in to continue to PressMeet</p>

        <div className="login-actions">
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>
          )}

          <button className="primary full" onClick={handleLogin}>
            Login
          </button>

          <div className="divider">OR</div>

          <button className="google-btn" onClick={handleGoogleLogin}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
            />
            Continue with Google
          </button>
        </div>

        <div className="login-footer">
          Don’t have an account?{" "}
          <a href="#" onClick={() => navigate("/register")}>
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}
