const { BadRequestError } = require('../errors');
const User = require('../models/User');

const updateTournamentRanking = async (tournament) => {
    try {
        if (tournament.determinant === 'workouts') {
            // rewrite if code in for loop

            for (let i = 0; i < tournament.ranking.length; i++) {
                let score = 0;
                const user = await User.findById(tournament.ranking[i].user).populate('workouts');
                if (!user) {
                    throw new BadRequestError(`User with id ${tournament.ranking[i].user} not found`);
                }
                user.workouts.filter(workout => workout.startDate > tournament.startDate && workout?.endDate < tournament.endDate).forEach(() => {
                    score += 1;
                });
                tournament.ranking[i].score = score;
            }

            tournament.ranking = tournament.ranking.sort((a, b) => b.score - a.score);
        }
        else if (tournament.determinant === 'time') {
            for (let i = 0; i < tournament.ranking.length; i++) {
                let score = 0;
                const user = await User.findById(tournament.ranking[i].user).populate('workouts');
                if (!user) {
                    throw new BadRequestError(`User with id ${tournament.ranking[i].user} not found`);
                }
                user.workouts.filter(workout => workout.startDate > tournament.startDate && workout?.endDate < tournament.endDate).forEach((workout) => {
                    score += workout.duration;
                });
                tournament.ranking[i].score = score;
            }
        }
        else if (tournament.determinant === 'weight') {
            for (let i = 0; i < tournament.ranking.length; i++) {
                let score = 0;
                const user = await User.findById(tournament.ranking[i].user).populate({
                    path: 'workouts',
                    populate: {
                        path: 'exercises',
                    },
                });
                if (!user) {
                    throw new BadRequestError(`User with id ${tournament.ranking[i].user} not found`);
                }
                user.workouts.filter(workout => workout.startDate > tournament.startDate && workout?.endDate < tournament.endDate).forEach((workout) => {
                    for (let j = 0; j < workout.exercises.length; j++) {
                        console.log(workout.exercises[j]);
                        if (workout.exercises[j].weight && workout.exercises[j].reps && workout.exercises[j].sets) {
                            score += workout.exercises[j].weight * workout.exercises[j].reps * workout.exercises[j].sets;
                        } 
                    }
                });
                tournament.ranking[i].score = score;
            }
        }
        
        return tournament;
    } catch (err) {
        throw new BadRequestError(err);
    }
}

module.exports = updateTournamentRanking;