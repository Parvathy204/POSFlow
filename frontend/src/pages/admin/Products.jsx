import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Modal from "../../components/Modal";
import { formatMoney } from "../../utils/format";

const EMPTY_FORM = {
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
  "Shirts",
  "Jeans",
  "Sarees",
  "Dress Materials",
  "Kurtas",
  "T-Shirts",
  "Dupattas",
  "Suits",
  "Other",
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", { params: search ? { search } : {} });
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/suppliers").then((res) => setSuppliers(res.data)).catch(() => {});
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
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
    setError("");

    const payload = {
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice) || 0,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      supplier: form.supplier || null,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Products</h1>
          <p>{products.length} products in catalogue</p>
        </div>
        <button className="btn" onClick={openCreate}>+ Add Product</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Size</th>
              <th className="num">Price</th>
              <th className="num">Cost</th>
              <th className="num">Stock</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category}</td>
                <td>{p.size}</td>
                <td className="num">{formatMoney(p.price)}</td>
                <td className="num" style={{ color: "var(--muted)" }}>
                  {formatMoney(p.costPrice)}
                </td>
                <td className="num">
                  <span
                    className={
                      p.stock === 0
                        ? "badge badge-danger"
                        : p.stock <= (p.lowStockThreshold ?? 5)
                        ? "badge badge-warning"
                        : "badge badge-success"
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>
                  {p.supplier?.name || "-"}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                    Edit
                  </button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan="9" className="empty">No products found. Add your first product.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={editingId ? "Edit Product" : "Add Product"}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn" form="product-form" type="submit">
                {editingId ? "Update" : "Save"}
              </button>
            </>
          }
        >
          <form id="product-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Product name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>SKU</label>
                <input
                  className="input"
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Size</label>
                <input
                  className="input"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Supplier</label>
                <select
                  className="input"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                >
                  <option value="">No supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Selling price (₹)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Cost price (₹)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Stock</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Low stock alert threshold</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
