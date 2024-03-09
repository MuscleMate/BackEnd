const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  description: {
    type: String,
    minlength: 10,
    maxlength: 500,
  },
  date: {
    type: Date,
    required: [true, "Please provide date"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  duration: {
    type: Number,
    required: [true, "Please provide duration"],
    min: 1,
    max: 120,
  },
});

module.exports = mongoose.model("Tournament", TournamentSchema, "Tournament");
