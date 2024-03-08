const express = require("express");
const router = express.Router();

const { add_workout } = require("../controllers/workouts.js");

router.route("/").post(add_workout);

module.exports = router;