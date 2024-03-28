const {StatusCodes} = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const User = require('../models/User');

const getUser = async (req, res) => {
    const { id } = req.params;
    const {user: userID} = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
    
        const getUser = await User.findById(id).populate('friends').populate('workouts').populate('tournaments');
        if (!getUser) {
            throw new NotFoundError(`User your are looking for does not exist`);
        }

        var fieldsToDelete = [];
        if (userID === id) {
            fieldsToDelete = ['password']
        } else if (getUser.friends.includes(userID)) {
            fieldsToDelete = ['password', 'notifications']
        } else {
            fieldsToDelete = ['password', 'dateOfBirth', 'height', 'weight', 'gender', 'friends', 'workouts', 'tournaments', 'notifications']
        }
        var responseData = getUser.toObject();
        fieldsToDelete.forEach((field) => {
            delete responseData[field];
        });
        responseData.workouts.filter((workout) => workout.company.includes(user) || workout.access.includes(user) || workout.user.toString() === user);

        res.status(StatusCodes.OK).json({ user: responseData });
    } catch (err) {
        throw new BadRequestError(err);
    }

    


};

const updateUser = async (req, res) => {
}

module.exports = { getUser, updateUser };