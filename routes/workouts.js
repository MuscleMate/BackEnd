const express = require("express");
const router = express.Router();

const { getAllWorkouts, createWorkout, deleteWorkout, getSingleWorkout, updateWorkout, 
    changeFavourite, startWorkout, endWorkout, getCompany, deleteUserFromAccess, 
    deleteUserFromCompany, getAccess, addUserToAccess, addUserToCompany } = require("../controllers/workouts.js");

router.route("/").post(createWorkout).get(getAllWorkouts);
router.route("/:id").delete(deleteWorkout).get(getSingleWorkout).put(updateWorkout);
router.route("/:id/start").post(startWorkout);
router.route("/:id/end").post(endWorkout);
router.route("/:id/favourite").put(changeFavourite);
router.route("/:id/company").delete(deleteUserFromCompany).get(getCompany).post(addUserToCompany);
router.route("/:id/access").delete(deleteUserFromAccess).get(getAccess).post(addUserToAccess);

module.exports = router;
