const express = require('express');
const router = express.Router();

const {getTournaments} = require("../controllers/tournaments.js");

// GET route to retrieve tournaments data for a specified user
router.route("/").get(getTournaments);

module.exports = router;