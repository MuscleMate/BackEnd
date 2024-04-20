const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const sendNotification = require("../utils/sendNotification");

/** Get friends of a user
 * @url GET /friends
 * @body user - the user id
 * @response friends - array of friends
 */
const getFriends = async(req,res) => {
    try {
        const user = await User.findById(req.body.user).populate({
            path: "friends",
            select: ["firstName", "lastName", "email", "_id", "RP"]
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        res.status(StatusCodes.OK).json({ friends: user.friends });
    } catch (error) {
        throw new BadRequestError(error.message);
    } 
}

/** Send a friend request
 * @url POST /friends/request/send
 * @body id - the id of the user to send the request to
 * @body user - the id of the user sending the request
 * @response 204 - No content
 */
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
        await sendNotification(user._id, [userToBeAdded._id], `${user.firstName} sent you a friend request`);
        res.status(StatusCodes.NO_CONTENT).json({});
    }catch(error){
        throw new BadRequestError(error.message);
    }
}

/** Accept a friend request
 * @url POST /friends/request/accept
 * @body id - the id of the user to accept the request from
 * @body user - the id of the user accepting the request
 * @response 204 - No content
 */
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
        await sendNotification(user._id, [userToBeAdded._id], `${user.firstName} accepted your friend request`);
        res.status(StatusCodes.NO_CONTENT).json({});
    } catch(error){
        throw new BadRequestError(error.message);
    }
}

/** Cancel a friend request
 * @url POST /friends/request/cancel
 * @body id - the id of the user to cancel the request to
 * @body user - the id of the user canceling the request
 * @response 204 - No content
 */
const cancelFriend = async(req,res) =>{
    const{id} = req.body;
    const { user:userID } = req.body;
    const user = await User.findById(userID);
    const userToBeCanceled = await User.findById(id);
    if(!user)
    {
        throw new NotFoundError('User does not exist');
    }
    if(!userToBeCanceled)
    {
        throw new NotFoundError('User to be denyed friend request does not exist');
    }
    if(user.sentFriendsRequests.indexOf(userToBeCanceled._id)===-1)
    {
        throw new NotFoundError('User did not send a friend request to that user');
    }
    try{
        await user.updateOne({ $pull: { sentFriendsRequests: userToBeCanceled._id} });
        await userToBeCanceled.updateOne({ $pull: { receivedFriendsRequests: user._id} });
        res.status(StatusCodes.NO_CONTENT).json({});
    } catch(error){
        throw new BadRequestError(error.message);
    }
}

/** Delete a friend
 * @url POST /friends/delete
 * @body id - the id of the user to delete from friends
 * @body user - the id of the user deleting the friend
 * @response 204 - No content
 */
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

/** Deny a friend request
 * @url POST /friends/request/deny
 * @body id - the id of the user to deny the request from
 * @body user - the id of the user denying the request
 * @response 204 - No content
 */
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

/** Get received friend requests
 * @url GET /friends/request/received
 * @body user - the id of the user
 * @response receivedFriendsRequests - array of received friend requests
 */
const getReceivedRequests = async (req, res) => {
    try {
        const user = await User.findById(req.body.user).populate({
            path: "receivedFriendsRequests",
            select: ["firstName", "lastName", "email", "_id", "RP"]
        })
        if (!user) {
            throw new NotFoundError('User not found');
        }

        res.status(StatusCodes.OK).json({ receivedFriendsRequests: user.receivedFriendsRequests });
    } catch (error) {
        throw new BadRequestError(error.message);
    } 
}

/** Get sent friend requests
 * @url GET /friends/request/sent
 * @body user - the id of the user
 * @response sentFriendsRequests - array of sent friend requests
 */
const getSentRequests = async (req, res) => {
    try {
        const user = await User.findById(req.body.user).populate({
            path: "sentFriendsRequests",
            select: ["firstName", "lastName", "email", "_id", "RP"]
        })
        if (!user) {
            throw new NotFoundError('User not found');
        }

        res.status(StatusCodes.OK).json({ sentFriendsRequests: user.sentFriendsRequests });
    } catch (error) {
        throw new BadRequestError(error.message);
    } 
}

/** Get level ranking
 * @url GET /friends/rankings/level
 * @body user - the id of the user
 * @response ranking - array of friends and user sorted by level
 */
const getLevelRanking = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate({
            path: "friends",
            select: ["firstName", "lastName", "_id", "RP"]
        })
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        let ranking = [...user.friends, {_id: userID, RP: user.RP, firstName: user.firstName, lastName: user.lastName}]

        ranking = ranking.sort((a, b) => b.RP.level - a.RP.level);
        res.status(StatusCodes.OK).json({ ranking });
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

/** Get experience ranking
 * @url GET /friends/rankings/exp
 * @body user - the id of the user
 * @response ranking - array of friends and user sorted by experience
 */
const getExpRanking = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate({
            path: "friends",
            select: ["firstName", "lastName", "_id", "RP"]
        })
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        let ranking = [...user.friends, {_id: userID, RP: user.RP, firstName: user.firstName, lastName: user.lastName}]

        ranking = ranking.sort((a, b) => b.RP.totalPoints - a.RP.totalPoints);
        res.status(StatusCodes.OK).json({ ranking });
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

/** Get challenges ranking
 * @url GET /friends/rankings/challenges
 * @body user - the id of the user
 * @response ranking - array of friends and user sorted by challenges won
 * @deprecated Not implemented
 */
const getChallengesRanking = async (req, res) => {
    // TODO: delete deprecated tag from JSDoc when implemented
    res.status(StatusCodes.NOT_IMPLEMENTED).json({ message: "Not implemented" });
}

/** Get workouts ranking
 * @url GET /friends/rankings/workouts
 * @body user - the id of the user
 * @response ranking - array of friends and user sorted by workouts completed
 */
const getWorkoutsRanking = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate({
            path: "friends",
            select: ["firstName", "lastName", "_id", "RP", "stats"]
        })
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        let ranking = [...user.friends, {_id: userID, RP: user.RP, firstName: user.firstName, lastName: user.lastName}]

        ranking = ranking.sort((a, b) => b.stats.workoutsCompleted - a.stats.workoutsCompleted);
        res.status(StatusCodes.OK).json({ ranking });
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

/** Get tournaments ranking
 * @url GET /friends/rankings/tournaments
 * @body user - the id of the user
 * @response ranking - array of friends and user sorted by tournaments won
 */
const getTournamentsRanking = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate({
            path: "friends",
            select: ["firstName", "lastName", "_id", "RP", "stats"]
        })
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        let ranking = [...user.friends, {_id: userID, RP: user.RP, firstName: user.firstName, lastName: user.lastName}]

        ranking = ranking.sort((a, b) => b.stats.tournamentsWon - a.stats.tournamentsWon);
        res.status(StatusCodes.OK).json({ ranking });
    } catch (error) {
        throw new BadRequestError(error.message);
    }
}

/** Searches for friends by first name, last name or email
 * @url POST /friends/search
 * @body searchText
 * @query count - number of friends to return
 * @response friends
 */
const searchFriend = async(req,res) =>{
    const { searchText } = req.body;
    const { count } = req.query;
    
    try {
        const user = await User.findById(req.body.user).populate({
            path: "friends",
            select: ["firstName", "lastName", "email", "_id"]
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const friends = await User.findById(req.body.user).populate({
            path: "friends",
            select: ["firstName", "lastName", "email", "_id"]
        }).select("friends").find({
            $or: [
                {firstName: {$regex: searchText, $options: 'i'}},
                {lastName: {$regex: searchText, $options: 'i'}},
                {email: {$regex: searchText, $options: 'i'}}
            ]
        }).limit(count);
        // const friends = user.friends && user.friends.find({
        //     $or: [
        //         {firstName: {$regex: searchText, $options: 'i'}},
        //         {lastName: {$regex: searchText, $options: 'i'}},
        //         {email: {$regex: searchText, $options: 'i'}}
        //     ]
        // }).limit(count);

        res.status(StatusCodes.OK).json({ friends })
    } catch (err) {
        throw new BadRequestError(err.message);
    }
}

module.exports ={getFriends,addFriend, sendRequest, cancelFriend,denyFriend, deleteFriend, getReceivedRequests, getSentRequests, 
    getLevelRanking, getExpRanking, getChallengesRanking, getWorkoutsRanking, getTournamentsRanking, searchFriend };

