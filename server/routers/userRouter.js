const express = require("express");
const {
  userRegister,
  userLogin,
  userLogout,
  getUser,
  loginStatus,
  sendTokenWhenForgotPass,
  changePasswordWhenForgotPass,
  depositToAccount,
  withdrawFromAccount,
} = require("../controllers/user");
const protect = require("../middleware/auth");
const router = express.Router();
router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/logout", userLogout);
router.get("/getUser", protect, getUser);
router.post("/deposit", depositToAccount);
router.post("/withdraw", withdrawFromAccount);
router.get("/loggedin", loginStatus);
router.post("/forgotpassword", sendTokenWhenForgotPass);
router.put("/forgotpassword/:resetToken", changePasswordWhenForgotPass);
module.exports = router;
