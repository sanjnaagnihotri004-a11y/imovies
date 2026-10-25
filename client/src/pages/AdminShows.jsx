
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

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

function ShowForm({ movies, theatres, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    movieId: "",
    theatreId: "",
    showdate: "",
    showtime: "",
  });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      style={{
        background: "#171b30",
        border: "1px solid #2a2f4a",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
        maxWidth: 500,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Add a show</h2>

      <label style={labelStyle}>Movie</label>
      <select style={inputStyle} name="movieId" value={form.movieId} onChange={handleChange} required>
        <option value="">Choose a movie</option>
        {movies.map((m) => (
          <option key={m._id} value={m._id}>{m.movieName}</option>
        ))}
      </select>

      <label style={labelStyle}>Theatre</label>
      <select style={inputStyle} name="theatreId" value={form.theatreId} onChange={handleChange} required>
        <option value="">Choose a theatre</option>
        {theatres.map((t) => (
          <option key={t._id} value={t._id}>{t.theatreName} ({t.location})</option>
        ))}
      </select>

      <label style={labelStyle}>Date</label>
      <input style={inputStyle} type="date" name="showdate" value={form.showdate}
        onChange={handleChange} required />

      <label style={labelStyle}>Time</label>
      <input style={inputStyle} type="time" name="showtime" value={form.showtime}
        onChange={handleChange} required />

      <p style={{ fontSize: 13, opacity: 0.7 }}>
        The seats are created automatically from the theatre's layout and prices.
      </p>

      <button
        disabled={saving}
        style={{ padding: "10px 22px", border: "none", borderRadius: 6, background: "#ff4d6d", color: "white", marginRight: 10 }}
      >
        {saving ? "Saving..." : "Add show"}
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

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadShows = useCallback(() => {
    return api
      .get("/shows")
      .then((res) => setShows(res.data.shows))
      .catch(() => toast.error("Could not load shows"));
  }, []);

  useEffect(() => {
    Promise.all([
      loadShows(),
      api.get("/movie", { params: { limit: 50 } }).then((r) => setMovies(r.data.movies)),
      api.get("/theatre").then((r) => setTheatres(r.data.theatres)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadShows]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await api.post("/shows", data);
      toast.success("Show added");
      setAdding(false);
      await loadShows();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add the show");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    const name = s.movieId?.movieName || "this show";
    if (!window.confirm(`Delete the ${s.showtime} show of ${name} on ${s.showdate}?`)) return;
    try {
      await api.delete(`/shows/${s._id}`);
      toast.success("Show deleted");
      await loadShows();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the show");
    }
  };

  if (loading) return <p>Loading shows...</p>;

  if (adding) {
    return (
      <ShowForm
        movies={movies}
        theatres={theatres}
        onSubmit={handleSubmit}
        onCancel={() => setAdding(false)}
        saving={saving}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Shows</h1>
        <button
          onClick={() => setAdding(true)}
          style={{ padding: "10px 20px", border: "none", borderRadius: 6, background: "#ff4d6d", color: "white" }}
        >
          + Add show
        </button>
      </div>

      {shows.length === 0 ? (
        <p>No shows yet.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={cell}>Date</th>
                <th style={cell}>Time</th>
                <th style={cell}>Movie</th>
                <th style={cell}>Theatre</th>
                <th style={cell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shows.map((s) => (
                <tr key={s._id}>
                  <td style={cell}>{s.showdate}</td>
                  <td style={cell}>{s.showtime}</td>
                  <td style={cell}>{s.movieId?.movieName || "Deleted movie"}</td>
                  <td style={cell}>
                    {s.theatreId ? `${s.theatreId.theatreName}, ${s.theatreId.location}` : "Deleted theatre"}
                  </td>
                  <td style={cell}>
                    <button
                      onClick={() => handleDelete(s)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #ff4d6d", background: "transparent", color: "#ff4d6d" }}
                    >
                      Delete
                    </button>
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