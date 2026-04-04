import mongoose from 'mongoose';
import { Player, IPlayer } from '@/models/Player';
import { MatchScore, IMatchScore, IMatchScoreStats } from '@/models/MatchScore';
import { Team, ITeam, ITeamPlayer } from '@/models/Team';
import { Contest, IContest } from '@/models/Contest';
import { Match, IMatch } from '@/models/Match';

interface PlayerPoints {
  externalId: string;
  points: number;
  stats: IMatchScoreStats;
}

export async function updatePlayerScore(
  matchId: string,
  playerPoints: PlayerPoints[]
): Promise<IMatchScore[]> {
  const matchObjectId = new mongoose.Types.ObjectId(matchId);
  const updatedScores: IMatchScore[] = [];

  for (const pp of playerPoints) {
    const player = await Player.findOne({ externalId: pp.externalId });
    if (!player) {
      continue;
    }

    const existingScore = await MatchScore.findOne({
      matchId: matchObjectId,
      playerId: player._id,
    });

    if (existingScore) {
      existingScore.points = pp.points;
      existingScore.stats = pp.stats;
      existingScore.lastUpdated = new Date();
      await existingScore.save();
      updatedScores.push(existingScore);
    } else {
      const newScore = new MatchScore({
        matchId: matchObjectId,
        playerId: player._id,
        externalId: pp.externalId,
        points: pp.points,
        stats: pp.stats,
        lastUpdated: new Date(),
      });
      await newScore.save();
      updatedScores.push(newScore);
    }
  }

  return updatedScores;
}

export async function calculateTeamScores(matchId: string): Promise<ITeam[]> {
  const matchObjectId = new mongoose.Types.ObjectId(matchId);

  const contest = await Contest.findOne({ matchId: matchObjectId });
  if (!contest) {
    return [];
  }

  const teams = await Team.find({ contestId: contest._id });
  const updatedTeams: ITeam[] = [];

  for (const team of teams) {
    let totalPoints = 0;
    const captainObjectId = team.captainId;
    const viceCaptainObjectId = team.viceCaptainId;

    for (const teamPlayer of team.players) {
      const matchScore = await MatchScore.findOne({
        matchId: matchObjectId,
        playerId: teamPlayer.playerId,
      });

      if (matchScore) {
        let playerMultiplier = 1;
        if (captainObjectId.equals(teamPlayer.playerId)) {
          playerMultiplier = 2;
        } else if (viceCaptainObjectId.equals(teamPlayer.playerId)) {
          playerMultiplier = 1.5;
        }

        totalPoints += matchScore.points * playerMultiplier;
      }
    }

    team.score = totalPoints;
    await team.save();
    updatedTeams.push(team);
  }

  return updatedTeams;
}

export async function getLeaderboard(contestId: string): Promise<ITeam[]> {
  const contestObjectId = new mongoose.Types.ObjectId(contestId);

  const teams = await Team.find({ contestId: contestObjectId }).sort({ score: -1 });

  for (let i = 0; i < teams.length; i++) {
    teams[i].rank = i + 1;
    await teams[i].save();
  }

  return teams;
}