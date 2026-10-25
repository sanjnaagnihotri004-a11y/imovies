

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import { cell, smallButton } from "../adminStyles";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return api
      .get("/admin/refunds")
      .then((res) => setRefunds(res.data.refunds))
      .catch(() => toast.error("Could not load refunds"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDone = async (r) => {
    const ok = window.confirm(
      `Mark ₹${r.amount} as refunded? Only do this after you have sent the money back.`
    );
    if (!ok) return;
    try {
      await api.post(`/admin/payments/${r._id}/refunded`);
      toast.success("Marked as refunded");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the payment");
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Refunds</h1>
      <p style={{ opacity: 0.7 }}>
        These payments need money sent back to the customer. Refund them in the
        Razorpay dashboard, then mark them done here.
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : refunds.length === 0 ? (
        <p>No refunds waiting. 🎉</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 650 }}>
            <thead>
              <tr>
                <th style={cell}>Booking</th>
                <th style={cell}>User</th>
                <th style={cell}>Amount</th>
                <th style={cell}>Razorpay payment</th>
                <th style={cell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r._id}>
                  <td style={cell}>{r.bookingId?.bookingId || "-"}</td>
                  <td style={cell}>
                    {r.userId?.username}
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{r.userId?.email}</div>
                  </td>
                  <td style={cell}>₹{r.amount}</td>
                  <td style={cell}>{r.providerPaymentId || "-"}</td>
                  <td style={cell}>
                    <button onClick={() => handleDone(r)} style={smallButton("#4cd964")}>
                      Mark refunded
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}