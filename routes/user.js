const express = require('express');
const router = express.Router();

const { getFriends } = require("../controllers/user.js");


router.route("/friends").get(getFriends);

module.exports = router;