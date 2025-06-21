const mongoose = require("mongoose");

const plateRecordSchema = mongoose.Schema(
  {
    plateNumber: String,
    entryTime: String,
    exitTime: String,
    duration: String,
    fee: Number,
  },
  { collection: "platesRecord" }
);

const platesRecord = mongoose.model("platesRecord", plateRecordSchema);
module.exports = platesRecord;
