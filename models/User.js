const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcrypt');
const UnauthenticatedError = require('../errors/unauthenticated');

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
    lowercase: true,
    validate: [validator.isEmail,"Please provide valid email"]
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
});

// The function is fired before saving user to the database
UserSchema.pre('save', async function(next){
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.statics.login = async function(email, password){
  const user = await this.findOne({email});
  if (user){
    const auth = await bcrypt.compare(password, user.password);
    if(auth){
      return user;
    }
  }
  throw new UnauthenticatedError('Incorrect login credentials');
}

module.exports = mongoose.model("User", UserSchema);
