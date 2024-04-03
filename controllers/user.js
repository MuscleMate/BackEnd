const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const User = require("../models/User");

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
        "weight",
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

module.exports = { getUser, updateUser, getCurrentUser };
