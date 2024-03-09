const express = require("express");
const router = express.Router();

const { login, register, logout } = require("../controllers/auth.js");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);

module.exports = router;
