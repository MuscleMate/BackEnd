const express = require('express');
const router = express.Router();

const { getChallenges, replaceChallenge } = require("../controllers/challenges.js");

router.route("/").get(getChallenges).post(replaceChallenge);

module.exports = router;