const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");

const getTournaments = async (req, res) => {
    try {
        const user = await User.findById(req.body.user);

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }
        res.status(StatusCodes.OK).json({ tournaments: user.tournaments });

    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
};

module.exports = {
    getTournaments,
};