const express = require("express");
const router = express.Router();

const { add_workout, get_workouts , delete_workout , get_singleworkout, update_workout, change_favourite, start_workout, end_workout } = require("../controllers/workouts.js");

router.route("/").post(add_workout).get(get_workouts);
router.route("/:id").delete(delete_workout).get(get_singleworkout).put(update_workout);
router.route("/:id/start").post(start_workout);
router.route("/:id/end").post(end_workout);
router.route("/:id/favourite").put(change_favourite);
module.exports = router;
