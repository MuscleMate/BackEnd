const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");
const { BadRequestError ,UnauthorizedError, NotFoundError} = require("../errors");
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
      { $pull: { workouts: id } }
    );
    await workout.deleteOne();
    res.status(StatusCodes.OK).json({msg: "Workout deleted"});
  }
  catch(err) {
    res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
  }
}

const get_singleworkout = async(req,res)=> {
  const { id } = req.params;
  const { user: userID } = req.body;
  const user = await User.findById(userID);
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User not found" });
  }
  const workout = await Workout.findById(id);
  if(!workout)
  {
    throw new NotFoundError('Workout not found');
  }
  if(workout.company.indexOf(userID) === -1 && workout.access.indexOf(userID)===-1)
  {
  if(workout.user._id.valueOf() !== userID)
  {
    throw new UnauthorizedError('User not authorized to get information about this workout');
  }
}
  try{
    return res.status(StatusCodes.OK).json(workout);
  }catch(err){
    res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
  }
};

module.exports = { add_workout, get_workouts, delete_workout, get_singleworkout};
