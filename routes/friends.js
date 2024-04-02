const express = require('express');
const router = express.Router();

const { getFriends,sendReqeust } = require("../controllers/friends.js");

router.route("/").get(getFriends);
router.route("/send-request").post(sendReqeust);

module.exports = router;