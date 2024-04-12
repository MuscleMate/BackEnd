const { InternalServerError } = require('../errors');
const User = require('../models/User');

const actions = [
    'tournamentWin',
    'tournamentPodium',
    'tournamentParticipation',
    'challenge',
    'workout'
]

/** Increases rp points and levels up the user if necessary
 * @param {string} userID The user id
 * @param {string} action enum like variable with possible values: tournamentWin, tournamentPodium, tournamentParticipation, challenge, workout
 * 
 * @description Points needed to level up increase by factor of 2 with each level
 * 
 */
const increaseRP = async (userID, action) => {
    const rpAmountEnum = {
        tournamentWin: 100,
        tournamentPodium: 70,
        tournamentParticipation: 50,
        challenge: 50,
        workout: 30,
    };


    if (!rpAmountEnum[action]) {
        throw new InternalServerError('Invalid action specified in increaseRP function');
    }


    const user = await User.findById(userID);

    let currentLevel = user.RP.level;
    let currentPoints = user.RP.levelPoints;
    let currentPointsLimit = user.RP.levelPointsLimit;

    const levelMultiplier = 1 + (currentLevel - 1) * 2;
    currentPoints += rpAmountEnum[action] * levelMultiplier;
    if (currentPoints >= currentPointsLimit) {
        currentLevel++;
        currentPoints -= currentPointsLimit;
        currentPointsLimit = currentPointsLimit * 2 + 50;
    }

    user.RP = {
        level: currentLevel,
        levelPoints: currentPoints,
        levelPointsLimit: currentPointsLimit,
    }

    await user.save();
}

module.exports = increaseRP;
