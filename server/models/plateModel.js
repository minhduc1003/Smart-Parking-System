const mongoose = require("mongoose");

const plateSchema = mongoose.Schema(
  {
    plateNumber: String,
    time: String,
  },
  { collection: "plates" }
);

const plates = mongoose.model("plates", plateSchema);
module.exports = plates;
