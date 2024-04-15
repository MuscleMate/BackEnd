const express = require('express');
const router = express.Router();

const { getFriends,sendRequest, addFriend, searchUser, denyFriend, deleteFriend, cancelFriend } = require("../controllers/friends.js");

router.route("/").get(getFriends);
router.route("/send-request").post(sendRequest);
router.route("/accept").post(addFriend)
router.route("/search").post(searchUser);
router.route("/cancel").post(cancelFriend);
router.route("/deny").post(denyFriend);
router.route("/delete").delete(deleteFriend);

module.exports = router;
