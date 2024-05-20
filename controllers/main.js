const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { NotFoundError, InternalServerError } = require("../errors");
const calculateRP = require('../utils/calculateRP');

const getMain = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate("challenges").select("-_id challenges RP suplements weightHistory").lean();

        if (!user) {
            throw new NotFoundError(`User with ID ${userID} not found`);
        }

        for (let i = 0; i < user.challenges.length; i++) {
            const challenge = user.challenges[i];
            const { _id, title, endDate, difficulty } = challenge;
            const timeToEnd = Math.floor((endDate - Date.now()) / (1000 * 60 * 60 * 24)); // Time to end in days
            const exp = await calculateRP(userID, "challenge" + difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
            user.challenges[i] = { _id, title, timeToEnd, exp };
        }

        res.status(StatusCodes.OK).json(user);
    } catch (err) {
        throw new InternalServerError(err.message);
    }
}

module.exports = {
    getMain,
}