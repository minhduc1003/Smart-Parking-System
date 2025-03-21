const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const protect = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401);
      throw new Error("please login");
    }
    const vertify = jwt.verify(token, process.env.JWT_SECRETOKEN || "hihihaha");
    const user = await User.findOne({ _id: vertify.id }).select("-password");
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("please login");
  }
});
module.exports = protect;
