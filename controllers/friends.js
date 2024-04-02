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

const addFriend = async(req,res) =>{
    const {userID} = req.body;
    const { user:_id } = req.body;
    const user = await User.findById(_id);
    const userToBeAdded = await User.findById(userID);
    if(!user)
    {
        throw new NotFoundError('User does not exist');
    }
    if(!userToBeAdded)
    {
        throw new NotFoundError('User to be added does not exist');
    }
    if(user.receivedFriendsRequests.indexOf(userToBeAdded._id)===-1)
    {
        throw new NotFoundError('User to be added did not send a request');
    }
    try{
        await userToBeAdded.updateOne({ $push: { friends: user._id} });
        await user.updateOne({ $push: { friends: userToBeAdded._id} });
        await user.updateOne({ $pull: { receivedFriendsRequests: userToBeAdded._id} });
        await userToBeAdded.updateOne({ $pull: { sentFriendsRequests: user._id} });
    } catch(error){
        throw new BadRequestError(error.message);
    }
}

module.exports ={getFriends,addFriend};