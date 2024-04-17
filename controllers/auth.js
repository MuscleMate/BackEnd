const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const Token = require("../models/Token");
const { createJWT, attachCookies, isJWTValid } = require("../utils/JWT");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const jwt = require("jsonwebtoken");
const sendEmail= require("../utils/sendEmail");
const { resetPasswordTemplate } = require("../utils/emailTemaplates");

/** Registers a new user
 * @url POST /auth/register
 * @body email, firstName, password
 * @response user id
 * @cookies jwt
 */
const register = async (req, res) => {
  const { email, firstName, password, weight, height, suplements } = req.body;
  req.body.weightHistory = weight && { weight: weight }
  req.body.heightHistory = height && { height: height }
  req.body.suplements = suplements && {
    name: suplements.name,
    status: suplements.status,
    history: [
      {
        dose: suplements.dose,
        frequency: suplements.frequency,
        frequencyUnit: suplements.frequencyUnit
      }
    ]
  }

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

  await Token.create({ token: tokenValue, user: user._id });

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
  // check if valid token, do not create

  const tokenValue = createJWT(user._id);
  attachCookies(res, tokenValue);
  user.save();

  await Token.create({ token: tokenValue, user: user._id });

  res.status(StatusCodes.OK).json({ user: user._id });
};

/** Logs out a user
 * @url POST /auth/logout
 * @response log out message
 */
const logout = async (req, res) => {
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

  res.cookie("jwt", "", {
    maxAge: 1,
  });
  res.status(StatusCodes.OK).json({ message: "Logged out" });
};

/** Resets user password
 * @url POST /auth/reset-password
 * @body new password
 * @response password change message
 * @cookies jwt
 */
const reset_password = async (req, res) => {
  const { user, password } = req.body;

  if (!password) {
    throw new BadRequestError("Please provide new password");
  }

  const userRet = await User.findById(user);
  if (!userRet) {
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

/** Sends reset password mail
 * @url POST /auth/reset-password
 * @body email
 * @response email sent message
 */
const forgot_password = async (req,res) => {
  const { email } = req.body;

  if(!email){
    throw new BadRequestError("Please provide email");
  }

  const user = await User.findOne({email: email});
  if(!user){
    throw new BadRequestError("User with provided email does not exists");
  }

  const tokenValue = jwt.sign({ payload: user._id}, process.env.JWT_SECRET, {
    expiresIn: 3600, // 1 h
  });
  const currentDate = new Date();
  const earlierDate = new Date(currentDate.getTime() - (71 * 60 * 60 * 1000)); // Date 2 days and 23h eariler

  const token = await Token.create({ token: tokenValue, user: user._id, expireAt: earlierDate });
  const link = `${process.env.PROTO}://${process.env.BASE_URL}:${process.env.PORT}/auth/password/forgot/${tokenValue}`;
  await sendEmail(email, 'Zmiana hasła', resetPasswordTemplate(user.firstName, link));

  res.status(StatusCodes.OK).json({ message: "Reset link was sent to email" });
}

/** Resets user password
 * @url POST /auth/reset-password
 * @body new password
 * @response password changed
 */
const forgot_password_reset = async (req,res) => {
  const tokenParam = req.params.token;
  const password = req.body.password;

  if(!tokenParam){
    throw new BadRequestError("Please provide reset token");
  }
  if(!password){
    throw new BadRequestError("Please provide password");
  }

  if(!isJWTValid(tokenParam)){
    throw new UnauthenticatedError("Token is invalid");
  }

  const tokens = await Token.find();
  let userID;
  for (const token of tokens) {
    const isMatch = await token.compareTokens(tokenParam);
    if (isMatch) {
      userID = token.user;
    }
  }

  if(!userID){
    throw new BadRequestError("User does not exists");
  }

  const user = await User.findById(userID);
  user.password = password;
  await user.save();

  await Token.deleteMany({ user: userID });

  res.status(StatusCodes.OK).json({ message: "Password has been changed" });
}

module.exports = { register, login, logout, reset_password, forgot_password, forgot_password_reset };
