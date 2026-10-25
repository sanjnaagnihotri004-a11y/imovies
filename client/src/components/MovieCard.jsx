import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Poster from "./Poster";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export default function MovieCard({ movie }) {
  const { user } = useAuth();
  const { ids, toggle } = useFavorites();
  const navigate = useNavigate();
  const isFav = ids.includes(movie._id);

  const handleHeart = async (e) => {
    // The whole card is a link, so stop the click from opening the movie
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please log in to save favorites");
      navigate("/login");
      return;
    }
    try {
      await toggle(movie._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update favorites");
    }
  };

  return (
    <Link
      to={`/movie/${movie._id}`}
      style={{
        background: "#171b30",
        borderRadius: 10,
        overflow: "hidden",
        display: "block",
        border: "1px solid #2a2f4a",
        position: "relative",
      }}
    >
      <button
        onClick={handleHeart}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: "none",
          background: "#000000aa",
          color: isFav ? "#ff4d6d" : "white",
          fontSize: 20,
          lineHeight: 1,
          padding: 0,
        }}
      >
        {isFav ? "♥" : "♡"}
      </button>

      <Poster src={movie.poster} alt={movie.movieName} height={280} />
      <div style={{ padding: 12 }}>
        <h3 style={{ margin: "0 0 6px" }}>{movie.movieName}</h3>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          {movie.genres.join(" • ")}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
          {movie.language} • {movie.duration} min
        </div>
      </div>
    </Link>
  );
}