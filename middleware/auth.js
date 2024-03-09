const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");
require("dotenv").config();

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    throw new UnauthenticatedError("Unauthorized access");
  }

  try {
    const { userID } = jwt.verify(token, process.env.JWT_SECRET);
    req.body.user = userID;
    next();
  } catch (error) {
    throw new UnauthenticatedError("Unauthorized access");
  }
};

module.exports = { requireAuth };
