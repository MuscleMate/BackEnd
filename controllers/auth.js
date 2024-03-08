const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const jwt = require('jsonwebtoken');

// cookie lifetime in seconds
const maxAge = 3*24*60*60;

const createJWT = (id)=>{
  // i dont know where to put the secret string
  // so for now i just type literals
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
  const token = createJWT(user._id);
  res.cookie('jwt', token,{
    httpOnly: true,
    maxAge: maxAge * 1000
  });
  res.status(StatusCodes.OK).json({user:user._id});
};

const logout = async (req, res) => {
  res.cookie('jwt', '',{
    maxAge: 1
  });
  res.status(StatusCodes.OK).json({message: 'Logged out'});
};

module.exports = { register, login, logout };
