// Description: Middleware to check if a challenge is completed and update user stats accordingly.

const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Workout = require('../models/Workout')
const drawChallege = require('../utils/challenges');
const increaseRP = require('../utils/increaseRP');
const InternalServerError = require('../errors/internal-server-error');

const workoutsCompleted = async (req, res, next) => {

    const user = await User.findById(req.body.user);
    const allChallenges = await Challenge.find({ _id: { $in: user.challenges } });
    const challenges = allChallenges.filter(challenge => challenge.status === 'ongoing' &&
                                                        challenge.goal === 'Complete workouts' &&
                                                        new Date(challenge.endDate) > new Date()
    );
    if(challenges.length!=0 && user.workouts){
        //const tournaments = user.tournaments.filter(tournament =>tournament.endDate > new Date());
        const allWorkouts = await Workout.find({ _id: { $in: user.workouts } });
        const workouts = allWorkouts.filter(workout => workout.endDate != null);
 
        const target = workouts.length;
        console.log(target);
        workouts.forEach(async(workout)=>{          
            challenges.map(async (challenge) => {
                if(new Date(workout.endDate)>new Date(challenge.startDate)){
                    if(target == challenge.target){
                        challenge.status = 'completed';
                        challenge_new = await drawChallege(challenge.difficulty);
                        await user.challenges.push(challenge_new);
                        await increaseRP(user._id,ChallengeDifficulty(challenge.difficulty));
                        await challenge.save();
                        await user.save();

                        console.log('workoutsCompleted')
                    }
                }
            });   
        });      
    }
       
    next();
}

const tournamentAttend = async (req, res, next) => {

    const user = await User.findById(req.body.user);
    const allChallenges = await Challenge.find({ _id: { $in: user.challenges } });
    const challenges = allChallenges.filter(challenge => challenge.status === 'ongoing' &&
                                                        challenge.goal === 'Attend tournament' &&
                                                        new Date(challenge.endDate) > new Date()
    );

    if(challenges.length!=0 && user.tournaments){
        const allTournaments = await Tournament.find({ _id: { $in: user.tournaments } });
        const tournaments = allTournaments.filter(tournament => new Date() > new Date(tournament.endDate));

        let target = 0;
        tournaments.forEach(async(tournament)=>{          
            target++;
            challenges.map(async (challenge) => {
                if(new Date(tournament.endDate)>new Date(challenge.startDate)){
                    if(target == challenge.target){
                        challenge.status = 'completed';
                        challenge_new = await drawChallege(challenge.difficulty);
                        await user.challenges.push(challenge_new);
                        await increaseRP(user._id,ChallengeDifficulty(challenge.difficulty));
                        await challenge.save();
                        await user.save();

                        console.log('tournamentAttend');
                    }  
                }
            });
        });      
    }
       
    next();
}

const tournamentPodiumFinish = async (req, res, next) => {

    const user = await User.findById(req.body.user);
    const allChallenges = await Challenge.find({ _id: { $in: user.challenges } });
    const challenges = allChallenges.filter(challenge => challenge.status === 'ongoing' &&
                                                        challenge.goal === 'Tournament podium finish' &&
                                                        new Date(challenge.endDate) > new Date()
    );

    if(challenges.length!=0 && user.tournaments){
        const allTournaments = await Tournament.find({ _id: { $in: user.tournaments } });
        const tournaments = allTournaments.filter(tournament => new Date() > new Date(tournament.endDate));

        let target = 0;
        tournaments.forEach(async(tournament)=>{          
            const sortedRanking = tournament.ranking.sort((a, b) => b.score - a.score);
            const top3Users = sortedRanking.slice(0, 3).map(rank => rank.user);
            const isIdPresent = top3Users.some(id => id.equals(user._id));

            if(isIdPresent){
                target++;
                challenges.map(async (challenge) => {
                    if(new Date(tournament.endDate)>new Date(challenge.startDate)){
                        if(target == challenge.target){
                            challenge.status = 'completed';
                            challenge_new = await drawChallege(challenge.difficulty);
                            await user.challenges.push(challenge_new);
                            await increaseRP(user._id,ChallengeDifficulty(challenge.difficulty));
                            await challenge.save();
                            await user.save();

                            console.log('tournamentPodiumFinish');
                        }  
                    }
                });
            }
        });      
    }
       
    next();
}

const winTournament = async (req, res, next) => {

    const user = await User.findById(req.body.user);
    const allChallenges = await Challenge.find({ _id: { $in: user.challenges } });
    const challenges = allChallenges.filter(challenge => challenge.status === 'ongoing' &&
                                                        challenge.goal === 'Win tournament' &&
                                                        new Date(challenge.endDate) > new Date()
    );

    if(challenges.length!=0 && user.tournaments){
        //const tournaments = user.tournaments.filter(tournament =>tournament.endDate > new Date());
        const allTournaments = await Tournament.find({ _id: { $in: user.tournaments } });
        const tournaments = allTournaments.filter(tournament => new Date() > new Date(tournament.endDate));

        let target = 0;
        tournaments.forEach(async(tournament)=>{          
            const sortedRanking = tournament.ranking.sort((a, b) => b.score - a.score);
            const topUser = sortedRanking.length > 0 ? sortedRanking[0].user : null;

            const isHighestScore = topUser && topUser.equals(user._id);
            if(isHighestScore){            
                target++;

                challenges.map(async (challenge) => {
                    if(new Date(tournament.endDate)>new Date(challenge.startDate)){
                        if(target == challenge.target){
                            challenge.status = 'completed';
                            challenge_new = await drawChallege(challenge.difficulty);
                            await user.challenges.push(challenge_new);
                            await increaseRP(user._id,ChallengeDifficulty(challenge.difficulty));
                            await challenge.save();
                            await user.save();

                            
                            console.log('winTournament');
                        }                  
                    }
                });
            }
        });      
    }
       
    next();
}

const ChallengeDifficulty = (diff) => {

    switch(diff){
        case 'easy':
            return 'challengeEasy';      
        case 'medium':
            return 'challengeMedium';  
        case 'hard':
            return 'challengeHard';
        default:
            throw new InternalServerError("Failed to get challenge difficulty");
    }

}

module.exports = {workoutsCompleted,tournamentPodiumFinish,winTournament,tournamentAttend}