const express = require("express");
const router = express.Router();

const { login, register, logout, reset_pass } = require("../controllers/auth.js");

const {requireAuth} = require("../middleware/auth.js");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/reset-password").post(requireAuth, reset_pass);

module.exports = router;
