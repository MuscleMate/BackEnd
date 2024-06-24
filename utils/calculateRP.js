const { InternalServerError } = require('../errors');
const User = require('../models/User');

/** Calculates rp points for given action
 * @param {string} userID The user id
 * @param {string} action enum like variable with possible values: tournamentWin, tournamentPodium, tournamentParticipation, challengeEasy, challengeMedium, challengeHard , workout
 * 
 */
const calculateRP = async (userID, action) => {
    const rpAmountEnum = {
        tournamentWin: 125,
        tournamentPodium: 75,
        tournamentParticipation: 50,
        challengeŁatwy: 50,
        challengeŚredni: 75,
        challengeZaawansowany: 100,
        workout: 50,
    };

    console.log(rpAmountEnum[action])


    if (!rpAmountEnum[action]) {
        throw new InternalServerError('Invalid action specified in calculateRP function');
    }


    const user = await User.findById(userID);

    let currentLevel = user.RP.level;

    const levelMultiplier = 1 + (currentLevel - 1) * 2;

    return rpAmountEnum[action] * levelMultiplier;
}

module.exports = calculateRP;
