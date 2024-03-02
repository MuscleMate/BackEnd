const { StatusCodes } = require("http-status-codes");

const register = async (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Register route" });
};

const login = async (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Login route" });
};

module.exports = { register, login };
