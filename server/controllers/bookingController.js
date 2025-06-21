import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";

export const createBooking = async (req, res) => {
  const { location, slotIndex, userID } = req.body;
  try {
    const existing = await Booking.findOne({ location, slotIndex });
    if (existing)
      return res.status(400).json({ message: "Slot already booked" });

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ message: "User not found" });

    const bookingFee = 20000;
    if (user.money < bookingFee)
      return res.status(400).json({ message: "Insufficient balance" });

    user.money -= bookingFee;
    await user.save();
    const newBooking = await Booking.create({ location, slotIndex, userID });

    res.status(200).json({
      message: "Booking successful",
      booking: newBooking,
      newBalance: user.money,
    });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error });
  }
};

export const deleteBooking = async (req, res) => {
  const { location, slotIndex, userID } = req.body;
  try {
    const booking = await Booking.findOne({ location, slotIndex });
    if (!booking) return res.status(404).json({ message: "No booking found" });
    if (booking.userID !== userID)
      return res.status(403).json({ message: "Not allowed" });

    await Booking.deleteOne({ _id: booking._id });
    res.status(200).json({ message: "Booking cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Cancel booking failed", error });
  }
};
