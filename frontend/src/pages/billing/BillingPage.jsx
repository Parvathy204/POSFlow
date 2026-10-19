import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, Printer, LogOut, ArrowLeft, Receipt } from "lucide-react";
import api from "../../api";
import { useAuth } from "../../auth";
import { formatMoney, formatDate, statusBadge } from "../../utils/format";

export default function BillingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("billing");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [mySales, setMySales] = useState([]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: search ? { search } : {} });
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load products");
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (tab === "history") {
      api
        .get("/transactions")
        .then((res) => setMySales(res.data))
        .catch(() => {});
    }
  }, [tab]);

  function addToCart(product) {
    if (product.stock < 1) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setError("");
    setCart((current) => {
      const existing = current.find((i) => i._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError(`Only ${product.stock} units of ${product.name} in stock.`);
          return current;
        }
        return current.map((i) =>
          i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((current) =>
      current
        .map((i) => {
          if (i._id !== id) return i;
          const next = i.quantity + delta;
          if (next > i.stock) {
            setError(`Only ${i.stock} units in stock.`);
            return i;
          }
          return { ...i, quantity: next };
        })
        .filter((i) => i.quantity > 0)
    );
  }

  const subtotal = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const taxable = subtotal - discountValue;
  const taxValue = Math.round(taxable * (Number(taxRate) || 0)) / 100;
  const total = taxable + taxValue;
  // An empty cash field means the customer paid the exact amount.
  const cashReceived = amountPaid === "" ? total : Number(amountPaid) || 0;
  const paid = paymentMethod === "Cash" ? cashReceived : total;
  const change = paid > total ? paid - total : 0;

  function resetBill() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("");
    setTaxRate("0");
    setPaymentMethod("Cash");
    setAmountPaid("");
    setError("");
  }

  async function completeSale() {
    if (cart.length === 0) {
      setError("Add at least one product to the bill.");
      return;
    }
    if (paymentMethod === "Cash" && cashReceived < total) {
      setError("Amount received is less than the bill total.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await api.post("/transactions", {
        items: cart.map((i) => ({ productId: i._id, quantity: i.quantity })),
        paymentMethod,
        customerName,
        customerPhone,
        discount: discountValue,
        taxRate: Number(taxRate) || 0,
        amountPaid: paid,
      });

      setReceipt({
        ...res.data.transaction,
        cashierName: user?.name,
      });

      // Reflect the new stock locally
      setProducts((current) =>
        current.map((p) => {
          const sold = cart.find((i) => i._id === p._id);
          return sold ? { ...p, stock: p.stock - sold.quantity } : p;
        })
      );

      resetBill();
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete the sale.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      {/* Top bar */}
      <header
        className="no-print"
        style={{
          background: "#111827",
          color: "#fff",
          padding: "12px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {user?.role === "admin" && (
          <button className="btn btn-ghost btn-sm" style={{ color: "#d1d5db" }} onClick={() => navigate("/admin")}>
            <ArrowLeft size={15} /> Admin
          </button>
        )}
        <div style={{ fontWeight: 800, fontSize: 17 }}>
          POS<span style={{ color: "#818cf8" }}>Flow</span> Billing
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 3 }}>
          <button
            className={`btn btn-sm ${tab === "billing" ? "" : "btn-ghost"}`}
            style={{ color: tab === "billing" ? "#111827" : "#d1d5db" }}
            onClick={() => setTab("billing")}
          >
            <Receipt size={15} /> New Bill
          </button>
          <button
            className={`btn btn-sm ${tab === "history" ? "" : "btn-ghost"}`}
            style={{ color: tab === "history" ? "#111827" : "#d1d5db" }}
            onClick={() => setTab("history")}
          >
            My Sales
          </button>
        </div>

        <span style={{ fontSize: 13, color: "#9ca3af" }}>{user?.name}</span>
        <button className="btn btn-ghost btn-sm" style={{ color: "#d1d5db" }} onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </header>

      {tab === "billing" ? (
        <div className="billing-layout">
          {/* Product picker */}
          <div>
            <div className="toolbar">
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                <Search
                  size={16}
                  style={{ position: "absolute", left: 12, color: "var(--muted)" }}
                />
                <input
                  className="input"
                  style={{ width: "100%", paddingLeft: 36 }}
                  placeholder="Search products by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="alert alert-error no-print">{error}</div>}

            <div className="product-grid">
              {products.map((p) => (
                <div
                  key={p._id}
                  className={`product-tile${p.stock < 1 ? " out" : ""}`}
                  onClick={() => addToCart(p)}
                >
                  <div className="p-name">{p.name}</div>
                  <div className="p-meta">
                    {p.sku} · {p.size}
                    <br />
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </div>
                  <div className="p-price">{formatMoney(p.price)}</div>
                </div>
              ))}
              {products.length === 0 && <p style={{ color: "var(--muted)" }}>No products found.</p>}
            </div>
          </div>

          {/* Cart */}
          <div className="cart-panel">
            <div className="cart-head">Current Bill</div>

            <div className="cart-items">
              {cart.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14, padding: "18px 0" }}>
                  Tap products on the left to add them to the bill.
                </p>
              )}
              {cart.map((i) => (
                <div className="cart-line" key={i._id}>
                  <div className="cl-info">
                    <div className="cl-name">{i.name}</div>
                    <div className="cl-price">{formatMoney(i.price)} each</div>
                  </div>
                  <div className="qty-box">
                    <button onClick={() => changeQty(i._id, -1)}>−</button>
                    <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700 }}>
                      {i.quantity}
                    </span>
                    <button onClick={() => changeQty(i._id, +1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, minWidth: 76, textAlign: "right" }}>
                    {formatMoney(Number(i.price) * i.quantity)}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--danger)", padding: 4 }}
                    onClick={() => setCart((c) => c.filter((x) => x._id !== i._id))}
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-foot">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input
                  className="input"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Discount (₹)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>GST (%)</label>
                  <select className="input" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
              </div>

              <div className="totals-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="totals-row">
                  <span>Discount</span>
                  <span>-{formatMoney(discountValue)}</span>
                </div>
              )}
              {taxValue > 0 && (
                <div className="totals-row">
                  <span>GST ({taxRate}%)</span>
                  <span>{formatMoney(taxValue)}</span>
                </div>
              )}
              <div className="totals-row grand">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {["Cash", "UPI", "Card"].map((m) => (
                  <button
                    key={m}
                    className={`btn btn-sm ${paymentMethod === m ? "" : "btn-secondary"}`}
                    style={{ flex: 1 }}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod === "Cash" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Cash received (₹)</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder={String(Math.ceil(total))}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Change to return</label>
                    <div
                      className="input"
                      style={{ background: "var(--bg)", fontWeight: 700, display: "flex", alignItems: "center" }}
                    >
                      {formatMoney(change)}
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn"
                style={{ width: "100%", padding: 13, fontSize: 15 }}
                onClick={completeSale}
                disabled={saving || cart.length === 0}
              >
                {saving ? "Processing..." : `Complete Sale · ${formatMoney(total)}`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontSize: 22, marginBottom: 16 }}>My Sales</h1>
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
                {mySales.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600 }}>{t.invoiceNumber}</td>
                    <td>{t.customerName}</td>
                    <td>{t.paymentMethod}</td>
                    <td className="num">{formatMoney(t.totalAmount)}</td>
                    <td>
                      <span className={statusBadge(t.status)}>{t.status}</span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
                {mySales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty">No sales yet. Start billing!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receipt && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setReceipt(null)}>
          <div className="modal" style={{ maxWidth: 400, padding: 16 }}>
            <div className="receipt">
              <h3>POSFLOW STORE</h3>
              <div className="r-sub">
                Retail Textile Showroom
                <br />
                GSTIN: 24ABCDE1234F1Z5
              </div>
              <div className="r-line" />
              <table>
                <tbody>
                  <tr>
                    <td>Invoice</td>
                    <td style={{ textAlign: "right" }}>{receipt.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td style={{ textAlign: "right" }}>{formatDate(receipt.createdAt)}</td>
                  </tr>
                  <tr>
                    <td>Customer</td>
                    <td style={{ textAlign: "right" }}>{receipt.customerName}</td>
                  </tr>
                  <tr>
                    <td>Billed by</td>
                    <td style={{ textAlign: "right" }}>{receipt.cashierName || "-"}</td>
                  </tr>
                </tbody>
              </table>
              <div className="r-line" />
              <table>
                <tbody>
                  {receipt.items.map((i) => (
                    <tr key={i._id || i.productId}>
                      <td>
                        {i.name}
                        <br />
                        <span style={{ fontSize: 10 }}>
                          {i.quantity} × {formatMoney(i.price)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>{formatMoney(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="r-line" />
              <table>
                <tbody>
                  <tr>
                    <td>Subtotal</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.subtotal)}</td>
                  </tr>
                  {receipt.discount > 0 && (
                    <tr>
                      <td>Discount</td>
                      <td style={{ textAlign: "right" }}>-{formatMoney(receipt.discount)}</td>
                    </tr>
                  )}
                  {receipt.taxAmount > 0 && (
                    <tr>
                      <td>GST</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(receipt.taxAmount)}</td>
                    </tr>
                  )}
                  <tr className="r-total">
                    <td>TOTAL</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td>Paid ({receipt.paymentMethod})</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(receipt.amountPaid)}</td>
                  </tr>
                  {receipt.changeReturned > 0 && (
                    <tr>
                      <td>Change</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(receipt.changeReturned)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="r-line" />
              <div className="r-thanks">
                Thank you for shopping with us!
                <br />
                Goods once sold are exchangeable within 7 days with receipt.
              </div>
            </div>

            <div className="modal-actions no-print">
              <button className="btn btn-secondary" onClick={() => setReceipt(null)}>
                New Bill
              </button>
              <button className="btn" onClick={() => window.print()}>
                <Printer size={16} /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
