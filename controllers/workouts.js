const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");

const add_workout = async (req, res)=>{
    const workout = await Workout.create(req.body);

    res.status(StatusCodes.CREATED).json(workout);
}

module.exports = { add_workout };