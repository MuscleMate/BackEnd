const express = require('express');
const router = express.Router();

const { getMain } = require("../controllers/main.js");

router.route("/").get(getMain);

module.exports = router;