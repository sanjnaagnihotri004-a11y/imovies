

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import Pager from "../components/Pager";
import { cell, smallButton } from "../adminStyles";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return api
      .get("/admin/reviews", { params: { page } })
      .then((res) => {
        setReviews(res.data.reviews);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => toast.error("Could not load reviews"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (r) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${r._id}`);
      toast.success("Review deleted");
      // If that was the last review on this page, go back one page
      if (reviews.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the review");
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reviews</h1>

      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 650 }}>
            <thead>
              <tr>
                <th style={cell}>Movie</th>
                <th style={cell}>User</th>
                <th style={cell}>Rating</th>
                <th style={cell}>Comment</th>
                <th style={cell}>Date</th>
                <th style={cell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td style={cell}>{r.movieId?.movieName || "Deleted movie"}</td>
                  <td style={cell}>{r.userId?.username || "Deleted user"}</td>
                  <td style={{ ...cell, color: "#f5c518" }}>{"★".repeat(r.rating)}</td>
                  <td style={{ ...cell, maxWidth: 300 }}>{r.comment || "-"}</td>
                  <td style={cell}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={cell}>
                    <button onClick={() => handleDelete(r)} style={smallButton("#ff4d6d")}>
                      Delete
                    </button>
                  </td>
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