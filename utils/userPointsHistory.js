const { BadRequestError } = require("../errors");
const User = require("../models/User")

/** Returns the user's points history for a given time frame
 * @param {string} userID The user id
 * @param {number} timeFrame The time frame for the points history in days (default is 7 days)
 * 
 * @returns {Array} The user's points history
 */
const userPointsHistory = async (userID, timeFrame = 7) => {
    const user = await User.findById(userID);
    if (!user) {
        throw new BadRequestError('User not found');
    }

    let pointsHistory = user.RP.pointsHistory;
    const now = new Date();
    const timeFrameAgo = new Date(now - timeFrame * 24 * 60 * 60 * 1000);

    pointsHistory = pointsHistory.filter((point) => point.date >= timeFrameAgo)

    const mergedPointsHistory = [];
    pointsHistory.forEach((point) => {
        const date = new Date(point.date);
        const dateStr = date.toDateString();
        const existingPoint = mergedPointsHistory.find((p) => new Date(p.date).toDateString() === dateStr);
        if (existingPoint) {
            existingPoint.points += point.points;
        } else {
            mergedPointsHistory.push({ date, points: point.points });
        }
    });

    return mergedPointsHistory;
}

module.exports = userPointsHistory;

