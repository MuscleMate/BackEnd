const {StatusCodes} = require('http-status-codes');

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