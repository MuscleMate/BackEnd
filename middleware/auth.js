const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");
require("dotenv").config();
const Token = require("../models/Token");

const requireAuth = async(req, res, next) => {
  const token = req.cookies.jwt;

  

  if (!token) {
    throw new UnauthenticatedError("Unauthorized access");
  }

  try {
    const { userID } = jwt.verify(token, process.env.JWT_SECRET);

    const tokens = await Token.find({ user: userID });

    if (tokens.length === 0) {
      throw new UnauthenticatedError("Unauthorized access");
    }

    const tokenExists = tokens.some(async tokenDoc => {
      return await tokenDoc.compareTokens(token);
    });

    if (!tokenExists) {
      throw new UnauthenticatedError("Unauthorized access");
    }

    req.body.user = userID;
    next();
  } catch (error) {
    throw new UnauthenticatedError("Unauthorized access");
  }
};

module.exports = { requireAuth };
