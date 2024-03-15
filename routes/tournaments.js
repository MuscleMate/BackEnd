const express = require('express');
const router = express.Router();

const { getTournaments, createTournament, updateTournament, updateTournamentRole, addUsersToTournament , deleteTournament} = require("../controllers/tournaments.js");

// GET route to retrieve tournaments data for a specified user
router.route("/").get(getTournaments).post(createTournament);
router.route("/:id").put(updateTournament);
router.route("/:id/role").put(updateTournamentRole);
router.route("/:id/users").put(addUsersToTournament);
router.route("/:id/users").delete(deleteTournament);

module.exports = router;