const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const userRouter = require("./routers/userRouter");
const User = require("./models/userModel");
const app = express();
const port = 3000;
const wsPort = 8080;
const uri =
  "mongodb+srv://vuminhduc231003:duc123434@cluster0.rxney.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const Booking =
  mongoose.models.Booking ||
  mongoose.model(
    "Booking",
    new mongoose.Schema(
      {
        location: String,
        slotIndex: Number,
        userID: String,
        createdAt: { type: Date, default: Date.now },
      },
      { collection: "bookings" }
    )
  );
const wss = new WebSocket.Server({ port: wsPort });
wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    if (data.action === "slot-status") {
      // Xoá các booking quá 1 phút
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      await Booking.deleteMany({ createdAt: { $lt: oneMinuteAgo } });

      const bookings = await Booking.find({});
      const mergedSlots = [...data.slots];
      const mergedSlots2 = [...data.slots2];
      const bookedUsers = {
        "54 Triều Khúc (DH CNGTVT)": {},
        "32 Nguyễn Công Chứ": {},
      };

      bookings.forEach((b) => {
        if (
          b.location === "54 Triều Khúc (DH CNGTVT)" &&
          b.slotIndex < mergedSlots.length
        ) {
          mergedSlots[b.slotIndex] = 1;
          bookedUsers["54 Triều Khúc (DH CNGTVT)"][b.slotIndex] = b.userID;
        } else if (
          b.location === "32 Nguyễn Công Chứ" &&
          b.slotIndex < mergedSlots2.length
        ) {
          mergedSlots2[b.slotIndex] = 1;
          bookedUsers["32 Nguyễn Công Chứ"][b.slotIndex] = b.userID;
        }
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "slot-update",
              slots: mergedSlots,
              slots2: mergedSlots2,
              bookedUsers: bookedUsers,
            })
          );
        }
      });
    }
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (data.type === "lightStatus") {
          client.send(
            JSON.stringify({
              type: "light-status",
              lightStatus: data.status,
            })
          );
          // Save light status to MongoDB
          const saveStatus = async () => {
            try {
              // Create a light status document
              const lightStatusData = {
                status: data.status,
                timestamp: new Date(),
              };

              // Use mongoose to save to database
              const LightStatus =
                mongoose.models.LightStatus ||
                mongoose.model(
                  "LightStatus",
                  new mongoose.Schema({
                    status: Boolean,
                    timestamp: Date,
                  }),
                  "lightStatus"
                );

              await new LightStatus(lightStatusData).save();
              console.log("Light status saved to database:", data.status);
            } catch (error) {
              console.error("Error saving light status:", error);
            }
          };

          saveStatus();
        }
      }
    });
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
app.use("/api/user", userRouter);
app.get("/api/light-status", async (req, res) => {
  try {
    const LightStatus =
      mongoose.models.LightStatus ||
      mongoose.model(
        "LightStatus",
        new mongoose.Schema({
          status: Boolean,
          timestamp: Date,
        }),
        "lightStatus"
      );
    const latestStatus = await LightStatus.findOne().sort({ timestamp: -1 });
    if (!latestStatus) {
      return res.status(404).json({ message: "No light status found" });
    }
    res.status(200).json({
      status: latestStatus.status,
      timestamp: latestStatus.timestamp,
    });
  } catch (error) {
    console.error("Error fetching light status:", error);
    res
      .status(500)
      .json({ message: "Error fetching light status", error: error.message });
  }
});
app.post("/get-in", async (req, res) => {
  try {
    const plates =
      mongoose.models.plates ||
      mongoose.model(
        "plates",
        new mongoose.Schema({
          plateNumber: String,
          time: String,
        }),
        "plates"
      );
    const plateData = {
      plateNumber: req.body.plate,
      time: req.body.time,
    };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "plate-entry",
            plateNumber: plateData.plateNumber,
            time: plateData.time,
          })
        );
      }
    });
    console.log("Plate data received:", plateData);
    const result = await plates.create(plateData);
    console.log("Plate data saved:", result);
    res.status(200).send({ message: "Plate data saved successfully", result });
  } catch (error) {
    res.status(500).send({ message: "Error saving plate data", error });
  }
});
app.get("/api/get-plate", async (req, res) => {
  try {
    const plates =
      mongoose.models.plates ||
      mongoose.model(
        "plates",
        new mongoose.Schema({
          plateNumber: String,
          time: String,
        }),
        "plates"
      );
    const plateData = await plates.find({});
    res
      .status(200)
      .send({ message: "Plate data fetched successfully", plateData });
  } catch (error) {
    res.status(500).send({ message: "Error fetching plate data", error });
  }
});
app.post("/user-plate", async (req, res) => {
  const plateNumber = req.body.plateNumber;

  try {
    const plates =
      mongoose.models.platesRecord ||
      mongoose.model(
        "platesRecord",
        new mongoose.Schema({
          plateNumber: String,
          entryTime: String,
          exitTime: String,
          duration: String,
          fee: Number,
        }),
        "platesRecord"
      );

    const userPlates = await plates.find({ plateNumber });

    res
      .status(200)
      .send({ message: "User plates fetched successfully", userPlates });
  } catch (error) {
    res.status(500).send({ message: "Error fetching user plates", error });
  }
});

app.post("/get-out", async (req, res) => {
  try {
    const plates =
      mongoose.models.plates ||
      mongoose.model(
        "plates",
        new mongoose.Schema({
          plateNumber: String,
          time: String,
        }),
        "plates"
      );
    const platesRecord =
      mongoose.models.platesRecord ||
      mongoose.model(
        "platesRecord",
        new mongoose.Schema({
          plateNumber: String,
          entryTime: String,
          exitTime: String,
          duration: String,
          fee: Number,
        }),
        "platesRecord"
      );

    console.log("Received exit request:", req.body);
    const plateNumber = req.body.plate;
    const exitTime = req.body.time;
    const entry = await plates
      .findOne({ plateNumber: plateNumber })
      .sort({ time: -1 });

    if (!entry) {
      return res.status(404).send({ message: "No entry found for this plate" });
    }
    console.log("Entry found:", entry);
    const durationInSeconds =
      (new Date(exitTime) - new Date(entry.time)) / 1000;
    const durationInMinutes = Math.floor(durationInSeconds / 60);
    const fee = durationInMinutes < 15 ? 5000 : 10000;
    console.log(
      `Parking duration: ${durationInMinutes} minutes, Fee: ${fee} VND`
    );

    const exitData = {
      plateNumber,
      entryTime: entry.time,
      exitTime,
      duration: durationInMinutes,
      fee,
    };

    // Check if the user has enough balance
    const user = await User.findOne({ numberPlate: plateNumber });
    if (user) {
      if (user.money >= fee) {
        // Deduct the fee from the user's balance
        user.money -= fee;
        await user.save();
        console.log("Fee deducted from user balance:", user);
        exitData.paymentStatus = "auto";
      } else {
        console.log("Insufficient balance for user:", user);
        exitData.paymentStatus = "manual";
      }
    } else {
      console.log("No user found for plate number:", plateNumber);
      exitData.paymentStatus = "manual";
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "plate-exit",
            plateNumber: exitData.plateNumber,
            entryTime: exitData.entryTime,
            exitTime: exitData.exitTime,
            duration: exitData.duration,
            fee: exitData.fee,
            paymentStatus: exitData.paymentStatus,
          })
        );
      }
    });
    console.log("Exit data saved:", exitData);

    await plates.deleteMany({ plateNumber: plateNumber });
    await platesRecord.create(exitData);
    res.status(200).send({ message: "Exit recorded successfully", exitData });
  } catch (error) {
    res.status(500).send({ message: "Error recording exit", error });
  }
});
app.post("/in-not-found", async (req, res) => {
  const time = req.body.time;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log({
        type: "plate-in-not-found",
        time: time,
      });
      client.send(
        JSON.stringify({
          type: "plate-in-not-found",
          time: time,
        })
      );
    }
  });
});
app.post("/out-not-found", async (req, res) => {
  const time = req.body.time;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log({
        type: "plate-out-not-found",
        time: time,
      });
      client.send(
        JSON.stringify({
          type: "plate-out-not-found",
          time: time,
        })
      );
    }
  });
});
app.post("/api/bookings", async (req, res) => {
  const { location, slotIndex, userID } = req.body;
  try {
    const existing = await Booking.findOne({ location, slotIndex });
    if (existing) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Find user and check balance
    const user = await User.findById(userID);
    const bookingFee = 5000; // Set your booking fee here

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.money < bookingFee) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct fee and save user
    user.money -= bookingFee;
    await user.save();

    const newBooking = await Booking.create({ location, slotIndex, userID });
    console.log("✅ Booking saved:", newBooking);

    res.status(200).json({
      message: "Booking successful",
      booking: newBooking,
      newBalance: user.money,
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ message: "Booking failed", error });
  }
});

app.delete("/api/bookings", async (req, res) => {
  const { location, slotIndex, userID } = req.body;
  try {
    const booking = await Booking.findOne({ location, slotIndex });

    if (!booking) {
      return res.status(404).json({ message: "No booking found" });
    }

    if (booking.userID !== userID) {
      return res
        .status(403)
        .json({ message: "You are not allowed to cancel this booking" });
    }

    await Booking.deleteOne({ _id: booking._id });
    console.log("🗑️ Booking cancelled:", booking);

    res.status(200).json({ message: "Booking cancelled" });
  } catch (error) {
    console.error("❌ Cancel booking error:", error);
    res.status(500).json({ message: "Cancel booking failed", error });
  }
});

mongoose
  .connect(uri, {
    dbName: "smart_parking",
  })
  .then(() => {
    console.log("Connected to MongoDB database: smart_parking");
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  })
  .catch((e) => console.log("MongoDB connection error:", e));
console.log(`WebSocket server running at ws://localhost:${wsPort}`);
