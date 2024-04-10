const { BadRequestError } = require("../errors");
const User = require("../models/User");

const sendNotification = async (senderID, receiverID, message) => {
  const sender = User.findById(senderID);
  if (!sender) {
    throw BadRequestError(`User with id ${senderID} not found`);
  }

  const receiver = User.findById(receiverID);
  if (!receiver) {
    throw BadRequestError(`User with id ${receiverID} not found`);
  }

  const date = new Date();
  
  await receiver.updateOne({ $push: { notifications: { senderID, message, date } } });
};

module.exports = sendNotification;
