import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
  MapPin,
  MoreHorizontal,
  Package,
  ReceiptText,
  ShieldCheck,
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

function MobilePreview() {
  return (
    <div className="signin-device-wrap" aria-hidden="true">
      <span className="signin-float signin-float-top">
        <CheckCircle2 size={13} />
        Stock synced
      </span>

      <div className="signin-phone">
        <div className="signin-phone-screen">
          <div className="signin-phone-notch" />
          <div className="signin-phone-top">
            <span>POSFlow</span>
            <span>Hi, Priya</span>
          </div>

          <div className="signin-phone-body">
            <div className="signin-phone-greet">Store overview</div>

            <div className="signin-phone-stats">
              <div className="signin-phone-stat">
                <small>Today</small>
                <strong>₹12,480</strong>
              </div>
              <div className="signin-phone-stat">
                <small>Bills</small>
                <strong>18</strong>
              </div>
            </div>

            <div className="signin-phone-chart">
              <i style={{ height: "32%" }} />
              <i style={{ height: "58%" }} />
              <i style={{ height: "46%" }} />
              <i style={{ height: "74%" }} />
              <i style={{ height: "64%" }} />
              <i style={{ height: "92%" }} />
              <i style={{ height: "78%" }} />
            </div>

            <div className="signin-phone-section">Low stock</div>
            <div className="signin-phone-row">
              <span>Silk Saree · Emerald</span>
              <b>2 left</b>
            </div>
            <div className="signin-phone-row">
              <span>Cotton Kurta · Indigo</span>
              <b>4 left</b>
            </div>

            <div className="signin-phone-tabs">
              <Home className="active" />
              <Package />
              <BarChart3 />
              <MoreHorizontal />
            </div>
          </div>
        </div>
      </div>

      <span className="signin-float signin-float-bottom">
        <BarChart3 size={13} />
        Daily report ready
      </span>
    </div>
  );
}

const ALLOWED_NEXT_PATHS = ["/admin", "/billing", "/mobile"];

function resolveDestination(user, requestedPath) {
  const fallback = user.role === "admin" ? "/admin" : "/billing";
  const target = requestedPath || "";
  const isAllowed = ALLOWED_NEXT_PATHS.some(
    (path) => target === path || target.startsWith(`${path}/`)
  );

  if (!isAllowed) return fallback;

  // Staff accounts only have access to the billing counter.
  if (user.role !== "admin" && target !== "/billing" && !target.startsWith("/billing/")) {
    return "/billing";
  }

  return target;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(resolveDestination(user, searchParams.get("next")), {
        replace: true,
      });
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Check your connection and try again.");
      } else {
        setError(
          err.response.data?.message || "Unable to log in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-visual" aria-label="About POSFlow">
        <div className="signin-visual-inner">
          <Brand />

          <div className="signin-visual-main">
            <span className="signin-kicker">
              <span className="signin-pulse" aria-hidden="true" />
              Textile retail, without the friction
            </span>

            <h1>
              Run the shop.
              <br />
              <span>Not the paperwork.</span>
            </h1>

            <p className="signin-lede">
              Billing, inventory, staff and daily reports — together in one
              calm, quick workspace.
            </p>

            <MobilePreview />

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
              Kochi, India
            </span>
            <span>Built for independent retailers</span>
          </footer>
        </div>
      </section>

      <section className="signin-panel">
        <div className="signin-form-wrap">
          <Link to="/" className="signin-back">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to website
          </Link>

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

          <div className="signin-security">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>Secure sign-in for admin and staff accounts.</span>
          </div>

          <p className="signin-copyright">
            © 2026 POSFlow · Kochi, India
          </p>
        </div>
      </section>
    </main>
  );
}
