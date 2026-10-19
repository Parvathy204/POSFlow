import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Modal from "../../components/Modal";
import { formatMoney, formatDate } from "../../utils/format";

const TYPE_COLORS = {
  Sale: "badge-success",
  Refund: "badge-danger",
  Expense: "badge-warning",
  Capital: "badge-primary",
  Adjustment: "",
};

export default function Ledger() {
  const [data, setData] = useState({ entries: [], summary: { credits: 0, debits: 0, balance: 0 } });
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Expense", amount: "", description: "", category: "" });

  const load = useCallback(async () => {
    try {
      const res = await api.get("/ledger", { params: type ? { type } : {} });
      setData(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load ledger");
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/ledger", {
        ...form,
        amount: Number(form.amount),
      });
      setShowForm(false);
      setForm({ type: "Expense", amount: "", description: "", category: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save ledger entry");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Ledger</h1>
          <p>All money movements: sales, refunds, expenses and capital</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>
          + Add Entry
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Credits (in)</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {formatMoney(data.summary.credits)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Debits (out)</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {formatMoney(data.summary.debits)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value">{formatMoney(data.summary.balance)}</div>
        </div>
      </div>

      <div className="toolbar">
        <select className="input" style={{ flex: "0 0 170px" }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option>Sale</option>
          <option>Refund</option>
          <option>Expense</option>
          <option>Capital</option>
          <option>Adjustment</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Category</th>
              <th className="num">Amount</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e) => (
              <tr key={e._id}>
                <td>
                  <span className={`badge ${TYPE_COLORS[e.type] || ""}`}>{e.type}</span>
                </td>
                <td>{e.description}</td>
                <td style={{ color: "var(--muted)" }}>{e.category || "-"}</td>
                <td
                  className="num"
                  style={{
                    fontWeight: 700,
                    color: e.direction === "credit" ? "var(--success)" : "var(--danger)",
                  }}
                >
                  {e.direction === "credit" ? "+" : "-"}
                  {formatMoney(e.amount)}
                </td>
                <td>{e.createdBy?.name || "System"}</td>
                <td style={{ color: "var(--muted)", fontSize: 13 }}>{formatDate(e.createdAt)}</td>
              </tr>
            ))}
            {data.entries.length === 0 && (
              <tr>
                <td colSpan="6" className="empty">No ledger entries.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title="Add Ledger Entry"
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn" form="ledger-form" type="submit">
                Save
              </button>
            </>
          }
        >
          <form id="ledger-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Entry type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Expense">Expense (money out)</option>
                <option value="Capital">Capital / owner withdrawal (money in)</option>
                <option value="Adjustment">Adjustment (money out)</option>
              </select>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <input
                className="input"
                placeholder="e.g. Electricity bill for October"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Category (optional)</label>
              <input
                className="input"
                placeholder="e.g. Utilities, Rent, Salary"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
