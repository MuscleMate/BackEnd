const router = require("express").Router();

const { createWorkoutTemplate, deleteWorkoutTemplate, getSingleWorkoutTemplate, getAllWorkoutTemplates, searchWorkoutTemplates } = require("../controllers/templates");

router.route("/").post(createWorkoutTemplate).get(getAllWorkoutTemplates);
router.route("/search").post(searchWorkoutTemplates);
router.route("/:templateID").delete(deleteWorkoutTemplate).get(getSingleWorkoutTemplate);

module.exports = router;