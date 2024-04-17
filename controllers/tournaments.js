const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../errors");
const Tournament = require("../models/Tournament");
const sendNotification = require("../utils/sendNotification");

const getTournaments = async (req, res) => {
    try {
        const user = await User.findById(req.body.user).populate({
            path: 'tournaments',
            populate: [
                {
                    path: 'admins',
                    model: 'User',
                    select: '_id firstName lastName email RP.level'
                },
                {
                    path: 'contestants',
                    model: 'User',
                    select: '_id firstName lastName email RP.level'
                }
            ]
        })

        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(StatusCodes.OK).json({ count: user.tournaments.length, tournaments: user.tournaments });

    } catch (error) {
        throw new BadRequestError(error.message);
    }
};

const createTournament = async (req, res) => {
    const requiredFields = ['name', 'startDate', 'endDate', 'determinant'];

    if (requiredFields.some(field => !req.body[field])) {
        throw new BadRequestError(`Please provide all required fields: ${requiredFields.join(', ')}`);
    }

    req.body.admins = req.body.admins ? [...req.body.admins, req.body.user] : [req.body.user];
    req.body.contestants = req.body.contestants ?? [];
    req.body.admins = [...new Set(req.body.admins)];

    try {
        const user = await User.findById(req.body.user);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const allUsersIDs = [...req.body.admins, ...req.body.contestants]
        var allUsers = [];

        for (let i = 0; i < allUsersIDs.length; i++) {
            const user = await User.findById(allUsersIDs[i]);

            if (!user) {
                throw new NotFoundError('User you are trying to add does not exist');
            }

            allUsers.push(user);
        }

        const tournament = await Tournament.create(req.body)

        allUsers.forEach(async (user) => {
            if (!user.tournaments.includes(tournament._id)) {
                await user.updateOne({ $push: { tournaments: tournament._id } });
            }
        });
        tournament.admins.forEach(async (admin) => {
            if (admin._id.toString() !== user._id.toString()) {
                await sendNotification(user._id, admin, `You have been added as an admin to the tournament ${tournament.name}`);
            } else {
                await sendNotification(user._id, admin, `You have created the tournament ${tournament.name}`);
            }
        });

        tournament.contestants.forEach(async (contestant) => {
            await sendNotification(user._id, contestant, `You have been added as a contestant to the tournament ${tournament.name}`);
        });

        await tournament.populate([{
            path: 'admins',
            model: 'User',
            select: '_id firstName lastName email RP.level'
        }, {
            path: 'contestants',
            model: 'User',
            select: '_id firstName lastName email RP.level'
        }])

        res.status(StatusCodes.CREATED).json(tournament);
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

const updateTournament = async (req, res) => {
    const { tournamentID } = req.params;
    let { admins, contestants, user: userId } = req.body;
    req.body.admins = undefined;
    req.body.contestants = undefined;

    if (Object.keys(req.body).length === 1) {
        throw new BadRequestError('Provide data to update');
    }

    const tournament = await Tournament.findById(tournamentID);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${tournamentID}`);
    }

    const user = await User.findById(userId);
    if (tournament.admins.indexOf(user._id) === -1) {
        throw new UnauthorizedError('User not authorized to update this tournament');
    }

    // add the tournamentID to tournaments array of the admins
    if (admins?.length > 0) {
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
    if (contestants?.length > 0) {
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
        await tournament.updateOne({ $pull: { admins: { $in: admins } } });
        await tournament.updateOne({ $pull: { contestants: { $in: contestants } } });

        await tournament.updateOne(req.body)
    } catch (error) {
        throw new BadRequestError(error.message);
    }

    res.status(StatusCodes.OK).json({ msg: "Tournament updated" });
}

const updateTournamentRole = async (req, res) => {
    const { tournamentID, userID: userToBeChanged } = req.params;
    const { user, role } = req.body;

    if (!user || !role || !userToBeChanged) {
        throw new BadRequestError('Provide role and userToBeChanged');
    }

    if (role !== 'admin' && role !== 'contestant') {
        throw new BadRequestError('Invalid role');
    }

    const tournament = await Tournament.findById(tournamentID);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${tournamentID}`);
    }

    const admin = await User.findById(user);
    if (!admin) {
        throw new NotFoundError(`No user found with id: ${user}`);
    }
    if (tournament.admins.indexOf(admin._id) === -1) {
        throw new UnauthorizedError('User not authorized to update this tournament');
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

    res.status(StatusCodes.OK).json({ msg: "User role changed" });
}

const addUsersToTournament = async (req, res) => {
    const { tournamentID, userID: userToBeAdded } = req.params;
    const { user, role } = req.body;

    if (!user || !role || !userToBeAdded) {
        throw new BadRequestError('Provide role and userToBeAdded fields');
    }

    if (role !== 'admin' && role !== 'contestant') {
        throw new BadRequestError('Invalid role');
    }

    const tournament = await Tournament.findById(tournamentID);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${tournamentID}`);
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
        res.status(StatusCodes.OK).json({ msg: "User added" });

    } catch (err) {
        throw new BadRequestError(err.message);
    }

}

const getSingleTournament = async (req, res) => {
    const { tournamentID } = req.params;
    const { user: userID } = req.body;
    const user = await User.findById(userID);
    if (!user) {
        throw new NotFoundError('User does not exist');
    }
    const tournament = await Tournament.findById(tournamentID)
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${tournamentID}`);
    }
    if (tournament.contestants.indexOf(userID) === -1 && tournament.admins.indexOf(userID) === -1) {
        throw new UnauthorizedError('User not authorized to get info about this tournament');
    }
    await tournament.populate([
        {
            path: 'admins',
            model: 'User',
            select: '_id firstName lastName email RP.level'
        },
        {
            path: 'contestants',
            model: 'User',
            select: '_id firstName lastName email RP.level'
        }
    ]);
    try {
        res.status(StatusCodes.OK).json({ tournament });
    }
    catch (error) {
        throw new BadRequestError(error.message);
    }
}

const deleteTournament = async (req, res) => {
    const { tournamentID } = req.params;
    const { user: userID } = req.body;
    const user = await User.findById(userID);
    if (!user) {
        throw new NotFoundError('User does not exist');
    }

    const tournament = await Tournament.findById(tournamentID);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${tournamentID}`);
    }

    if (tournament.admins.indexOf(userID) === -1) {
        throw new UnauthorizedError('User not authorized to delete this tournament');
    }

    try {
        for (let i = 0; i < tournament.admins.length; i++) {
            const admin = await User.findById(tournament.admins[i]);
            await admin.updateOne({ $pull: { tournaments: tournament._id } });
        }
        for (let i = 0; i < tournament.contestants.length; i++) {
            const contestant = await User.findById(tournament.contestants[i]);
            await contestant.updateOne({ $pull: { tournaments: tournament._id } });
        }
        await tournament.deleteOne();
        res.status(StatusCodes.OK).json({ msg: "Tournament deleted" });
    }
    catch (error) {
        throw new BadRequestError(error.message);
    }
}

const deleteUserFromTournament = async (req, res) => {
    const { tournamentID, userID: userToBeDeleted } = req.params;
    const { user: userID} = req.body;

    const user = await User.findById(userID);
    if (!user) {
        throw new NotFoundError('User does not exist');
    }

    const userTBD = await User.findById(userToBeDeleted);
    if (!userToBeDeleted) {
        throw new NotFoundError('User to be deleted does not exist');
    }

    const tournament = await Tournament.findById(tournamentID);
    if (!tournament) {
        throw new NotFoundError(`No tournament with id : ${tournamentID}`);
    }

    if (tournament.admins.indexOf(userID) === -1) {
        throw new UnauthorizedError('User not authorized to delete this tournament');
    }

    if (tournament.admins.indexOf(userToBeDeleted) === -1 && tournament.contestants.indexOf(userToBeDeleted) === -1) {
        throw new NotFoundError('User is not part of the tournament');
    }

    try {
        if (tournament.admins.indexOf(userToBeDeleted) !== -1) {
            await tournament.updateOne({ $pull: { admins: userToBeDeleted } });
        }
        if (tournament.contestants.indexOf(userToBeDeleted) !== -1) {
            await tournament.updateOne({ $pull: { contestants: userToBeDeleted } });
        }
        await userTBD.updateOne({ $pull: { tournaments: tournament._id } });
        res.status(StatusCodes.OK).json({ msg: "User deleted from tournament" });
    }
    catch (error) {
        throw new BadRequestError(error.message);
    }
}


module.exports = {
    getTournaments,
    createTournament,
    updateTournament,
    updateTournamentRole,
    addUsersToTournament,
    getSingleTournament,
    deleteTournament, 
    deleteUserFromTournament
};