
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import MovieCard from "../components/MovieCard";

const GENRES = ["Action", "Comedy", "Drama", "Romance", "Thriller", "Horror", "Sci-Fi"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu"];

const filterStyle = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #2a2f4a",
  background: "#171b30",
  color: "#f1f1f1",
};

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Wait until the user stops typing for 0.4 seconds before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load movies whenever a filter or the page changes
  useEffect(() => {
    setLoading(true);
    api
      .get("/movie", {
        params: {
          search: debouncedSearch || undefined,
          genre: genre || undefined,
          language: language || undefined,
          page,
          limit: 8,
        },
      })
      .then((res) => {
        setMovies(res.data.movies);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => toast.error("Could not load movies"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, genre, language, page]);

  return (
    <div style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Now showing</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          style={{ ...filterStyle, flex: 1, minWidth: 200 }}
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={filterStyle}
          value={genre}
          onChange={(e) => { setGenre(e.target.value); setPage(1); }}
        >
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select
          style={filterStyle}
          value={language}
          onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
        >
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Loading movies...</p>
      ) : movies.length === 0 ? (
        <p>No movies found. Try changing your search or filters.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {movies.map((m) => <MovieCard key={m._id} movie={m} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 30, display: "flex", gap: 14, alignItems: "center", justifyContent: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={filterStyle}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={filterStyle}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}