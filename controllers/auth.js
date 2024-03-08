const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const jwt = require('jsonwebtoken');


const maxAge = 3*24*60*60;
const createJWT = (id)=>{
  return jwt.sign({ id }, 'secret', {
    expiresIn: maxAge
  });
};

const register = async (req, res) => {

  const user = await User.create(req.body);
  const token = createJWT(user._id);
  res.cookie('jwt', token,{
    httpOnly: true,
    maxAge: maxAge * 1000
  });

  res.status(StatusCodes.OK).json({user: user._id}); 
};

const login = async (req, res) => {
  const {email, password} = req.body;

  const user = await User.login(email, password);
  res.status(StatusCodes.OK).json({user:user._id});
};

module.exports = { register, login };
