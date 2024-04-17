const express = require("express");
const router = express.Router();

const { add_workout, get_workouts , delete_workout , get_singleworkout, update_workout, change_favourite } = require("../controllers/workouts.js");

router.route("/").post(add_workout);
router.route("/").get(get_workouts);
router.route("/:id").delete(delete_workout).get(get_singleworkout).put(update_workout);
router.route("/:id/favourite").put(change_favourite);
module.exports = router;
