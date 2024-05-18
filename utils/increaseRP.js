const { InternalServerError } = require('../errors');
const User = require('../models/User');
const calculateRP = require('./calculateRP');

/** Increases rp points and levels up the user if necessary
 * @param {string} userID The user id
 * @param {string} action enum like variable with possible values: tournamentWin, tournamentPodium, tournamentParticipation, challengeEasy, challengeMedium, challengeHard , workout
 * 
 * @description Points needed to level up increase by factor of 2 with each level
 * 
 */
const increaseRP = async (userID, action) => {
    const amountToAdd = await calculateRP(userID, action);
    const user = await User.findById(userID);

    let currentLevel = user.RP.level;
    let currentPoints = user.RP.levelPoints;
    let currentPointsMax = user.RP.levelPointsMax;
    let totalPoints = user.RP.totalPoints;

    currentPoints += amountToAdd;
    totalPoints += amountToAdd;
    if (currentPoints >= currentPointsMax) {
        currentLevel++;
        currentPoints -= currentPointsMax;
        currentPointsMax = currentPointsMax * 2 + 50;
    }

    user.RP = {
        level: currentLevel,
        levelPoints: currentPoints,
        levelPointsMax: currentPointsMax,
        totalPoints,
        pointsHistory: [
            ...user.RP.pointsHistory,
            {
                points: amountToAdd,
                date: new Date(),
            },
        ],
    }

    await user.save();
}

module.exports = increaseRP;
