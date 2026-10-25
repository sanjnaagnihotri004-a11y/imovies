import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import ShowList from "../components/ShowList";
import Poster from "../components/Poster";
import Reviews from "../components/Reviews";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");

    const loadMovie = () =>
    api
      .get(`/movie/${id}`)
      .then((res) => setMovie(res.data.movie))
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load this movie")
      );

  useEffect(() => {
    loadMovie();
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 30 }}>
        <p>{error}</p>
        <Link to="/" style={{ color: "#ff4d6d" }}>Back to movies</Link>
      </div>
    );
  }
  if (!movie) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 900, margin: "0 auto" }}>
      <Link to="/" style={{ color: "#ff4d6d" }}>← Back to movies</Link>

      <div style={{ display: "flex", gap: 30, marginTop: 20, flexWrap: "wrap" }}>
        <Poster
          src={movie.poster}
          alt={movie.movieName}
          width={280}
          height={400}
          fontSize={72}
          radius={10}
        />

        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ marginTop: 0 }}>{movie.movieName}</h1>
          <p style={{ opacity: 0.8 }}>
            {movie.certification && `${movie.certification} • `}
            {movie.duration} min • {movie.language}
          </p>
            <p style={{ color: "#f5c518", margin: "0 0 8px" }}>
            {movie.rating > 0 ? `★ ${movie.rating} / 5` : "No ratings yet"}
          </p>
          <p>{movie.genres.join(" • ")}</p>
          <p>{movie.description}</p>
          <p>
            <b>Release date:</b>{" "}
            {new Date(movie.releaseDate).toLocaleDateString()}
          </p>
          {movie.cast.length > 0 && (
            <p><b>Cast:</b> {movie.cast.join(", ")}</p>
          )}
        </div>
      </div>

      <ShowList movieId={movie._id} />
            <Reviews movieId={movie._id} onChange={loadMovie} />
    </div>
  );
}