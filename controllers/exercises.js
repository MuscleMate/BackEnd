const { StatusCodes } = require("http-status-codes");
const ExercisesList = require("../models/ExercisesList");
const { BadRequestError } = require("../errors");

const searchExercises = async (req, res) => {
    const { searchText } = req.body;
    let { difficulty, type, limit } = req.query;

    difficulty = difficulty ? difficulty : { $in: ['Beginner', 'Intermediate', 'Advanced', "Expert"] };
    type = type ? type : { $in: ["Chest", "Back", "Legs", "Shoulders", "Arms", "Calfs", "Core", "Cardio", "Full body", "Other"] };
    limit = limit ? limit : 10;

    console.log(type, difficulty)

    try {
        const exercises = await ExercisesList.find({
            $or: [
                { title: { $regex: searchText, $options: "i" } },
                { description: { $regex: searchText, $options: "i" } }
            ],
            difficulty: difficulty,
            type: type,
        }, "_id title").limit(limit);

        res.status(StatusCodes.OK).json({ exercises });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

module.exports = {
    searchExercises
}