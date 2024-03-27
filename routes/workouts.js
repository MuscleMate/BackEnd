const express = require("express");
const router = express.Router();

const { add_workout, get_workouts , get_singleworkout } = require("../controllers/workouts.js");

router.route("/").post(add_workout);
router.route("/").get(get_workouts);
router.route("/:id").get(get_singleworkout);
module.exports = router;
