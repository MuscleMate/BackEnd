const { BadRequestError } = require("../errors");
const User = require("../models/User");

/** Sends a notification to a user
 * @param {string[]} receivers - the ids of the users who will receive the notification
 * @param {string} message - the message of the notification
 */
const sendNotification = async (receivers, message) => {
   
  try {
    receivers.forEach(async (receiverID) => {
      const receiver = User.findById(receiverID);
      if (!receiver) {
        throw BadRequestError(`User with id ${receiverID} not found`);
      }
      await receiver.updateOne({ $push: { notifications: { message } } });
    })
  } catch (err) {
    throw new BadRequestError(err);
  }
};

module.exports = sendNotification;
