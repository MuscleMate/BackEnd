const mongoose = require("mongoose");
//const validator = require("validate");

const UserSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide email"],
   //validate: {
   //  validator: validator.isEmail,
   //  message: "Please provide valid email",
   //},
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
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
});

module.exports = mongoose.model("User", UserSchema, 'User');
