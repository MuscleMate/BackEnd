const express = require('express');
const router = express.Router();

const { getFriends ,addFriend} = require("../controllers/friends.js");


router.route("/").get(getFriends);
router.route("/accept").post(addFriend)

module.exports = router;