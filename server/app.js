require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const userRouter = require("./routers/userRouter");
const bookingRoutes = require("./routers/bookingRoutes");
const lightRoutes = require("./routers/lightRoutes");
const plateRoutes = require("./routers/plateRoutes");
const Booking = require("./models/bookingModel");
const LightStatus = require("./models/lightModel");
const app = express();
const port = 3000;
const wsPort = 8080;
const uri = process.env.MONGODB_URI;
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const wss = new WebSocket.Server({ port: wsPort });
wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    console.log("Received message:", data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "slot-hi",
            slothi: 1,
            slotshi: 2,
          })
        );
      }
    });
    if (data.action === "slot-status") {
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
          const saveStatus = async () => {
            try {
              const lightStatusData = {
                status: data.status,
                timestamp: new Date(),
              };

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
app.use("/api/bookings", bookingRoutes);
app.use("/api/light-status", lightRoutes);
app.use("/api/plate", plateRoutes);
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
