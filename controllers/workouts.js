const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");

const add_workout = async (req, res)=>{
    try{
        const workout = new Workout(req.body);
        await workout.validate();

        // TODO
        // verify if the user is the same user which sent request

        await workout.save();

        res.status(StatusCodes.CREATED).json(workout);
    }
    catch(err){
        res.status(StatusCodes.BAD_REQUEST).json(err);
    }
}

module.exports = { add_workout };