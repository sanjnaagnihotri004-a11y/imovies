
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import MovieForm from "../components/MovieForm";

const cell = { padding: "10px 12px", borderBottom: "1px solid #2a2f4a", textAlign: "left" };

const smallButton = (color) => ({
  padding: "4px 12px",
  borderRadius: 6,
  border: `1px solid ${color}`,
  background: "transparent",
  color,
  marginRight: 6,
});

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(null); // null, "new", or a movie
  const [saving, setSaving] = useState(false);

  const loadMovies = useCallback(() => {
    return api
      .get("/movie", { params: { page, limit: 10 } })
      .then((res) => {
        setMovies(res.data.movies);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => toast.error("Could not load movies"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/movie", data);
        toast.success("Movie added");
      } else {
        await api.put(`/movie/${editing._id}`, data);
        toast.success("Movie updated");
      }
      setEditing(null);
      await loadMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the movie");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Delete "${movie.movieName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/movie/${movie._id}`);
      toast.success("Movie deleted");
      // If that was the last movie on this page, go back one page
      if (movies.length === 1 && page > 1) setPage(page - 1);
      else await loadMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the movie");
    }
  };

  if (editing) {
    return (
      <MovieForm
        // a new key makes the form start fresh for each movie
        key={editing === "new" ? "new" : editing._id}
        movie={editing === "new" ? null : editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
        saving={saving}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Movies</h1>
        <button
          onClick={() => setEditing("new")}
          style={{ padding: "10px 20px", border: "none", borderRadius: 6, background: "#ff4d6d", color: "white" }}
        >
          + Add movie
        </button>
      </div>

      {loading ? (
        <p>Loading movies...</p>
      ) : movies.length === 0 ? (
        <p>No movies yet. Click "Add movie" to create one.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={cell}>Name</th>
                <th style={cell}>Genres</th>
                <th style={cell}>Language</th>
                <th style={cell}>Rating</th>
                <th style={cell}>Release</th>
                <th style={cell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => (
                <tr key={m._id}>
                  <td style={cell}>{m.movieName}</td>
                  <td style={cell}>{m.genres.join(", ")}</td>
                  <td style={cell}>{m.language}</td>
                  <td style={cell}>{m.rating > 0 ? `★ ${m.rating}` : "-"}</td>
                  <td style={cell}>{new Date(m.releaseDate).toLocaleDateString()}</td>
                  <td style={cell}>
                    <button onClick={() => setEditing(m)} style={smallButton("#4cd964")}>Edit</button>
                    <button onClick={() => handleDelete(m)} style={smallButton("#ff4d6d")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 20, display: "flex", gap: 14, alignItems: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={smallButton("#aaa")}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={smallButton("#aaa")}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}