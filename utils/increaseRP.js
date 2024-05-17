const { InternalServerError } = require('../errors');
const User = require('../models/User');

/** Increases rp points and levels up the user if necessary
 * @param {string} userID The user id
 * @param {string} action enum like variable with possible values: tournamentWin, tournamentPodium, tournamentParticipation, challengeEasy, challengeMedium, challengeHard , workout
 * 
 * @description Points needed to level up increase by factor of 2 with each level
 * 
 */
const increaseRP = async (userID, action) => {
    const rpAmountEnum = {
        tournamentWin: 125,
        tournamentPodium: 75,
        tournamentParticipation: 50,
        challengeEasy: 50,
        challengeMedium: 75,
        challengeHard: 100,
        workout: 50,
    };


    if (!rpAmountEnum[action]) {
        throw new InternalServerError('Invalid action specified in increaseRP function');
    }


    const user = await User.findById(userID);

    let currentLevel = user.RP.level;
    let currentPoints = user.RP.levelPoints;
    let currentPointsMax = user.RP.levelPointsMax;
    let totalPoints = user.RP.totalPoints;


    const levelMultiplier = 1 + (currentLevel - 1) * 2;
    currentPoints += rpAmountEnum[action] * levelMultiplier;
    totalPoints += rpAmountEnum[action] * levelMultiplier;
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
                points: rpAmountEnum[action] * levelMultiplier,
                date: new Date(),
            },
        ],
    }

    await user.save();
}

module.exports = increaseRP;
