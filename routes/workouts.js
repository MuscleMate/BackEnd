const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.js");

const { add_workout } = require("../controllers/workouts.js");

router.post("/", requireAuth, add_workout);

module.exports = router;
