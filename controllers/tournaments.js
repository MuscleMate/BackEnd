const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.js");

const getTournaments = async (req, res) => {
    try {
        const user = await User.findById(req.query.userID);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }
        res.status(StatusCodes.OK).json(user.tournaments);
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to retrieve tournaments' });
    }
};

module.exports = {
    getTournaments,
};