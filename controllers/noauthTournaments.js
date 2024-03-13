const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const Tournament = require("../models/Tournament");

const getAllTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find({}).populate(['admins', 'contestants']);

        res.status(StatusCodes.OK).json({ tournaments: tournaments });

    } catch (error) {
        throw new BadRequestError(error.message);
    }
};

module.exports = {
    getAllTournaments,
};