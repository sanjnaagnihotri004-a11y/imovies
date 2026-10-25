
const mongoose = require("mongoose");

// One seating area (lower, middle or balcony)
const areaSchema = new mongoose.Schema(
  {
    rows: {
      type: Number,
      required: [true, "Number of rows is required"],
      min: [1, "At least 1 row"],
      max: [10, "At most 10 rows per area"],
    },
    seatsPerRow: {
      type: Number,
      required: [true, "Seats per row is required"],
      min: [1, "At least 1 seat per row"],
      max: [30, "At most 30 seats per row"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: false }
);

const theatreSchema = new mongoose.Schema(
  {
    theatreName: {
      type: String,
      required: [true, "Theatre name is required"],
      trim: true,
      minlength: [2, "Theatre name must be at least 2 characters"],
      maxlength: [100, "Theatre name cannot exceed 100 characters"],
    },
    location: {
      type: String, // for example the city or area
      required: [true, "Location is required"],
      trim: true,
    },
    lower: { type: areaSchema, required: true },
    middle: { type: areaSchema, required: true },
    balcony: { type: areaSchema, required: true },
  },
  { timestamps: true }
);

// The same theatre name can't be added twice in the same location
theatreSchema.index({ theatreName: 1, location: 1 }, { unique: true });

module.exports = mongoose.model("Theatre", theatreSchema);