const express = require('express');
const router = express.Router();

const { getFriends,sendRequest, addFriend, searchUser , deleteFriend} = require("../controllers/friends.js");

router.route("/").get(getFriends);
router.route("/send-request").post(sendRequest);
router.route("/accept").post(addFriend)
router.route("/search").post(searchUser);
router.route("/delete").post(deleteFriend);

module.exports = router;
