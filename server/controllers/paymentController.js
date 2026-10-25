
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const { sendBookingConfirmation } = require("../utils/mailer");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE PAYMENT ORDER for a pending booking
exports.createOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "This booking is not pending" });
    }
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Seat lock expired. Please select seats again." });
    }

    // If an order already exists for this booking, reuse it
    let payment = await Payment.findOne({
      bookingId: booking._id,
      status: "created",
    });

    if (!payment) {
      const order = await razorpay.orders.create({
        amount: booking.amount * 100, // Razorpay uses paise (1 rupee = 100 paise)
        currency: "INR",
        receipt: booking.bookingId,
      });

      payment = await Payment.create({
        bookingId: booking._id,
        userId: req.user.id,
        providerOrderId: order.id,
        amount: booking.amount,
      });
    }

    res.status(201).json({
      message: "Order created",
      orderId: payment.providerOrderId,
      amount: payment.amount * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID, // the public key, safe to send
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create the payment order" });
  }
};

// VERIFY PAYMENT and confirm the booking
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const payment = await Payment.findOne({
      providerOrderId: razorpay_order_id,
      userId: req.user.id,
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Already done earlier? Just say so (safe to call twice)
    if (payment.status === "paid") {
      return res.json({ message: "Booking already confirmed" });
    }

    // 1. Check the signature with our secret key
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid) {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // 2. The booking must still be pending
    const booking = await Booking.findById(payment.bookingId);
    if (!booking || booking.status !== "pending") {
      payment.providerPaymentId = razorpay_payment_id;
      payment.status = "refund_needed";
      await payment.save();
      return res
        .status(409)
        .json({ message: "Booking is no longer pending. Your payment will be refunded." });
    }

    // 3. Mark ALL seats as booked in one atomic command,
    //    but only if they are still locked by this user
    const conditions = booking.seats.map((id) => ({
      [`seats.${id}.status`]: "locked",
      [`seats.${id}.lockedBy`]: String(req.user.id),
    }));
    const changes = {};
    booking.seats.forEach((id) => {
      changes[`seats.${id}.status`] = "booked";
      changes[`seats.${id}.lockedBy`] = null;
      changes[`seats.${id}.lockedUntil`] = null;
    });

    const result = await Show.updateOne(
      { _id: booking.showId, $and: conditions },
      { $set: changes }
    );

    if (result.matchedCount === 0) {
      // Money was paid but the seats were lost (for example the lock expired and
      // someone else took them). Flag it so it can be refunded.
      payment.providerPaymentId = razorpay_payment_id;
      payment.status = "refund_needed";
      await payment.save();
      booking.status = "failed";
      await booking.save();
      return res
        .status(409)
        .json({ message: "Seats are no longer held for you. Your payment will be refunded." });
    }

    // 4. Everything worked
    payment.providerPaymentId = razorpay_payment_id;
    payment.status = "paid";
    await payment.save();

    booking.status = "confirmed";
    booking.expiresAt = undefined;
    await booking.save();
        // Send the email in the background. A failure here never breaks the booking.
    sendBookingConfirmation(booking._id).catch((err) =>
      console.error("Email error:", err.message)
    );

    res.json({
      message: "Payment verified. Booking confirmed!",
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        seats: booking.seats,
        amount: booking.amount,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};