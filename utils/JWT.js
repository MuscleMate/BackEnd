const jwt = require("jsonwebtoken");
require("dotenv").config();

const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds

/** Creates JWT token
 * @param {string} id - user id
 * @returns {string} - JWT token
 */
const createJWT = (userID) => {
  return jwt.sign({ userID }, process.env.JWT_SECRET, {
    expiresIn: maxAge, // 3 days
  });
};

/** Attaches JWT token to cookies
 * @param {object} res - response object
 * @param {string} token - JWT token
 */
const attachCookies = (res, token) => {
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: maxAge * 1000, // in milliseconds
  });
};

/** Checks if JWT token is valid
 * @param {string} token - JWT token
 * @returns {string} - JWT token
 */
const isJWTValid = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { createJWT, isJWTValid, attachCookies };
