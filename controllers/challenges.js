const {StatusCodes} = require('http-status-codes');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { BadRequestError, NotFoundError} = require('../errors');
const drawChallege = require('../utils/challenges');

/** Get user's challenges
 * Checks if any of current challenges are expired, if so deletes them and draws a new ones with the same difficulty level
 * Returns a list of current and past challenges.
 * 
 * @url GET /challenges 
 * @query count - number of past challenges to return
 * @response challenges - list of current and past challenges
 */
const getChallenges = async (req, res) => {
    let {count} = req.query;
    const{ user:userID } = req.body;
    const user = await User.findById(userID).populate({
        path:'challenges',
        mode:'Challenge',
        select:'_id title description startDate endDate difficulty status'
    }).limit(count);
    if(!user)
    {
        throw new NotFoundError(`No user with id : ${userID}`);
    }
    try
    {
        for(challange in user.challenges)
        {
            if(challange.status == 'ongoing' && challange.endDate < Date.now)
            {
                difficulty = challange.difficulty;
                const challengeReplacment = await drawChallege(difficulty);
                await user.updateOne({ $pull: { challenges: challenge._id } });
                await user.updateOne({ $push: { challenges: challengeReplacment._id } });
                await Challenge.deleteOne({ _id: challengeID });
            }
        }
        res.status(StatusCodes.OK).json({challenges: user.challenges });
    }
    catch(err)
    {
            throw new BadRequestError(err.message);
    }
    
    //TODO delete deprecated tag after implementing the function
    //TODO @VEXI19 calculating exp granted for completing challenge

}

/** Replace given challenge with a new one
 * Deletes specified challenge and draws a new one, with the same difficulty level
 * 
 * @url PUT /challenges 
 * @body challengeID - id of the challenge to replace
 * @response challenge - new challenge
 * @deprecated not implemented
 */
const replaceChallenge = async (req, res) => {
    //TODO delete deprecated tag after implementing the function
    res.status(StatusCodes.NOT_IMPLEMENTED).json({message: "Not implemented"});
};

module.exports = {
    getChallenges,
    replaceChallenge
}