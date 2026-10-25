
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, default: "razorpay" },
    providerOrderId: { type: String, required: true, unique: true },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true }, // in rupees
    status: {
      type: String,
            enum: ["created", "paid", "failed", "refund_needed", "refunded"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);