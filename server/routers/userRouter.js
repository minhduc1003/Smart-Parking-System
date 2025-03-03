const express = require("express");
const {
  userRegister,
  userLogin,
  userLogout,
  getUser,
  loginStatus,
  sendTokenWhenForgotPass,
  changePasswordWhenForgotPass,
} = require("../controllers/user");
const router = express.Router();
router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/logout", userLogout);
router.get("/getUser", getUser);

router.get("/loggedin", loginStatus);
router.post("/forgotpassword", sendTokenWhenForgotPass);
router.put("/forgotpassword/:resetToken", changePasswordWhenForgotPass);
module.exports = router;
