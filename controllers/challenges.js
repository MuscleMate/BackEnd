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
        match:{'status':'ongoing'},
        select:'_id title description startDate endDate difficulty status'
    });
    if(!user)
    {
        throw new NotFoundError(`No user with id : ${userID}`);
    }
    try
    {
        for(challenge in user.challenges)
        {
            if(challenge.status == 'ongoing' && challenge.endDate < Date.now)
            {
                difficulty = challange.difficulty;
                const challengeReplacment = await drawChallege(difficulty);
                await user.updateOne({ $pull: { challenges: challenge._id } });
                await user.updateOne({ $push: { challenges: challengeReplacment._id } });
                await Challenge.deleteOne({ _id: challengeID });
            }
        }
        const challengesDone = user.challenges.filter(challenge => challenge.status === 'complated');
        const challengesToDo = user.challenges.filter(challenge => challenge.status === 'ongoing').slice(0, count);
        res.status(StatusCodes.OK).json({      
            challengesDone: challengesDone,
            challengesToDo: challengesToDo });
    }
    catch(err)
    {
            throw new BadRequestError(err.message);
    }
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