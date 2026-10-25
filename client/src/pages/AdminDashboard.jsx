
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#171b30",
        border: "1px solid #2a2f4a",
        borderRadius: 10,
        padding: 18,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Could not load the dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p>No data available.</p>;

  const cell = { padding: "10px 12px", borderBottom: "1px solid #2a2f4a", textAlign: "left" };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 30,
        }}
      >
        <StatCard label="Total revenue" value={money(stats.revenue)} />
        <StatCard label="Tickets sold" value={stats.tickets} />
        <StatCard label="Confirmed bookings" value={stats.confirmedBookings} />
        <StatCard label="Cancelled bookings" value={stats.cancelledBookings} />
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Movies" value={stats.movies} />
        <StatCard label="Theatres" value={stats.theatres} />
        <StatCard label="Shows" value={stats.shows} />
      </div>

      <h2>Revenue by movie</h2>
      {stats.byMovie.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No confirmed bookings yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420 }}>
            <thead>
              <tr>
                <th style={cell}>Movie</th>
                <th style={cell}>Bookings</th>
                <th style={cell}>Tickets</th>
                <th style={cell}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.byMovie.map((m) => (
                <tr key={m.movieName}>
                  <td style={cell}>{m.movieName}</td>
                  <td style={cell}>{m.bookings}</td>
                  <td style={cell}>{m.tickets}</td>
                  <td style={cell}>{money(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}