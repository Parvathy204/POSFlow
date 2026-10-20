import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import "../signin.css";
import { useAuth } from "../auth";

function Brand({ compact = false }) {
  return (
    <div className={`signin-brand${compact ? " signin-brand-compact" : ""}`}>
      <span className="signin-logo" aria-hidden="true">
        <ReceiptText size={22} strokeWidth={2.1} />
      </span>
      <span className="signin-brand-text">
        <strong>POSFlow</strong>
        <small>Retail billing suite</small>
      </span>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [demoNotice, setDemoNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setDemoNotice("");
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

  function fillDemo(demoEmail, demoPassword, label) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setDemoNotice(`${label} details filled. Press Sign in to continue.`);
  }

  return (
    <main className="signin-page">
      <section className="signin-visual" aria-label="About POSFlow">
        <div className="signin-visual-inner">
          <Brand />

          <div className="signin-visual-main">
            <span className="signin-kicker">
              <span className="signin-pulse" aria-hidden="true" />
              Textile retail, in rhythm
            </span>

            <h1>
              One counter.
              <br />
              <span>Every sale in sync.</span>
            </h1>

            <p className="signin-lede">
              Billing, stock, staff and books — connected in one fast, focused
              workspace.
            </p>

            <div className="signin-receipt" aria-hidden="true">
              <div className="signin-receipt-head">
                <span>Bill preview</span>
                <span className="signin-live">
                  <i />
                  Live
                </span>
              </div>

              <div className="signin-receipt-meta">
                <span>
                  <small>Invoice</small>
                  <strong>INV-2048</strong>
                </span>
                <span>
                  <small>Counter</small>
                  <strong>Coimbatore</strong>
                </span>
              </div>

              <div className="signin-receipt-items">
                <span>
                  Silk Saree · Emerald <b>₹2,799</b>
                </span>
                <span>
                  Cotton Kurta · Indigo <b>₹899</b>
                </span>
              </div>

              <div className="signin-receipt-total">
                <span>Total</span>
                <strong>₹3,698</strong>
              </div>

              <div className="signin-receipt-foot">
                <span>
                  <CheckCircle2 size={14} />
                  Payment received
                </span>
                <span>Cash</span>
              </div>
            </div>

            <div className="signin-highlights">
              <span>
                <Zap size={14} aria-hidden="true" />
                Fast billing
              </span>
              <span>
                <CheckCircle2 size={14} aria-hidden="true" />
                Live stock
              </span>
              <span>
                <ShieldCheck size={14} aria-hidden="true" />
                Role-based access
              </span>
            </div>
          </div>

          <footer className="signin-visual-foot">
            <span className="signin-place">
              <MapPin size={14} aria-hidden="true" />
              Coimbatore, India
            </span>
            <span>Built for independent retailers</span>
          </footer>
        </div>
      </section>

      <section className="signin-panel">
        <div className="signin-form-wrap">
          <div className="signin-mobile-brand">
            <Brand compact />
          </div>

          <header className="signin-head">
            <span className="signin-eyebrow">POSFlow access</span>
            <h2>Welcome back</h2>
            <p>Sign in to your counter or admin console.</p>
          </header>

          {error && (
            <div className="alert alert-error signin-alert" role="alert">
              {error}
            </div>
          )}

          {demoNotice && (
            <div className="signin-demo-notice" role="status">
              {demoNotice}
            </div>
          )}

          <form className="signin-form" onSubmit={handleSubmit}>
            <div className="signin-field">
              <label htmlFor="email">Email address</label>
              <div className="signin-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="email"
                  className="signin-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@posflow.in"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="signin-field">
              <label htmlFor="password">Password</label>
              <div className="signin-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="password"
                  className="signin-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="signin-eye"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className="signin-submit" disabled={loading}>
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="signin-demo-label">
            <span>Quick demo access</span>
          </div>

          <div className="signin-demo-grid">
            <button
              type="button"
              className="signin-demo"
              onClick={() =>
                fillDemo("admin@posflow.com", "admin123", "Admin demo")
              }
            >
              <span className="signin-demo-icon" aria-hidden="true">
                <ShieldCheck size={18} strokeWidth={1.9} />
              </span>
              <span className="signin-demo-copy">
                <strong>Admin</strong>
                <small>admin@posflow.com</small>
              </span>
            </button>

            <button
              type="button"
              className="signin-demo"
              onClick={() =>
                fillDemo("staff@posflow.com", "staff123", "Staff demo")
              }
            >
              <span className="signin-demo-icon" aria-hidden="true">
                <UserRound size={18} strokeWidth={1.9} />
              </span>
              <span className="signin-demo-copy">
                <strong>Staff</strong>
                <small>staff@posflow.com</small>
              </span>
            </button>
          </div>

          <p className="signin-demo-note">
            Pick a demo account to fill the form instantly.
          </p>

          <p className="signin-copyright">
            © 2026 POSFlow · Coimbatore, India
          </p>
        </div>
      </section>
    </main>
  );
}
