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
const sendReqeust = async(req,res) =>{
    const {id} = req.body;
    const { user:userID } = req.body;
    const user = await User.findById(userID);
    const userToBeAdded = await User.findById(id);
    if(!user)
    {
        throw new NotFoundError('User does not exist');
    }
    if(!userToBeAdded)
    {
        throw new NotFoundError('User to be added does not exist');
    }
    if(user.friends.indexOf(userToBeAdded._id)!==-1)
    {
        throw new BadRequestError('User is already a friend');
    }
    if(user.sentFriendsRequests.indexOf(userToBeAdded._id)!==-1)
    {
        throw new BadRequestError('Invitation has already been sent');
    }
    try{
        await userToBeAdded.updateOne({ $push: { receivedFriendsRequests: user._id} });
        await user.updateOne({ $push: { sentFriendsRequests: userToBeAdded._id} });
        res.status(StatusCodes.NO_CONTENT).json({});
    }catch(error){
        throw new BadRequestError(error.message);
    }
}

module.exports ={getFriends, sendReqeust};