const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { createJWT, attachCookies } = require("../utils/JWT");
const { BadRequestError } = require("../errors");

/** Registers a new user
 * @url POST /auth/register
 * @body email, firstName, password
 * @response user id
 * @cookies jwt
 */
const register = async (req, res) => {
  const { email, firstName, password } = req.body;

  if (!email || !password || !firstName) {
    throw new BadRequestError("Please provide email, firstName and password");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new BadRequestError(`User with email ${email} already exists`);
  }

  const user = await User.create(req.body);

  const token = createJWT(user._id);
  attachCookies(res, token);

  res.status(StatusCodes.CREATED).json({ user: user._id });
};

/** Logs in a user
 * @url POST /auth/login
 * @body email, password
 * @response user id
 * @cookies jwt
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError(`User with email ${email} does not exists`);
  }

  const isPasswordCorrect = await user.comparePasswords(password);
  if (!isPasswordCorrect) {
    throw new BadRequestError("Invalid credentials");
  }

  const token = createJWT(user._id);
  attachCookies(res, token);

  res.status(StatusCodes.OK).json({ user: user._id });
};

/** Logs out a user
 * @url POST /auth/logout
 * @response log out message
 */
const logout = async (req, res) => {
  res.cookie("jwt", "", {
    maxAge: 1,
  });
  res.status(StatusCodes.OK).json({ message: "Logged out" });
};

/** Resets user password
 * @url POST /auth/reset-password
 * @body email, new password
 * @response password change message
 * @cookies jwt
 */
const reset_pass = async (req,res)=>{
  const { user, password} = req.body;

  if (!password) {
    throw new BadRequestError("Please provide new password");
  }

  const userRet = await User.findById(user);
  if (!userRet){
    throw new BadRequestError("User not found");
  }

  userRet.password = password;

  userRet.save();
  res.status(StatusCodes.OK).json({ message: "Password has been changed" });
};

module.exports = { register, login, logout, reset_pass };
