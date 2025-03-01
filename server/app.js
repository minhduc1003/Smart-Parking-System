// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();
const port = 3000;
const wsPort = 8080; // WebSocket server port
const uri =
  "mongodb+srv://vuminhduc231003:duc123434@cluster0.rxney.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
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
  console.log("A client connected to WebSocket server.");

  // Send a message to the client when connected
  ws.send("Welcome to the WebSocket server!");

  // Handle incoming messages from the ESP8266
  ws.on("message", async (message) => {
    console.log("Received: " + message);
    // try {
    const data = JSON.parse(message);
    console.log(data.slots);
    // Broadcast the slot data to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "slot-update",
            slots: data.slots,
          })
        );
      }
    });
    //   if (data.action === 'slot-status') {
    //     // Handle slot status action
    //     console.log('Slot Status:', data.slots);
    //     // You can store this data in the database or use it as needed
    //     await client.connect();
    //     const database = client.db('smart_parking');
    //     const collection = database.collection('slots');

    //     const slotData = {
    //       slots: data.slots,
    //       timestamp: new Date()
    //     };

    //     // Insert slot status data into MongoDB (optional)
    //     await collection.insertOne(slotData);
    //     ws.send(JSON.stringify({ message: 'Slot status received and saved' }));
    //   }
    // } catch (error) {
    //   ws.send(JSON.stringify({ message: 'Error processing message', error }));
    // }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

app.post("/get-in", async (req, res) => {
  try {
    console.log(req.body);
    await client.connect();
    const database = client.db("smart_parking");
    const collection = database.collection("plates");

    const plateData = {
      plateNumber: req.body.plateNumber,
      time: req.body.time,
    };
    const result = await collection.insertOne(plateData);

    res.status(200).send({ message: "Plate data saved successfully", result });
  } catch (error) {
    res.status(500).send({ message: "Error saving plate data", error });
  } finally {
    await client.close();
  }
});
app.post("/get-out", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("smart_parking");
    const collection = database.collection("plates");

    const plateNumber = req.body.plateNumber;
    const exitTime = req.body.time;

    // Find the most recent entry for this plate number
    const entry = await collection.findOne(
      { plateNumber: plateNumber },
      { sort: { time: -1 } }
    );

    if (!entry) {
      return res.status(404).send({ message: "No entry found for this plate" });
    }

    // Calculate parking duration and fee
    const duration = (new Date(exitTime) - new Date(entry.time)) / 1000; // in seconds
    const fee = duration * 100; // 100 VND per second

    const exitData = {
      plateNumber,
      entryTime: entry.time,
      exitTime,
      duration,
      fee,
    };

    await collection.deleteOne({ plateNumber: plateNumber });

    res.status(200).send({ message: "Exit recorded successfully", exitData });
  } catch (error) {
    res.status(500).send({ message: "Error recording exit", error });
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
console.log(`WebSocket server running at ws://localhost:${wsPort}`);
