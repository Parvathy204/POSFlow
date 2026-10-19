import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Modal from "../../components/Modal";
import { formatMoney, formatDate } from "../../utils/format";

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New return flow
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
      setError("");
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

    // Accept a full mongo id or search the transaction list by invoice number
    try {
      let tx = null;
      if (/^[a-f0-9]{24}$/i.test(invoiceId.trim())) {
        const res = await api.get(`/transactions/${invoiceId.trim()}`);
        tx = res.data;
      } else {
        const res = await api.get("/transactions");
        tx = res.data.find((t) =>
          t.invoiceNumber.toLowerCase().includes(invoiceId.trim().toLowerCase())
        );
        if (tx) {
          const full = await api.get(`/transactions/${tx._id}`);
          tx = full.data;
        }
      }

      if (!tx) {
        setError("No invoice found matching that ID or number.");
        return;
      }
      if (tx.status === "Cancelled" || tx.status === "Returned") {
        setError(`This invoice is ${tx.status} - nothing can be returned.`);
        return;
      }

      setInvoiceDetail(tx);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not find that invoice");
    }
  }

  function setQty(productId, value) {
    setQuantities((q) => ({ ...q, [productId]: value }));
  }

  function selectedItems() {
    if (!invoiceDetail) return [];
    return invoiceDetail.items
      .map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: Number(quantities[i.productId]) || 0,
        max: i.quantity - (i.returnedQuantity || 0),
        price: i.price,
      }))
      .filter((i) => i.quantity > 0);
  }

  const refundTotal = selectedItems().reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function submitReturn() {
    const items = selectedItems();
    if (items.length === 0) {
      setError("Select the quantity to return for at least one item.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a return reason.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.post("/returns", {
        transactionId: invoiceDetail._id,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        reason: reason.trim(),
        refundMethod,
      });
      setSuccess(`Return processed. Refund of ${formatMoney(refundTotal)} recorded.`);
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
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Product Returns</h1>
          <p>{returns.length} returns processed</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>
          + Process Return
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Invoice</th>
              <th>Items</th>
              <th>Reason</th>
              <th>Refund</th>
              <th className="num">Amount</th>
              <th>Processed by</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r._id}>
                <td style={{ fontWeight: 600 }}>{r.returnNumber}</td>
                <td>{r.invoiceNumber}</td>
                <td>{r.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td style={{ maxWidth: 220 }}>{r.reason}</td>
                <td>{r.refundMethod}</td>
                <td className="num" style={{ color: "var(--danger)" }}>
                  {formatMoney(r.refundAmount)}
                </td>
                <td>{r.processedBy?.name || "-"}</td>
                <td style={{ color: "var(--muted)", fontSize: 13 }}>{formatDate(r.createdAt)}</td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan="8" className="empty">No returns yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title="Process a Return"
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={submitReturn} disabled={saving || !invoiceDetail}>
                {saving ? "Processing..." : `Confirm Return${refundTotal > 0 ? ` (${formatMoney(refundTotal)})` : ""}`}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Search the invoice by its number (e.g. INV-...) or paste its ID. Stock is restocked
            automatically and the refund is recorded in the ledger.
          </p>

          <div className="field">
            <label>Invoice number or ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="INV-1792420466873-508"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={lookupInvoice} type="button">
                Find
              </button>
            </div>
          </div>

          {invoiceDetail && (
            <>
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                <strong>{invoiceDetail.invoiceNumber}</strong> · {invoiceDetail.customerName} ·{" "}
                {formatDate(invoiceDetail.createdAt)}
                <br />
                Status: <span className={invoiceDetail.status === "Completed" ? "badge badge-success" : "badge badge-warning"}>{invoiceDetail.status}</span>
              </div>

              {invoiceDetail.items.map((i) => {
                const max = i.quantity - (i.returnedQuantity || 0);
                return (
                  <div
                    key={i._id || i.productId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ flex: 1, fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{i.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {formatMoney(i.price)} × {i.quantity} sold
                        {i.returnedQuantity > 0 && ` · ${i.returnedQuantity} already returned`}
                      </div>
                    </div>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max={max}
                      disabled={max <= 0}
                      style={{ width: 76 }}
                      value={quantities[i.productId] || ""}
                      placeholder="0"
                      onChange={(e) => setQty(i.productId, e.target.value)}
                    />
                  </div>
                );
              })}

              <div className="field" style={{ marginTop: 14 }}>
                <label>Return reason</label>
                <input
                  className="input"
                  placeholder="e.g. Size did not fit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Refund method</label>
                <select className="input" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                </select>
              </div>

              <div className="totals-row grand" style={{ marginBottom: 0 }}>
                <span>Refund total</span>
                <span style={{ color: "var(--danger)" }}>{formatMoney(refundTotal)}</span>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
