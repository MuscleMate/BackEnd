const express = require('express');
const router = express.Router();

const { getAllTournaments } = require("../controllers/noauthTournaments.js");

// GET route to retrieve tournaments data for a specified user
router.route("/").get(getAllTournaments);

module.exports = router;