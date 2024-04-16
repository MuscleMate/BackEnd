const express = require('express');
const router = express.Router();

const { getTournaments, createTournament, updateTournament, updateTournamentRole, addUsersToTournament,
    getSingleTournament, deleteTournament, deleteUserFromTournament } = require("../controllers/tournaments.js");

// GET route to retrieve tournaments data for a specified user
router.route("/").get(getTournaments).post(createTournament);
router.route("/:tournamentID").put(updateTournament).get(getSingleTournament).delete(deleteTournament);
router.route("/:tournamentID/user/:userID").put(addUsersToTournament).delete(deleteUserFromTournament);
router.route("/:tournamentID/user/:userID/role").put(updateTournamentRole);

module.exports = router;