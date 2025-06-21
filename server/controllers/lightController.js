import LightStatus from "../models/lightModel.js";

export const getLightStatus = async (req, res) => {
  try {
    const latestStatus = await LightStatus.findOne().sort({ timestamp: -1 });
    if (!latestStatus)
      return res.status(404).json({ message: "No light status found" });
    res.status(200).json(latestStatus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching light status", error });
  }
};
