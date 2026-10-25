
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import MovieCard from "../components/MovieCard";
import { useFavorites } from "../context/FavoritesContext";

export default function Favorites() {
  const { ids, loaded } = useFavorites();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/favorite")
      .then((res) => setMovies(res.data.movies))
      .catch(() => toast.error("Could not load your favorites"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !loaded) return <div style={{ padding: 30 }}>Loading...</div>;

  // Un-hearting a movie here removes it from the page straight away
  const shown = movies.filter((m) => ids.includes(m._id));

  return (
    <div style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>My favorites</h1>

      {shown.length === 0 ? (
        <p>
          No favorites yet. Click the heart on a movie to save it.{" "}
          <Link to="/" style={{ color: "#ff4d6d" }}>Browse movies</Link>
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {shown.map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}