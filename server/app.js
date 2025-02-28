// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

const uri = 'mongodb+srv://vuminhduc231003:duc123434@cluster0.rxney.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/get-in', async (req, res) => {
  try {
    console.log(req.body);
    await client.connect();
    const database = client.db('smart_parking');
    const collection = database.collection('plates');

    const plateData = {
      plateNumber: req.body.plateNumber,
      time: req.body.time
    };
    const result = await collection.insertOne(plateData);

    res.status(200).send({ message: 'Plate data saved successfully', result });
  } catch (error) {
    res.status(500).send({ message: 'Error saving plate data', error });
  } finally {
    await client.close();
  }
});
app.post('/get-out', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('smart_parking');
    const collection = database.collection('plates');

    const plateNumber = req.body.plateNumber;
    const exitTime = req.body.time;

    // Find the most recent entry for this plate number
    const entry = await collection.findOne(
      { plateNumber: plateNumber },
      { sort: { time: -1 } }
    );

    if (!entry) {
      return res.status(404).send({ message: 'No entry found for this plate' });
    }

    // Calculate parking duration and fee
    const duration = (new Date(exitTime) - new Date(entry.time)) / 1000; // in seconds
    const fee = duration * 100; // 100 VND per second

    const exitData = {
      plateNumber,
      entryTime: entry.time,
      exitTime,
      duration,
      fee
    };

     await collection.deleteOne({ plateNumber: plateNumber });

    res.status(200).send({ message: 'Exit recorded successfully', exitData });
  } catch (error) {
    res.status(500).send({ message: 'Error recording exit', error });
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
