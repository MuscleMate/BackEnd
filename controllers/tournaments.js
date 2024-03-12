const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const Tournament = require("../models/Tournament");

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

const createTournament = async (req, res) => {
    try {
        const user = await User.findById(req.body.user);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        req.body.admins = [...(req.body.admins.filter((id) => id != user._id)), user._id]
        const tournament = await Tournament.create(req.body)

        await user.updateOne({ $push: { tournaments: tournament._id } });

        res.status(StatusCodes.CREATED).json({ tournamentID: tournament._id });
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

module.exports = {
    getTournaments,
    createTournament
};