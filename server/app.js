// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const userRouter = require("./routers/userRouter");
const app = express();
const port = 3000;
const wsPort = 8080; // WebSocket server port
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
const wss = new WebSocket.Server({ port: wsPort });
wss.on("connection", (ws) => {

  // Send a message to the client when connected

  // Handle incoming messages from the ESP8266
  ws.on("message", async (message) => {
    // try {
    const data = JSON.parse(message);
    // Broadcast the slot data to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "slot-update",
            slots: data.slots,
          })
        );
        if(data.type ==="lightStatus"){
          client.send(JSON.stringify({
            type: "light-status",
            lightStatus: data.status,
          }))
          // Save light status to MongoDB
          const saveStatus = async () => {
            try {
              // Create a light status document
              const lightStatusData = {
                status: data.status,
                timestamp: new Date()
              };
              
              // Use mongoose to save to database
              const LightStatus = mongoose.models.LightStatus || mongoose.model('LightStatus', new mongoose.Schema({
                status: Boolean,
                timestamp: Date
              }), 'lightStatus');
              
              await new LightStatus(lightStatusData).save();
              console.log('Light status saved to database:', data.status);
            } catch (error) {
              console.error('Error saving light status:', error);
            }
          };

          saveStatus();
        }
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
app.use("/api/user", userRouter);
// Route to get light status
app.get('/api/light-status', async (req, res) => {
  try {
    // Use the existing LightStatus model or define it if not already defined
    const LightStatus = mongoose.models.LightStatus || mongoose.model('LightStatus', 
      new mongoose.Schema({
        status: Boolean,
        timestamp: Date
      }), 
      'lightStatus'
    );
    
    // Get the latest light status
    const latestStatus = await LightStatus.findOne().sort({ timestamp: -1 });
    
    if (!latestStatus) {
      return res.status(404).json({ message: 'No light status found' });
    }
    
    res.status(200).json({ 
      status: latestStatus.status,
      timestamp: latestStatus.timestamp 
    });
  } catch (error) {
    console.error('Error fetching light status:', error);
    res.status(500).json({ message: 'Error fetching light status', error: error.message });
  }
});
app.post("/get-in", async (req, res) => {
  try {
    const plates = mongoose.models.plates || mongoose.model('plates', 
      new mongoose.Schema({
        plateNumber: String,
        time: String,
      }), 
      'plates'
    );
    const plateData = {
      plateNumber: req.body.plate,
      time: req.body.time,
    };
    // Send plate data to all connected clients via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "plate-entry",
          plateNumber: plateData.plateNumber,
          time: plateData.time
        }));
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
app.post("/get-out", async (req, res) => {
  try {
    const plates = mongoose.models.plates || mongoose.model('plates', 
      new mongoose.Schema({
        plateNumber: String,
        time: String,
      }), 
      'plates'
    );
    const platesRecord = mongoose.models.platesRecord || mongoose.model('platesRecord', 
      new mongoose.Schema({
        plateNumber: String,
        entryTime: String,
        exitTime: String,
        duration: String,
        fee: Number,
      }), 
      'platesRecord'
    );
    console.log("Received exit request:", req.body);
    const plateNumber = req.body.plate;
    const exitTime = req.body.time;
    
    // Find the most recent entry for this plate number
    const entry = await plates.findOne(
      { plateNumber: plateNumber }
    ).sort({ time: -1 });

    if (!entry) {
      return res.status(404).send({ message: "No entry found for this plate" });
    }
    console.log("Entry found:", entry);
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
    // Send plate exit data to all connected clients via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "plate-exit",
          plateNumber: exitData.plateNumber,
          entryTime: exitData.entryTime,
          exitTime: exitData.exitTime,
          duration: exitData.duration,
          fee: exitData.fee
        }));
      }
    });
    console.log("Exit data saved:", exitData);

    // await plates.deleteMany({ plateNumber: plateNumber });
    await platesRecord.create(exitData);
    res.status(200).send({ message: "Exit recorded successfully", exitData });
  } catch (error) {
    res.status(500).send({ message: "Error recording exit", error });
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
