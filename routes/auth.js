const express = require("express");
const router = express.Router();

const { login, register, logout, reset_password, forgot_password, forgot_password_reset } = require("../controllers/auth.js");

const {requireAuth} = require("../middleware/auth.js");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/password/reset").put(requireAuth, reset_password);
router.route("/password/forgot").post(forgot_password)
router.route("/password/forgot/:token").post(forgot_password_reset)


module.exports = router;
