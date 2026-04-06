import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';
import { Contest } from '@/models/Contest';
import { Team } from '@/models/Team';
import { Player } from '@/models/Player';
import { MatchScore } from '@/models/MatchScore';
import { TeamFinalResult } from '@/models/TeamFinalResult';
import { ContestFinalResult } from '@/models/ContestFinalResult';
import { User } from '@/models/User';

interface IPlayerPointsBreakdown {
  category: string;
  description: string;
  points: number;
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { matchId, contestId } = data;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'matchId is required' },
        { status: 400 }
      );
    }

    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const match = await Match.findById(matchId);

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Find all contests for this match
    const contests = contestId
      ? [await Contest.findById(contestId)]
      : await Contest.find({ matchId: matchObjectId });

    const results: any[] = [];

    for (const contest of contests) {
      if (!contest) continue;

      // Check if already saved
      const existingResult = await ContestFinalResult.findOne({ contestId: contest._id });
      if (existingResult?.isSaved) {
        results.push({
          contestId: contest._id.toString(),
          message: 'Already saved',
          skipped: true
        });
        continue;
      }

      // Get all teams for this contest
      const teams = await Team.find({ contestId: contest._id });
      const teamResults: mongoose.Types.ObjectId[] = [];

      // Get all player scores for this match
      const matchScores = await MatchScore.find({ matchId: matchObjectId }).lean();
      const scoresMap = new Map<string, any>();
      matchScores.forEach(score => {
        scoresMap.set(score.playerId.toString(), score);
      });

      // Process each team
      const processedTeams = [];

      for (const team of teams) {
        let totalPoints = 0;
        const captainObjectId = team.captainId;
        const viceCaptainObjectId = team.viceCaptainId;

        const playerResults = [];

        for (const teamPlayer of team.players) {
          const playerIdStr = teamPlayer.playerId.toString();
          const matchScore = scoresMap.get(playerIdStr);

          // Get player details
          const player = await Player.findById(teamPlayer.playerId);

          // Determine multiplier
          let multiplier = 1;
          let isCaptain = false;
          let isViceCaptain = false;

          if (captainObjectId.equals(teamPlayer.playerId)) {
            multiplier = 2;
            isCaptain = true;
          } else if (viceCaptainObjectId.equals(teamPlayer.playerId)) {
            multiplier = 1.5;
            isViceCaptain = true;
          }

          const playerPoints = matchScore ? matchScore.points : 0;
          const finalPoints = playerPoints * multiplier;
          totalPoints += finalPoints;

          // Create breakdown based on stats
          const breakdown: IPlayerPointsBreakdown[] = [];

          if (matchScore?.stats) {
            const stats = matchScore.stats;

            // Batting breakdown
            if (stats.runs > 0) {
              breakdown.push({ category: 'Batting', description: `${stats.runs} runs (+1 each)`, points: stats.runs });
            }
            if (stats.fours > 0) {
              breakdown.push({ category: 'Batting', description: `${stats.fours} fours (+4 each)`, points: stats.fours * 4 });
            }
            if (stats.sixes > 0) {
              breakdown.push({ category: 'Batting', description: `${stats.sixes} sixes (+6 each)`, points: stats.sixes * 6 });
            }

            // Milestones
            if (stats.runs >= 100) {
              breakdown.push({ category: 'Milestone', description: 'Century Bonus', points: 16 });
            } else if (stats.runs >= 75) {
              breakdown.push({ category: 'Milestone', description: '75+ Run Bonus', points: 12 });
              breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
            } else if (stats.runs >= 50) {
              breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
            } else if (stats.runs >= 25) {
              breakdown.push({ category: 'Milestone', description: '25+ Run Bonus', points: 4 });
            }

            // Strike rate
            if (stats.balls >= 10 && stats.strikeRate) {
              if (stats.strikeRate > 170) {
                breakdown.push({ category: 'Strike Rate', description: 'SR > 170 (bonus)', points: 6 });
              } else if (stats.strikeRate > 150) {
                breakdown.push({ category: 'Strike Rate', description: 'SR 150.01-170 (bonus)', points: 4 });
              } else if (stats.strikeRate >= 130) {
                breakdown.push({ category: 'Strike Rate', description: 'SR 130-150 (bonus)', points: 2 });
              } else if (stats.strikeRate <= 70) {
                breakdown.push({ category: 'Strike Rate', description: 'SR <=70 (penalty)', points: -2 });
              }
            }

            // Bowling breakdown
            if (stats.dots > 0) {
              breakdown.push({ category: 'Bowling', description: `${stats.dots} dot balls (+1 each)`, points: stats.dots });
            }
            if (stats.wickets > 0) {
              breakdown.push({ category: 'Bowling', description: `${stats.wickets} wickets (+30 each)`, points: stats.wickets * 30 });
            }
            if (stats.maidens > 0) {
              breakdown.push({ category: 'Bowling', description: `${stats.maidens} maiden over(s) (+12 each)`, points: stats.maidens * 12 });
            }
            if (stats.economy && stats.overs >= 2) {
              if (stats.economy < 5) {
                breakdown.push({ category: 'Economy', description: `Economy <5 (bonus)`, points: 6 });
              } else if (stats.economy < 6) {
                breakdown.push({ category: 'Economy', description: `Economy 5-5.99 (bonus)`, points: 4 });
              } else if (stats.economy <= 7) {
                breakdown.push({ category: 'Economy', description: `Economy 6-7 (bonus)`, points: 2 });
              }
            }

            // Fielding
            if (stats.catches > 0) {
              breakdown.push({ category: 'Fielding', description: `${stats.catches} catch(es) (+8 each)`, points: stats.catches * 8 });
              if (stats.catches >= 3) {
                breakdown.push({ category: 'Fielding', description: '3+ Catches Bonus', points: 4 });
              }
            }
            if (stats.stumpings > 0) {
              breakdown.push({ category: 'Fielding', description: `${stats.stumpings} stumping(s) (+12 each)`, points: stats.stumpings * 12 });
            }
            if (stats.runOuts > 0) {
              breakdown.push({ category: 'Fielding', description: `${stats.runOuts} run-out(s)`, points: stats.runOuts * 6 });
            }

            // Other
            if (stats.playingXI === 1) {
              breakdown.push({ category: 'Other', description: 'Playing XI', points: 4 });
            }
            if (stats.substitute === 1) {
              breakdown.push({ category: 'Other', description: 'Substitute', points: 4 });
            }
          }

          // Add multiplier note if captain/vice-captain
          if (isCaptain) {
            breakdown.push({ category: 'Multiplier', description: 'Captain (2x)', points: Math.round(playerPoints) });
          } else if (isViceCaptain) {
            breakdown.push({ category: 'Multiplier', description: 'Vice-Captain (1.5x)', points: Math.round(playerPoints * 0.5) });
          }

          playerResults.push({
            playerId: teamPlayer.playerId,
            externalId: player?.externalId || '',
            playerName: teamPlayer.name,
            role: teamPlayer.role,
            creditCost: teamPlayer.creditCost,
            points: Math.round(finalPoints * 100) / 100,
            multiplier,
            isCaptain,
            isViceCaptain,
            breakdown,
          });
        }

        // Get user details
        const user = await User.findById(team.userId);

        // Create team final result
        const teamFinalResult = await TeamFinalResult.create({
          contestId: contest._id,
          userId: team.userId,
          teamId: team._id,
          teamName: team.name,
          userName: user?.displayName || 'Unknown',
          totalPoints: Math.round(totalPoints * 100) / 100,
          rank: 0, // Will update after sorting
          players: playerResults,
        });

        teamResults.push(teamFinalResult._id);
        processedTeams.push({
          _id: teamFinalResult._id,
          teamName: team.name,
          userName: user?.displayName || 'Unknown',
          totalPoints: Math.round(totalPoints * 100) / 100,
        });
      }

      // Sort teams by points and update ranks
      const sortedTeams = processedTeams.sort((a, b) => b.totalPoints - a.totalPoints);
      for (let i = 0; i < sortedTeams.length; i++) {
        await TeamFinalResult.findByIdAndUpdate(sortedTeams[i]._id, { rank: i + 1 });
      }

      // Create contest final result
      const matchName = `${match.team1.shortName} vs ${match.team2.shortName}`;

      await ContestFinalResult.create({
        matchId: matchObjectId,
        contestId: contest._id,
        contestName: contest.name,
        matchName,
        entryFee: contest.entryFee,
        prizePool: contest.prizePool,
        maxParticipants: contest.maxParticipants,
        completedAt: new Date(),
        totalTeams: teams.length,
        isSaved: true,
      });

      results.push({
        contestId: contest._id.toString(),
        contestName: contest.name,
        matchName,
        totalTeams: teams.length,
        topTeam: sortedTeams[0] || null,
        skipped: false,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error saving final results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save final results' },
      { status: 500 }
    );
  }
}
