const express = require("express");
const router = express.Router();

const { add_workout, get_workouts } = require("../controllers/workouts.js");

router.route("/").post(add_workout);
router.route("/").get(get_workouts);
module.exports = router;
