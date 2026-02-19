import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password || !confirm) {
      alert("Please fill all fields");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    // Demo register (replace with backend later)
    alert("Account created successfully!");
    navigate("/login");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Create Account</h1>
        <p className="subtitle">Join PressPilot AI</p>

        <div className="login-actions">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
          />

          <button className="primary full" onClick={handleRegister}>
            Create Account
          </button>
        </div>

        <div className="login-footer">
          Already have an account?{" "}
          <a href="#" onClick={() => navigate("/login")}>
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
