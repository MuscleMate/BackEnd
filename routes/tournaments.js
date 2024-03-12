const express = require('express');
const router = express.Router();

const { getTournaments, createTournament, updateTournament } = require("../controllers/tournaments.js");

// GET route to retrieve tournaments data for a specified user
router.route("/").get(getTournaments).post(createTournament);
router.route("/:id").put(updateTournament);

module.exports = router;