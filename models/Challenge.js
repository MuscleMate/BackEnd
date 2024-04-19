const mongoose = require('mongoose');
const { db } = require("../database/connect");

const ChallengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        default: Date.now,
    },
    duration: {
        type: Number,
        required: [true, 'Please provide a duration']
    },
    goal: {
        type: String,
        required: [true, 'Please provide a goal']
    },
    target: {
        type: Number,
        required: [true, 'Please provide a target']
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: [true, 'Please provide a dificulty']
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing'
    },
});

ChallengeSchema.pre("save", async function (next) {
    this.endDate = new Date(this.startDate.getTime() + this.duration * 24 * 60 * 60 * 1000);
  
    next();
});

module.exports = db.model("Challenge", ChallengeSchema, "Challenges");