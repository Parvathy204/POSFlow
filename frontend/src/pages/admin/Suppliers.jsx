import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Modal from "../../components/Modal";
import { formatMoney } from "../../utils/format";

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
  notes: "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load suppliers");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
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
    setError("");

    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save supplier");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this supplier? Products linked to it will keep their history.")) return;
    try {
      await api.delete(`/suppliers/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete supplier");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Suppliers</h1>
          <p>{suppliers.length} suppliers on record</p>
        </div>
        <button className="btn" onClick={openCreate}>+ Add Supplier</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {suppliers.map((s) => (
          <div className="card" key={s._id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h3 style={{ fontSize: 16 }}>{s.name}</h3>
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 3 }}>
                  {s.contactPerson || "No contact person"}
                </p>
              </div>
              <span className={s.isActive ? "badge badge-success" : "badge badge-danger"}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: "var(--ink-2)" }}>
              <div>📞 {s.phone}</div>
              {s.email && <div>✉️ {s.email}</div>}
              {s.address && <div>📍 {s.address}</div>}
              {s.gstNumber && <div>GST: {s.gstNumber}</div>}
              {s.notes && (
                <div style={{ color: "var(--muted)", marginTop: 6, fontSize: 13 }}>{s.notes}</div>
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Balance owed:{" "}
                <strong style={{ color: s.balanceOwed > 0 ? "var(--danger)" : "var(--success)" }}>
                  {formatMoney(s.balanceOwed)}
                </strong>
              </div>
              <div>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>
                  Edit
                </button>{" "}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="card empty">No suppliers yet. Add your first supplier.</div>
        )}
      </div>

      {showForm && (
        <Modal
          title={editingId ? "Edit Supplier" : "Add Supplier"}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn" form="supplier-form" type="submit">
                {editingId ? "Update" : "Save"}
              </button>
            </>
          }
        >
          <form id="supplier-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Supplier name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Contact person</label>
                <input
                  className="input"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone *</label>
                <input
  className="input"
  type="tel"
  required
  maxLength={10}
  pattern="[6-9][0-9]{9}"
  title="Enter a valid 10-digit Indian mobile number"
  value={form.phone}
  onChange={(e) =>
    setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
  }
/>
{form.phone.length > 0 &&
  !/^[6-9]\d{9}$/.test(form.phone) && (
    <small style={{ color: "#dc2626" }}>
      Please enter a valid 10-digit phone number.
    </small>
  )}
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label>GST number</label>
              <input
  className="input"
  type="text"
  maxLength={15}
  pattern="[0-9A-Za-z]{15}"
  title="GSTIN must contain exactly 15 letters and numbers"
  value={form.gstNumber}
  onChange={(e) =>
    setForm({ ...form, gstNumber: e.target.value.toUpperCase().slice(0, 15) })
  }
/>
{form.gstNumber.length > 0 &&
  !/^[0-9A-Z]{15}$/.test(form.gstNumber) && (
    <small style={{ color: "#dc2626" }}>
      GSTIN must contain exactly 15 letters and numbers.
    </small>
  )}
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                className="input"
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
