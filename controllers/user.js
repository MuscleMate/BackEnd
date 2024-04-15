const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const User = require("../models/User");
const Workout = require("../models/Workout");
const Tournament = require("../models/Tournament");
const increaseRP = require("../utils/increaseRP");

const getUser = async (req, res) => {
    const { id } = req.params;
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const getUser = await User.findById(id)
            .populate("friends")
            .populate("workouts")
            .populate("tournaments")
            .populate("receivedFriendsRequests")
            .populate("sentFriendsRequests")
            .select(["-password", "-notifications"]);
        if (!getUser) {
            throw new NotFoundError(`User your are looking for does not exist`);
        }

        var fieldsToDelete = [];

        if (userID === id) {
            fieldsToDelete = [];
        } else if (getUser.friends.includes(userID)) {
            fieldsToDelete = ["receivedFriendsRequests", "sentFriendsRequests"];
        } else {
            fieldsToDelete = [
                "dateOfBirth",
                "height",
                "weight",
                "gender",
                "friends",
                "workouts",
                "tournaments",
                "receivedFriendsRequests",
                "sentFriendsRequests",
            ];
        }

        var responseData = getUser.toObject();
        fieldsToDelete.forEach((field) => {
            delete responseData[field];
        });
        console.log(responseData);
        responseData.workouts?.filter(
            (workout) =>
                workout.company.includes(user) ||
                workout.access.includes(user) ||
                workout.user.toString() === user
        );

        res.status(StatusCodes.OK).json({ user: responseData });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

const getCurrentUser = async (req, res) => {
    const { user: userID } = req.body;


    try {
        await increaseRP(userID, "workout");

        const user = await User.findById(userID)
            .populate("friends")
            .populate("workouts")
            .populate("tournaments")
            .populate("receivedFriendsRequests")
            .populate("sentFriendsRequests")
            .select(["-password", "-notifications"]);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({ user });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

const updateUser = async (req, res) => {
    const { user: userID } = req.body;
    const updates = Object.keys(req.body);
    updates.pop();  // deletes user field from updates
    const allowedUpdates = [
        "email",
        "dateOfBirth",
        "height",
        "firstName",
        "lastName",
        "gender",
    ];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        throw new BadRequestError(`Invalid updates! Only ${allowedUpdates.join(", ")} can be changed`);
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        updates.forEach((update) => (user[update] = req.body[update]));
        await user.save();
        res.status(StatusCodes.OK).json({ user });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

const deleteUser = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        for (let i = 0; i < user.friends.length; i++) {
            const friend = await User.findById(user.friends[i]);
            friend.friends = friend.friends.filter((friend) => friend.toString() !== userID);
            await friend.save();
        }

        for (let i = 0; i < user.receivedFriendsRequests.length; i++) {
            const friend = await User.findById(user.receivedFriendsRequests[i]);
            friend.sentFriendsRequests = friend.sentFriendsRequests.filter(
                (friend) => friend.toString() !== userID
            );
            await friend.save();
        }

        for (let i = 0; i < user.sentFriendsRequests.length; i++) {
            const friend = await User.findById(user.sentFriendsRequests[i]);
            friend.receivedFriendsRequests = friend.receivedFriendsRequests.filter(
                (friend) => friend.toString() !== userID
            );
            await friend.save();
        }

        for (let i = 0; i < user.workouts.length; i++) {
            const workout = await Workout.findById(user.workouts[i]);
            if (workout.user.toString() === userID) {
                await workout.deleteOne();
            } else {
                workout.company = workout.company.filter((company) => company.toString() !== userID);
                workout.access = workout.access.filter((access) => access.toString() !== userID);
                await workout.save();
            }
        }

        for (let i = 0; i < user.tournaments.length; i++) {
            const tournament = await Tournament.findById(user.tournaments[i]);
            if (tournament.participants.length === 1 && tournament.participants[0].toString() === userID) {
                await tournament.deleteOne();
            }
            else {
                tournament.participants = tournament.participants.filter(
                    (participant) => participant.toString() !== userID
                );
                await tournament.save();
            }
        }

        await user.deleteOne();
        res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getNotifications = async (req, res) => {
    const { user: userID } = req.body;
    const { count } = req.query;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const notifications = user.notifications.sort((a, b) => b.date - a.date).slice(0, count);

        res.status(StatusCodes.OK).json({ notifications: notifications });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getCurrentWeight = async (req, res) => {
    const { user: userID } = req.body;

    const user = await User.findById(userID);
    if (!user) {
        throw new NotFoundError(`User with id ${userID} not found`);
    }

    const weight = user.weightHistory;
    if (!weight || weight.length === 0 ) {
        throw new NotFoundError("No weight data found");
    }

    const currentWeight = weight.sort((a, b) => b.date - a.date)[0];

    res.status(StatusCodes.OK).json({currentWeight: currentWeight.weight});
}

const updateCurrentWeight = async (req, res) => {
    const { user: userID } = req.body;
    const { weight } = req.body;

    if (!weight) {
        throw new BadRequestError("Please provide weight");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        user.weightHistory.push({ weight });
        await user.save();

        res.status(StatusCodes.OK).json({ msg: "Weight updated successfully" });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getWeightHistory = async (req, res) => { 
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
    
        res.status(StatusCodes.OK).json({weightHistory: user.weightHistory});
    } catch (err) {
        throw new BadRequestError(err);
    }

}

const getFirstName = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({firstName: user.firstName});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateFirstName = async (req, res) => {
    const { user: userID } = req.body;
    const { firstName } = req.body;

    if (!firstName) {
        throw new BadRequestError("First name is a required field, it cannot be empty");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        user.firstName = firstName;
        await user.save();

        res.status(StatusCodes.OK).json({ msg: "First name updated successfully", updatedFirstName: user.firstName });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getLastName = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({lastName: user.lastName ?? ""});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateLastName = async (req, res) => {
    const { user: userID } = req.body;
    const { lastName } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        if (!lastName) {
            user.lastName = undefined;
            await user.save();
        } else {
            user.lastName = lastName;
            await user.save();
        }

        res.status(StatusCodes.OK).json({ msg: "Last name updated successfully", updatedLastName: user.lastName });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getEmail = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({email: user.email});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateEmail = async (req, res) => {
    const { user: userID } = req.body;
    const { email } = req.body;

    if (!email) {
        throw new BadRequestError("Email is a required field, it cannot be empty");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        user.email = email;
        await user.validate();
        await user.save();

        res.status(StatusCodes.OK).json({ msg: "Email updated successfully", updatedEmail: user.email });
    } catch (err) {
        throw new BadRequestError(err);
    }
}


module.exports = { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, getCurrentWeight, updateCurrentWeight, getWeightHistory, getFirstName, updateFirstName, getLastName, updateLastName, getEmail, updateEmail};
