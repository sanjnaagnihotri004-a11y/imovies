
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// Today's date as "YYYY-MM-DD", the same format the backend stores
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function prettyDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ShowList({ movieId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    api
      .get("/shows", { params: { movieId } })
      .then((res) => {
        const today = todayString();
        // Hide shows on past dates
        const upcoming = res.data.shows.filter(
          (s) => s.theatreId && s.showdate >= today
        );
        setShows(upcoming);
        if (upcoming.length > 0) setSelectedDate(upcoming[0].showdate);
      })
      .catch(() => toast.error("Could not load shows"))
      .finally(() => setLoading(false));
  }, [movieId]);

  const handlePick = (show) => {
    if (!user) {
      toast.info("Please log in to book tickets");
      navigate("/login");
      return;
    }
    navigate(`/show/${show._id}/seats`);
  };

  if (loading) return <p>Loading shows...</p>;
  if (shows.length === 0) return <p>No upcoming shows for this movie yet.</p>;

  const dates = [...new Set(shows.map((s) => s.showdate))];

  // Group the chosen date's shows by theatre
  const byTheatre = {};
  shows
    .filter((s) => s.showdate === selectedDate)
    .forEach((s) => {
      const key = s.theatreId._id;
      if (!byTheatre[key]) byTheatre[key] = { theatre: s.theatreId, list: [] };
      byTheatre[key].list.push(s);
    });

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Select a show</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ff4d6d",
              background: d === selectedDate ? "#ff4d6d" : "transparent",
              color: "white",
            }}
          >
            {prettyDate(d)}
          </button>
        ))}
      </div>

      {Object.values(byTheatre).map(({ theatre, list }) => (
        <div
          key={theatre._id}
          style={{
            background: "#171b30",
            border: "1px solid #2a2f4a",
            borderRadius: 10,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: "bold" }}>{theatre.theatreName}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
            {theatre.location}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {list.map((s) => (
              <button
                key={s._id}
                onClick={() => handlePick(s)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #4cd964",
                  background: "transparent",
                  color: "#4cd964",
                }}
              >
                {s.showtime}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}