const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");

const add_workout = async (req, res)=>{
    try{
        const workout = new Workout(req.body);
        await workout.validate();
        await workout.save();

        res.status(StatusCodes.CREATED).send(workout);
    }
    catch(err){
        res.status(StatusCodes.BAD_REQUEST).send(err);
    }
}

module.exports = { add_workout };