const express = require('express');
const router = express.Router();

const { getFriends,sendRequest, addFriend, denyFriend, deleteFriend, cancelFriend, getReceivedRequests, getSentRequests } = require("../controllers/friends.js");

router.route("/").get(getFriends);
router.route("/delete").delete(deleteFriend);
router.route("/request/received").get(getReceivedRequests);
router.route("/request/sent").get(getSentRequests);
router.route("/request/send").post(sendRequest)
router.route("/request/accept").post(addFriend)
router.route("/request/cancel").post(cancelFriend);
router.route("/request/deny").post(denyFriend);

module.exports = router;
