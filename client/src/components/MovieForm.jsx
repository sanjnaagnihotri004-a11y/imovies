
import { useState } from "react";

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

// Turn a saved movie into the text values the form fields need
function toForm(movie) {
  if (!movie) {
    return {
      movieName: "",
      description: "",
      genres: "",
      language: "",
      duration: "",
      cast: "",
      certification: "",
      releaseDate: "",
      poster: "",
    };
  }
  return {
    movieName: movie.movieName,
    description: movie.description,
    genres: movie.genres.join(", "),
    language: movie.language,
    duration: String(movie.duration),
    cast: (movie.cast || []).join(", "),
    certification: movie.certification || "",
    releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : "",
    poster: movie.poster || "",
  };
}

const splitList = (text) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function MovieForm({ movie, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(toForm(movie));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      movieName: form.movieName.trim(),
      description: form.description.trim(),
      genres: splitList(form.genres),
      language: form.language.trim(),
      duration: Number(form.duration),
      cast: splitList(form.cast),
      certification: form.certification.trim(),
      releaseDate: form.releaseDate,
      poster: form.poster.trim(),
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
      <h2 style={{ marginTop: 0 }}>{movie ? "Edit movie" : "Add a movie"}</h2>

      <label style={labelStyle}>Movie name</label>
      <input style={inputStyle} name="movieName" value={form.movieName}
        onChange={handleChange} required minLength={2} maxLength={200} />

      <label style={labelStyle}>Description (at least 10 characters)</label>
      <textarea style={{ ...inputStyle, minHeight: 80 }} name="description"
        value={form.description} onChange={handleChange} required minLength={10} />

      <label style={labelStyle}>Genres (separate with commas, e.g. Action, Drama)</label>
      <input style={inputStyle} name="genres" value={form.genres}
        onChange={handleChange} required />

      <label style={labelStyle}>Language</label>
      <input style={inputStyle} name="language" value={form.language}
        onChange={handleChange} required />

      <label style={labelStyle}>Duration (minutes)</label>
      <input style={inputStyle} name="duration" type="number" min="1"
        value={form.duration} onChange={handleChange} required />

      <label style={labelStyle}>Cast (separate with commas, optional)</label>
      <input style={inputStyle} name="cast" value={form.cast} onChange={handleChange} />

      <label style={labelStyle}>Certification (e.g. U, UA, A, optional)</label>
      <input style={inputStyle} name="certification" value={form.certification}
        onChange={handleChange} />

      <label style={labelStyle}>Release date</label>
      <input style={inputStyle} name="releaseDate" type="date"
        value={form.releaseDate} onChange={handleChange} required />

      <label style={labelStyle}>Poster image link (optional)</label>
      <input style={inputStyle} name="poster" value={form.poster}
        onChange={handleChange} placeholder="https://..." />

      <button
        disabled={saving}
        style={{
          padding: "10px 22px",
          border: "none",
          borderRadius: 6,
          background: "#ff4d6d",
          color: "white",
          marginRight: 10,
        }}
      >
        {saving ? "Saving..." : movie ? "Save changes" : "Add movie"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          padding: "10px 22px",
          borderRadius: 6,
          border: "1px solid #2a2f4a",
          background: "transparent",
          color: "white",
        }}
      >
        Cancel
      </button>
    </form>
  );
}