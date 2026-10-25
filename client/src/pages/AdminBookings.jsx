

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import Pager from "../components/Pager";
import { cell, fieldStyle, STATUS_COLOR } from "../adminStyles";

function Badge({ text }) {
  const color = STATUS_COLOR[text] || "#777";
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {text.replace("_", " ")}
    </span>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/bookings", { params: { status: status || undefined, page } })
      .then((res) => {
        setBookings(res.data.bookings);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch(() => toast.error("Could not load bookings"))
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Bookings</h1>

      <select
        style={fieldStyle}
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
      >
        <option value="">All statuses</option>
        <option value="confirmed">Confirmed</option>
        <option value="pending">Pending</option>
        <option value="cancelled">Cancelled</option>
        <option value="failed">Failed</option>
      </select>
      <span style={{ marginLeft: 14, opacity: 0.7 }}>{total} booking(s)</span>

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 800 }}>
            <thead>
              <tr>
                <th style={cell}>Booking</th>
                <th style={cell}>User</th>
                <th style={cell}>Movie</th>
                <th style={cell}>Show</th>
                <th style={cell}>Seats</th>
                <th style={cell}>Amount</th>
                <th style={cell}>Status</th>
                <th style={cell}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td style={cell}>{b.bookingId}</td>
                  <td style={cell}>
                    {b.userId ? b.userId.username : "Deleted user"}
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{b.userId?.email}</div>
                  </td>
                  <td style={cell}>{b.showId?.movieId?.movieName || "-"}</td>
                  <td style={cell}>
                    {b.showId ? `${b.showId.showdate} ${b.showId.showtime}` : "-"}
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{b.showId?.theatreId?.theatreName}</div>
                  </td>
                  <td style={cell}>{b.seats.join(", ")}</td>
                  <td style={cell}>₹{b.amount}</td>
                  <td style={cell}><Badge text={b.status} /></td>
                  <td style={cell}><Badge text={b.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}