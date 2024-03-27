const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const Token = require("../models/Token");
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

  const tokenValue = createJWT(user._id);
  attachCookies(res, tokenValue);
  user.save();

  const token = new Token({ token: tokenValue, user: user._id });
  await token.save();

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

  // TODO 
  // check if valid token do not create

  const tokenValue = createJWT(user._id);
  attachCookies(res, tokenValue);
  user.save();

  const token = new Token({ token: tokenValue, user: user._id });
  await token.save();

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

  const tokenValue = req.cookies.jwt;

  if(!tokenValue){
    throw new BadRequestError("You are already log out");
  }

  const tokens = await Token.find();
  for (const token of tokens) {
    const isMatch = await token.compareTokens(tokenValue);
    if (isMatch) {
      await Token.deleteOne({ _id: token._id });
    }
  }

  res.status(StatusCodes.OK).json({ message: "Logged out" });
};

/** Resets user password
 * @url POST /auth/reset-password
 * @body new password
 * @response password change message
 * @cookies jwt
 */
const reset_password = async (req,res)=>{
  const { user, password} = req.body;

  if (!password) {
    throw new BadRequestError("Please provide new password");
  }

  const userRet = await User.findById(user);
  if (!userRet){
    throw new BadRequestError("User not found");
  }

  userRet.password = password;

  const tokens = await Token.find({ user: user });
  if(tokens.length != 0){
    await Token.deleteMany({ user: user });
  }

  userRet.save();

  res.cookie("jwt", "", {
    maxAge: 1,
  });
  res.status(StatusCodes.OK).json({ message: "Password has been changed" });
};

module.exports = { register, login, logout, reset_password };
