const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide email"],
    lowercase: true,
    validate: [validator.isEmail, "Please provide valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
    maxlength: 64, // for hashing algorithms
  },
  firstName: {
    type: String,
    required: [true, "Please provide first name"],
    minlength: 3,
    maxlength: 50,
  },
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  dateOfBirth: {
    type: Date,
  },
  height: {
    type: Number,
    min: 1,
    max: 250,
  },
  weight: {
    type: Number,
    min: 1,
    max: 250,
  },
  gender: {
    type: "String",
    enum: ["male", "female", "other"],
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  workouts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
    },
  ],
  tournaments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
  ],
  receivedFriendsRequests: [
    {
     type: mongoose.Schema.Types.ObjectId,
     ref: "User" 
    }
  ],
  sendedFriendsRequests: [
    {
     type: mongoose.Schema.Types.ObjectId,
     ref: "User" 
    }
  ]
});

UserSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePasswords = async function (password) {
  const isCorrect = await bcrypt.compare(password, this.password);
  return isCorrect;
};

module.exports = mongoose.model("User", UserSchema, "Users");
