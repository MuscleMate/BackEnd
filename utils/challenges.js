const ChallengesList = require("../models/ChallengesList");
const Challenge = require("../models/Challenge");
const { InternalServerError } = require("../errors");

/** Function to get a random challenge from the database
 * 
 * @param {String} difficulty - The difficulty level of the challenge, possible values are "easy", "medium" and "hard"
 * @returns {ObjectId} - Returns the id of the challenge created
 */
const drawChallege = async (difficulty) => {
    const difficultyPossibleValues = ["Łatwy", "Średni", "Zaaawansowany"];
    if (!difficultyPossibleValues.includes(difficulty)) {
        throw new InternalServerError("Invalid difficulty level");
    }

    const documentsCount = await ChallengesList.countDocuments({ difficulty: difficulty });
    const random = Math.floor(Math.random() * documentsCount);

    const challenges = await ChallengesList.find({ difficulty: difficulty }).select("-_id");
    if (!challenges) {
        throw new InternalServerError("Something went wrong while fetching challenges");
    }
    if (challenges.length === 0) {
        throw new InternalServerError("No challenges found");
    }

    try {
        const challenge = new Challenge(challenges[random].toObject());
        await challenge.save();

        return challenge._id.toString();
    }
    catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = drawChallege