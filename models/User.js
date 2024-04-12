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
  weightHistory: [
    {
      weight: {
        type: Number,
        min: 1,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  gender: {
    type: "String",
    enum: ["male", "female", "other"],
  },
  RP: {
    level: {
      type: Number,
      min: 1,
      default: 1,
    },
    levelPoints: {
      type: Number,
      min: 0,
      default: 0,
    },
    levelPointsLimit: {
      type: Number,
      min: 0,
      default: 100,
    }
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  receivedFriendsRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  sentFriendsRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
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
  suplements: [
    {
      name: {
        type: String,
        required: [true, "Please provide name of the suplement"],
      },
      amount: {
        type: Number,
        required: [true, "Please provide amount of the suplement"],
      },
    }
  ],
  notifications: [
    {
      senderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      receiverID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      isRead: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

UserSchema.index({ email: "text", firstName: "text", lastName: "text" });

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
