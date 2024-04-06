const express = require('express');
const router = express.Router();

const { getFriends,sendRequest, addFriend } = require("../controllers/friends.js");

router.route("/").get(getFriends);
router.route("/send-request").post(sendRequest);
router.route("/accept").post(addFriend)

module.exports = router;
