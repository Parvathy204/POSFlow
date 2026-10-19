import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin" : "/billing", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "linear-gradient(135deg, #eef2ff, #f7f8fc)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: "100%", maxWidth: 400, padding: 34 }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--primary)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          P
        </div>
        <p
          style={{
            margin: "18px 0 6px",
            color: "var(--primary)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "1.5px",
          }}
        >
          POSFLOW MANAGEMENT
        </p>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
          Sign in to manage billing and your retail store.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@posflow.com"
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ width: "100%", marginTop: 8, padding: 12 }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div
          style={{
            marginTop: 20,
            padding: "12px 14px",
            background: "var(--bg)",
            borderRadius: 8,
            fontSize: 12.5,
            color: "var(--muted)",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "var(--ink-2)" }}>Demo accounts</strong>
          <br />
          Admin: admin@posflow.com / admin123
          <br />
          Staff: staff@posflow.com / staff123
        </div>

        <p
          style={{
            marginTop: 18,
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 12,
          }}
        >
          Retail billing made simple.
        </p>
      </form>
    </main>
  );
}
