const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");


const getFriends = async(req,res) => {
    try {
        const user = await User.findById(req.body.user).populate([
            'friends',
            'receivedFriendsRequests',
            'sentFriendsRequests'
        ]);;
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(StatusCodes.OK).json({ friends: user.friends , receivedFriendsRequests: user.receivedFriendsRequests, sentFriendsRequests:user.sentFriendsRequests });

    } catch (error) {
        throw new BadRequestError(error.message);
    } 
}
const sendRequest = async(req,res) =>{
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
    if (user._id.toString() === userToBeAdded._id.toString()) {
        throw new BadRequestError('You cannot send a friend request to yourself');
    }
    if(user.friends.indexOf(userToBeAdded._id)!==-1)
    {
        throw new BadRequestError('User is already a friend');
    }
    if(user.sentFriendsRequests.indexOf(userToBeAdded._id)!==-1)
    {
        throw new BadRequestError('Invitation has already been sent');
    }
    if(user.receivedFriendsRequests.indexOf(userToBeAdded._id)!==-1)
    {
        throw new BadRequestError('You have already received a friend request from this user');
    }
    try{
        await userToBeAdded.updateOne({ $push: { receivedFriendsRequests: user._id} });
        await user.updateOne({ $push: { sentFriendsRequests: userToBeAdded._id} });
        res.status(StatusCodes.NO_CONTENT).json({});
    }catch(error){
        throw new BadRequestError(error.message);
    }
}

const addFriend = async(req,res) =>{
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
    if(user.receivedFriendsRequests.indexOf(userToBeAdded._id)===-1)
    {
        throw new NotFoundError('User to be added did not send a request');
    }
    try{
        await userToBeAdded.updateOne({ $push: { friends: user._id} });
        await user.updateOne({ $push: { friends: userToBeAdded._id} });
        await user.updateOne({ $pull: { receivedFriendsRequests: userToBeAdded._id} });
        await userToBeAdded.updateOne({ $pull: { sentFriendsRequests: user._id} });
        res.status(StatusCodes.NO_CONTENT).json({});
    } catch(error){
        throw new BadRequestError(error.message);
    }
}

const searchUser = async(req,res) =>{
    const { searchText } = req.body;
    const { count } = req.query;
    
    try {
        const users = await User.find(
            {
                $or: [
                    {firstName: {$regex: searchText, $options: 'i'}},
                    {lastName: {$regex: searchText, $options: 'i'}},
                    {email: {$regex: searchText, $options: 'i'}}
                ]
            },
        ).select('_id firstName lastName email').limit(count);
            
        res.status(StatusCodes.OK).json({users})
    } catch (err) {
        throw new BadRequestError(err.message);
    }
}

const deleteFriend = async(req,res) =>{
    const{id} = req.body;
    const { user:userID } = req.body;
    const user = await User.findById(userID);
    const userToDeleted = await User.findById(id);
    if(!user)
    {
        throw new NotFoundError('User does not exist');
    }

    if(!userToDeleted)
    {
        throw new NotFoundError('User to be deleted  does not exist');
    }
    if(user.friends.indexOf(userToDeleted._id)===-1)
    {
        throw new NotFoundError('User to be deleted from friend list is not a friend');
    }
    try{
        await user.updateOne({ $pull: { friends: userToDeleted._id} });
        await userToDeleted.updateOne({ $pull: { friends: user._id} });

        res.status(StatusCodes.NO_CONTENT).json({});
    } catch(error){
        throw new BadRequestError(error.message);
    }
}
  
  const denyFriend = async(req,res) =>{
    const{id} = req.body;
    const { user:userID } = req.body;
    const user = await User.findById(userID);
    const userToDenyed = await User.findById(id);
    if(!user)
    {
        throw new NotFoundError('User does not exist');
    }
    if(!userToDenyed)
    {
        throw new NotFoundError('User to be denyed friend request does not exist');
    }
    if(user.receivedFriendsRequests.indexOf(userToDenyed._id)===-1)
    {
        throw new NotFoundError('User to be denyed friend did not send a request');
    }
    try{
        await user.updateOne({ $pull: { receivedFriendsRequests: userToDenyed._id} });
        await userToDenyed.updateOne({ $pull: { sentFriendsRequests: user._id} });
        res.status(StatusCodes.NO_CONTENT).json({});
    } catch(error){
        throw new BadRequestError(error.message);
    }
}


module.exports ={getFriends,addFriend, sendRequest, searchUser,deleteFriend,denyFriend };


