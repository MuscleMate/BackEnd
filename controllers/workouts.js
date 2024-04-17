const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");
const { BadRequestError, UnauthorizedError, NotFoundError} = require("../errors");
const User = require("../models/User");
const increaseRP = require("../utils/increaseRP");

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

const update_workout = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;

  const validFields = ["user", "title", "description", "date", "duration", "exercises", "equipment", "company", "favourite", "access"]
  if (Object.keys(req.body).some((field) => !validFields.includes(field))) {
    throw new BadRequestError(`Invalid field. Valid fields are: ${validFields.join(", ")}`);
  }

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const workout = await Workout.findById(id);
    if(!workout)
    {
      throw new NotFoundError('Workout not found');
    }

    if (workout.user != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });

    res.status(StatusCodes.OK).json({workout: updatedWorkout});
  }
  catch (err) {
    throw new BadRequestError({msg: err.message});
  }
}

const change_favourite = async(req,res) => {
  const { user: userID, favourite } = req.body;
  const { id } = req.params;

  if (!favourite) {
    throw new BadRequestError("Please provide favourite status");
  }

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const workout = await Workout.findById(id);
    if(!workout)
    {
      throw new NotFoundError('Workout not found');
    }

    if (workout.user != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    await workout.updateOne({ favourite: favourite });
    res.status(StatusCodes.OK).json({msg: "Favourite status updated"});

  } catch (err) {
    throw new BadRequestError({msg: err.message});
  }
}

const start_workout = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const workout = await Workout.findById(id);
    if(!workout)
    {
      throw new NotFoundError('Workout not found');
    }

    if (workout.user != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    if (workout.date.getDate() !== new Date().getDate()) {
      workout.date = new Date();
    }

    workout.startTime = new Date();
    workout.ongoing = true;
    await workout.save();

    res.status(StatusCodes.OK).json({msg: "Workout started"});
  } catch (err) {
    throw new BadRequestError({msg: err.message});
  }
}

const end_workout = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const workout = await Workout.findById(id);
    if(!workout)
    {
      throw new NotFoundError('Workout not found');
    }

    if (workout.user != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    if (!workout.ongoing) {
      throw new BadRequestError("Workout is not ongoing");
    }

    workout.endTime = new Date();
    const duration = (workout.endTime - workout.startTime) / 1000 / 60; // in minutes
    workout.duration = Math.floor(duration)
    workout.ongoing = false;
    await workout.save();

    await increaseRP(userID, "workout")

    res.status(StatusCodes.OK).json({msg: "Workout ended"});
  } catch (err) {
    throw new BadRequestError(err.message);
  }
}

module.exports = { add_workout, get_workouts, delete_workout, get_singleworkout, update_workout, change_favourite, start_workout, end_workout};
