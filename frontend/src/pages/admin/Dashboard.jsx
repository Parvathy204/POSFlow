import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { formatMoneyShort, formatDate, statusBadge } from "../../utils/format";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports/dashboard")
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load dashboard")
      );
  }, []);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <div className="page"><p style={{ color: "var(--muted)" }}>Loading dashboard...</p></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Store overview and recent activity</p>
        </div>
        <Link to="/billing" className="btn">
          Open Billing Portal
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value">{formatMoneyShort(data.todaySales)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Bills</div>
          <div className="stat-value">{data.todayBills}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatMoneyShort(data.monthSales)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Month Bills</div>
          <div className="stat-value">{data.monthBills}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{data.totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Staff Members</div>
          <div className="stat-value">{data.staffCount}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, alignItems: "start" }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Payment</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }}>{t.invoiceNumber}</td>
                  <td>{t.customerName}</td>
                  <td>{t.paymentMethod}</td>
                  <td className="num">{formatMoneyShort(t.totalAmount)}</td>
                  <td>
                    <span className={statusBadge(t.status)}>{t.status}</span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">No sales yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Low Stock Alerts</h2>
          {data.lowStock.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>All products are sufficiently stocked.</p>
          )}
          {data.lowStock.map((p) => (
            <div
              key={p._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid var(--line)",
                fontSize: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.sku}</div>
              </div>
              <span className={p.stock === 0 ? "badge badge-danger" : "badge badge-warning"}>
                {p.stock} left
              </span>
            </div>
          ))}
          <Link
            to="/admin/products"
            style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 600 }}
          >
            Manage inventory →
          </Link>
        </div>
      </div>
    </div>
  );
}
