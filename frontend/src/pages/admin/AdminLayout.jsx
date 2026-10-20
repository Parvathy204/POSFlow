import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ShoppingCart,
  Smartphone,
  Truck,
  Undo2,
  Users,
} from "lucide-react";
import { useAuth } from "../../auth";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Selling",
    items: [
      { to: "/billing", label: "Billing counter", icon: ShoppingCart },
      { to: "/admin/transactions", label: "Transactions", icon: Receipt },
    ],
  },
  {
    label: "Stockroom",
    items: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "People",
    items: [{ to: "/admin/staff", label: "Staff", icon: Users }],
  },
  {
    label: "Accounts",
    items: [
      { to: "/admin/returns", label: "Returns", icon: Undo2 },
      { to: "/admin/ledger", label: "Ledger", icon: BookOpen },
      { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "More",
    items: [{ to: "/mobile", label: "Mobile admin", icon: Smartphone }],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar no-print">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            P
          </span>
          <span className="admin-brand-copy">
            <strong>POSFlow</strong>
            <small>Retail billing suite</small>
          </span>
        </div>

        <div className="admin-store">
          <span className="admin-store-mark" aria-hidden="true">
            PF
          </span>
          <span className="admin-store-copy">
            <strong>Main store</strong>
            <small>Kochi, India</small>
          </span>
          <span className="admin-store-status" aria-label="Store active" />
        </div>

        <nav className="admin-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="admin-nav-section" key={section.label}>
              <span className="admin-nav-label">{section.label}</span>
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `admin-nav-item${isActive ? " active" : ""}`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-foot">
          <span className="admin-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="admin-foot-copy">
            <strong>{user?.name}</strong>
            <small>Administrator</small>
          </span>
          <button
            className="admin-logout"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
