import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Receipt,
  Undo2,
  BookOpen,
  BarChart3,
  ShoppingCart,
  Smartphone,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../auth";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/staff", label: "Staff", icon: Users },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/returns", label: "Returns", icon: Undo2 },
  { to: "/admin/ledger", label: "Ledger", icon: BookOpen },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar no-print">
        <div className="sidebar-brand">
          POS<span>Flow</span>
        </div>

        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          <NavLink
            to="/billing"
            className="nav-item"
            style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <ShoppingCart size={18} />
            Billing Portal
          </NavLink>

          <NavLink to="/mobile" className="nav-item">
            <Smartphone size={18} />
            Mobile Admin UI
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="who">{user?.name}</div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: "100%" }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <Outlet />
      </div>
    </div>
  );
}
