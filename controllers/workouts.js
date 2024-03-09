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

module.exports = { add_workout };
