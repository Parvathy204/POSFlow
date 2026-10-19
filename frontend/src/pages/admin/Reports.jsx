import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import { formatMoney, formatMoneyShort, formatDay } from "../../utils/format";

const RANGES = [
  { label: "Today", days: 0 },
  { label: "7 days", days: 6 },
  { label: "14 days", days: 13 },
  { label: "30 days", days: 29 },
];

function rangeParams(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function Reports() {
  const [days, setDays] = useState(13);
  const [sales, setSales] = useState(null);
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const params = rangeParams(days);
    try {
      const [salesRes, staffRes, invRes] = await Promise.all([
        api.get("/reports/sales", { params }),
        api.get("/reports/staff", { params }),
        api.get("/reports/inventory"),
      ]);
      setSales(salesRes.data);
      setStaff(staffRes.data);
      setInventory(invRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load reports");
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const maxDay = sales ? Math.max(...sales.byDay.map((d) => d.sales), 1) : 1;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>Sales, staff and inventory analytics</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {RANGES.map((r) => (
            <button
              key={r.days}
              className={`btn btn-sm ${days === r.days ? "" : "btn-secondary"}`}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sales && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Revenue</div>
              <div className="stat-value">{formatMoneyShort(sales.totals.revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Bills</div>
              <div className="stat-value">{sales.totals.bills}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gross Profit (est.)</div>
              <div className="stat-value" style={{ color: "var(--success)" }}>
                {formatMoneyShort(sales.totals.grossProfit)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Discounts Given</div>
              <div className="stat-value">{formatMoneyShort(sales.totals.discounts)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Refunds</div>
              <div className="stat-value" style={{ color: "var(--danger)" }}>
                {formatMoneyShort(sales.totals.refunds)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tax Collected</div>
              <div className="stat-value">{formatMoneyShort(sales.totals.tax)}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.7fr 1fr",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div className="card">
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>Daily Sales</h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  height: 190,
                  overflowX: "auto",
                }}
              >
                {sales.byDay.map((d) => (
                  <div
                    key={d._id}
                    style={{ flex: 1, minWidth: 34, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                    title={`${d._id}: ${formatMoney(d.sales)} (${d.bills} bills)`}
                  >
                    <div style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {formatMoneyShort(d.sales)}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max((d.sales / maxDay) * 130, 4)}px`,
                        background: "var(--primary)",
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                    <div style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {formatDay(d._id)}
                    </div>
                  </div>
                ))}
                {sales.byDay.length === 0 && (
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>No sales in this period.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 16, marginBottom: 14 }}>Payment Methods</h2>
              {sales.byMethod.map((m) => {
                const pct = sales.totals.revenue
                  ? Math.round((m.total / sales.totals.revenue) * 100)
                  : 0;
                return (
                  <div key={m._id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{m._id}</span>
                      <span>
                        {formatMoneyShort(m.total)} · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: "var(--bg)", borderRadius: 999 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--primary)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {sales.byMethod.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No data.</p>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              marginTop: 18,
              alignItems: "start",
            }}
          >
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Top Products</th>
                    <th className="num">Qty Sold</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.topProducts.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p._id}</td>
                      <td className="num">{p.quantity}</td>
                      <td className="num">{formatMoney(p.revenue)}</td>
                    </tr>
                  ))}
                  {sales.topProducts.length === 0 && (
                    <tr>
                      <td colSpan="3" className="empty">No data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff Performance</th>
                    <th>Bills</th>
                    <th className="num">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>
                        {s.staff}{" "}
                        {s.role === "admin" && <span className="badge badge-primary">admin</span>}
                      </td>
                      <td>{s.bills}</td>
                      <td className="num">{formatMoney(s.sales)}</td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan="3" className="empty">No sales by staff in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {inventory && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Inventory Valuation</h2>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card" style={{ boxShadow: "none" }}>
              <div className="stat-label">Active SKUs</div>
              <div className="stat-value">{inventory.stats.skus}</div>
            </div>
            <div className="stat-card" style={{ boxShadow: "none" }}>
              <div className="stat-label">Units in Stock</div>
              <div className="stat-value">{inventory.stats.units}</div>
            </div>
            <div className="stat-card" style={{ boxShadow: "none" }}>
              <div className="stat-label">Retail Value</div>
              <div className="stat-value">{formatMoneyShort(inventory.stats.retailValue)}</div>
            </div>
            <div className="stat-card" style={{ boxShadow: "none" }}>
              <div className="stat-label">Cost Value</div>
              <div className="stat-value">{formatMoneyShort(inventory.stats.costValue)}</div>
            </div>
          </div>

          {inventory.byCategory.length > 0 && (
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">SKUs</th>
                  <th className="num">Units</th>
                  <th className="num">Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.byCategory.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>{c._id}</td>
                    <td className="num">{c.skus}</td>
                    <td className="num">{c.units}</td>
                    <td className="num">{formatMoney(c.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
