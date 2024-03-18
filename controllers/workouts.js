const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");
const { BadRequestError } = require("../errors");
const User = require("../models/User");

/** Adds a new workout
 * @url POST /workouts
 * @body title, description, date with hour, duration
 * @response new workout
 */
const add_workout = async (req, res) => {
  try {
    const workout = new Workout(req.body);
    await workout.validate();
    await workout.save();

    await User.findOneAndUpdate(
      { _id: req.body.user },
      { $push: { workouts: workout._id } }
    );

    res.status(StatusCodes.CREATED).json(workout);
  } catch (err) {
    throw new BadRequestError(err);
  }
};

const get_workouts = async (req, res) => {
  const { user: userID } = req.body;
  try {
    const user = await User.findById(userID);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    const workouts = await user.populate("workouts");
    res
      .status(StatusCodes.OK)
      .json({ user: userID, workouts: workouts.workouts });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
  }
};
const delete_workout = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;
  try{
    const user = await User.findById(userID);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    const workout = await Workout.findById(id);
    if(!workout)
    {
      return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Workout not found" });
    }
    if (workout.user != userID) 
    {
      throw new NotFoundError('User not authorized to delete this workout');
    }
    
    await user.updateOne(
      { $drop: { workouts: id } }
    );
    await workout.deleteOne();
    res.status(StatusCodes.NO_CONTENT).json({ msg: "OK" });
  }
  catch(err) {
    res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
  }
}

module.exports = { add_workout, get_workouts , delete_workout};
