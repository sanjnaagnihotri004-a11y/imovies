
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 6,
  border: "1px solid #2a2f4a",
  background: "#0f1220",
  color: "#f1f1f1",
};

function Stars({ value }) {
  return (
    <span style={{ color: "#f5c518" }}>
      {"★".repeat(value)}
      <span style={{ opacity: 0.3 }}>{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function Reviews({ movieId, onChange }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [eligible, setEligible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasReview, setHasReview] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(() => {
    return api
      .get(`/reviews/${movieId}`)
      .then((res) => setReviews(res.data.reviews))
      .catch(() => toast.error("Could not load reviews"));
  }, [movieId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Find out whether this user may write a review
  useEffect(() => {
    if (!user) {
      setEligible(false);
      return;
    }
    api
      .get(`/reviews/${movieId}/can-review`)
      .then((res) => {
        setEligible(res.data.eligible);
        if (res.data.myReview) {
          setRating(res.data.myReview.rating);
          setComment(res.data.myReview.comment);
          setHasReview(true);
        }
      })
      .catch(() => {});
  }, [movieId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please choose a star rating");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/reviews/${movieId}`, { rating, comment });
      toast.success("Review saved");
      setHasReview(true);
      await loadReviews();
      if (onChange) onChange(); // let the page refresh the average rating
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your review");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      await loadReviews();
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the review");
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Reviews</h2>

      {eligible && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#171b30",
            border: "1px solid #2a2f4a",
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <b>{hasReview ? "Edit your review" : "Write a review"}</b>
          <div style={{ margin: "10px 0" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                title={`${n} star${n > 1 ? "s" : ""}`}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 30,
                  padding: 0,
                  marginRight: 4,
                  color: n <= rating ? "#f5c518" : "#555",
                }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: 70 }}
            placeholder="Share your thoughts (optional, up to 500 characters)"
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            disabled={saving}
            style={{
              marginTop: 10,
              padding: "10px 22px",
              border: "none",
              borderRadius: 6,
              background: "#ff4d6d",
              color: "white",
            }}
          >
            {saving ? "Saving..." : hasReview ? "Update review" : "Submit review"}
          </button>
        </form>
      )}

      {user && !eligible && (
        <p style={{ opacity: 0.7 }}>
          You can review this movie after booking a ticket for it.
        </p>
      )}
      {!user && <p style={{ opacity: 0.7 }}>Log in to review movies you have booked.</p>}

      {reviews.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r._id}
            style={{
              background: "#171b30",
              border: "1px solid #2a2f4a",
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <b>{r.username}</b> &nbsp;<Stars value={r.rating} />
              </div>
              {user?.role === "admin" && (
                <button
                  onClick={() => handleDelete(r._id)}
                  style={{
                    background: "none",
                    border: "1px solid #ff4d6d",
                    color: "#ff4d6d",
                    borderRadius: 6,
                    padding: "2px 10px",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            {r.comment && <p style={{ margin: "8px 0 0" }}>{r.comment}</p>}
            <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.5 }}>
              {new Date(r.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}