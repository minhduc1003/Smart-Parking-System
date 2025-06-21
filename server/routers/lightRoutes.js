const express = require("express");
const router = express.Router();
const lightController = require("../controllers/lightController");

router.get("/", lightController.getLightStatus);

module.exports = router;
