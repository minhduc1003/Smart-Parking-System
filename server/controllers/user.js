const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Token = require("../models/tokenModel");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");
const genrateToken = (id) => {
  return jwt.sign({ id }, "hihihaha", {
    expiresIn: "1d",
  });
};
const userRegister = asyncHandler(async (req, res) => {
  const { email, password, name, numberPlate } = req.body;
  if (!email || !name || !password) {
    res.status(400);
    throw new Error("please fill a form");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("password must be up to 6 character");
  }
  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    res.status(400);
    throw new Error("please write correct email format");
  }

  const emailExist = await User.findOne({ email });
  if (emailExist) {
    res.status(400);
    throw new Error("email has been existed");
  }
  const user = await User.create({
    password,
    name,
    email,
    numberPlate,
    role: "user",
  });
  const token = genrateToken(user._id);
  if (user) {
    res.status(201);
    const { _id, name, email } = user;
    res.cookie("token", token, {
      path: "/",
      httpOnly: false,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: false,
    });
    res.json({
      _id,
      name,
      email,
      numberPlate,
      role: "user",
      token,
    });
  } else {
    res.status(500);
    throw new Error("error");
  }
});
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("please fill a form");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("password must be up to 6 character");
  }
  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    res.status(400);
    throw new Error("please write correct email format");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("user not found");
  }
  const token = genrateToken(user._id);
  res.cookie("token", token, {
    path: "/",
    httpOnly: false,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: false,
  });
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  if (user && passwordIsCorrect) {
    const { _id, name, email, role, numberPlate } = user;
    res.json({
      _id,
      name,
      email,
      token,
      role,
      numberPlate,
    });
  } else {
    res.status(400);
    throw new Error("wrong password");
  }
});
const userLogout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: false,
    expires: new Date(0),
    sameSite: "none",
    secure: false,
  });
  return res.status(200).json({ message: "logout successfuly" });
});
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.status(201);
    const { _id, name, email, role, numberPlate } = user;
    res.json({
      _id,
      name,
      email,
      role,
      numberPlate,
    });
  } else {
    res.status(500);
    throw new Error("error");
  }
});
const loginStatus = (req, res) => {
  const token = req.cookies.token;
  if (!token) res.status(400).json(false);
  else {
    const verify = jwt.verify(token, process.env.JWT_SECRETOKEN);
    if (verify) res.status(200).json(true);
    else res.status(400).json(false);
  }
};
const sendTokenWhenForgotPass = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(404);
    throw new Error("please add email to the field");
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(500);
    throw new Error("email not exist");
  }
  await Token.findOneAndDelete({ userId: user._id });
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  let token = crypto.createHash("sha256").update(resetToken).digest("hex");
  await new Token({
    userId: user._id,
    token: token,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000,
  })
    .save()
    .catch(() => {
      res.status(500);
      throw new Error("error");
    });
  const url = `${process.env.URL_RPASSWORD}/${resetToken}`;
  const subj = "RESET EMAIL";
  const message = `<h1>Reset password</h1>
      <br/>
      <p>this is link to reset password</p>
      <br/>
      <a href=${url}>${url}</a>`;
  try {
    await sendEmail(email, subj, message);
  } catch (error) {
    res.status(500);
    throw new Error("error");
  }
  res.send("reset password");
});
const changePasswordWhenForgotPass = asyncHandler(async (req, res) => {
  const { password, oldPassword } = req.body;
  const { resetToken } = req.params;
  let token = crypto.createHash("sha256").update(resetToken).digest("hex");
  const tokenDb = await Token.findOne({
    token,
    expiresAt: { $gt: Date.now() },
  });
  if (!tokenDb) {
    res.status(400);
    throw new Error("token had been expired");
  }

  const user = await User.findOne({ _id: tokenDb.userId });
  if (!user) {
    res.status(500);
    throw new Error("error");
  }
  const verify = await bcrypt.compare(oldPassword, user.password);
  if (verify) {
    user.password = password;
    await user.save();
    tokenDb.token = "";
    await tokenDb.save();
    res.status(200).json({ message: "change password successfully" });
  } else {
    res.status(400);
    throw new Error("enter correct your old password");
  }
});

module.exports = {
  userRegister,
  userLogin,
  userLogout,
  getUser,
  loginStatus,
  sendTokenWhenForgotPass,
  changePasswordWhenForgotPass,
};
