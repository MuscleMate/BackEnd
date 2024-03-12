const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide title"],
    minlength: 3,
    maxlength: 50,
  },
  description: {
    type: String,
    required: [true, "Please provide description"],
    minlength: 10,
    maxlength: 500,
  },
  duration: {
    type: Number,
    required: [true, "Please provide duration"],
    min: 1,
    max: 120,
  },
  date: {
    type: Date,
    required: [true, "Please provide date"],
  },
  exercises: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Please provide user"],
  },
  equipment: [
    {
      type: String,
      minlength: 3,
      maxlength: 50,
    },
  ],
  company: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  favourite: {
    type: Boolean,
    default: false,
  },
  access: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Workout", WorkoutSchema, "Workouts");
