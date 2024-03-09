const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");

const getTournaments = async (req, res) => {
    try {
        const user = await User.findById(req.body.user);

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }
        const tournaments = await user.populate("tournaments");
        res.status(StatusCodes.OK).json({ tournaments: tournaments.tournaments });
        res.status(StatusCodes.OK).json({});

    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to retrieve tournaments' });
    }
};

module.exports = {
    getTournaments,
};