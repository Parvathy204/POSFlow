import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  MoreHorizontal,
  Users,
  Truck,
  Undo2,
  BookOpen,
  Plus,
  Monitor,
  LogOut,
  Search,
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../auth";
import Modal from "../../components/Modal";
import {
  formatMoney,
  formatMoneyShort,
  formatDate,
  formatDay,
  statusBadge,
} from "../../utils/format";
import { isValidPhone, phoneDigits, PHONE_ERROR } from "../../utils/phone";

/* ------------------------------------------------------------------ *
 * MobileAdmin - the complete admin portal in an app-style layout.
 * Fixed top bar, bottom tab bar, mobile cards. Same API + rules as
 * the desktop portal.
 * ------------------------------------------------------------------ */

const TABS = [
  { key: "home", label: "Home", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "sales", label: "Sales", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "more", label: "More", icon: MoreHorizontal },
];

const MORE_LINKS = [
  { key: "staff", label: "Staff Management", icon: Users },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "returns", label: "Product Returns", icon: Undo2 },
  { key: "ledger", label: "Ledger", icon: BookOpen },
];

export default function MobileAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="mobile-stage">
      <div className="phone">
        {/* Top app bar */}
        <div className="mobile-top">
          {tab !== "home" && tab !== "more" ? (
            <button
              onClick={() => setTab("home")}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}
            >
              ←
            </button>
          ) : (
            <span style={{ fontWeight: 800, fontSize: 18 }}>
              POS<span style={{ color: "#c7d2fe" }}>Flow</span>
            </span>
          )}
          <div className="m-title">
            {tab === "home" && `Hi, ${user?.name?.split(" ")[0]}`}
            {tab === "products" && "Products"}
            {tab === "sales" && "Transactions"}
            {tab === "reports" && "Reports"}
            {tab === "more" && "More"}
            {MORE_LINKS.map((l) =>
              tab === l.key ? (
                <span key={l.key}>{l.label}</span>
              ) : null
            )}
          </div>
          <button
            onClick={() => navigate("/admin")}
            title="Switch to desktop view"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="mobile-body">
          {tab === "home" && <MobileDashboard onNavigate={setTab} />}
          {tab === "products" && <MobileProducts />}
          {tab === "sales" && <MobileTransactions />}
          {tab === "reports" && <MobileReports />}
          {tab === "more" && (
            <>
              <div className="m-section-title">Management</div>
              {MORE_LINKS.map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  className="m-list-item m-card-row"
                  onClick={() => setTab(key)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Icon size={19} color="var(--primary)" />
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{label}</span>
                  </div>
                  <span style={{ color: "var(--muted)" }}>›</span>
                </div>
              ))}
            </>
          )}

          {MORE_LINKS.map(({ key }) =>
            tab === key ? (
              <div key={key}>
                {key === "staff" && <MobileStaff />}
                {key === "suppliers" && <MobileSuppliers />}
                {key === "returns" && <MobileReturns />}
                {key === "ledger" && <MobileLedger />}
              </div>
            ) : null
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="mobile-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`mobile-tab${tab === key || (key === "more" && MORE_LINKS.some((l) => l.key === tab)) ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Dashboard ---------------------------- */

function MobileDashboard({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/reports/dashboard").then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <p style={{ color: "var(--muted)" }}>Loading...</p>;

  return (
    <>
      <div className="m-stat-grid">
        <div className="m-stat">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value">{formatMoneyShort(data.todaySales)}</div>
        </div>
        <div className="m-stat">
          <div className="stat-label">Today's Bills</div>
          <div className="stat-value">{data.todayBills}</div>
        </div>
        <div className="m-stat">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatMoneyShort(data.monthSales)}</div>
        </div>
        <div className="m-stat">
          <div className="stat-label">Products</div>
          <div className="stat-value">{data.totalProducts}</div>
        </div>
      </div>

      <div className="m-section-title">Recent Sales</div>
      {data.recent.map((t) => (
        <div className="m-list-item" key={t._id}>
          <div className="m-card-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.invoiceNumber}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                {t.customerName} · {t.paymentMethod}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800 }}>{formatMoney(t.totalAmount)}</div>
              <span className={statusBadge(t.status)} style={{ fontSize: 10 }}>
                {t.status}
              </span>
            </div>
          </div>
        </div>
      ))}

      {data.lowStock.length > 0 && (
        <>
          <div className="m-section-title">Low Stock Alerts</div>
          {data.lowStock.map((p) => (
            <div className="m-list-item m-card-row" key={p._id}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.sku}</div>
              </div>
              <span className={p.stock === 0 ? "badge badge-danger" : "badge badge-warning"}>
                {p.stock} left
              </span>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: "100%", marginTop: 6 }}
            onClick={() => onNavigate("products")}
          >
            Manage Inventory
          </button>
        </>
      )}
    </>
  );
}

/* ---------------------------- Products ---------------------------- */

const EMPTY_PRODUCT = {
  name: "",
  sku: "",
  category: "Shirts",
  size: "Free Size",
  price: "",
  costPrice: "",
  stock: "",
  lowStockThreshold: "5",
  supplier: "",
};

const CATEGORIES = [
  "Shirts", "Jeans", "Sarees", "Dress Materials", "Kurtas", "T-Shirts", "Dupattas", "Suits", "Other",
];

function MobileProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: search ? { search } : {} });
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load products");
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/suppliers").then((res) => setSuppliers(res.data)).catch(() => {});
  }, []);

  function openCreate() {
    setForm(EMPTY_PRODUCT);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      size: p.size || "Free Size",
      price: String(p.price),
      costPrice: String(p.costPrice ?? ""),
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold ?? 5),
      supplier: p.supplier?._id || "",
    });
    setEditingId(p._id);
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice) || 0,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      supplier: form.supplier || null,
    };
    try {
      if (editingId) await api.put(`/products/${editingId}`, payload);
      else await api.post("/products", payload);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product");
    }
  }

  return (
    <>
      <div style={{ position: "relative", marginBottom: 12, display: "flex", alignItems: "center" }}>
        <Search size={16} style={{ position: "absolute", left: 12, color: "var(--muted)" }} />
        <input
          className="input"
          style={{ paddingLeft: 36 }}
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {products.map((p) => (
        <div className="m-list-item" key={p._id}>
          <div className="m-card-row">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                {p.sku} · {p.category} · {p.size}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                <strong style={{ color: "var(--primary)" }}>{formatMoney(p.price)}</strong>
                <span
                  className={
                    p.stock === 0
                      ? "badge badge-danger"
                      : p.stock <= (p.lowStockThreshold ?? 5)
                      ? "badge badge-warning"
                      : "badge badge-success"
                  }
                >
                  {p.stock} in stock
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>
                Del
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        className="btn"
        style={{ position: "fixed", bottom: 76, right: 16, borderRadius: 999, width: 54, height: 54, justifyContent: "center", boxShadow: "var(--shadow-lg)", zIndex: 50 }}
        onClick={openCreate}
        title="Add product"
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <Modal
          title={editingId ? "Edit Product" : "Add Product"}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn" form="m-product-form" type="submit">
                {editingId ? "Update" : "Save"}
              </button>
            </>
          }
        >
          <form id="m-product-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Product name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>SKU</label>
              <input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Size</label>
              <input className="input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </div>
            <div className="field">
              <label>Supplier</label>
              <select className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                <option value="">No supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Selling price (₹)</label>
              <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="field">
              <label>Cost price (₹)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
            <div className="field">
              <label>Stock</label>
              <input className="input" type="number" min="0" step="1" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="field">
              <label>Low stock threshold</label>
              <input className="input" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* --------------------------- Transactions --------------------------- */

function MobileTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/transactions")
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load"));
  }, []);

  async function openDetail(id) {
    try {
      const res = await api.get(`/transactions/${id}`);
      setDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load invoice");
    }
  }

  async function cancelTransaction(id) {
    if (!window.confirm("Cancel this invoice? Stock will be restored.")) return;
    try {
      await api.post(`/transactions/${id}/cancel`);
      setDetail(null);
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel");
    }
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {transactions.map((t) => (
        <div className="m-list-item" key={t._id} onClick={() => openDetail(t._id)} style={{ cursor: "pointer" }}>
          <div className="m-card-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.invoiceNumber}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                {t.customerName} · {t.paymentMethod} · {t.staffId?.name || "-"}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                {formatDate(t.createdAt)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800 }}>{formatMoney(t.totalAmount)}</div>
              <span className={statusBadge(t.status)} style={{ fontSize: 10 }}>{t.status}</span>
            </div>
          </div>
        </div>
      ))}
      {transactions.length === 0 && <p style={{ color: "var(--muted)" }}>No transactions yet.</p>}

      {detail && (
        <Modal
          title={detail.invoiceNumber}
          onClose={() => setDetail(null)}
          actions={
            <>
              {detail.status === "Completed" && (
                <button className="btn btn-danger" onClick={() => cancelTransaction(detail._id)}>
                  Cancel Invoice
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
            {formatDate(detail.createdAt)} · {detail.staffId?.name || "-"}
          </p>
          {detail.items.map((i) => (
            <div className="m-card-row" key={i._id || i.productId} style={{ padding: "7px 0", borderBottom: "1px solid var(--line)", fontSize: 14 }}>
              <span>{i.name} × {i.quantity}</span>
              <strong>{formatMoney(i.subtotal)}</strong>
            </div>
          ))}
          <div className="totals-row grand" style={{ marginTop: 12 }}>
            <span>Total</span>
            <span>{formatMoney(detail.totalAmount)}</span>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------ Reports ------------------------------ */

function MobileReports() {
  const [days, setDays] = useState(6);
  const [sales, setSales] = useState(null);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    const params = { from: from.toISOString(), to: to.toISOString() };
    Promise.all([
      api.get("/reports/sales", { params }),
      api.get("/reports/staff", { params }),
    ]).then(([s, st]) => {
      setSales(s.data);
      setStaff(st.data);
    }).catch(() => {});
  }, [days]);

  if (!sales) return <p style={{ color: "var(--muted)" }}>Loading...</p>;

  const maxDay = Math.max(...sales.byDay.map((d) => d.sales), 1);

  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ l: "Today", d: 0 }, { l: "7d", d: 6 }, { l: "14d", d: 13 }, { l: "30d", d: 29 }].map((r) => (
          <button
            key={r.d}
            className={`btn btn-sm ${days === r.d ? "" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => setDays(r.d)}
          >
            {r.l}
          </button>
        ))}
      </div>

      <div className="m-stat-grid">
        <div className="m-stat">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">{formatMoneyShort(sales.totals.revenue)}</div>
        </div>
        <div className="m-stat">
          <div className="stat-label">Bills</div>
          <div className="stat-value">{sales.totals.bills}</div>
        </div>
        <div className="m-stat">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {formatMoneyShort(sales.totals.grossProfit)}
          </div>
        </div>
        <div className="m-stat">
          <div className="stat-label">Refunds</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {formatMoneyShort(sales.totals.refunds)}
          </div>
        </div>
      </div>

      <div className="m-section-title">Daily Sales</div>
      <div className="m-card" style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 150, overflowX: "auto" }}>
        {sales.byDay.map((d) => (
          <div key={d._id} style={{ flex: 1, minWidth: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{ width: "100%", height: `${Math.max((d.sales / maxDay) * 100, 4)}px`, background: "var(--primary)", borderRadius: 3 }}
              title={`${d._id}: ${formatMoney(d.sales)}`}
            />
            <div style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap" }}>{formatDay(d._id)}</div>
          </div>
        ))}
        {sales.byDay.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No sales.</p>}
      </div>

      <div className="m-section-title">Payment Methods</div>
      <div className="m-card">
        {sales.byMethod.map((m) => (
          <div key={m._id} style={{ marginBottom: 10 }}>
            <div className="m-card-row" style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>{m._id}</strong>
              <span>{formatMoney(m.total)}</span>
            </div>
            <div style={{ height: 7, background: "var(--bg)", borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  width: `${sales.totals.revenue ? (m.total / sales.totals.revenue) * 100 : 0}%`,
                  background: "var(--primary)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))}
        {sales.byMethod.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No data.</p>}
      </div>

      <div className="m-section-title">Top Products</div>
      {sales.topProducts.map((p) => (
        <div className="m-list-item m-card-row" key={p._id}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p._id}</div>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <strong>{formatMoney(p.revenue)}</strong>
            <div style={{ color: "var(--muted)", fontSize: 11 }}>{p.quantity} sold</div>
          </div>
        </div>
      ))}
      {sales.topProducts.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No data.</p>}

      <div className="m-section-title">Staff Performance</div>
      {staff.map((s, idx) => (
        <div className="m-list-item m-card-row" key={idx}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.staff}</div>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <strong>{formatMoney(s.sales)}</strong>
            <div style={{ color: "var(--muted)", fontSize: 11 }}>{s.bills} bills</div>
          </div>
        </div>
      ))}
      {staff.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No staff sales.</p>}
    </>
  );
}

/* ------------------------------- Staff ------------------------------- */

const EMPTY_USER = { name: "", email: "", password: "", phone: "", role: "staff" };

function MobileStaff() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_USER);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load staff");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_USER);
    setEditingId(null);
    setPhoneError("");
    setShowForm(true);
  }

  function openEdit(u) {
    setForm({ name: u.name, email: u.email, password: "", phone: u.phone || "", role: u.role });
    setEditingId(u.id || u._id);
    setPhoneError("");
    setShowForm(true);
  }

  function handlePhoneChange(value) {
    const digits = phoneDigits(value);
    setForm((current) => ({ ...current, phone: digits }));
    setPhoneError(digits.length > 0 && digits.length !== 10 ? PHONE_ERROR : "");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isValidPhone(form.phone)) {
      setPhoneError(PHONE_ERROR);
      return;
    }

    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post("/users", form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save");
    }
  }

  async function toggleActive(u) {
    try {
      await api.put(`/users/${u.id || u._id}`, { isActive: !u.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update");
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try {
      await api.delete(`/users/${u.id || u._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete");
    }
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {users.map((u) => (
        <div className="m-list-item" key={u.id || u._id}>
          <div className="m-card-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {u.name}{" "}
                <span className={u.role === "admin" ? "badge badge-primary" : "badge"} style={{ fontSize: 10 }}>
                  {u.role}
                </span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{u.email}</div>
              <span className={u.isActive ? "badge badge-success" : "badge badge-danger"} style={{ fontSize: 10, marginTop: 4, display: "inline-block" }}>
                {u.isActive ? "Active" : "Deactivated"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
              <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(u)}>
                {u.isActive ? "Disable" : "Enable"}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Del</button>
            </div>
          </div>
        </div>
      ))}

      <button
        className="btn"
        style={{ position: "fixed", bottom: 76, right: 16, borderRadius: 999, width: 54, height: 54, justifyContent: "center", boxShadow: "var(--shadow-lg)", zIndex: 50 }}
        onClick={openCreate}
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <Modal
          title={editingId ? "Edit Staff" : "Add Staff"}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn" form="m-staff-form" type="submit">{editingId ? "Update" : "Create"}</button>
            </>
          }
        >
          <form id="m-staff-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Password {editingId && "(blank keeps current)"}</label>
              <input className="input" type="password" required={!editingId} minLength={editingId ? 0 : 8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? "m-staff-phone-error" : undefined}
              />
              {phoneError && (
                <p className="field-error" id="m-staff-phone-error">
                  {phoneError}
                </p>
              )}
            </div>
            <div className="field">
              <label>Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">Staff (billing only)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ----------------------------- Suppliers ----------------------------- */

const EMPTY_SUPPLIER = { name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "", notes: "" };

function MobileSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load suppliers");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_SUPPLIER);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(s) {
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || "",
      phone: s.phone,
      email: s.email || "",
      address: s.address || "",
      gstNumber: s.gstNumber || "",
      notes: s.notes || "",
    });
    setEditingId(s._id);
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (editingId) await api.put(`/suppliers/${editingId}`, form);
      else await api.post("/suppliers", form);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save supplier");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await api.delete(`/suppliers/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete supplier");
    }
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {suppliers.map((s) => (
        <div className="m-list-item" key={s._id}>
          <div className="m-card-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                {s.contactPerson && `${s.contactPerson} · `}{s.phone}
              </div>
              {s.address && <div style={{ color: "var(--muted)", fontSize: 12 }}>{s.address}</div>}
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Owed:{" "}
                <strong style={{ color: s.balanceOwed > 0 ? "var(--danger)" : "var(--success)" }}>
                  {formatMoney(s.balanceOwed)}
                </strong>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>Del</button>
            </div>
          </div>
        </div>
      ))}
      {suppliers.length === 0 && <p style={{ color: "var(--muted)" }}>No suppliers yet.</p>}

      <button
        className="btn"
        style={{ position: "fixed", bottom: 76, right: 16, borderRadius: 999, width: 54, height: 54, justifyContent: "center", boxShadow: "var(--shadow-lg)", zIndex: 50 }}
        onClick={openCreate}
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <Modal
          title={editingId ? "Edit Supplier" : "Add Supplier"}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn" form="m-supplier-form" type="submit">{editingId ? "Update" : "Save"}</button>
            </>
          }
        >
          <form id="m-supplier-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Contact person</label>
              <input className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="field">
              <label>Phone *</label>
              <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="field">
              <label>GST number</label>
              <input className="input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------ Returns ------------------------------ */

function MobileReturns() {
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/returns");
      setReturns(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load returns");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function lookupInvoice() {
    setInvoiceDetail(null);
    setQuantities({});
    if (!invoiceId.trim()) return;
    try {
      let tx = null;
      if (/^[a-f0-9]{24}$/i.test(invoiceId.trim())) {
        const res = await api.get(`/transactions/${invoiceId.trim()}`);
        tx = res.data;
      } else {
        const res = await api.get("/transactions");
        tx = res.data.find((t) => t.invoiceNumber.toLowerCase().includes(invoiceId.trim().toLowerCase()));
        if (tx) tx = (await api.get(`/transactions/${tx._id}`)).data;
      }
      if (!tx) {
        setError("No invoice found matching that.");
        return;
      }
      if (tx.status === "Cancelled" || tx.status === "Returned") {
        setError(`Invoice is ${tx.status}.`);
        return;
      }
      setInvoiceDetail(tx);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not find invoice");
    }
  }

  function selectedItems() {
    if (!invoiceDetail) return [];
    return invoiceDetail.items
      .map((i) => ({
        productId: i.productId,
        quantity: Number(quantities[i.productId]) || 0,
        price: i.price,
        name: i.name,
      }))
      .filter((i) => i.quantity > 0);
  }

  const refundTotal = selectedItems().reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function submitReturn() {
    const items = selectedItems();
    if (items.length === 0) {
      setError("Select quantities to return.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/returns", {
        transactionId: invoiceDetail._id,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        reason: reason.trim(),
        refundMethod,
      });
      setSuccess(`Return processed. Refund ${formatMoney(refundTotal)} recorded.`);
      setShowForm(false);
      setInvoiceId("");
      setInvoiceDetail(null);
      setQuantities({});
      setReason("");
      await load();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not process return");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {returns.map((r) => (
        <div className="m-list-item" key={r._id}>
          <div className="m-card-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.returnNumber}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                {r.invoiceNumber} · {r.refundMethod}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{r.reason}</div>
              <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                {formatDate(r.createdAt)} · by {r.processedBy?.name || "-"}
              </div>
            </div>
            <strong style={{ color: "var(--danger)" }}>-{formatMoney(r.refundAmount)}</strong>
          </div>
        </div>
      ))}
      {returns.length === 0 && <p style={{ color: "var(--muted)" }}>No returns yet.</p>}

      <button
        className="btn"
        style={{ position: "fixed", bottom: 76, right: 16, borderRadius: 999, width: 54, height: 54, justifyContent: "center", boxShadow: "var(--shadow-lg)", zIndex: 50 }}
        onClick={() => setShowForm(true)}
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <Modal
          title="Process Return"
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={submitReturn} disabled={saving || !invoiceDetail}>
                {saving ? "..." : `Confirm${refundTotal > 0 ? ` (${formatMoney(refundTotal)})` : ""}`}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Invoice number or ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="INV-..." value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} />
              <button className="btn btn-secondary" type="button" onClick={lookupInvoice}>Find</button>
            </div>
          </div>

          {invoiceDetail && (
            <>
              <div style={{ background: "var(--bg)", borderRadius: 8, padding: 10, fontSize: 12.5, marginBottom: 10 }}>
                <strong>{invoiceDetail.invoiceNumber}</strong> · {invoiceDetail.customerName}
              </div>
              {invoiceDetail.items.map((i) => {
                const max = i.quantity - (i.returnedQuantity || 0);
                return (
                  <div key={i._id || i.productId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ flex: 1, fontSize: 13.5 }}>
                      <div style={{ fontWeight: 600 }}>{i.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 11.5 }}>
                        {formatMoney(i.price)} × {i.quantity}
                        {i.returnedQuantity > 0 && ` · ${i.returnedQuantity} returned`}
                      </div>
                    </div>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max={max}
                      disabled={max <= 0}
                      style={{ width: 66 }}
                      placeholder="0"
                      value={quantities[i.productId] || ""}
                      onChange={(e) => setQuantities((q) => ({ ...q, [i.productId]: e.target.value }))}
                    />
                  </div>
                );
              })}
              <div className="field" style={{ marginTop: 12 }}>
                <label>Reason</label>
                <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="field">
                <label>Refund method</label>
                <select className="input" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                </select>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

/* ------------------------------- Ledger ------------------------------- */

function MobileLedger() {
  const [data, setData] = useState({ entries: [], summary: { credits: 0, debits: 0, balance: 0 } });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Expense", amount: "", description: "", category: "" });

  const load = useCallback(async () => {
    try {
      const res = await api.get("/ledger");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load ledger");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await api.post("/ledger", { ...form, amount: Number(form.amount) });
      setShowForm(false);
      setForm({ type: "Expense", amount: "", description: "", category: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save entry");
    }
  }

  const TYPE_COLORS = { Sale: "badge-success", Refund: "badge-danger", Expense: "badge-warning", Capital: "badge-primary", Adjustment: "" };

  return (
    <>
      <div className="m-stat-grid">
        <div className="m-stat">
          <div className="stat-label">Credits In</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>{formatMoneyShort(data.summary.credits)}</div>
        </div>
        <div className="m-stat">
          <div className="stat-label">Debits Out</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>{formatMoneyShort(data.summary.debits)}</div>
        </div>
      </div>
      <div className="m-card m-card-row" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>Net Balance</span>
        <strong style={{ fontSize: 18 }}>{formatMoney(data.summary.balance)}</strong>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data.entries.map((e) => (
        <div className="m-list-item" key={e._id}>
          <div className="m-card-row">
            <div>
              <span className={`badge ${TYPE_COLORS[e.type] || ""}`} style={{ fontSize: 10 }}>{e.type}</span>
              <div style={{ fontSize: 13.5, marginTop: 5, fontWeight: 600 }}>{e.description}</div>
              <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 2 }}>
                {formatDate(e.createdAt)} · {e.createdBy?.name || "System"}
              </div>
            </div>
            <strong style={{ color: e.direction === "credit" ? "var(--success)" : "var(--danger)" }}>
              {e.direction === "credit" ? "+" : "-"}{formatMoney(e.amount)}
            </strong>
          </div>
        </div>
      ))}
      {data.entries.length === 0 && <p style={{ color: "var(--muted)" }}>No entries.</p>}

      <button
        className="btn"
        style={{ position: "fixed", bottom: 76, right: 16, borderRadius: 999, width: 54, height: 54, justifyContent: "center", boxShadow: "var(--shadow-lg)", zIndex: 50 }}
        onClick={() => setShowForm(true)}
      >
        <Plus size={24} />
      </button>

      {showForm && (
        <Modal
          title="Add Ledger Entry"
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn" form="m-ledger-form" type="submit">Save</button>
            </>
          }
        >
          <form id="m-ledger-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Expense">Expense (money out)</option>
                <option value="Capital">Capital (money in)</option>
                <option value="Adjustment">Adjustment (money out)</option>
              </select>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <input className="input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <input className="input" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="field">
              <label>Category (optional)</label>
              <input className="input" placeholder="Rent, Salary, Utilities..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
