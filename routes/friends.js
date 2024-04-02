const express = require('express');
const router = express.Router();

const { getFriends } = require("../controllers/friends.js");


router.route("/").get(getFriends);

module.exports = router;