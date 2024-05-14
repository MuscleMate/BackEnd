const { StatusCodes } = require('http-status-codes');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const ChallengesList = require('../models/ChallengesList');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../errors');
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
    let { count = 10 } = req.query;
    const{ user:userID } = req.body;
    const user = await User.findById(userID);
    if(!user)
    {
        throw new NotFoundError(`No user with id : ${userID}`);
    }
    try
    {
        for(let challengeID of user.challenges)
        {
            const challenge = await Challenge.findById(challengeID)
            if (!challenge) {
                throw new NotFoundError(`No challenge with id : ${challengeID}`);
            }

            if (challenge.status === 'ongoing' && challenge.endDate < Date.now()) {
                const difficulty = challenge.difficulty;
                const challengeReplacment = await drawChallege(difficulty);
                await user.updateOne({ $pull: { challenges: challengeID } });
                await user.updateOne({ $push: { challenges: challengeReplacment } });
                await Challenge.deleteOne({ _id: challengeID });
            }
        }

        let challenges = await User.findById(userID).populate('challenges').lean();
        const challengesDone = challenges.challenges.filter(challenge => challenge.status === 'completed').sort((a, b) => a.startDate - b.startDate).slice(0,count);
        const challengesToDo = challenges.challenges.filter(challenge => challenge.status === 'ongoing');
        res.status(StatusCodes.OK).json({      
            challengesDone: challengesDone,
            challengesToDo: challengesToDo });
    }
    catch(err)
    {
            throw new BadRequestError(err.message);
    }
    //TODO @VEXI19 calculating exp granted for completing challenge
    res.status(StatusCodes.NOT_IMPLEMENTED).json({ message: "Not implemented" });
}

/** Replace given challenge with a new one
 * Deletes specified challenge and draws a new one, with the same difficulty level
 * 
 * @url PUT /challenges 
 * @body challengeID - id of the challenge to replace
 * @response challenge - new challenge
 */
const replaceChallenge = async (req, res) => {
    const { challengeID } = req.body;
    const { user: userID } = req.body;
    challengeToChange = await Challenge.findById(challengeID);
    if (!challengeToChange) {
        throw new NotFoundError(`No challenge with id : ${challengeID}`);
    }
    const user = await User.findById(userID);
    if (!user) {
        throw new NotFoundError('User does not exist');
    }
    if (user.challenges.indexOf(challengeID) === -1) {
        throw new UnauthorizedError('User not authorized to replace this challenge');
    }
    difficulty = challengeToChange.difficulty;
    try {
        const challengeReplacment = await drawChallege(difficulty);
        await user.updateOne({ $pull: { challenges: challengeID } });
        await user.updateOne({ $push: { challenges: challengeReplacment } });
        await Challenge.deleteOne({ _id: challengeID });
        res.status(StatusCodes.OK).json({ newChallengeID: challengeReplacment });
    }
    catch (err) {
        throw new BadRequestError(err.message);
    }

};

module.exports = {
    getChallenges,
    replaceChallenge
}