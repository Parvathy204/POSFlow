import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth";

import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Staff from "./pages/admin/Staff";
import Suppliers from "./pages/admin/Suppliers";
import Transactions from "./pages/admin/Transactions";
import Returns from "./pages/admin/Returns";
import Ledger from "./pages/admin/Ledger";
import Reports from "./pages/admin/Reports";

import BillingPage from "./pages/billing/BillingPage";
import MobileAdmin from "./pages/mobile/MobileAdmin";

function Protected({ children, role }) {
  const { user, checking } = useAuth();

  if (checking) {
    return (
      <div className="page">
        <p className="session-check">Checking your session...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/billing"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Desktop admin portal */}
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="staff" element={<Staff />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="returns" element={<Returns />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="reports" element={<Reports />} />
      </Route>

   
      <Route
        path="/billing/*"
        element={
          <Protected>
            <BillingPage />
          </Protected>
        }
      />

      {/* Mobile admin portal - full admin UI in an app-style layout */}
      <Route
        path="/mobile/*"
        element={
          <Protected role="admin">
            <MobileAdmin />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
