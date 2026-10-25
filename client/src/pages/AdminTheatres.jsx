
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

const AREAS = [
  { key: "lower", label: "Lower (front)" },
  { key: "middle", label: "Middle" },
  { key: "balcony", label: "Balcony (back)" },
];

const cell = { padding: "10px 12px", borderBottom: "1px solid #2a2f4a", textAlign: "left" };
const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  borderRadius: 6,
  border: "1px solid #2a2f4a",
  background: "#0f1220",
  color: "#f1f1f1",
};
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, opacity: 0.8 };
const smallButton = (color) => ({
  padding: "4px 12px",
  borderRadius: 6,
  border: `1px solid ${color}`,
  background: "transparent",
  color,
  marginRight: 6,
});

function toForm(t) {
  const area = (a) => ({
    rows: t ? String(t[a].rows) : "",
    seatsPerRow: t ? String(t[a].seatsPerRow) : "",
    price: t ? String(t[a].price) : "",
  });
  return {
    theatreName: t ? t.theatreName : "",
    location: t ? t.location : "",
    lower: area("lower"),
    middle: area("middle"),
    balcony: area("balcony"),
  };
}

function TheatreForm({ theatre, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(toForm(theatre));

  const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setArea = (area, field, value) =>
    setForm({ ...form, [area]: { ...form[area], [field]: value } });

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = (a) => ({
      rows: Number(form[a].rows),
      seatsPerRow: Number(form[a].seatsPerRow),
      price: Number(form[a].price),
    });
    const lower = num("lower");
    const middle = num("middle");
    const balcony = num("balcony");

    if (lower.rows + middle.rows + balcony.rows > 26) {
      toast.error("A theatre can have at most 26 rows in total");
      return;
    }
    onSubmit({
      theatreName: form.theatreName.trim(),
      location: form.location.trim(),
      lower,
      middle,
      balcony,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#171b30",
        border: "1px solid #2a2f4a",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
        maxWidth: 600,
      }}
    >
      <h2 style={{ marginTop: 0 }}>{theatre ? "Edit theatre" : "Add a theatre"}</h2>

      <label style={labelStyle}>Theatre name</label>
      <input style={inputStyle} name="theatreName" value={form.theatreName}
        onChange={setField} required minLength={2} maxLength={100} />

      <label style={labelStyle}>Location (city or area)</label>
      <input style={inputStyle} name="location" value={form.location}
        onChange={setField} required />

      {AREAS.map((a) => (
        <div key={a.key} style={{ marginBottom: 6 }}>
          <b>{a.label}</b>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Rows (1-10)</label>
              <input style={inputStyle} type="number" min="1" max="10"
                value={form[a.key].rows} required
                onChange={(e) => setArea(a.key, "rows", e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Seats per row (1-30)</label>
              <input style={inputStyle} type="number" min="1" max="30"
                value={form[a.key].seatsPerRow} required
                onChange={(e) => setArea(a.key, "seatsPerRow", e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Price (₹)</label>
              <input style={inputStyle} type="number" min="0"
                value={form[a.key].price} required
                onChange={(e) => setArea(a.key, "price", e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      {theatre && (
        <p style={{ fontSize: 13, color: "#c98a1b" }}>
          Changing the layout or prices only affects shows created <b>after</b> this
          change. Existing shows keep their old seats.
        </p>
      )}

      <button
        disabled={saving}
        style={{ padding: "10px 22px", border: "none", borderRadius: 6, background: "#ff4d6d", color: "white", marginRight: 10 }}
      >
        {saving ? "Saving..." : theatre ? "Save changes" : "Add theatre"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{ padding: "10px 22px", borderRadius: 6, border: "1px solid #2a2f4a", background: "transparent", color: "white" }}
      >
        Cancel
      </button>
    </form>
  );
}

const seatCount = (t) =>
  ["lower", "middle", "balcony"].reduce((sum, a) => sum + t[a].rows * t[a].seatsPerRow, 0);

export default function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null, "new", or a theatre
  const [saving, setSaving] = useState(false);

  const loadTheatres = useCallback(() => {
    return api
      .get("/theatre")
      .then((res) => setTheatres(res.data.theatres))
      .catch(() => toast.error("Could not load theatres"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTheatres();
  }, [loadTheatres]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/theatre", data);
        toast.success("Theatre added");
      } else {
        await api.put(`/theatre/${editing._id}`, data);
        toast.success("Theatre updated");
      }
      setEditing(null);
      await loadTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the theatre");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.theatreName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/theatre/${t._id}`);
      toast.success("Theatre deleted");
      await loadTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the theatre");
    }
  };

  if (editing) {
    return (
      <TheatreForm
        key={editing === "new" ? "new" : editing._id}
        theatre={editing === "new" ? null : editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
        saving={saving}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Theatres</h1>
        <button
          onClick={() => setEditing("new")}
          style={{ padding: "10px 20px", border: "none", borderRadius: 6, background: "#ff4d6d", color: "white" }}
        >
          + Add theatre
        </button>
      </div>

      {loading ? (
        <p>Loading theatres...</p>
      ) : theatres.length === 0 ? (
        <p>No theatres yet.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={cell}>Name</th>
                <th style={cell}>Location</th>
                <th style={cell}>Seats</th>
                <th style={cell}>Prices (L / M / B)</th>
                <th style={cell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {theatres.map((t) => (
                <tr key={t._id}>
                  <td style={cell}>{t.theatreName}</td>
                  <td style={cell}>{t.location}</td>
                  <td style={cell}>{seatCount(t)}</td>
                  <td style={cell}>₹{t.lower.price} / ₹{t.middle.price} / ₹{t.balcony.price}</td>
                  <td style={cell}>
                    <button onClick={() => setEditing(t)} style={smallButton("#4cd964")}>Edit</button>
                    <button onClick={() => handleDelete(t)} style={smallButton("#ff4d6d")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}