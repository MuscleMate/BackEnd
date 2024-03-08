const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");
const User = require("../models/User")
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

const get_workout = async (req, res) => {
    try {
        const userId = req.query.userID;
        if (!userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }

        // You may return the entire user object or specific fields as needed
        res.status(StatusCodes.OK).json({ user });
    } catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
}

module.exports = { add_workout, get_workout};