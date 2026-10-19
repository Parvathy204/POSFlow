import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Modal from "../../components/Modal";
import { formatDate } from "../../utils/format";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", role: "staff" };

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load staff");
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

  function openEdit(u) {
    setForm({ name: u.name, email: u.email, password: "", phone: u.phone || "", role: u.role });
    setEditingId(u._id || u.id);
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

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
      setError(err.response?.data?.message || "Could not save staff member");
    }
  }

  async function toggleActive(u) {
    const id = u.id || u._id;
    try {
      await api.put(`/users/${id}`, { isActive: !u.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update staff member");
    }
  }

  async function handleDelete(u) {
    const id = u.id || u._id;
    if (!window.confirm(`Delete ${u.name}? Their past sales remain in reports.`)) return;
    try {
      await api.delete(`/users/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete staff member");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Staff Management</h1>
          <p>{users.filter((u) => u.role === "staff").length} staff accounts</p>
        </div>
        <button className="btn" onClick={openCreate}>+ Add Staff</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
           {users.filter((u) => u.role === "staff").map((u) => {
              const id = u.id || u._id;
              return (
                <tr key={id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "-"}</td>
                  <td>
                    <span className={u.role === "admin" ? "badge badge-primary" : "badge"}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={u.isActive ? "badge badge-success" : "badge badge-danger"}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                      Edit
                    </button>{" "}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>{" "}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={editingId ? "Edit Staff Member" : "Add Staff Member"}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn" form="staff-form" type="submit">
                {editingId ? "Update" : "Create"}
              </button>
            </>
          }
        >
          <form id="staff-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Password {editingId && "(leave blank to keep current)"}</label>
              <input
                className="input"
                type="password"
                minLength={editingId ? 0 : 8}
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Role</label>
                <input
  className="input"
  value="Staff (billing only)"
  disabled
/>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
