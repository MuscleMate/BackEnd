const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const Tournament = require("../models/Tournament");
const sendNotification = require("../utils/sendNotification");

const getTournaments = async (req, res) => {
    try {
        const user = await User.findById(req.body.user).populate({
            path: 'tournaments',
            populate: [
                {
                    path: 'admins',
                    model: 'User'
                },
                {
                    path: 'contestants',
                    model: 'User'
                }
            ]
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(StatusCodes.OK).json({ tournaments: user.tournaments });

    } catch (error) {
        throw new BadRequestError(error.message);
    }
};

const createTournament = async (req, res) => {
    try {
        const user = await User.findById(req.body.user);
        
        if (!user) {
            throw new NotFoundError('User not found');
        }
        
        if (req.body.admins.indexOf(user._id.toString()) === -1) {
            throw new BadRequestError('Admins array should contain the user creating the tournament');
        }

        const tournament = await Tournament.create(req.body)

        await user.updateOne({ $push: { tournaments: tournament._id } });

        res.status(StatusCodes.CREATED).json({ tournamentID: tournament._id });
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

const updateTournament = async (req, res) => {
    const { id } = req.params;
    let { admins, contestants } = req.body;

    if (Object.keys(req.body).length === 1) {
        throw new BadRequestError('Provide data to update');
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${id}`);
    }

    const user = await User.findById(req.body.user);
    if (tournament.admins.indexOf(user._id) === -1) {
        throw new NotFoundError('User not authorized to update this tournament');
    }

    // add the tournamentID to tournaments array of the admins
    if (admins?.length) {
        for (let i = 0; i < admins.length; i++) {
            const admin = await User.findById(admins[i]);
            if (!admin) {
                throw new NotFoundError('Admin you are trying to add does not exist');
            }
            if (!admin.tournaments.includes(tournament._id)) {
                await admin.updateOne({ $push: { tournaments: tournament._id } });
            }
        }
    }

    // add the tournamentID to tournaments array of the contestants
    if (contestants?.length) {
        for (let i = 0; i < contestants.length; i++) {
            const contestant = await User.findById(contestants[i]);
            if (!contestant) {
                throw new NotFoundError('Contestant you are trying to add does not exist');
            }
            if (!contestant.tournaments.includes(tournament._id)) {
                await contestant.updateOne({ $push: { tournaments: tournament._id } });
            }
        }
    }

    try {
        await tournament.updateOne(req.body)
    } catch (error) {
        throw new BadRequestError(error.message);
    }

    res.status(StatusCodes.OK).json({ msg: "Tournament updated" });
}

const updateTournamentRole = async (req, res) => {
    const { id } = req.params;
    const { user, role, userToBeChanged } = req.body;

    if (!user || !role || !userToBeChanged) {
        throw new BadRequestError('Provide role and userToBeChanged');
    }

    if (role !== 'admin' && role !== 'contestant') {
        throw new BadRequestError('Invalid role');
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${id}`);
    }

    const admin = await User.findById(user);
    if (!admin) {
        throw new NotFoundError(`No user found with id: ${user}`);
    }
    if (tournament.admins.indexOf(admin._id) === -1) {
        throw new NotFoundError('User not authorized to update this tournament');
    }

    const userToBeChangedDoc = await User.findOne({ _id: userToBeChanged });
    if (!userToBeChangedDoc) {
        throw new NotFoundError(`No user found with id: ${userToBeChanged}`);
    }
    if (userToBeChangedDoc.tournaments.indexOf(tournament._id) === -1) {
        throw new NotFoundError('User is not part of the tournament');
    }
    if (role === 'admin') {
        if (tournament.admins.indexOf(userToBeChangedDoc._id) === -1) {
            await tournament.updateOne({ $push: { admins: userToBeChangedDoc._id } });
            await tournament.updateOne({ $pull: { contestants: userToBeChangedDoc._id } });
        } else {
            throw new BadRequestError('User is already an admin');
        }
    }
    if (role === 'contestant') {
        if (tournament.contestants.indexOf(userToBeChangedDoc._id) === -1) {
            await tournament.updateOne({ $push: { contestants: userToBeChangedDoc._id } });
            await tournament.updateOne({ $pull: { admins: userToBeChangedDoc._id } });
        } else {
            throw new BadRequestError('User is already a contestant');
        }
    }

    res.status(StatusCodes.NO_CONTENT).json({ msg: "OK" });
}

const addUsersToTournament = async (req, res) => {
    const { id } = req.params;
    const { user, role, userToBeAdded } = req.body;

    if (!user || !role || !userToBeAdded) {
        throw new BadRequestError('Provide role and userToBeAdded fields');
    }

    if (role !== 'admin' && role !== 'contestant') {
        throw new BadRequestError('Invalid role');
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${id}`);
    }

    const admin = await User.findById(user);
    if (!admin) {
        throw new NotFoundError(`No user found with id: ${user}`);
    }
    if (tournament.admins.indexOf(admin._id) === -1) {
        throw new NotFoundError('User not authorized to update this tournament');
    }

    const userTBA = await User.findOne({ _id: userToBeAdded });
    if (!userTBA) {
        throw new NotFoundError(`No user found with id: ${userToBeAdded}`);
    }
    if (userTBA.tournaments.includes(tournament._id)) {
        throw new NotFoundError('User is already part of the tournament');
    }

    try {
        if (role === 'admin') {
            await tournament.updateOne({ $push: { admins: userTBA._id } });
            await userTBA.updateOne({ $push: { tournaments: tournament._id } });
        }
        if (role === 'contestant') {
            await tournament.updateOne({ $push: { contestants: userTBA._id } });
            await userTBA.updateOne({ $push: { tournaments: tournament._id } });
        }
        await sendNotification(user, userToBeAdded, `You have been added to the tournament ${tournament.name}`);
        res.status(StatusCodes.NO_CONTENT).json({ msg: "OK" });

    } catch (err) {
        throw new BadRequestError(err.message);
    }

}


module.exports = {
    getTournaments,
    createTournament,
    updateTournament,
    updateTournamentRole,
    addUsersToTournament
};