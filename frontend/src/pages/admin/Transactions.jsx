import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Modal from "../../components/Modal";
import { formatMoney, formatDate, statusBadge } from "../../utils/format";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (status) params.status = status;
      const res = await api.get("/transactions", { params });
      setTransactions(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, [paymentMethod, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id) {
    try {
      const res = await api.get(`/transactions/${id}`);
      setDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load invoice detail");
    }
  }

  async function cancelTransaction(id) {
    if (!window.confirm("Cancel this invoice? Stock will be restored and the ledger reversed.")) return;
    try {
      await api.post(`/transactions/${id}/cancel`);
      setDetail(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel transaction");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p>{transactions.length} bills recorded (latest 200)</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <select className="input" style={{ flex: "0 0 170px" }} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="">All payments</option>
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
        </select>
        <select className="input" style={{ flex: "0 0 190px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Completed</option>
          <option>Partially Returned</option>
          <option>Returned</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Staff</th>
              <th className="num">Total</th>
              <th>Status</th>
              <th>When</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id}>
                <td style={{ fontWeight: 600 }}>{t.invoiceNumber}</td>
                <td>{t.customerName}</td>
                <td>{t.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td>{t.paymentMethod}</td>
                <td>{t.staffId?.name || "-"}</td>
                <td className="num">{formatMoney(t.totalAmount)}</td>
                <td>
                  <span className={statusBadge(t.status)}>{t.status}</span>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 13 }}>{formatDate(t.createdAt)}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openDetail(t._id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan="9" className="empty">No transactions match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <Modal
          title={`Invoice ${detail.invoiceNumber}`}
          onClose={() => setDetail(null)}
          actions={
            <>
              {detail.status === "Completed" && (
                <button className="btn btn-danger" onClick={() => cancelTransaction(detail._id)}>
                  Cancel Invoice
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>
                Close
              </button>
            </>
          }
        >
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
            {formatDate(detail.createdAt)} · Billed by {detail.staffId?.name || "Unknown"} ·{" "}
            <span className={statusBadge(detail.status)}>{detail.status}</span>
          </p>

          <table className="table" style={{ marginBottom: 14 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Price</th>
                <th className="num">Subtotal</th>
                <th className="num">Returned</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((i) => (
                <tr key={i._id || i.productId}>
                  <td>{i.name}</td>
                  <td className="num">{i.quantity}</td>
                  <td className="num">{formatMoney(i.price)}</td>
                  <td className="num">{formatMoney(i.subtotal)}</td>
                  <td className="num">{i.returnedQuantity || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-row"><span>Subtotal</span><span>{formatMoney(detail.subtotal)}</span></div>
          {detail.discount > 0 && (
            <div className="totals-row"><span>Discount</span><span>-{formatMoney(detail.discount)}</span></div>
          )}
          {detail.taxAmount > 0 && (
            <div className="totals-row"><span>Tax</span><span>{formatMoney(detail.taxAmount)}</span></div>
          )}
          <div className="totals-row grand">
            <span>Total</span>
            <span>{formatMoney(detail.totalAmount)}</span>
          </div>
          {detail.paymentMethod === "Cash" && (
            <>
              <div className="totals-row"><span>Paid</span><span>{formatMoney(detail.amountPaid)}</span></div>
              <div className="totals-row"><span>Change returned</span><span>{formatMoney(detail.changeReturned)}</span></div>
            </>
          )}
          {detail.refundAmount > 0 && (
            <div className="totals-row" style={{ color: "var(--danger)" }}>
              <span>Refunded</span>
              <span>{formatMoney(detail.refundAmount)}</span>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
