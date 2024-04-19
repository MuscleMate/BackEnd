// Description: Middleware to check if a challenge is completed and update user stats accordingly.

const workoutsCompleted = async (req, res, next) => {
    // example

    // check if there is a challenge for completed workouts, if so check if challenge completed
    // if challenge completed, increment user stats (increaseRP), change it's status, draw a new challenge

    next();
}

module.exports = {workoutsCompleted}