const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  description: {
    type: String,
    required: [true, "Please provide description"],
    minlength: 10,
    maxlength: 500,
  },
});

module.exports = mongoose.model("Exercise", ExerciseSchema, "Exercises");
