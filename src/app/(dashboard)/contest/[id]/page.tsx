'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Navbar,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  PageLoader
} from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { Contest, Match } from '@/types';
import { LiveScorecardPanel, LiveScorecardData } from '@/components/live/LiveScorecardPanel';
import { ContestOverviewCard } from '@/components/contest/ContestOverviewCard';
import { MatchDetailsCard } from '@/components/contest/MatchDetailsCard';
import { InviteCodeCard } from '@/components/contest/InviteCodeCard';
import { MatchCountdownCard } from '@/components/contest/MatchCountdownCard';
import { ContestStatusCard } from '@/components/contest/ContestStatusCard';
import { CompareTeamsModal } from '@/components/contest/CompareTeamsModal';
import { LeaderboardCard } from '@/components/contest/LeaderboardCard';
import { ContestTeam, ExpandedPlayerState, MatchScoreStats, PlayerBreakdown, ScoreDetail, TeamPlayer } from '@/components/contest/types';

const toNum = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getNormalizedMatchTime = (date: Date) => new Date(date);

const getCountdownParts = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

const buildDetailedBreakdown = (stats?: MatchScoreStats, totalPoints?: number): PlayerBreakdown[] => {
  if (!stats) {
    return [{ category: 'Other', description: 'Base fantasy points', points: toNum(totalPoints) }];
  }

  const runs = toNum(stats.runs);
  const balls = toNum(stats.balls);
  const dots = toNum(stats.dots);
  const fours = toNum(stats.fours);
  const sixes = toNum(stats.sixes);
  const strikeRate = toNum(stats.strikeRate);
  const wickets = toNum(stats.wickets);
  const overs = toNum(stats.overs);
  const maidens = toNum(stats.maiden);
  const economy = toNum(stats.economy);
  const catches = toNum(stats.catches);
  const runOuts = toNum(stats.runOuts);
  const stumpings = toNum(stats.stumpings);
  const lbwBowled = toNum(stats.lbwBowled);
  const playingXI = toNum(stats.playingXI);
  const substitute = toNum(stats.substitute);
  const hasBowlingContribution = overs > 0 || wickets > 0 || maidens > 0 || economy > 0;

  const breakdown: PlayerBreakdown[] = [];
  let computed = 0;

  if (runs > 0) {
    breakdown.push({ category: 'Batting', description: `${runs} runs (+1 each)`, points: runs });
    computed += runs;
  }
  if (fours > 0) {
    const pts = fours * 4;
    breakdown.push({ category: 'Batting', description: `${fours} fours (+4 each)`, points: pts });
    computed += pts;
  }
  if (sixes > 0) {
    const pts = sixes * 6;
    breakdown.push({ category: 'Batting', description: `${sixes} sixes (+6 each)`, points: pts });
    computed += pts;
  }

  if (runs >= 100) {
    breakdown.push({ category: 'Milestone', description: 'Century Bonus', points: 16 });
    computed += 16;
  } else if (runs >= 75) {
    breakdown.push({ category: 'Milestone', description: '75+ Runs Bonus', points: 12 });
    breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
    computed += 20;
  } else if (runs >= 50) {
    breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
    computed += 8;
  } else if (runs >= 25) {
    breakdown.push({ category: 'Milestone', description: '25+ Runs Bonus', points: 4 });
    computed += 4;
  }

  if (balls >= 10) {
    if (strikeRate > 170) {
      breakdown.push({ category: 'Strike Rate', description: 'SR > 170 (bonus)', points: 6 });
      computed += 6;
    } else if (strikeRate > 150) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 150.01-170 (bonus)', points: 4 });
      computed += 4;
    } else if (strikeRate >= 130) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 130-150 (bonus)', points: 2 });
      computed += 2;
    } else if (strikeRate <= 70 && strikeRate > 60) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 60-70 (penalty)', points: -2 });
      computed -= 2;
    } else if (strikeRate <= 60 && strikeRate > 50) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 50.01-60 (penalty)', points: -4 });
      computed -= 4;
    } else if (strikeRate <= 50) {
      breakdown.push({ category: 'Strike Rate', description: 'SR <50 (penalty)', points: -6 });
      computed -= 6;
    }
  }

  if (hasBowlingContribution && dots > 0) {
    breakdown.push({ category: 'Bowling', description: `${dots} dot balls (+1 each)`, points: dots });
    computed += dots;
  }
  if (wickets > 0) {
    const pts = wickets * 30;
    breakdown.push({ category: 'Bowling', description: `${wickets} wickets (+30 each)`, points: pts });
    computed += pts;
  }
  if (hasBowlingContribution && lbwBowled > 0) {
    const pts = lbwBowled * 8;
    breakdown.push({ category: 'Bowling', description: `${lbwBowled} LBW/Bowled (+8 each)`, points: pts });
    computed += pts;
  }
  if (wickets >= 5) {
    breakdown.push({ category: 'Bowling', description: '5 Wicket Haul Bonus', points: 12 });
    computed += 12;
  } else if (wickets >= 4) {
    breakdown.push({ category: 'Bowling', description: '4 Wicket Bonus', points: 8 });
    computed += 8;
  } else if (wickets >= 3) {
    breakdown.push({ category: 'Bowling', description: '3 Wicket Bonus', points: 4 });
    computed += 4;
  }
  if (maidens > 0) {
    const pts = maidens * 12;
    breakdown.push({ category: 'Bowling', description: `${maidens} maiden over(s) (+12 each)`, points: pts });
    computed += pts;
  }

  if (overs >= 2) {
    if (economy < 5) {
      breakdown.push({ category: 'Economy', description: 'Economy <5 (bonus)', points: 6 });
      computed += 6;
    } else if (economy < 6) {
      breakdown.push({ category: 'Economy', description: 'Economy 5-5.99 (bonus)', points: 4 });
      computed += 4;
    } else if (economy <= 7) {
      breakdown.push({ category: 'Economy', description: 'Economy 6-7 (bonus)', points: 2 });
      computed += 2;
    } else if (economy >= 10 && economy <= 11) {
      breakdown.push({ category: 'Economy', description: 'Economy 10-11 (penalty)', points: -2 });
      computed -= 2;
    } else if (economy > 11 && economy <= 12) {
      breakdown.push({ category: 'Economy', description: 'Economy 11.01-12 (penalty)', points: -4 });
      computed -= 4;
    } else if (economy > 12) {
      breakdown.push({ category: 'Economy', description: 'Economy >12 (penalty)', points: -6 });
      computed -= 6;
    }
  }

  if (catches > 0) {
    const pts = catches * 8;
    breakdown.push({ category: 'Fielding', description: `${catches} catch(es) (+8 each)`, points: pts });
    computed += pts;
    if (catches >= 3) {
      breakdown.push({ category: 'Fielding', description: '3+ Catches Bonus', points: 4 });
      computed += 4;
    }
  }
  if (stumpings > 0) {
    const pts = stumpings * 12;
    breakdown.push({ category: 'Fielding', description: `${stumpings} stumping(s) (+12 each)`, points: pts });
    computed += pts;
  }
  if (runOuts > 0) {
    const pts = runOuts * 6;
    breakdown.push({ category: 'Fielding', description: `${runOuts} run-out(s)`, points: pts });
    computed += pts;
  }

  if (playingXI > 0) {
    breakdown.push({ category: 'Other', description: 'Playing XI', points: 4 });
    computed += 4;
  }

  const base = toNum(totalPoints);
  const diff = Math.round((base - computed) * 100) / 100;
  if (diff !== 0) {
    breakdown.push({ category: 'Other', description: 'Scoring adjustment', points: diff });
  }

  if (breakdown.length === 0) {
    breakdown.push({ category: 'Other', description: 'Base fantasy points', points: base });
  }

  return breakdown;
};

export default function ContestDetailPage() {
  const params = useParams();
  const contestId = params.id as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [contest, setContest] = useState<Contest | null>(null);
  const [userTeam, setUserTeam] = useState<ContestTeam | null>(null);
  const [teams, setTeams] = useState<ContestTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<ExpandedPlayerState | null>(null);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareTeam1, setCompareTeam1] = useState<ContestTeam | null>(null);
  const [compareTeam2, setCompareTeam2] = useState<ContestTeam | null>(null);
  const [compareRevealReady, setCompareRevealReady] = useState(false);
  const [lastScoreUpdate, setLastScoreUpdate] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [playerScoreDetails, setPlayerScoreDetails] = useState<Record<string, ScoreDetail>>({});
  const [countdownNow, setCountdownNow] = useState<number>(Date.now());
  const [liveScorecard, setLiveScorecard] = useState<LiveScorecardData | null>(null);
  const [loadingScorecardPanel, setLoadingScorecardPanel] = useState(false);
  const [scorecardPanelError, setScorecardPanelError] = useState<string | null>(null);



  useEffect(() => {
    if (user && contestId) {
      fetchContestDetails();
      checkUserTeam();
    }
  }, [user, contestId]);

  useEffect(() => {
    if (user && contestId) {
      fetchAllTeams();
    }
  }, [user, contestId, contest?.matchId]);

  useEffect(() => {
    if (!contest?.matchId) return;
    fetchLiveScorecard(contest.matchId);
  }, [contest?.matchId]);

  useEffect(() => {
    if (!contest?.matchId) return;

    const timer = setInterval(() => {
      fetchLiveScorecard(contest.matchId);
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, [contest?.matchId]);

  useEffect(() => {
    const timer = setInterval(() => {
      window.location.reload();
    }, 2 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (compareTeam1 && compareTeam2) {
      setCompareRevealReady(false);
      const timeout = window.setTimeout(() => setCompareRevealReady(true), 25);
      return () => window.clearTimeout(timeout);
    }
    setCompareRevealReady(false);
  }, [compareTeam1?._id, compareTeam2?._id]);

  const fetchContestDetails = async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}`);
      const data = await res.json();
      // console.log(data)
      if (data.success) {
        setContest(data.contest);
      }
    } catch (error) {
      console.error('Error fetching contest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserTeam = async () => {
    try {
      const res = await fetch(`/api/teams?userId=${user?._id}&contestId=${contestId}`);
      const data = await res.json();

      if (data.success && data.teams.length > 0) {
        setUserTeam(data.teams[0]);
      }
    } catch (error) {
      console.error('Error checking team:', error);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const [scoresRes, teamsRes, playersRes] = await Promise.all([
        fetch(`/api/scores?contestId=${contestId}`),
        fetch(`/api/teams?contestId=${contestId}`),
        fetch(`/api/players`),
      ]);

      const [scoresData, teamsData, playersData] = await Promise.all([
        scoresRes.json(),
        teamsRes.json(),
        playersRes.json(),
      ]);
      // console.log('Scores Data:', scoresData);
      // console.log('Teams Data:', teamsData);
      // console.log('Players Data:', playersData);

      if (!scoresData.success || !teamsData.success || !playersData.players) {
        return;
      }

      setIsFromCache(scoresData.isFromCache || false);
      if (scoresData.lastScoreUpdate) {
        setLastScoreUpdate(new Date(scoresData.lastScoreUpdate));
      }

      if (scoresData.isFromCache && scoresData.leaderboard) {
        setTeams(scoresData.leaderboard);
        return;
      }

      const playerIdToExternalId: Record<string, string> = {};
      const playerNameToExternalId: Record<string, string> = {};

      playersData.players.forEach((player: any) => {
        if (player?._id && player?.externalId) {
          playerIdToExternalId[String(player._id)] = String(player.externalId);
        }
        if (player?.name && player?.externalId) {
          playerNameToExternalId[player.name] = String(player.externalId);
        }
      });

      const { scoresMap, scoreDetailsMap } = await fetchPlayerScores(contest?.matchId || '');

      const teamsWithPoints: ContestTeam[] = (teamsData.teams || []).map((team: ContestTeam) => {
        if (team.isTeamLocked) {
          return {
            ...team,
            score: team.score ?? 0,
            rank: team.rank ?? 0,
          };
        }

        const updatedPlayers: TeamPlayer[] = (team.players || []).map((p: TeamPlayer) => {
          const externalId =
            p.externalId ||
            playerIdToExternalId[p.playerId] ||
            playerNameToExternalId[p.name] ||
            null;

          const basePoints = externalId ? (scoresMap[externalId] || 0) : 0;
          const scoreDetail = externalId ? scoreDetailsMap[externalId] : undefined;
          const isCaptain = p.playerId === team.captainId;
          const isViceCaptain = p.playerId === team.viceCaptainId;
          const multiplier = isCaptain ? 2 : isViceCaptain ? 1.5 : 1;
          const totalPoints = Math.round(basePoints * multiplier * 100) / 100;
          const multiplierBonus = totalPoints - basePoints;

          const breakdown: PlayerBreakdown[] = buildDetailedBreakdown(scoreDetail?.stats, basePoints);

          if (multiplierBonus !== 0) {
            breakdown.push({
              category: 'Multiplier',
              description: isCaptain ? 'Captain (2x)' : 'Vice-captain (1.5x)',
              points: Math.round(multiplierBonus * 100) / 100,
            });
          }

          return {
            ...p,
            externalId,
            points: totalPoints,
            multiplier,
            isCaptain,
            isViceCaptain,
            breakdown,
          };
        });

        const totalScore = updatedPlayers.reduce((sum, p) => sum + (p.points || 0), 0);

        return {
          ...team,
          players: updatedPlayers,
          score: Math.round(totalScore * 100) / 100,
        };
      });

      const rankedTeams = [...teamsWithPoints]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((team, index) => ({
          ...team,
          rank: index + 1,
        }));

      setTeams(rankedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchLiveScorecard = async (matchId: string) => {
    if (!matchId) return;

    setLoadingScorecardPanel(true);
    try {
      const res = await fetch(`/api/matches/scorecard?matchId=${matchId}`, { cache: 'no-store' });
      const data = await res.json();

      if (data.success && data.data) {
        setLiveScorecard(data.data as LiveScorecardData);
        setScorecardPanelError(null);
      } else {
        setScorecardPanelError(data.error || 'Unable to load live scorecard');
      }
    } catch (error) {
      setScorecardPanelError('Unable to load live scorecard');
    } finally {
      setLoadingScorecardPanel(false);
    }
  };

  const fetchPlayerScores = async (
    matchId: string
  ): Promise<{ scoresMap: Record<string, number>; scoreDetailsMap: Record<string, ScoreDetail> }> => {
    if (!matchId) return { scoresMap: {}, scoreDetailsMap: {} };
    setLoadingScores(true);
    try {
      const res = await fetch(`/api/scores?matchId=${matchId}`);
      const data = await res.json();
      console.log(data)

      if (data.success && data.scores) {
        const scoresMap: Record<string, number> = {};
        const scoreDetailsMap: Record<string, ScoreDetail> = {};
        data.scores.forEach((score: any) => {
          const key = score.externalId ? String(score.externalId) : score.playerId ? String(score.playerId) : null;
          if (key) {
            scoresMap[key] = score.points;
            scoreDetailsMap[key] = {
              points: toNum(score.points),
              stats: score.stats,
            };
          }
        });
        console.log('Scores Map:', scoresMap);  
        setPlayerScores(scoresMap);
        setPlayerScoreDetails(scoreDetailsMap);

        // Set last score update time if available
        if (data.lastScoreUpdate) {
          setLastScoreUpdate(new Date(data.lastScoreUpdate));
        }

        return { scoresMap, scoreDetailsMap };
      }

      return { scoresMap: {}, scoreDetailsMap: {} };
    } catch (error) {
      console.error('Error fetching player scores:', error);
      return { scoresMap: {}, scoreDetailsMap: {} };
    } finally {
      setLoadingScores(false);
    }
  };

  const getPlayerPoints = (player: TeamPlayer): number => {
    if (typeof player.points === 'number') {
      return player.points;
    }

    if (player.externalId && typeof playerScores[player.externalId] === 'number') {
      return playerScores[player.externalId];
    }

    if (player.externalId && typeof playerScoreDetails[player.externalId]?.points === 'number') {
      return playerScoreDetails[player.externalId].points;
    }

    return playerScores[player.playerId] || 0;
  };

  const toggleTeamExpand = async (team: ContestTeam) => {
    if (expandedTeamId === team._id) {
      setExpandedTeamId(null);
      setExpandedPlayerId(null);
    } else {
      setExpandedTeamId(team._id);
      setExpandedPlayerId(null);
      if (team.isTeamLocked) {
        return;
      }

      if (contest?.matchId && Object.keys(playerScores).length === 0 && !isFromCache) {
        await fetchPlayerScores(contest.matchId);
      }
    }
  };

  const handleJoin = async () => {
    if (!user) return;

    setIsJoining(true);
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/my-team/${contestId}`);
      } else {
        alert(data.error || 'Failed to join contest');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setIsJoining(false);
    }
  };

  const copyInviteCode = useCallback(() => {
    if (contest?.inviteCode) {
      navigator.clipboard.writeText(contest.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
  }, [contest?.inviteCode]);

  const copyJoinLink = useCallback(() => {
    if (!contest?.inviteCode) return;

    const joinLink = `${window.location.origin}/join?code=${encodeURIComponent(contest.inviteCode)}`;
    navigator.clipboard.writeText(joinLink);
    setJoinLinkCopied(true);
    setTimeout(() => setJoinLinkCopied(false), 4000);
  }, [contest?.inviteCode]);

  const hasJoined = contest?.participants?.includes(user?._id || '') || !!userTeam;
  const match = contest?.match as Match | undefined;
  const matchDate = match?.date ? new Date(match.date) : null;
  const normalizedMatchTime = matchDate ? getNormalizedMatchTime(matchDate) : null;
  const isMatchStarted = normalizedMatchTime ? countdownNow >= normalizedMatchTime.getTime() : false;
  const matchStartsInMs = normalizedMatchTime ? Math.max(0, normalizedMatchTime.getTime() - countdownNow) : 0;
  const countdown = getCountdownParts(matchStartsInMs);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const countdownProgressPct = Math.min(100, Math.max(0, ((oneDayMs - matchStartsInMs) / oneDayMs) * 100));
  const isUrgent = !isMatchStarted && matchStartsInMs <= 60 * 60 * 1000;
  const isSoon = !isMatchStarted && matchStartsInMs <= 6 * 60 * 60 * 1000;

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">Contest not found</h1>
            <Link href="/dashboard">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ContestOverviewCard contest={contest} matchDate={matchDate} />

            {match && (
              <MatchDetailsCard match={match} matchDate={matchDate} />
            )}

            {contest.inviteCode && (
              <InviteCodeCard
                inviteCode={contest.inviteCode}
                copied={copied}
                joinLinkCopied={joinLinkCopied}
                onCopyInviteCode={copyInviteCode}
                onCopyJoinLink={copyJoinLink}
              />
            )}

            <LeaderboardCard
              teams={teams}
              expandedTeamId={expandedTeamId}
              expandedPlayerId={expandedPlayerId}
              loadingScores={loadingScores}
              isFromCache={isFromCache}
              lastScoreUpdate={lastScoreUpdate}
              onOpenCompare={() => setShowCompare(true)}
              onToggleTeamExpand={toggleTeamExpand}
              onSetExpandedPlayer={setExpandedPlayerId}
              getPlayerPoints={getPlayerPoints}
            />

            <Card className="order-5 border border-accent/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-card via-surface-light/70 to-card border-b border-accent/20">
                <CardTitle>Deep Live Scorecard</CardTitle>
                <CardDescription>
                  Auto-refreshes every 5 minutes and combines scorecard plus over-by-over streams.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingScorecardPanel && !liveScorecard ? (
                  <p className="text-sm text-text-secondary">Loading live scorecard...</p>
                ) : scorecardPanelError && !liveScorecard ? (
                  <p className="text-sm text-danger-text">{scorecardPanelError}</p>
                ) : liveScorecard ? (
                  <LiveScorecardPanel data={liveScorecard} />
                ) : (
                  <p className="text-sm text-text-secondary">Live scorecard will appear once match scorecard URL is available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {matchDate && (
              <MatchCountdownCard
                matchDate={matchDate}
                isMatchStarted={isMatchStarted}
                isUrgent={isUrgent}
                isSoon={isSoon}
                countdownProgressPct={countdownProgressPct}
                countdown={countdown}
              />
            )}

            <ContestStatusCard
              hasJoined={hasJoined}
              userTeam={userTeam}
              contestId={contestId}
              contest={contest}
              isMatchStarted={isMatchStarted}
              isJoining={isJoining}
              onJoin={handleJoin}
            />

          </div>
        </div>

        <CompareTeamsModal
          isOpen={showCompare}
          teams={teams}
          compareTeam1={compareTeam1}
          compareTeam2={compareTeam2}
          compareRevealReady={compareRevealReady}
          setCompareTeam1={setCompareTeam1}
          setCompareTeam2={setCompareTeam2}
          onClose={() => {
            setShowCompare(false);
            setCompareTeam1(null);
            setCompareTeam2(null);
          }}
          getPlayerPoints={getPlayerPoints}
        />
      </main>
    </div>
  );
}