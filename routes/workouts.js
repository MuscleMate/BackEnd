const express = require("express");
const router = express.Router();

const { add_workout, get_workout } = require("../controllers/workouts.js");

router.route("/").post(add_workout);
router.route("/").get(get_workout);
module.exports = router;
