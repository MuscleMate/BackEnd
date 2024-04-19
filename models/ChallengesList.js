const mongoose = require("mongoose");
const { dbReadOnly } = require("../database/connect");

const ChallengesListSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    goal: {
        type: String,
    },
    target: {
        type: Number,
    },
    duration: {
        type: Number,
    },
    difficulty: {
        type: String,
    },
});

module.exports = dbReadOnly.model("ChallengesList", ChallengesListSchema, "ChallengesList");