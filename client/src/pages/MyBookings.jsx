import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

const CANCEL_HOURS = 2;

const STATUS_COLOR = {
  confirmed: "#4cd964",
  pending: "#c98a1b",
  cancelled: "#999",
  failed: "#ff4d6d",
};

// Combine "2026-11-05" and "21:00" into a real date (Indian time)
function showStart(show) {
  return new Date(`${show.showdate}T${show.showtime}:00+05:30`);
}

function canCancel(booking) {
  if (booking.status !== "confirmed" || !booking.showId) return false;
  const cutoff = showStart(booking.showId).getTime() - CANCEL_HOURS * 60 * 60 * 1000;
  return Date.now() < cutoff;
}

function BookingCard({ booking, onCancel, cancelling }) {
  const show = booking.showId;

  return (
    <div
      style={{
        background: "#171b30",
        border: "1px solid #2a2f4a",
        borderRadius: 10,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>
          {show?.movieId?.movieName || "Movie no longer available"}
        </h3>
        <span
          style={{
            color: STATUS_COLOR[booking.status],
            border: `1px solid ${STATUS_COLOR[booking.status]}`,
            borderRadius: 20,
            padding: "2px 12px",
            fontSize: 13,
            textTransform: "capitalize",
          }}
        >
          {booking.status}
        </span>
      </div>

      {show && (
        <p style={{ margin: "8px 0 0", opacity: 0.8, fontSize: 14 }}>
          {show.theatreId?.theatreName}, {show.theatreId?.location}
          <br />
          {show.showdate} • {show.showtime}
        </p>
      )}

      <p style={{ margin: "8px 0 0", fontSize: 14 }}>
        <b>Seats:</b> {booking.seats.join(", ")} &nbsp;•&nbsp; <b>Amount:</b> ₹{booking.amount}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.6 }}>
        Booking ID: {booking.bookingId}
      </p>

      {canCancel(booking) && (
        <button
          onClick={() => onCancel(booking)}
          disabled={cancelling}
          style={{
            marginTop: 12,
            padding: "8px 18px",
            borderRadius: 6,
            border: "1px solid #ff4d6d",
            background: "transparent",
            color: "#ff4d6d",
          }}
        >
          {cancelling ? "Cancelling..." : "Cancel booking"}
        </button>
      )}
    </div>
  );
}

function Section({ title, bookings, onCancel, cancellingId }) {
  if (bookings.length === 0) return null;
  return (
    <div style={{ marginBottom: 30 }}>
      <h2>{title}</h2>
      {bookings.map((b) => (
        <BookingCard
          key={b._id}
          booking={b}
          onCancel={onCancel}
          cancelling={cancellingId === b._id}
        />
      ))}
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState("");

  const loadBookings = () =>
    api
      .get("/bookings/my")
      .then((res) => setBookings(res.data.bookings))
      .catch(() => toast.error("Could not load your bookings"));

  useEffect(() => {
    loadBookings().finally(() => setLoading(false));
  }, []);

  const handleCancel = async (booking) => {
    const ok = window.confirm(
      `Cancel booking ${booking.bookingId}? Your seats will be released and a refund will be processed.`
    );
    if (!ok) return;

    setCancellingId(booking._id);
    try {
      const res = await api.post(`/bookings/${booking._id}/cancel`);
      toast.success(res.data.message);
      await loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel this booking");
    } finally {
      setCancellingId("");
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading your bookings...</div>;

  const now = new Date();
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  const upcoming = confirmed
    .filter((b) => b.showId && showStart(b.showId) >= now)
    .sort((a, b) => showStart(a.showId) - showStart(b.showId));
  const past = confirmed
    .filter((b) => !b.showId || showStart(b.showId) < now)
    .sort((a, b) => (b.showId ? showStart(b.showId) : 0) - (a.showId ? showStart(a.showId) : 0));
  const others = bookings.filter((b) => b.status !== "confirmed");

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>My bookings</h1>

      {bookings.length === 0 ? (
        <p>
          You have no bookings yet.{" "}
          <Link to="/" style={{ color: "#ff4d6d" }}>Browse movies</Link>
        </p>
      ) : (
        <>
          {upcoming.length === 0 && <p style={{ opacity: 0.7 }}>No upcoming shows.</p>}
          <Section title="Upcoming" bookings={upcoming} onCancel={handleCancel} cancellingId={cancellingId} />
          <Section title="Past" bookings={past} onCancel={handleCancel} cancellingId={cancellingId} />
          <Section title="Unpaid or cancelled" bookings={others} onCancel={handleCancel} cancellingId={cancellingId} />
          <p style={{ fontSize: 12, opacity: 0.6 }}>
            Bookings can be cancelled up to {CANCEL_HOURS} hours before the show starts.
          </p>
        </>
      )}
    </div>
  );
}