const express = require("express");
const router = express.Router();

const { add_workout, get_workouts , delete_workout , get_singleworkout, update_workout } = require("../controllers/workouts.js");

router.route("/").post(add_workout);
router.route("/").get(get_workouts);
router.route("/:id").delete(delete_workout).get(get_singleworkout).put(update_workout);
module.exports = router;
