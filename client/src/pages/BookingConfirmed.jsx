

import { Link, Navigate, useLocation } from "react-router-dom";

export default function BookingConfirmed() {
  const { state } = useLocation();

  // If someone opens this page directly, there is nothing to show
  if (!state?.booking) return <Navigate to="/" replace />;

  const { booking, show } = state;

  const row = (label, value) => (
    <tr>
      <td style={{ padding: "6px 16px 6px 0", opacity: 0.7 }}>{label}</td>
      <td style={{ padding: "6px 0" }}><b>{value}</b></td>
    </tr>
  );

  return (
    <div style={{ padding: 30, maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
      <div style={{ fontSize: 60 }}>🎉</div>
      <h1 style={{ marginTop: 0 }}>Booking confirmed!</h1>
      <p style={{ opacity: 0.8 }}>
        A confirmation email is on its way to your registered address.
      </p>

      <div
        style={{
          background: "#171b30",
          border: "1px solid #2a2f4a",
          borderRadius: 10,
          padding: 20,
          textAlign: "left",
          margin: "20px 0",
        }}
      >
        <table>
          <tbody>
            {row("Booking ID", booking.bookingId)}
            {show && row("Movie", show.movieId.movieName)}
            {show && row("Theatre", `${show.theatreId.theatreName}, ${show.theatreId.location}`)}
            {show && row("Date", show.showdate)}
            {show && row("Time", show.showtime)}
            {row("Seats", [...booking.seats].join(", "))}
            {row("Amount paid", `₹${booking.amount}`)}
          </tbody>
        </table>
      </div>

            <Link to="/my-bookings" style={{ color: "#ff4d6d", marginRight: 20 }}>View my bookings</Link>
      <Link to="/" style={{ color: "#ff4d6d" }}>Back to movies</Link>
    </div>
  );
}
