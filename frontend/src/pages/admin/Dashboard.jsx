import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Package,
  Plus,
  ReceiptText,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../auth";
import { formatMoneyShort, formatDate, statusBadge } from "../../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
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

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <p className="dash-loading">Loading dashboard...</p>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const billLabel = data.todayBills === 1 ? "bill" : "bills";

  return (
    <div className="page dashboard-page">
      <header className="page-head dash-head">
        <div>
          <span className="dash-eyebrow">Store overview</span>
          <h1>Welcome back, {firstName}</h1>
          <p>Here is what is happening across your store today.</p>
        </div>
        <div className="dash-head-actions">
          <span className="dash-date">
            <CalendarDays size={15} />
            {today}
          </span>
          <Link to="/billing" className="btn">
            <Plus size={16} />
            New bill
          </Link>
        </div>
      </header>

      <div className="dash-kpis">
        <article className="dash-kpi dash-kpi-primary">
          <div className="dash-kpi-top">
            <span>Today&apos;s sales</span>
            <span className="dash-kpi-icon">
              <Wallet size={18} />
            </span>
          </div>
          <strong className="dash-kpi-value">
            {formatMoneyShort(data.todaySales)}
          </strong>
          <span className="dash-kpi-foot">
            {data.todayBills} {billLabel} billed today
          </span>
        </article>

        <article className="dash-kpi">
          <div className="dash-kpi-top">
            <span>This month</span>
            <span className="dash-kpi-icon">
              <TrendingUp size={18} />
            </span>
          </div>
          <strong className="dash-kpi-value">
            {formatMoneyShort(data.monthSales)}
          </strong>
          <span className="dash-kpi-foot">
            {data.monthBills} bills this month
          </span>
        </article>

        <article className="dash-kpi">
          <div className="dash-kpi-top">
            <span>Active products</span>
            <span className="dash-kpi-icon">
              <Package size={18} />
            </span>
          </div>
          <strong className="dash-kpi-value">{data.totalProducts}</strong>
          <span className="dash-kpi-foot">Live in the catalogue</span>
        </article>

        <article className="dash-kpi">
          <div className="dash-kpi-top">
            <span>Team</span>
            <span className="dash-kpi-icon">
              <Users size={18} />
            </span>
          </div>
          <strong className="dash-kpi-value">{data.staffCount}</strong>
          <span className="dash-kpi-foot">Active staff accounts</span>
        </article>
      </div>

      <div className="dash-grid">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <h2>Recent sales</h2>
              <span>Latest bills from the counter</span>
            </div>
            <Link to="/admin/transactions">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="dash-sales">
            <div className="dash-sales-head">
              <span>Invoice</span>
              <span>Customer</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            {data.recent.map((transaction) => (
              <div className="dash-sale-row" key={transaction._id}>
                <div className="dash-sale-main">
                  <strong>{transaction.invoiceNumber}</strong>
                  <small>{formatDate(transaction.createdAt)}</small>
                </div>
                <span className="dash-sale-customer">
                  {transaction.customerName || "Walk-in customer"}
                </span>
                <span className="dash-sale-amount">
                  {formatMoneyShort(transaction.totalAmount)}
                </span>
                <span className={statusBadge(transaction.status)}>
                  {transaction.status}
                </span>
              </div>
            ))}

            {data.recent.length === 0 && (
              <p className="empty">No sales recorded yet.</p>
            )}
          </div>
        </section>

        <section className="dash-panel dash-stock-panel">
          <div className="dash-panel-head">
            <div>
              <h2>Low stock</h2>
              <span>Restock before the shelf empties</span>
            </div>
            <Link to="/admin/products">
              Manage
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="dash-stock-list">
            {data.lowStock.map((product) => (
              <div className="dash-stock-row" key={product._id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.sku}</small>
                </div>
                <span
                  className={
                    product.stock === 0
                      ? "badge badge-danger"
                      : "badge badge-warning"
                  }
                >
                  {product.stock} left
                </span>
              </div>
            ))}

            {data.lowStock.length === 0 && (
              <p className="empty">Every product is sufficiently stocked.</p>
            )}
          </div>

          <Link to="/admin/products" className="dash-panel-link">
            Open inventory
            <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>

      <section className="dash-shortcuts">
        <div className="dash-shortcuts-head">
          <h2>Quick actions</h2>
          <span>Jump straight into the work that matters.</span>
        </div>

        <div className="dash-quick-grid">
          <Link to="/billing" className="dash-action">
            <span className="dash-action-icon">
              <ReceiptText size={18} />
            </span>
            <span>
              <strong>New bill</strong>
              <small>Open the counter</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/admin/products" className="dash-action">
            <span className="dash-action-icon">
              <Package size={18} />
            </span>
            <span>
              <strong>Add a product</strong>
              <small>Update the catalogue</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/admin/reports" className="dash-action">
            <span className="dash-action-icon">
              <BarChart3 size={18} />
            </span>
            <span>
              <strong>View reports</strong>
              <small>Sales and stock</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/admin/staff" className="dash-action">
            <span className="dash-action-icon">
              <Users size={18} />
            </span>
            <span>
              <strong>Manage staff</strong>
              <small>Roles and access</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
