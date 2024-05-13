const {StatusCodes} = require('http-status-codes');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const ChallengesList = require('../models/ChallengesList');
/** Get user's challenges
 * Checks if any of current challenges are expired, if so deletes them and draws a new ones with the same difficulty level
 * Returns a list of current and past challenges.
 * 
 * @url GET /challenges 
 * @query count - number of past challenges to return
 * @response challenges - list of current and past challenges
 * @deprecated not implemented
 */
const getChallenges = async (req, res) => {
    //TODO delete deprecated tag after implementing the function
    //TODO @VEXI19 calculating exp granted for completing challenge
    res.status(StatusCodes.NOT_IMPLEMENTED).json({message: "Not implemented"});
}

/** Replace given challenge with a new one
 * Deletes specified challenge and draws a new one, with the same difficulty level
 * 
 * @url PUT /challenges 
 * @body challengeID - id of the challenge to replace
 * @response challenge - new challenge
 */
const replaceChallenge = async (req, res) => {
    //TODO delete deprecated tag after implementing the function
    const{ challengeID } = req.body;
    const{ user:userID } = req.body;
    challengeToChange = await Challenge.findById(challengeID);
    if(!challengeToChange)
    {
        throw new NotFoundError(`No challenge with id : ${challengeID}`);
    }
    const user = await User.findById(userID);
    if (!user) 
    {
        throw new NotFoundError('User does not exist');
    }
    if(user.challenges.indexOf(challengeToChange)===-1)
    {
        throw new UnauthorizedError('User not authorized to replace this challenge');
    }
    difficulty = challengeToChange.difficulty;
    try{
        const challengeReplacment = await ChallengesList.find({difficulty : difficulty}); 
        await user.updateOne({ $pull: { challenges: challengeToChange._id } });
        await user.updateOne({ $push: { challenges: challengeReplacment._id } });
        res.status(StatusCodes.OK).json(challengeReplacment);
    }
    catch(err){
        throw new BadRequestError(err);
    }
    
};

module.exports = {
    getChallenges,
    replaceChallenge
}