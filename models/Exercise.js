const mongoose = require("mongoose");
const { db } = require("../database/connect");

const ExerciseSchema = new mongoose.Schema({
  title: {
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
  type: {
    type: String,
    enum: ["Nogi", "Klatka piersiowa", "Plecy", "Ramiona", "Barki", "Core", "Całe ciało"]
  },
  difficulty: {
    type: String,
    enum: ['Łatwy', 'Średni', 'Zaawansowany'],
  },
  sets: {
    type: Number,
    min: 0,
    max: 1000,
    default: 0,
  },
  reps: {
    type: Number,
    min: 0,
    max: 10000,
    default: 0,
  },
  weight: {
    type: Number,
    min: 0,
    max: 1000000,
    default: 0,
  },
  duration: {
    type: Number,
    min: 0,
    max: 60 * 24 * 7 * 4,
    default: 0,
  }
});

module.exports = db.model("Exercise", ExerciseSchema, "Exercises");
