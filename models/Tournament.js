const mongoose = require("mongoose");
const { db } = require("../database/connect");

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
  startDate: {
    type: Date,
    required: [true, "Please provide start date"],
  },
  endDate: {
    type: Date,
    required: [true, "Please provide end date"],
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  contestants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  determinant: {
    type: String,
    enum: ["workouts", "time", "weight"],
    required: [true, "Please provide determinant"],
  },
  ranking: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      score: {
        type: Number,
        default: 0,
      },
    },
  ],
}, { timestamps: true });

module.exports = db.model("Tournament", TournamentSchema, "Tournaments");
