const { StatusCodes } = require("http-status-codes");
const BadRequestError = require("../errors/bad-request");
const User = require("../models/User");
const Workout = require("../models/Workout");
const Exercise = require("../models/Exercise");
const Template = require("../models/Template");
const { NotFoundError } = require("../errors");

const createWorkoutTemplate = async (req, res) => {
    const { user: userID, name, workoutID } = req.body;
    
    if (!name || !workoutID) {
        throw new BadRequestError("Please provide name and workoutID");
    }

    try {
        const nameUsed = await Template.findOne({ name });
        if (nameUsed) {
            throw new BadRequestError(`Name ${name} is already in use`);
        }

        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} does not exist`);
        }

        const workout = await Workout.findById(workoutID).populate("exercises").lean().select("-_id exercises title description equipment");
        if (!workout) {
            throw new NotFoundError(`Workout with id ${workoutID} does not exist`);
        }

        let exercisesList = [];
        for (let exercise of workout.exercises) {
            delete exercise._id;
            const newExercise = await Exercise.create(exercise);
            exercisesList.push(newExercise._id);
        }

        const template = await Template.create({ name, workoutData: { ...workout, exercises: exercisesList } });
        user.templates.push(template._id);
        await user.save();

        res.status(StatusCodes.OK).json({ msg: `'${name}' template created` });
    } catch (error) {
        throw new BadRequestError(error);
    }
}

const deleteWorkoutTemplate = async (req, res) => {
    const { user: userID } = req.body;
    const { templateID } = req.params;

    if (!templateID) {
        throw new BadRequestError("Please provide templateID");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} does not exist`);
        }

        if (!user.templates.includes(templateID)) {
            throw new BadRequestError(`User with id ${userID} does not have template with id ${templateID}`);
        }

        const template = await Template.findById(templateID);
        if (!template) {
            if (user.templates.includes(templateID)) {
                user.templates = user.templates.filter((template) => template.toString() !== templateID);
                await user.save();
                res.status(StatusCodes.OK).json({ msg: `Template with id ${templateID} was deleted` });
            }
            throw new NotFoundError(`Template with id ${templateID} does not exist`);
        }

        await template.deleteOne();
        user.templates = user.templates.filter((template) => template.toString() !== templateID);
        await user.save();
        res.status(StatusCodes.OK).json({ msg: `Template '${template.name}' was deleted` });
    } catch (error) {
        throw new BadRequestError(error);
    }
}

const getSingleWorkoutTemplate = async (req, res) => {
    const { user: userID } = req.body;
    const { templateID } = req.params;

    if (!templateID) {
        throw new BadRequestError("Please provide templateID");
    }

    try {
        const user = await User.findById(userID).populate("templates").lean();
        if (!user) {
            throw new NotFoundError(`User with id ${userID} does not exist`);
        }

        const template = await Template.findById(templateID);
        if (!template) {
            throw new NotFoundError(`Template with id ${templateID} does not exist`);
        }

        res.status(StatusCodes.OK).json({ template });
    } catch (error) {
        throw new BadRequestError(error);
    }
}

const getAllWorkoutTemplates = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate({ 
            path: "templates",
            select: "_id name"
        }).lean();
        if (!user) {
            throw new NotFoundError(`User with id ${userID} does not exist`);
        }

        res.status(StatusCodes.OK).json({ templates: user.templates });
    } catch (error) {
        throw new BadRequestError(error);
    }
}

const searchWorkoutTemplates = async (req, res) => {
    const { user: userID, searchText } = req.body;
    let { limit } = req.query;

    limit = limit ? limit : 10;

    if (!searchText) {
        throw new BadRequestError("Please provide search text");
    }

    try {
        const user = await User.findById(userID).populate({
            path: "templates",
            match: {
                name: { $regex: searchText, $options: "i" },
            },
            select: "_id name",
        })
        if (!user) {
            throw new NotFoundError(`User with id ${userID} does not exist`);
        }

        res.status(StatusCodes.OK).json({ templates: user.templates });
    } catch (error) {
        throw new BadRequestError(error);
    }
}

module.exports = {
    createWorkoutTemplate,
    deleteWorkoutTemplate,
    getSingleWorkoutTemplate,
    getAllWorkoutTemplates,
    searchWorkoutTemplates
}