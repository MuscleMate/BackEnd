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
      .json({ user: userID, reqworkouts: workouts.workouts });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json(err);
  }
};

module.exports = { add_workout, get_workouts };
