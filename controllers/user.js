const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const User = require("../models/User");
const Workout = require("../models/Workout");
const Tournament = require("../models/Tournament");
const increaseRP = require("../utils/increaseRP");

const getUser = async (req, res) => {
    const { id } = req.params;
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const getUser = await User.findById(id)
            .populate("friends")
            .populate("workouts")
            .populate("tournaments")
            .populate("receivedFriendsRequests")
            .populate("sentFriendsRequests")
            .select(["-password", "-notifications"]);
        if (!getUser) {
            throw new NotFoundError(`User your are looking for does not exist`);
        }

        var fieldsToDelete = [];

        if (userID === id) {
            fieldsToDelete = [];
        } else if (getUser.friends.includes(userID)) {
            fieldsToDelete = ["receivedFriendsRequests", "sentFriendsRequests"];
        } else {
            fieldsToDelete = [
                "dateOfBirth",
                "height",
                "weight",
                "gender",
                "friends",
                "workouts",
                "tournaments",
                "receivedFriendsRequests",
                "sentFriendsRequests",
            ];
        }

        var responseData = getUser.toObject();
        fieldsToDelete.forEach((field) => {
            delete responseData[field];
        });
        console.log(responseData);
        responseData.workouts?.filter(
            (workout) =>
                workout.company.includes(user) ||
                workout.access.includes(user) ||
                workout.user.toString() === user
        );

        res.status(StatusCodes.OK).json({ user: responseData });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

const getCurrentUser = async (req, res) => {
    const { user: userID } = req.body;


    try {
        await increaseRP(userID, "workout");

        const user = await User.findById(userID)
            .populate("friends")
            .populate("workouts")
            .populate("tournaments")
            .populate("receivedFriendsRequests")
            .populate("sentFriendsRequests")
            .select(["-password", "-notifications"]);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({ user });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

const updateUser = async (req, res) => {
    const { user: userID } = req.body;
    const updates = Object.keys(req.body);
    updates.pop();  // deletes user field from updates
    const allowedUpdates = [
        "email",
        "dateOfBirth",
        "height",
        "firstName",
        "lastName",
        "gender",
    ];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        throw new BadRequestError(`Invalid updates! Only ${allowedUpdates.join(", ")} can be changed`);
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        updates.forEach((update) => (user[update] = req.body[update]));
        await user.save();
        res.status(StatusCodes.OK).json({ user });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

const deleteUser = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        for (let i = 0; i < user.friends.length; i++) {
            const friend = await User.findById(user.friends[i]);
            friend.friends = friend.friends.filter((friend) => friend.toString() !== userID);
            await friend.save();
        }

        for (let i = 0; i < user.receivedFriendsRequests.length; i++) {
            const friend = await User.findById(user.receivedFriendsRequests[i]);
            friend.sentFriendsRequests = friend.sentFriendsRequests.filter(
                (friend) => friend.toString() !== userID
            );
            await friend.save();
        }

        for (let i = 0; i < user.sentFriendsRequests.length; i++) {
            const friend = await User.findById(user.sentFriendsRequests[i]);
            friend.receivedFriendsRequests = friend.receivedFriendsRequests.filter(
                (friend) => friend.toString() !== userID
            );
            await friend.save();
        }

        for (let i = 0; i < user.workouts.length; i++) {
            const workout = await Workout.findById(user.workouts[i]);
            if (workout.user.toString() === userID) {
                await workout.deleteOne();
            } else {
                workout.company = workout.company.filter((company) => company.toString() !== userID);
                workout.access = workout.access.filter((access) => access.toString() !== userID);
                await workout.save();
            }
        }

        for (let i = 0; i < user.tournaments.length; i++) {
            const tournament = await Tournament.findById(user.tournaments[i]);
            if (tournament.participants.length === 1 && tournament.participants[0].toString() === userID) {
                await tournament.deleteOne();
            }
            else {
                tournament.participants = tournament.participants.filter(
                    (participant) => participant.toString() !== userID
                );
                await tournament.save();
            }
        }

        await user.deleteOne();
        res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getNotifications = async (req, res) => {
    const { user: userID } = req.body;
    const { count } = req.query;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const notifications = user.notifications.sort((a, b) => b.date - a.date).slice(0, count);

        res.status(StatusCodes.OK).json({ notifications: notifications });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getCurrentWeight = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
    
        const weightHistory = user.weightHistory;
        if (!weightHistory || weightHistory.length === 0 ) {
            throw new NotFoundError("No weight data found");
        }
    
        const currentWeight = weightHistory.sort((a, b) => b.date - a.date)[0];
    
        res.status(StatusCodes.OK).json({currentWeight: currentWeight.weight});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateCurrentWeight = async (req, res) => {
    const { user: userID } = req.body;
    const { weight } = req.body;

    if (!weight) {
        throw new BadRequestError("Please provide weight");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        user.weightHistory.push({ weight });
        await user.save();

        res.status(StatusCodes.OK).json({ updatedWeight: weight});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getWeightHistory = async (req, res) => { 
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
    
        res.status(StatusCodes.OK).json({weightHistory: user.weightHistory});
    } catch (err) {
        throw new BadRequestError(err);
    }

}

const getFirstName = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({firstName: user.firstName});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateFirstName = async (req, res) => {
    const { user: userID } = req.body;
    const { firstName } = req.body;

    if (!firstName) {
        throw new BadRequestError("First name is a required field, it cannot be empty");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        if (user.firstName === firstName) {
            throw new BadRequestError(`First name is already set to ${firstName}`);
        }

        user.firstName = firstName;
        await user.save();

        res.status(StatusCodes.OK).json({ updatedFirstName: user.firstName });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getLastName = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({lastName: user.lastName ?? ""});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateLastName = async (req, res) => {
    const { user: userID } = req.body;
    const { lastName } = req.body;

    if (lastName === "") 
        lastName = undefined;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        if (user.lastName === lastName) {
            throw new BadRequestError(`Last name is already set to ${lastName ?? "unset"}`);
        }

        user.lastName = lastName;
        await user.save();

        res.status(StatusCodes.OK).json({ updatedLastName: user.lastName });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getEmail = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({email: user.email});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateEmail = async (req, res) => {
    const { user: userID } = req.body;
    const { email } = req.body;

    if (!email) {
        throw new BadRequestError("Email is a required field, it cannot be empty");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        if (user.email === email) {
            throw new BadRequestError(`Email is already set to ${email}`);
        }

        user.email = email;
        await user.validate();
        await user.save().catch((err) => {
            if (err.code === 11000) {
                throw new BadRequestError(`Email ${email} is already taken`);
            }
        });

        res.status(StatusCodes.OK).json({ updatedEmail: user.email });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getDateOfBirth = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({dateOfBirth: user.dateOfBirth ?? ""});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateDateOfBirth = async (req, res) => {
    const { user: userID } = req.body;
    let { dateOfBirth } = req.body;

    if (dateOfBirth === "") 
        dateOfBirth = undefined;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
        
        user.dateOfBirth = dateOfBirth;
        await user.save();

        res.status(StatusCodes.OK).json({ updatedDateOfBirth: user.dateOfBirth ?? "" });
    }
    catch (err) {
        throw new BadRequestError(err);
    }
}
 
const getHeightHistory = async (req, res) => {
    const { user: userID } = req.body;
 
    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
 
        res.status(StatusCodes.OK).json({heightHistory: user.heightHistory});
    } catch (err) {
        throw new BadRequestError(err);
    }
}
 
const updateCurrentHeight = async (req, res) => {
    const { user: userID } = req.body;
    const { height } = req.body;

    if (!height) {
        throw new BadRequestError("Please provide height");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        user.heightHistory.push({ height });
        await user.save();

        res.status(StatusCodes.OK).json({ updatedHeight: height });
    } catch (err) {
        throw new BadRequestError(err);
    }
}
 
const getCurrentHeight = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
    
        const heightHistory = user.heightHistory;
        if (!heightHistory || heightHistory.length === 0 ) {
            throw new NotFoundError("No height data found");
        }
    
        const currentHeight = heightHistory.sort((a, b) => b.date - a.date)[0];
    
        res.status(StatusCodes.OK).json({currentHeight: currentHeight.height});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const getGender = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({gender: user.gender ?? ""});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateGender = async (req, res) => {
    const { user: userID, gender } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        if (user.gender === gender) {
            throw new BadRequestError(`Date of birth is already set to ${gender ?? "unset"}`);
        }
        
        user.gender = gender;
        await user.save();

        res.status(StatusCodes.OK).json({ updatedGender: user.gender ?? "" });
    }
    catch (err) {
        throw new BadRequestError(err);
    }
}

/** Get all suplements of the user with current dose
 * @return {Object} suplements
 */
const getAllSuplements = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID).populate("suplements");
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplements = user.suplements.map((suplement) => ({name: suplement.name, status: suplement.status, currentDose: suplement.history.sort((a, b) => b.date - a.date)[0]}))

        res.status(StatusCodes.OK).json({suplements: suplements});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Get suplement of the user with current dose
 * @query name
 * @return {Object} suplement 
 */
const getSuplement = async (req, res) => {
    const { user: userID } = req.body;
    const { name } = req.query;

    if (!name) {
        throw new BadRequestError("Please provide name of the suplement");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplement = user.suplements.find((suplement) => suplement.name === name);
        if (!suplement) {
            throw new NotFoundError(`Suplement with name ${name} not found`);
        }

        res.status(StatusCodes.OK).json({suplement: {
            name: suplement.name,
            status: suplement.status,
            currentDose: suplement.history.sort((a, b) => b.date - a.date)[0]
        }});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Add a new suplement to the user
 * @body name, status, dose, frequency, frequencyUnit
 * @return {Object} addedSuplement
 */
const addSuplement = async (req, res) => {
    const { user: userID, name, status, dose, frequency, frequencyUnit } = req.body;

    if (!name || !status || !dose || !frequency || !frequencyUnit) {
        throw new BadRequestError("Please provide name, status, dose, frequency and frequency unit");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplement = user.suplements.find((suplement) => suplement.name === name);
        if (suplement) {
            throw new BadRequestError(`Suplement with name ${name} already exists`);
        }

        user.suplements.push({ name, status, history: [{ dose, frequency, frequencyUnit }] });
        await user.save();

        res.status(StatusCodes.CREATED).json({ msg: "Suplement added successfully", addedSuplement: user.suplements[user.suplements.length - 1]});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Get suplement with history of dosing
 * @query name
 * @return {Object} suplement
 */
const getSuplementHistory = async (req, res) => {
    const { user: userID } = req.body;
    const { name } = req.query;

    if (!name) {
        throw new BadRequestError("Please provide name of the suplement");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplement = user.suplements.find((suplement) => suplement.name === name);
        if (!suplement) {
            throw new NotFoundError(`Suplement with name ${name} not found`);
        }

        res.status(StatusCodes.OK).json({suplement: suplement});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Update dose of a suplement
 * @body name, dose, frequency, frequencyUnit
 * @return {Object} updatedSuplement
 */
const updateSuplementDose = async (req, res) => {
   const { user: userID, name, dose, frequency, frequencyUnit } = req.body;

    if (!name || !dose || !frequency || !frequencyUnit) {
         throw new BadRequestError("Please provide name, dose, frequency and frequency unit");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplement = user.suplements.find((suplement) => suplement.name === name);
        if (!suplement) {
            throw new NotFoundError(`Suplement with name ${name} not found`);
        }

        suplement.history.push({ dose, frequency, frequencyUnit });
        await user.save();

        res.status(StatusCodes.OK).json({ updatedSuplement: {
                name: suplement.name,
                status: suplement.status,
                currentDose: suplement.history.sort((a, b) => b.date - a.date)[0]
        } });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateSuplementName = async (req, res) => {
    const { user: userID, name, newName } = req.body;

    if (!name || !newName) {
        throw new BadRequestError("Please provide name and new name of the suplement");
    }

    if (name === newName) {
        throw new BadRequestError("New name cannot be the same as the old name");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplement = user.suplements.find((suplement) => suplement.name === name);
        if (!suplement) {
            throw new NotFoundError(`Suplement with name ${name} not found`);
        }

        suplement.name = newName;
        await user.save();

        res.status(StatusCodes.OK).json({ updatedSuplement: suplement });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const updateSuplementStatus = async (req, res) => {
    const { user: userID, name, status } = req.body;

    if (!name || !status) {
        throw new BadRequestError("Please provide name and status of the suplement");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const suplement = user.suplements.find((suplement) => suplement.name === name);
        if (!suplement) {
            throw new NotFoundError(`Suplement with name ${name} not found`);
        }

        if (suplement.status === status) {
            throw new BadRequestError(`Suplement status is already set to ${status}`);
        }

        suplement.status = status;
        await user.save();

        res.status(StatusCodes.OK).json({ updatedSuplement: suplement });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

const searchUser = async(req,res) =>{
    const { searchText } = req.body;
    const { count } = req.query;
    
    try {
        let users = await User.find(
            {
                $or: [
                    {firstName: {$regex: searchText, $options: 'i'}},
                    {lastName: {$regex: searchText, $options: 'i'}},
                    {email: {$regex: searchText, $options: 'i'}}
                ]
            },
        ).select('_id firstName lastName email').limit(count);

        users = users.filter(user => {
            return user._id.toString() !== req.body.user;
        });

        res.status(StatusCodes.OK).json({users})
    } catch (err) {
        throw new BadRequestError(err.message);
    }
}

module.exports = { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, getCurrentWeight, 
    updateCurrentWeight, getWeightHistory, getFirstName, updateFirstName, getLastName, updateLastName, 
    getEmail, updateEmail, getDateOfBirth, updateDateOfBirth, getHeightHistory, getCurrentHeight, 
    updateCurrentHeight, getGender, updateGender, getAllSuplements, getSuplement, addSuplement, 
    getSuplementHistory, updateSuplementDose, updateSuplementName, updateSuplementStatus, searchUser};
