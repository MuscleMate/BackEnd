const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");


const getFriends = async(req,res) => {
    try {
        const user = await User.findById(req.body.user).populate({
            path: 'friends',
            path: 'receivedFriendsRequests',
            path: 'sentFriendsRequests'
        });;
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(StatusCodes.OK).json({ friends: user.friends , receivedFriendsRequests: user.receivedFriendsRequests, sentFriendsRequests:user.sentFriendsRequests });

    } catch (error) {
        throw new BadRequestError(error.message);
    } 
}

module.exports ={getFriends};