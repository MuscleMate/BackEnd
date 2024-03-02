const { StatusCodes } = require("http-status-codes");

const notFound = (req, res) => {
  console.log("Not found middleware");
  res.status(StatusCodes.NOT_FOUND).send("Route does not exist");
};

module.exports = notFound;
