const express = require('express');
const router = express.Router();

const tournaments = require("../controllers/tournaments.js");

// GET route to retrieve tournaments data for a specified user
router.route("/tournaments/:userID").get(tournaments);

module.exports = router;