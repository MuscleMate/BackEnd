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
        
        return tournament;
    } catch (err) {
        throw new BadRequestError(err);
    }
}

module.exports = updateTournamentRanking;