// Description: Middleware to check if a challenge is completed and update user stats accordingly.

const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Tournament = require('../models/Tournament')
const drawChallege = require('../utils/challenges');
const increaseRP = require('../utils/increaseRP');

const workoutsCompleted = async (req, res, next) => {
    // example

    // check if there is a challenge for completed workouts, if so check if challenge completed
    // if challenge completed, increment user stats (increaseRP), change it's status, draw a new challenge

    next();
}

const tournamentPodiumFinish = async (req, res, next) => {

    const user = await User.findById(req.body.user);
    const allChallenges = await Challenge.find({ _id: { $in: user.challenges } });
    const challenges = allChallenges.filter(challenge => challenge.status === 'ongoing' &&
                                                        challenge.goal === 'Tournament podium finish'
    );

    if(challenges.length!==0 && user.tournaments){
        //const tournaments = user.tournaments.filter(tournament =>tournament.endDate > new Date());
        const allTournaments = await Tournament.find({ _id: { $in: user.tournaments } });
        const tournaments = allTournaments.filter(tournament => new Date() > new Date(tournament.endDate));

        tournaments.forEach(async(tournament)=>{          
            const sortedRanking = tournament.ranking.sort((a, b) => b.score - a.score);
            const top3Users = sortedRanking.slice(0, 3).map(rank => rank.user);
            const isIdPresent = top3Users.some(id => id.equals(user._id));

            if(isIdPresent){
                // Challenge complete
                challenges.map(async (challenge) => {
                    if(new Date(tournament.endDate)>new Date(challenge.startDate)){
                        console.log('jupi');
                        challenge.status = 'completed';
                        challenge_new = await drawChallege(challenge.difficulty);
                        await user.challenges.push(challenge_new);
                        await increaseRP(user._id,'tournamentPodium');
                        await challenge.save();
                        await user.save();
                    }
                });
            }
        });      
    }
       
    next();
}

const winTournament = async (req, res, next) => {

    console.log('win');
    const user = await User.findById(req.body.user);
    const allChallenges = await Challenge.find({ _id: { $in: user.challenges } });
    const challenges = allChallenges.filter(challenge => challenge.status === 'ongoing' &&
                                                        challenge.goal === 'Win tournament'
    );
    console.log('win');
    if(challenges.length!==0 && user.tournaments){
        //const tournaments = user.tournaments.filter(tournament =>tournament.endDate > new Date());
        const allTournaments = await Tournament.find({ _id: { $in: user.tournaments } });
        const tournaments = allTournaments.filter(tournament => new Date() > new Date(tournament.endDate));
        console.log('win');
        tournaments.forEach(async(tournament)=>{          
            const sortedRanking = tournament.ranking.sort((a, b) => b.score - a.score);
            const topUser = sortedRanking.length > 0 ? sortedRanking[0].user : null;

            const isHighestScore = topUser && topUser.equals(user._id);
            console.log('win');
            if(isHighestScore){
                // Challenge complete
                challenges.map(async (challenge) => {
                    if(new Date(tournament.endDate)>new Date(challenge.startDate)){
                        console.log('win3');
                        challenge.status = 'completed';
                        challenge_new = await drawChallege(challenge.difficulty);
                        await user.challenges.push(challenge_new);
                        await increaseRP(user._id,'tournamentWin');
                        await challenge.save();
                        await user.save();
                    }
                });
            }
        });      
    }
       
    next();
}

module.exports = {workoutsCompleted,tournamentPodiumFinish,winTournament}