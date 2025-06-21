const express = require("express");
const router = express.Router();
const plateController = require("../controllers/plateController");

router.post("/add", plateController.addPlate);
router.get("/", plateController.getPlates);

module.exports = router;
