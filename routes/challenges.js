const express = require('express');
const router = express.Router();

const { getChallenges, replaceChallenge, getSingleChallenge } = require("../controllers/challenges.js");

router.route("/").get(getChallenges)
router.route("/:challengeID").get(getSingleChallenge).put(replaceChallenge);

module.exports = router;