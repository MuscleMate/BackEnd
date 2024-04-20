const { StatusCodes } = require("http-status-codes");
const Workout = require("../models/Workout");
const { BadRequestError, UnauthorizedError, NotFoundError} = require("../errors");
const User = require("../models/User");
const increaseRP = require("../utils/increaseRP");
const ExercisesList = require("../models/ExercisesList");
const Exercise = require("../models/Exercise");

/** Adds a new workout
 * @url POST /workouts
 * @body title, description, date with hour, duration
 * @response new workout
 */
const createWorkout = async (req, res) => {
  const { user: userID } = req.body;
  var { exercises, company, access } = req.body;
  const possibleFields = ["user", "title", "description", "startDate", "exercises", "equipment", "company", "favourite", "access"];

  if (Object.keys(req.body).some((field) => !possibleFields.includes(field))) {
    throw new BadRequestError(`There was invalid field provided. Valid fields are: ${possibleFields.join(", ")}`);
  }

  if (company && !Array.isArray(company)) {
    throw new BadRequestError("Company must be an array");
  }

  if (access && !Array.isArray(access)) {
    throw new BadRequestError("Access must be an array");
  }

  try {

    if (exercises && exercises.length !== 0) {
      for (let exercise of exercises) {
        if (!exercise._id) {
          throw new BadRequestError("Please provide exercise id for each exercise");
        }
        if ((!exercise.sets || !exercise.reps || !exercise.weight) && !exercise.duration) {
          throw new BadRequestError(" Please provide sets, reps and weight or duration for each exercise");
        }

        if (exercise.duration) {
          exercise.sets = undefined;
          exercise.reps = undefined;
          exercise.weight = undefined;
        } else {
          exercise.duration = undefined;
        }

        let exerciseObject = await ExercisesList.findById(exercise._id, "-_id -__v").lean();
        delete exercise._id;
        const newExercise = await Exercise.create({ ...exerciseObject, ...exercise});
        exercise._id = newExercise._id.toString();
      }
    }
    const workout = new Workout(req.body);
    await workout.validate();
    await workout.save();

    await User.findOneAndUpdate(
      { _id: userID },
      { $push: { workouts: workout._id } }
    );

    workout.company.forEach(async (company) => {
      await User.findOneAndUpdate(
        { _id: company },
        { $push: { workouts: workout._id } }
      );
    });

    workout.access.forEach(async (access) => {
      await User.findOneAndUpdate(
        { _id: access },
        { $push: { workouts: workout._id } }
      );
    });

    res.status(StatusCodes.CREATED).json(workout);
  } catch (err) {
    throw new BadRequestError(err);
  }
};

const getAllWorkouts = async (req, res) => {
  const { user: userID } = req.body;
  try {
    const user = await User.findById(userID).populate({
      path: "workouts",
      select: "title startDate duration exercises favourite"
    }).lean();
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    let workouts = user.workouts;

    workouts = workouts.map((workout) => {
      let newWorkout = { ...workout };
      newWorkout.exercises = newWorkout.exercises.length;
      newWorkout.date = new Date(newWorkout.startDate).toLocaleDateString();
      newWorkout.time = new Date(newWorkout.startDate).toLocaleTimeString().slice(0, 5);
      delete newWorkout.startDate;
      return newWorkout;
    })

    res
      .status(StatusCodes.OK)
      .json({ workouts: workouts });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
  }
};

const deleteWorkout = async(req,res) => {
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

const getSingleWorkout = async (req, res) => {
  const { id } = req.params;
  const { user: userID } = req.body;

  if (!id) {
    throw new BadRequestError("Please provide workout id");
  }

  const user = await User.findById(userID);
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User not found" });
  }
  const workout = await Workout.findById(id).populate([{
      path: "exercises",
    }, {
      path: "user",
      select: "_id firstName",
    }, {
      path: "company",
      select: "_id firstName",
    }, {
      path: "access",
      select: "_id firstName",
    }
  ]).select("-__v -updatedAt -createdAt").lean();

  if (!workout) {
    throw new NotFoundError('Workout not found');
  }
  if (workout.company.indexOf(userID) === -1 && workout.access.indexOf(userID) === -1 && workout.user._id.toString() !== userID) {
      throw new UnauthorizedError('User not authorized to get information about this workout');
  }

  workout.date = new Date(workout.startDate).toLocaleDateString();
  workout.time = new Date(workout.startDate).toLocaleTimeString().slice(0, 5);
  delete workout.startDate;    

  try {
    return res.status(StatusCodes.OK).json(workout);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
  }
};

const updateWorkout = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;
  delete req.body.user;

  const validFields = ["title", "description", "startDate", "endDate", "duration", "exercises", "equipment", "favourite"]
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
    throw new BadRequestError(err);
  }
}

const changeFavourite = async(req,res) => {
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
    throw new BadRequestError(err);
  }
}

const startWorkout = async(req,res) => {
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

    if (workout.endDate) {
      throw new BadRequestError("Workout is already finished");
    }
    
    workout.startDate = new Date();
    workout.ongoing = true;
    await workout.save();

    res.status(StatusCodes.OK).json({msg: "Workout started"});
  } catch (err) {
    throw new BadRequestError(err);
  }
}

const endWorkout = async(req,res) => {
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

    workout.endDate = new Date();
    workout.ongoing = false;
    workout.duration = Math.floor((workout.endDate - workout.startDate) / 1000 / 60);
    await workout.save();
    await increaseRP(userID, "workout")

    res.status(StatusCodes.OK).json({msg: "Workout ended"});
  } catch (err) {
    throw new BadRequestError(err);
  }
}

const getCompany = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError(`User with id ${userID} not found`);
    }

    const workout = await Workout.findById(id).populate({
      path: "company",
      select: "_id firstName"
    })
    if(!workout)
    {
      throw new NotFoundError(`Workout with id ${id} not found`);
    }

    if (workout.user.toString() != userID) 
    {
      throw new UnauthorizedError('User not authorized to get information about this workout');
    }

    const company = workout.company;
    res.status(StatusCodes.OK).json({ _id: workout._id, company });
  } catch (err) {
    throw new BadRequestError(err);
  }
}

const addUserToCompany = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;
  const { company } = req.body;

  if (!company) {
    throw new BadRequestError("Please provide company");
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

    if (workout.user.toString() != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    if (workout.company.indexOf(company) !== -1) {
      throw new BadRequestError("User is already in company");
    }

    const userToBeAdded = await User.findById(company);
    if (!userToBeAdded) {
      throw new NotFoundError('User not found');
    }

    await workout.updateOne({ $push: { company: userToBeAdded._id } });
    await userToBeAdded.updateOne({ $push: { workouts: workout._id } });
    res.status(StatusCodes.OK).json({msg: "User added to company"});
  } catch (err) {
    throw new BadRequestError(err);
  }
}

const deleteUserFromCompany = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;
  const { company } = req.body;

  if (!company) {
    throw new BadRequestError("Please provide company");
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

    if (workout.user.toString() != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    if (workout.company.indexOf(company) === -1) {
      throw new BadRequestError("User is not in company");
    }

    const userToBeDeleted = await User.findById(company);
    if (!userToBeDeleted) {
      throw new NotFoundError('User not found');
    }

    await workout.updateOne({ $pull: { company: userToBeDeleted._id } });
    await userToBeDeleted.updateOne({ $pull: { workouts: workout._id } });
    res.status(StatusCodes.OK).json({msg: "User deleted from company"});
  } catch (err) {
    throw new BadRequestError(err);
  }
}  

const getAccess = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError(`User with id ${userID} not found`);
    }

    const workout = await Workout.findById(id).populate({
      path: "access",
      select: "_id firstName"
    })
    if(!workout)
    {
      throw new NotFoundError(`Workout with id ${id} not found`);
    }

    if (workout.user.toString() != userID) 
    {
      throw new UnauthorizedError('User not authorized to get information about this workout');
    }

    const access = workout.access;
    res.status(StatusCodes.OK).json({ _id: workout._id, access });
  } catch (err) {
    throw new BadRequestError(err);
  }
}

const addUserToAccess = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;
  const { access } = req.body;

  if (!access) {
    throw new BadRequestError("Please provide access");
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

    if (workout.user.toString() != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    if (workout.access.indexOf(access) !== -1) {
      throw new BadRequestError("User is already has access");
    }

    const userToBeAdded = await User.findById(access);
    if (!userToBeAdded) {
      throw new NotFoundError('User not found');
    }

    await workout.updateOne({ $push: { access: userToBeAdded._id } });
    await userToBeAdded.updateOne({ $push: { workouts: workout._id } });
    res.status(StatusCodes.OK).json({msg: "User added to company"});
  } catch (err) {
    throw new BadRequestError(err);
  }
}

const deleteUserFromAccess = async(req,res) => {
  const { user: userID } = req.body;
  const { id } = req.params;
  const { access } = req.body;

  if (!access) {
    throw new BadRequestError("Please provide access");
  }

  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new NotFoundError(`User with id ${userID} not found`);
    }

    const workout = await Workout.findById(id);
    if(!workout)
    {
      throw new NotFoundError(`Workout with id ${id} not found`);
    }

    if (workout.user.toString() != userID) 
    {
      throw new UnauthorizedError('User not authorized to update this workout');
    }

    if (workout.access.indexOf(access) === -1) {
      throw new BadRequestError("User is does not have access to this workout");
    }

    const userToBeDeleted = await User.findById(access);
    if (!userToBeDeleted) {
      throw new NotFoundError(`User to be deleted from access with id ${access} not found`);
    }

    await workout.updateOne({ $pull: { access: userToBeDeleted._id } });
    await userToBeDeleted.updateOne({ $pull: { workouts: workout._id } });
    res.status(StatusCodes.OK).json({msg: "User access revoked"});
  } catch (err) {
    throw new BadRequestError(err);
  }
}


module.exports = { 
  getAllWorkouts, 
  createWorkout, 
  deleteWorkout, 
  getSingleWorkout, 
  updateWorkout, 
  changeFavourite, 
  startWorkout, 
  endWorkout,
  getCompany,
  addUserToCompany,
  deleteUserFromCompany,
  getAccess,
  addUserToAccess,
  deleteUserFromAccess
};
