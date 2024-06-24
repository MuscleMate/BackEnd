const { StatusCodes } = require("http-status-codes");
const ExercisesList = require("../models/ExercisesList");
const { BadRequestError } = require("../errors");

const searchExercises = async (req, res) => {
    const { searchText } = req.body;
    let { difficulty, type, limit } = req.query;

    difficulty = difficulty ? difficulty : { $in: ['Łatwy', 'Średni', 'Zaawansowany'] };
    type = type ? type : { $in: ["Nogi", "Klatka piersiowa", "Plecy", "Ramiona", "Barki", "Core", "Całe ciało"] };
    limit = limit ? limit : 10;

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