const mongoose = require("mongoose");

const lightSchema = mongoose.Schema(
  {
    status: Boolean,
    timestamp: Date,
  },
  { collection: "lightStatus" }
);

const LightStatus = mongoose.model("LightStatus", lightSchema);
module.exports = LightStatus;
