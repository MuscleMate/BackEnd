const router = require("express").Router();

const { searchExercises } = require("../controllers/exercises");

router.route("/search").post(searchExercises);

module.exports = router;