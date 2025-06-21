const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
  {
    location: String,
    slotIndex: Number,
    userID: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "bookings" }
);
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
