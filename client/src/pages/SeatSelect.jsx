import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { loadRazorpay } from "../services/razorpay";
import { useAuth } from "../context/AuthContext";

const MAX_SEATS = 6;

// Sort seat names like A1, A2, A10, B1
function seatSort(a, b) {
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
  return parseInt(a.slice(1)) - parseInt(b.slice(1));
}

const CATEGORY_LABEL = { lower: "Lower", middle: "Middle", balcony: "Balcony" };

function seatColors(status, isSelected) {
  if (isSelected) return { background: "#ff4d6d", border: "#ff4d6d", color: "white" };
  if (status === "booked") return { background: "#3a3d4d", border: "#3a3d4d", color: "#777" };
  if (status === "locked") return { background: "#7a5a1e", border: "#c98a1b", color: "#ddd" };
  return { background: "transparent", border: "#4cd964", color: "#4cd964" };
}

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function SeatSelect() {
  const { id } = useParams(); // the show id
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState({});
  const [selected, setSelected] = useState([]);
  const [booking, setBooking] = useState(null); // set after seats are locked
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch the latest seat map, and drop any picked seat that is no longer free
  const loadSeats = useCallback(async () => {
    const res = await api.get(`/shows/${id}/seats`);
    const fresh = res.data.seats;
    setSeats(fresh);
    setSelected((prev) => prev.filter((s) => fresh[s]?.status === "available"));
  }, [id]);

  // First load: show details and seats together
  useEffect(() => {
    Promise.all([api.get(`/shows/${id}`), api.get(`/shows/${id}/seats`)])
      .then(([showRes, seatRes]) => {
        setShow(showRes.data.show);
        setSeats(seatRes.data.seats);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load this show")
      )
      .finally(() => setLoading(false));
  }, [id]);

  // Refresh the seats every 10 seconds, so locks by other people appear
  useEffect(() => {
    if (booking) return;
    const timer = setInterval(() => loadSeats().catch(() => {}), 10000);
    return () => clearInterval(timer);
  }, [booking, loadSeats]);

  // Countdown while our seats are locked
  useEffect(() => {
    if (!booking) return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(booking.expiresAt) - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left === 0) {
        toast.error("Time ran out. Please select your seats again.");
        setBooking(null);
        setSelected([]);
        loadSeats().catch(() => {});
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [booking, loadSeats]);

  // Group seats into rows: { A: ["A1","A2",...], B: [...] }
  const rows = useMemo(() => {
    const grouped = {};
    Object.keys(seats)
      .sort(seatSort)
      .forEach((seatId) => {
        const letter = seatId[0];
        if (!grouped[letter]) grouped[letter] = [];
        grouped[letter].push(seatId);
      });
    return Object.entries(grouped);
  }, [seats]);

  const handleSeatClick = (seatId) => {
    if (booking) return; // locked already, no more changes
    if (seats[seatId].status !== "available") return;

    if (selected.includes(seatId)) {
      setSelected(selected.filter((s) => s !== seatId));
    } else if (selected.length >= MAX_SEATS) {
      toast.info(`You can select at most ${MAX_SEATS} seats`);
    } else {
      setSelected([...selected, seatId]);
    }
  };

  const handleLock = async () => {
    if (selected.length === 0) return;
    setLocking(true);
    try {
      const res = await api.post("/bookings/lock", { showId: id, seats: selected });
      setBooking(res.data.booking);
      toast.success(res.data.message);
      loadSeats().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not lock the seats");
      setSelected([]);
      loadSeats().catch(() => {});
    } finally {
      setLocking(false);
    }
  };

  const handleRelease = async () => {
    try {
      await api.post(`/bookings/${booking._id}/release`);
      toast.info("Seats released");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not release the seats");
    }
    setBooking(null);
    setSelected([]);
    loadSeats().catch(() => {});
  };
    const handlePay = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Could not load the payment window. Check your internet.");
        setPaying(false);
        return;
      }

      // Ask our server to create a payment order for this booking
      const orderRes = await api.post(`/bookings/${booking._id}/pay`);
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "iMovies",
        description: `Booking ${booking.bookingId}`,
        prefill: { name: user?.username, email: user?.email },
        theme: { color: "#ff4d6d" },
        // Runs after the user pays successfully in the popup
        handler: async (response) => {
          try {
            const res = await api.post("/bookings/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(res.data.message);
            navigate("/booking-confirmed", {
              state: { booking: res.data.booking, show },
            });
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        // The user closed the popup without paying
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) =>
        toast.error(resp.error?.description || "Payment failed. You can try again.")
      );
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start the payment");
      setPaying(false);
    }
  };
  if (loading) return <div style={{ padding: 30 }}>Loading seats...</div>;
  if (error) {
    return (
      <div style={{ padding: 30 }}>
        <p>{error}</p>
        <Link to="/" style={{ color: "#ff4d6d" }}>Back to movies</Link>
      </div>
    );
  }

  const total = booking
    ? booking.amount
    : selected.reduce((sum, s) => sum + (seats[s]?.price || 0), 0);
  const shownSeats = booking ? booking.seats : selected;

  let lastCategory = "";

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <Link to={`/movie/${show.movieId._id}`} style={{ color: "#ff4d6d" }}>
        ← Back to movie
      </Link>

      <h1 style={{ marginBottom: 4 }}>{show.movieId.movieName}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        {show.theatreId.theatreName}, {show.theatreId.location} • {show.showdate} •{" "}
        {show.showtime}
      </p>

      {/* Screen */}
      <div
        style={{
          margin: "24px auto 30px",
          width: "80%",
          textAlign: "center",
          padding: 6,
          fontSize: 12,
          letterSpacing: 4,
          background: "linear-gradient(#ffffff33, transparent)",
          borderTop: "3px solid #ffffff88",
          borderRadius: "50% 50% 0 0",
        }}
      >
        SCREEN
      </div>

      {/* Seat rows */}
      <div style={{ overflowX: "auto", paddingBottom: 10 }}>
        <div style={{ width: "fit-content", margin: "0 auto" }}>
          {rows.map(([letter, ids]) => {
            const category = seats[ids[0]].category;
            const showHeading = category !== lastCategory;
            lastCategory = category;

            return (
              <div key={letter}>
                {showHeading && (
                  <div style={{ margin: "16px 0 8px", fontSize: 13, opacity: 0.7 }}>
                    {CATEGORY_LABEL[category]} • ₹{seats[ids[0]].price}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 20, fontSize: 13, opacity: 0.6 }}>{letter}</span>
                  {ids.map((seatId) => {
                    const isSelected = shownSeats.includes(seatId);
                    const c = seatColors(seats[seatId].status, isSelected);
                    const clickable = !booking && seats[seatId].status === "available";
                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(seatId)}
                        title={`${seatId} • ₹${seats[seatId].price} • ${seats[seatId].status}`}
                        style={{
                          width: 32,
                          height: 32,
                          fontSize: 11,
                          borderRadius: 6,
                          border: `1px solid ${c.border}`,
                          background: c.background,
                          color: c.color,
                          cursor: clickable ? "pointer" : "not-allowed",
                          padding: 0,
                        }}
                      >
                        {seatId.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", margin: "20px 0", fontSize: 13 }}>
        <span><span style={{ color: "#4cd964" }}>■</span> Available</span>
        <span><span style={{ color: "#ff4d6d" }}>■</span> Selected</span>
        <span><span style={{ color: "#c98a1b" }}>■</span> Held by someone</span>
        <span><span style={{ color: "#777" }}>■</span> Booked</span>
      </div>

      {/* Summary */}
      <div
        style={{
          background: "#171b30",
          border: "1px solid #2a2f4a",
          borderRadius: 10,
          padding: 18,
        }}
      >
        {shownSeats.length === 0 ? (
          <p style={{ margin: 0 }}>Click on seats to select them (up to {MAX_SEATS}).</p>
        ) : (
          <>
            <p style={{ margin: "0 0 6px" }}>
              <b>Seats:</b> {[...shownSeats].sort(seatSort).join(", ")}
            </p>
            <p style={{ margin: "0 0 14px" }}>
              <b>Total:</b> ₹{total}
            </p>
          </>
        )}

        {!booking ? (
          <button
            onClick={handleLock}
            disabled={selected.length === 0 || locking}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: 6,
              fontSize: 16,
              color: "white",
              background: selected.length === 0 ? "#555" : "#ff4d6d",
            }}
          >
            {locking ? "Locking..." : "Lock seats and continue"}
          </button>
        ) : (
          <>
            <p style={{ color: "#c98a1b", margin: "0 0 12px" }}>
              Seats held for you. Time left: <b>{formatTime(secondsLeft)}</b>
            </p>
                        <button
              onClick={handlePay}
              disabled={paying}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                background: paying ? "#555" : "#4cd964",
                color: "white",
                marginRight: 10,
              }}
            >
              {paying ? "Processing..." : `Pay ₹${total}`}
            </button>
            <button
              onClick={handleRelease}
              style={{
                padding: "12px 24px",
                borderRadius: 6,
                fontSize: 16,
                background: "transparent",
                color: "white",
                border: "1px solid #ff4d6d",
              }}
            >
              Release seats
            </button>
          </>
        )}
      </div>
    </div>
  );
}