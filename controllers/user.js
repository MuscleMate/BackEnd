const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const User = require("../models/User");
const Workout = require("../models/Workout");
const Tournament = require("../models/Tournament");
const increaseRP = require("../utils/increaseRP");

/** Get user by id
 * @url GET /user/:id
 * @param id The user id
 * @response user object, amount of information depends on the user's 
 * relationship with the user who is requesting the data
 */
const getUser = async (req, res) => {
    const { id } = req.params;
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const getUser = await User.findById(id)
            .populate({
                path: "friends",
                select: ["firstName", "lastName", "email", "_id", "RP"]
            })
            .populate("workouts")
            .populate("tournaments")
            .populate("challenges")
            .populate({
                path: "receivedFriendsRequests",
                select: ["firstName", "lastName", "email", "_id", "RP"]
            })
            .populate({
                path: "sentFriendsRequests",
                select: ["firstName", "lastName", "email", "_id", "RP"]
            })
            .select(["-password", "-notifications"]);
        if (!getUser) {
            throw new NotFoundError(`User your are looking for does not exist`);
        }

        var fieldsToDelete = [];
        if (userID === id) {
            fieldsToDelete = [];
        } else if (getUser.friends.find((friend) => friend._id.toString() === userID)) {
            fieldsToDelete = [
                "measurements",
                "suplements",
                "receivedFriendsRequests", 
                "sentFriendsRequests",
                "challenges"];
        } else {
            fieldsToDelete = [
                "dateOfBirth",
                "heightHistory",
                "weightHistory",
                "gender",
                "friends",
                "workouts",
                "tournaments",
                "receivedFriendsRequests",
                "sentFriendsRequests",
                "suplements",
                "measurements",
                "challenges"
            ];
        }

        var responseData = getUser.toObject();
        fieldsToDelete.forEach((field) => {
            delete responseData[field];
        });

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

/** Get current user
 * @url GET /user
 * @response user object
 */
const getCurrentUser = async (req, res) => {
    const { user: userID } = req.body;

    try {
        await increaseRP(userID, "workout");

        const user = await User.findById(userID)
            .populate({
                path: "friends",
                select: ["firstName", "lastName", "email", "_id", "RP"]
            })
            .populate("workouts")
            .populate("tournaments")
            .populate({
                path: "receivedFriendsRequests",
                select: ["firstName", "lastName", "_id", "RP"]
            })
            .populate({
                path: "sentFriendsRequests",
                select: ["firstName", "lastName", "_id", "RP"]
            })
            .populate("challenges")
            .select(["-password"]);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        res.status(StatusCodes.OK).json({ user });
    } catch (err) {
        throw new BadRequestError(err);
    }
};

/** Update user
 * @url PUT /user
 * @body user, email, dateOfBirth, firstName, lastName, gender
 * @response updated user object
 */
const updateUser = async (req, res) => {
    const { user: userID } = req.body;
    const updates = Object.keys(req.body);
    updates.pop();  // deletes user field from updates
    const allowedUpdates = [
        "email",
        "dateOfBirth",
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

/** Delete user
 * @url DELETE /user
 * @body user
 * @response message
 */
const deleteUser = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        for (let i = 0; i < user.friends?.length; i++) {
            const friend = await User.findById(user.friends[i]);
            friend.friends = friend.friends.filter((friend) => friend.toString() !== userID);
            await friend.save();
        }

        for (let i = 0; i < user.receivedFriendsRequests?.length; i++) {
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
            if (tournament.contestants.length === 1 && tournament.contestants[0].toString() === userID) {
                await tournament.deleteOne();
            }
            else {
                tournament.contestants = tournament.contestants.filter(
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

/** Get user's notifications
 * @url GET /user/notifications
 * @query count - number of notifications to return
 * @response notifications
 */
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

/** Get user's weight
 * @url GET /user/weight
 * @response currentWeight
 */
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

/** Update user's weight
 * @url PUT /user/weight
 * @body user, weight
 * @response updatedWeight
 * @description Adds a new weight to the user's weight history
 */
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

/** Get user's weight history
 * @url GET /user/weight/history
 * @response weightHistory
 */
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

/** Get user's first name
 * @url GET /user/firstName
 * @response firstName
 */
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

/** Update user's first name
 * @url PUT /user/firstName
 * @body user, firstName
 * @response updatedFirstName
 */
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

/** Get user's last name
 * @url GET /user/lastName
 * @response lastName
 */
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

/** Update user's last name
 * @url PUT /user/lastName
 * @body user, lastName
 * @response updatedLastName
 */
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

/** Get user's email
 * @url GET /user/email
 * @response email
 */
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

/** Update user's email
 * @url PUT /user/email
 * @body user, email
 * @response updatedEmail
 */
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

/** Get user's date of birth
 * @url GET /user/dateOfBirth
 * @response dateOfBirth
 */
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

/** Update user's date of birth
 * @url PUT /user/dateOfBirth
 * @body user, dateOfBirth
 * @response updatedDateOfBirth
 */
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

/** Get user's height history
 * @url GET /user/height/history
 * @response heightHistory - list of heights with dates
 */
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

/** Update user's current height
 * @url PUT /user/height
 * @body user, height
 * @response updatedHeight
 * @description Adds a new height to the user's height history
 */
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

/** Get user's current height
 * @url GET /user/height
 * @response currentHeight
 */
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

/** Get user's gender
 * @url GET /user/gender
 * @response user's gender
 */
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

/** Update user's gender
 * @url PUT /user/gender
 * @response updatedGender
 */
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
 * @url GET /user/suplement/all
 * @response suplements
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
 * @url GET /user/suplement
 * @query name - name of the suplement
 * @response suplement 
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
 * @url POST /user/suplement
 * @body name, status, dose, frequency, frequencyUnit
 * @response addedSuplement
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

        res.status(StatusCodes.CREATED).json({ addedSuplement: user.suplements[user.suplements.length - 1]});
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Get suplement with history of dosing
 * @url GET /user/suplement/dose/history
 * @query name - name of the suplement
 * @response {Object} suplement
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
 * @url PUT /user/suplement/dose
 * @body name, dose, frequency, frequencyUnit
 * @response updatedSuplement
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

/** Update name of a suplement
 * @url PUT /user/suplement/name
 * @body name, newName
 * @response updatedSuplement
 */
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

/** Update status of a suplement
 * @url PUT /user/suplement/status
 * @body name, status
 * @response updatedSuplement
 */
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

/** Searches for users by first name, last name or email
 * @url POST /user/search
 * @body searchText
 * @query count - number of users to return
 * @response users
 */
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

/** Get user's level
 * @url GET /user/level
 * @response level
 */
const getLevel = async (req, res) => {
    const { user: userID } = req.body;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
        
        const level = user.RP;
        res.status(StatusCodes.OK).json({ level });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Get measuremet history of the user
 * @url GET /user/measurements
 * @query type - type of the measurement (optional)
 * @response measurements - list of measurements with the history of the measurements
 */
const getMeasurementHistory = async (req, res) => {
    const { user: userID } = req.body;
    const { type } = req.query;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
        
        let measurements = user.measurements;
        if (type) {
            measurements = measurements.filter((measurement) => measurement.name === type);
        }

        res.status(StatusCodes.OK).json({ measurements });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Get measurements of the user
 * @url GET /user/measurements
 * @query type - type of the measurement (optional)
 * @response measurements - list of measurements with the current size
 */
const getMeasurements = async (req, res) => {
    const { user: userID } = req.body;
    const { type } = req.query;

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
        
        let measurements = user.measurements;
        if (type) {
            measurements = measurements.filter((measurement) => measurement.name === type);
        }

        measurements = measurements.map((measurement) => ({ name: measurement.name, size: measurement.history.sort((a, b) => b.date - a.date)[0]}))

        res.status(StatusCodes.OK).json({ measurements });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Add a new measurement to the user
 * @url POST /user/measurements
 * @body name, size
 * @response updatedMeasurement
 */
const addMeasurement = async (req, res) => {
    const { user: userID, name, size } = req.body;

    if (!name || !size) {
        throw new BadRequestError("Please provide name and size of the measurement");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
        
        const measurement = user.measurements.find((measurement) => measurement.name === name);
        if (!measurement) {
            user.measurements.push({ name, history: [{ size }] });
        } else {
            measurement.history.push({ size });
        }

        await user.save();

        res.status(StatusCodes.CREATED).json({ measurement: name, updatedMeasurement: size });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Update measurement
 * @url PUT /user/measurements
 * @body name, newName, newSize, measurementID
 * @response updatedMeasurement
 * @description Requires either newName or newSize, if newSize is provided measurementID is required
 */
const updateMeasurement = async (req, res) => {
    const { user: userID, name, measurementID, newName, newSize } = req.body;

    if (!name) {
        throw new BadRequestError("Name of the measurement is required to update measurement");
    }

    if (!newName && !newSize) {
        throw new BadRequestError("New name or new size is required to update measurement");
    }

    if (newSize && !measurementID) {
        throw new BadRequestError("Measurement ID is required to update size of the measurement");
    }

    if (name === newName) {
        throw new BadRequestError("New name cannot be the same as the old name");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }
        
        const measurement = user.measurements.find((measurement) => measurement.name === name);
        if (!measurement) {
            throw new NotFoundError(`Measurement with name ${name} not found`);
        }
        
        if (newSize) {
            const history = measurement.history.find((history) => history._id.toString() === measurementID);
            if (!history) {
                throw new NotFoundError(`Measurement with id ${measurementID} not found`);
            }

            if (newSize === history.size) {
                throw new BadRequestError(`Size is already set to ${newSize}`);
            }

            history.size = newSize;
        }

        if (newName) {
            measurement.name = newName;
        }

        await user.save();

        res.status(StatusCodes.OK).json({ updatedMeasurement: measurement });
    } catch (err) {
        throw new BadRequestError(err);
    }
}

/** Delete measurement
 * @url DELETE /user/measurements
 * @body name, measurementID
 * @response message
 * @description Deletes the measurement with the given id of measurement name
 */
const deleteMeasurement = async (req, res) => {
    const { user: userID, name, measurementID } = req.body;

    if (!name || !measurementID) {
        throw new BadRequestError("Name and measurement ID are required to delete measurement");
    }

    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new NotFoundError(`User with id ${userID} not found`);
        }

        const measurement = user.measurements.find((measurement) => measurement.name === name);
        if (!measurement) {
            throw new NotFoundError(`Measurement with name ${name} not found`);
        }

        const history = measurement.history.find((history) => history._id.toString() === measurementID);
        if (!history) {
            throw new NotFoundError(`Measurement with id ${measurementID} not found`);
        }

        measurement.history = measurement.history.filter((history) => history._id.toString() !== measurementID);
        await user.save();

        res.status(StatusCodes.OK).json({ message: "Measurement deleted successfully" });
    } catch (err) {
        throw new BadRequestError(err); 
    }
}

module.exports = { getUser, updateUser, getCurrentUser, deleteUser, getNotifications, getCurrentWeight, 
    updateCurrentWeight, getWeightHistory, getFirstName, updateFirstName, getLastName, updateLastName, 
    getEmail, updateEmail, getDateOfBirth, updateDateOfBirth, getHeightHistory, getCurrentHeight, 
    updateCurrentHeight, getGender, updateGender, getAllSuplements, getSuplement, addSuplement, 
    getSuplementHistory, updateSuplementDose, updateSuplementName, updateSuplementStatus, searchUser, getLevel,
    getMeasurementHistory, getMeasurements, updateMeasurement, addMeasurement, deleteMeasurement };
