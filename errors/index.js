const CustomAPIError = require("./custom-error");
const UnauthenticatedError = require("./unauthenticated");
const BadRequestError = require("./bad-request");
const NotFoundError = require("./not-found");
const UnauthorizedError = require("./unauthorized");
const InternalServerError = require("./internal-server-error");

module.exports = {
  CustomAPIError,
  UnauthenticatedError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
};
