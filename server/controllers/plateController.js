import Plate from "../models/plateModel.js";

export const addPlate = async (req, res) => {
  const plateData = { plateNumber: req.body.plate, time: req.body.time };
  try {
    const result = await Plate.create(plateData);
    res.status(200).send({ message: "Plate data saved", result });
  } catch (error) {
    res.status(500).send({ message: "Error saving plate", error });
  }
};

export const getPlates = async (req, res) => {
  try {
    const plateData = await Plate.find({});
    res.status(200).send({ plateData });
  } catch (error) {
    res.status(500).send({ message: "Error fetching plates", error });
  }
};
