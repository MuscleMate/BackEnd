const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { maxAge } = require("../utils/JWT");

const TokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expireAt: {
      type: Date,
      expires: maxAge,
      default: Date.now
    }
});

TokenSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt();
    if (this.isModified("token")) {
      this.token = await bcrypt.hash(this.token, salt);
    }
  
    next();
});

TokenSchema.methods.compareTokens = async function (tokenValue) {
  const isCorrect = await bcrypt.compare(tokenValue, this.token);
  return isCorrect;
};


module.exports = mongoose.model("Token", TokenSchema, "Tokens");