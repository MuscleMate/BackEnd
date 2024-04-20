const mongoose = require('mongoose');
const { dbReadOnly } = require("../database/connect");

const ExercisesListSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    type: {
        type: String
    },
    difficulty: {
        type: String
    }
});

module.exports = dbReadOnly.model("ExercisesList", ExercisesListSchema, "ExercisesList");