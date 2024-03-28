const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");


const getFriends = async(req,res) => {
    try {
        const user = await User.findById(req.body.user);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(StatusCodes.OK).json({ friends: user.friends , receivedFriendsRequests: user.receivedFriendsRequests, sendedFriendsRequests:user.sendedFriendsRequests });

    } catch (error) {
        throw new BadRequestError(error.message);
    } 
}

module.exports ={getFriends};