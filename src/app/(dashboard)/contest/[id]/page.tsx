'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  Badge,
  PageLoader,
  Input
} from '@/components/ui';
import { Copy, Check, Users, Calendar, MapPin, Trophy, ArrowLeft, ArrowRight, DollarSign, ChevronDown, ChevronUp, Crown, Star, GitCompare, X, ArrowRightLeft, Clock, Lock, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Contest, Match } from '@/types';
import { cn } from '@/lib/utils';
import { LiveScorecardPanel, LiveScorecardData } from '@/components/live/LiveScorecardPanel';

interface PlayerBreakdown {
  category: string;
  description: string;
  points: number;
}

interface MatchScoreStats {
  runs?: number;
  balls?: number;
  dots?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  wickets?: number;
  overs?: number;
  maiden?: number;
  economy?: number;
  catches?: number;
  runOuts?: number;
  stumpings?: number;
  lbwBowled?: number;
  playingXI?: number;
  substitute?: number;
}

interface ScoreDetail {
  points: number;
  stats?: MatchScoreStats;
}

interface TeamPlayer {
  playerId: string;
  name: string;
  role: string;
  creditCost: number;
  externalId?: string | null;
  points?: number;
  multiplier?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  breakdown?: PlayerBreakdown[];
}

interface Team {
  _id: string;
  userId: string;
  contestId: string;
  name: string;
  score?: number;
  rank?: number;
  captainId: string;
  viceCaptainId: string;
  players: TeamPlayer[];
  playerCount?: number;
  isTeamLocked?: boolean;
  user?: {
    _id: string;
    displayName: string;
  } | null;
}

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

function AnimatedNumber({
  value,
  className,
  precision = 0,
  showSign = false,
}: {
  value: number;
  className?: string;
  precision?: number;
  showSign?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const delta = endValue - startValue;
    const duration = 650;
    let frame = 0;
    const startedAt = performance.now();

    if (delta === 0) {
      setDisplayValue(endValue);
      return;
    }

    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(startValue + delta * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endValue;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const factor = 10 ** precision;
  const rounded = Math.round(displayValue * factor) / factor;
  const text = precision > 0
    ? rounded.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
    : String(Math.round(rounded));

  return (
    <span className={className}>
      {showSign && rounded > 0 ? '+' : ''}
      {text}
    </span>
  );
}

export default function ContestDetailPage() {
  const params = useParams();
  const contestId = params.id as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [contest, setContest] = useState<Contest | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<{ teamId: string; playerId: string } | null>(null);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareTeam1, setCompareTeam1] = useState<Team | null>(null);
  const [compareTeam2, setCompareTeam2] = useState<Team | null>(null);
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

      const teamsWithPoints: Team[] = (teamsData.teams || []).map((team: Team) => {
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

  const toggleTeamExpand = async (team: Team) => {
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
            <Card className="order-2 opacity-90 hover:opacity-100 transition-opacity">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{contest.name}</CardTitle>
                    <CardDescription className="mt-2">{contest.description}</CardDescription>
                  </div>
                  <Badge
                    variant={contest.status === 'open' ? 'success' : contest.status === 'filled' ? 'warning' : 'info'}
                  >
                    {contest.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
                    <Users size={24} className="text-accent" />
                    <div>
                      <p className="text-sm text-text-secondary">Participants</p>
                      <p className="text-xl font-bold text-text-primary">
                        {contest.participantCount} / {contest.maxParticipants}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
                    <Trophy size={24} className="text-accent" />
                    <div>
                      <p className="text-sm text-text-secondary">Prize Pool</p>
                      <p className="text-xl font-bold text-text-primary">₹{contest.prizePool?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
                    <DollarSign size={24} className="text-accent" />
                    <div>
                      <p className="text-sm text-text-secondary">Entry Fee</p>
                      <p className="text-xl font-bold text-text-primary">₹{contest.entryFee}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
                    <Calendar size={24} className="text-accent" />
                    <div>
                      <p className="text-sm text-text-secondary">Starts</p>
                      <p className="text-xl font-bold text-text-primary">
                        {matchDate ? matchDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {match && (
              <Card className="order-3 opacity-85 hover:opacity-100 transition-opacity">
                <CardHeader>
                  <CardTitle>Match Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-text-primary">{match.team1?.name}</p>
                        <p className="text-sm text-text-secondary">{match.team1?.shortName}</p>
                      </div>
                      <div className="px-4">
                        <p className="text-lg font-bold text-accent">VS</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-text-primary">{match.team2?.name}</p>
                        <p className="text-sm text-text-secondary">{match.team2?.shortName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <MapPin size={18} />
                        <span>{match.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>
                          {matchDate ? matchDate.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {contest.inviteCode && (
              <Card className="order-4 opacity-85 hover:opacity-100 transition-opacity">
                <CardHeader>
                  <CardTitle>Invite Code</CardTitle>
                  <CardDescription>Share this code with friends to invite them</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input
                      value={contest.inviteCode}
                      readOnly
                      className="font-mono text-lg tracking-wider"
                    />
                    <Button
                      variant="secondary"
                      onClick={copyInviteCode}
                      className="px-3"
                    >
                      {copied ? <Check size={18} className="text-success-text" /> : <Copy size={18} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="order-1 relative overflow-hidden border border-accent/40 shadow-xl shadow-accent/10">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy size={20} className="text-accent" />
                    Leaderboard
                  </CardTitle>
                  {teams.length >= 2 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowCompare(true)}
                    >
                      <GitCompare size={14} className="mr-1" />
                      Compare Teams
                    </Button>
                  )}
                </div>
                {lastScoreUpdate && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                    {isFromCache ? (
                      <>
                        <Trophy size={12} className="text-success-text" />
                        <span className="text-success-text">Final Results • Match Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        <span>Scores updated: {lastScoreUpdate.toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}</span>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">No teams have joined yet</p>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team, index) => {
                      const rank = index + 1;
                      const isExpanded = expandedTeamId === team._id;
                      const isTeamLocked = !!team.isTeamLocked;
                      const rankStyles = {
                        1: 'bg-warning-bg/40 text-warning-text border-warning-border',
                        2: 'bg-gray-300/20 text-gray-300 border-gray-300',
                        3: 'bg-warning-bg/25 text-warning-text border-warning-border',
                      };
                      const rankStyle = rankStyles[rank as keyof typeof rankStyles];

                      return (
                        <div key={team._id}>
                          <div
                            onClick={() => toggleTeamExpand(team)}
                            className={`flex items-center gap-4 p-3 rounded-lg bg-surface cursor-pointer hover:bg-surface/80 transition-colors ${rank <= 3 ? 'border' : ''
                              } ${rankStyle || ''}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank <= 3 ? rankStyle : 'bg-surface text-text-secondary'
                              }`}>
                              {rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-text-primary truncate">
                                {team.user?.displayName || 'Unknown Player'}
                              </p>
                              <p className="text-sm text-text-secondary truncate">
                                {team.name}
                              </p>
                              {isTeamLocked && (
                                <div className="mt-1 inline-flex items-center gap-1 text-xs text-warning-text">
                                  <Lock size={12} />
                                  Team hidden until match goes live
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-accent">{team.score ?? 0}</p>
                              <p className="text-xs text-text-secondary">pts</p>
                            </div>
                            <div className="text-text-secondary">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-surface/50 rounded-lg">
                              <p className="text-sm font-medium text-text-secondary mb-2">Team Players</p>
                              {isTeamLocked ? (
                                <div className="rounded-lg border border-warning-border/30 bg-warning-bg/20 p-3">
                                  <p className="text-sm text-warning-text flex items-center gap-2">
                                    <Lock size={14} />
                                    Opponent team is locked before match start.
                                  </p>
                                  <p className="text-xs text-text-secondary mt-1">
                                    Player picks will be revealed once the match status becomes Live or Completed.
                                  </p>
                                  <p className="text-xs text-text-secondary mt-2">
                                    Hidden players: {team.playerCount ?? 11}
                                  </p>
                                </div>
                              ) : loadingScores ? (
                                <p className="text-text-secondary text-sm">Loading scores...</p>
                              ) : (
                                <div className="space-y-1">
                                  {team.players.map((player) => {
                                    const isCaptain = player.isCaptain || player.playerId === team.captainId;
                                    const isViceCaptain = player.isViceCaptain || player.playerId === team.viceCaptainId;
                                    const playerPoints = getPlayerPoints(player);
                                    const isPlayerExpanded = expandedPlayerId?.teamId === team._id && expandedPlayerId?.playerId === player.playerId;

                                    const getCategoryColor = (category: string) => {
                                      switch (category) {
                                        case 'Batting': return 'bg-info-bg/30 text-info-text';
                                        case 'Bowling': return 'bg-danger-bg/30 text-danger-text';
                                        case 'Fielding': return 'bg-success-bg/30 text-success-text';
                                        case 'Milestone': return 'bg-warning-bg/40 text-warning-text';
                                        case 'Strike Rate': return 'bg-card-purple/50 text-text-primary';
                                        case 'Economy': return 'bg-orange-500/20 text-orange-400';
                                        case 'Other': return 'bg-gray-500/20 text-gray-400';
                                        case 'Multiplier': return 'bg-warning-bg/35 text-warning-text';
                                        default: return 'bg-gray-500/20 text-gray-400';
                                      }
                                    };

                                    return (
                                      <div key={player.playerId}>
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (player.breakdown && player.breakdown.length > 0) {
                                              setExpandedPlayerId(isPlayerExpanded ? null : { teamId: team._id, playerId: player.playerId });
                                            }
                                          }}
                                          className={cn(
                                            "flex items-center justify-between p-2 bg-surface rounded cursor-pointer transition-colors",
                                            player.breakdown && player.breakdown.length > 0 && "hover:bg-surface-light cursor-pointer"
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                              {isCaptain && <Crown size={14} className="text-accent" />}
                                              {isViceCaptain && <Star size={14} className="text-warning-text" />}
                                            </div>
                                            <div>
                                              <p className="text-sm text-text-primary">
                                                {player.name}
                                              </p>
                                              <p className="text-xs text-text-secondary capitalize">
                                                {player.role.replace('-', ' ')}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {player.breakdown && player.breakdown.length > 0 && (
                                              <span className="text-xs text-text-secondary">
                                                {isPlayerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                              </span>
                                            )}
                                            <div className="text-right">
                                              <p className={cn(
                                                "font-bold font-mono",
                                                isCaptain ? "text-accent" : isViceCaptain ? "text-warning-text" : "text-text-primary"
                                              )}>
                                                {playerPoints}
                                              </p>
                                              {isCaptain && (
                                                <p className="text-xs text-accent">2x</p>
                                              )}
                                              {isViceCaptain && (
                                                <p className="text-xs text-warning-text">1.5x</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Player Breakdown */}
                                        {isPlayerExpanded && player.breakdown && player.breakdown.length > 0 && (
                                          <div className="ml-4 mt-1 p-2 bg-background rounded border border-primary/20 mb-2">
                                            <p className="text-xs font-semibold text-text-secondary mb-2">Points Breakdown</p>
                                            <div className="space-y-1">
                                              {player.breakdown.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs">
                                                  <div className="flex items-center gap-2">
                                                    <Badge className={getCategoryColor(item.category)} variant="default">
                                                      {item.category}
                                                    </Badge>
                                                    <span className="text-text-primary text-xs">{item.description}</span>
                                                  </div>
                                                  <span className={item.points >= 0 ? 'text-success-text' : 'text-danger-text'}>
                                                    {item.points >= 0 ? '+' : ''}{item.points}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

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
              <Card className="relative overflow-hidden border-accent/40 bg-gradient-to-br from-accent/20 via-surface to-warning-bg/30 shadow-[0_20px_55px_rgba(96,165,250,0.15)]">
                <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-accent/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-warning-bg/40 blur-3xl" />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock size={18} className={cn('text-accent', isSoon && 'animate-pulse')} />
                        Match Countdown
                      </CardTitle>
                      {/* <CardDescription>
                        {isMatchStarted ? 'The arena is alive. Match has begun.' : 'A beautiful countdown to first ball'}
                      </CardDescription> */}
                    </div>
                    <Badge
                      variant={isMatchStarted ? 'success' : isUrgent ? 'danger' : isSoon ? 'warning' : 'info'}
                      className="gap-1"
                    >
                      <Sparkles size={12} />
                      {isMatchStarted ? 'Live' : isUrgent ? 'Starting Very Soon' : isSoon ? 'Starts Soon' : 'Upcoming'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  {isMatchStarted ? (
                    <div className="rounded-2xl border border-success-border bg-success-bg/45 p-4 text-center">
                      <p className="text-success-text font-semibold">Live Now</p>
                      <p className="text-xs text-text-secondary mt-1">You can now track points and leaderboard movement.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-2 rounded-full bg-surface-light overflow-hidden border border-accent/30">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            isUrgent
                              ? 'bg-gradient-to-r from-danger-text to-warning-text'
                              : 'bg-gradient-to-r from-accent to-accent-light'
                          )}
                          style={{ width: `${countdownProgressPct}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Days', value: countdown.days, accent: 'text-info-text' },
                          { label: 'Hours', value: countdown.hours, accent: 'text-accent' },
                          { label: 'Min', value: countdown.minutes, accent: 'text-warning-text' },
                          { label: 'Sec', value: countdown.seconds, accent: isUrgent ? 'text-danger-text' : 'text-success-text', highlight: true },
                        ].map((unit) => (
                          <div
                            key={unit.label}
                            className={cn(
                              'rounded-2xl border bg-surface/85 p-2 text-center shadow-sm transition-all',
                              unit.highlight ? 'border-accent/60 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'border-accent/30'
                            )}
                          >
                            <p className={cn('text-xl font-bold tabular-nums', unit.accent)}>{String(unit.value).padStart(2, '0')}</p>
                            <p className="text-[10px] uppercase tracking-wide text-text-secondary">{unit.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-accent/30 bg-surface/70 px-3 py-2 text-center">
                        <p className="text-xs text-text-secondary">
                          Starts at {matchDate.toLocaleString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="sticky top-24 opacity-90 hover:opacity-100 transition-opacity">
              <CardHeader>
                <CardTitle>Contest Status</CardTitle>
              </CardHeader>
              <CardContent>
                {hasJoined ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success-text">
                      <Check size={20} />
                      <span className="font-medium">You have joined this contest</span>
                    </div>

                    {userTeam ? (
                      <Link href={`/my-team/${contestId}`}>
                        <Button className="w-full">
                          View My Team
                          <ArrowRight size={18} className="ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      isMatchStarted ? (
                        <Button className="w-full" disabled>
                          Team Creation Locked
                        </Button>
                      ) : (
                        <Link href={`/my-team/${contestId}`}>
                          <Button className="w-full">
                            Create Team
                            <ArrowRight size={18} className="ml-2" />
                          </Button>
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contest.status === 'open' && !isMatchStarted ? (
                      <Button
                        className="w-full"
                        onClick={handleJoin}
                        isLoading={isJoining}
                        disabled={contest.participantCount >= contest.maxParticipants}
                      >
                        Join Contest
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        {isMatchStarted ? 'Match Started' : `Contest ${contest.status}`}
                      </Button>
                    )}

                    {contest.participantCount >= contest.maxParticipants && (
                      <p className="text-sm text-text-secondary text-center">
                        Contest is full
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {showCompare && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-5xl max-h-[92vh] overflow-y-auto border-accent/40 bg-gradient-to-br from-card via-surface to-card-purple/20 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-gradient-to-r from-card via-surface-light/70 to-card border-b border-accent/25 z-10">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft size={20} className="text-accent" />
                  Team Comparison
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowCompare(false); setCompareTeam1(null); setCompareTeam2(null); }}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent>
                {!compareTeam1 ? (
                  <div className="space-y-4">
                    <p className="text-text-secondary text-center mb-4">Select first team to compare</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teams.map((team) => (
                        <div
                          key={team._id}
                          onClick={() => setCompareTeam1(team)}
                          className="p-4 bg-surface/80 rounded-xl cursor-pointer hover:bg-surface border border-primary/30 hover:border-accent hover:shadow-[0_8px_20px_rgba(96,165,250,0.18)] transition-all"
                        >
                          <p className="font-medium text-text-primary">{team.user?.displayName || 'Unknown'}</p>
                          <p className="text-sm text-text-secondary">{team.score ?? 0} pts</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !compareTeam2 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <span className="text-text-primary font-medium">{compareTeam1.user?.displayName}</span>
                      <span className="text-text-secondary">({compareTeam1.score ?? 0} pts)</span>
                    </div>
                    <p className="text-text-secondary text-center mb-4">Select second team to compare</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teams.filter(t => t._id !== compareTeam1._id).map((team) => (
                        <div
                          key={team._id}
                          onClick={() => setCompareTeam2(team)}
                          className="p-4 bg-surface/80 rounded-xl cursor-pointer hover:bg-surface border border-primary/30 hover:border-accent hover:shadow-[0_8px_20px_rgba(96,165,250,0.18)] transition-all"
                        >
                          <p className="font-medium text-text-primary">{team.user?.displayName || 'Unknown'}</p>
                          <p className="text-sm text-text-secondary">{team.score ?? 0} pts</p>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" onClick={() => setCompareTeam1(null)} className="w-full">
                      Go Back
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "space-y-6 transition-all duration-500",
                    compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}>
                    {(() => {
                      const team1Score = compareTeam1.score ?? 0;
                      const team2Score = compareTeam2.score ?? 0;
                      const overallDiff = team1Score - team2Score;
                      const leader = overallDiff > 0 ? compareTeam1.user?.displayName : overallDiff < 0 ? compareTeam2.user?.displayName : null;

                      return (
                        <>
                          <div
                            className={cn(
                              "grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '40ms' }}
                          >
                            <div className={cn("text-center p-4 rounded-2xl border-2 bg-surface/80 transition-shadow", overallDiff > 0 ? "border-accent bg-accent/10 shadow-[0_0_28px_rgba(56,189,248,0.25)]" : overallDiff === 0 ? "border-primary/30" : "border-primary/30")}>
                              <p className="font-bold text-text-primary text-lg">{compareTeam1.user?.displayName}</p>
                              <p className="text-accent text-3xl font-bold"><AnimatedNumber value={team1Score} precision={0} /></p>
                              <p className="text-text-secondary text-sm">points</p>
                            </div>
                            <div className={cn("text-center p-4 rounded-2xl border-2 bg-surface/80 transition-shadow", overallDiff < 0 ? "border-accent bg-accent/10 shadow-[0_0_28px_rgba(56,189,248,0.25)]" : overallDiff === 0 ? "border-primary/30" : "border-primary/30")}>
                              <p className="font-bold text-text-primary text-lg">{compareTeam2.user?.displayName}</p>
                              <p className="text-accent text-3xl font-bold"><AnimatedNumber value={team2Score} precision={0} /></p>
                              <p className="text-text-secondary text-sm">points</p>
                            </div>
                          </div>

                          {leader ? (
                            <div
                              className={cn(
                                "text-center p-3 bg-accent/10 rounded-lg border border-accent/30 transition-all duration-500",
                                compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                              )}
                              style={{ transitionDelay: '100ms' }}
                            >
                              <p className="text-text-primary font-medium">
                                🏆 <span className="text-accent font-bold">{leader}</span> leads by <span className="text-accent font-bold text-2xl"><AnimatedNumber value={Math.abs(overallDiff)} precision={0} /> pts</span>
                              </p>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "text-center p-3 bg-surface rounded-lg border border-warning-border/30 transition-all duration-500",
                                compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                              )}
                              style={{ transitionDelay: '100ms' }}
                            >
                              <p className="text-warning-text font-medium">⚖️ Equal points!</p>
                            </div>
                          )}

                          <div
                            className={cn(
                              "flex items-center justify-center gap-8 p-2 bg-surface rounded-lg transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '140ms' }}
                          >
                            <div className="text-center">
                              <p className="text-xs text-text-secondary">Difference</p>
                              <p className={cn("text-lg font-bold", overallDiff > 0 ? "text-success-text" : overallDiff < 0 ? "text-danger-text" : "text-text-secondary")}>
                                <AnimatedNumber value={overallDiff} precision={0} showSign />
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {(() => {
                      const team1Players = compareTeam1.players.map((p) => {
                        const points = getPlayerPoints(p);
                        return {
                          ...p,
                          points,
                          isCaptain: p.playerId === compareTeam1.captainId,
                          isViceCaptain: p.playerId === compareTeam1.viceCaptainId,
                        };
                      });
                      const team2Players = compareTeam2.players.map((p) => {
                        const points = getPlayerPoints(p);
                        return {
                          ...p,
                          points,
                          isCaptain: p.playerId === compareTeam2.captainId,
                          isViceCaptain: p.playerId === compareTeam2.viceCaptainId,
                        };
                      });

                      const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();
                      const getCompareKey = (player: typeof team1Players[number]) => {
                        if (player.externalId) return `ext:${player.externalId}`;
                        if (player.playerId) return `id:${player.playerId}`;
                        return `name:${normalizeName(player.name)}`;
                      };

                      const team1Enriched = team1Players.map((p) => ({ ...p, compareKey: getCompareKey(p) }));
                      const team2Enriched = team2Players.map((p) => ({ ...p, compareKey: getCompareKey(p) }));

                      const team2ByKey = new Map(team2Enriched.map((p) => [p.compareKey, p]));
                      const matchedKeys = new Set<string>();

                      const commonPairs = team1Enriched
                        .map((p1) => {
                          const key = p1.compareKey;
                          const p2 = team2ByKey.get(key);
                          if (!p2) return null;
                          matchedKeys.add(key);
                          return {
                            key,
                            p1,
                            p2,
                            diff: (p1.points || 0) - (p2.points || 0),
                          };
                        })
                        .filter((entry): entry is { key: string; p1: typeof team1Enriched[number]; p2: typeof team2Enriched[number]; diff: number } => !!entry);

                      const onlyInTeam1All = team1Enriched.filter((p1) => !team2ByKey.has(p1.compareKey));
                      const onlyInTeam2All = team2Enriched.filter((p2) => !matchedKeys.has(p2.compareKey));

                      const team1Captain = team1Enriched.find((p) => p.isCaptain);
                      const team1ViceCaptain = team1Enriched.find((p) => p.isViceCaptain);
                      const team2Captain = team2Enriched.find((p) => p.isCaptain);
                      const team2ViceCaptain = team2Enriched.find((p) => p.isViceCaptain);

                      const sameCaptain = !!team1Captain && !!team2Captain && team1Captain.compareKey === team2Captain.compareKey;
                      const sameViceCaptain = !!team1ViceCaptain && !!team2ViceCaptain && team1ViceCaptain.compareKey === team2ViceCaptain.compareKey;

                      const cvcDifferences = [
                        {
                          label: 'Captain',
                          team1: team1Captain,
                          team2: team2Captain,
                          isDifferent: !sameCaptain,
                        },
                        {
                          label: 'Vice-Captain',
                          team1: team1ViceCaptain,
                          team2: team2ViceCaptain,
                          isDifferent: !sameViceCaptain,
                        },
                      ].filter((row) => row.isDifferent);

                      const commonPlayers = commonPairs.filter((pair) => {
                        const hasCvcTag = pair.p1.isCaptain || pair.p1.isViceCaptain || pair.p2.isCaptain || pair.p2.isViceCaptain;
                        if (!hasCvcTag) return true;
                        const sameRoleCaptain = pair.p1.isCaptain && pair.p2.isCaptain;
                        const sameRoleVice = pair.p1.isViceCaptain && pair.p2.isViceCaptain;
                        return sameRoleCaptain || sameRoleVice;
                      });

                      const onlyInTeam1 = onlyInTeam1All.filter((p) => !p.isCaptain && !p.isViceCaptain);
                      const onlyInTeam2 = onlyInTeam2All.filter((p) => !p.isCaptain && !p.isViceCaptain);

                      const team1UniqueTotal = onlyInTeam1.reduce((sum, p) => sum + (p.points || 0), 0);
                      const team2UniqueTotal = onlyInTeam2.reduce((sum, p) => sum + (p.points || 0), 0);
                      const uniqueNet = team1UniqueTotal - team2UniqueTotal;
                      const cvcNet = cvcDifferences.reduce((sum, row) => sum + ((row.team1?.points || 0) - (row.team2?.points || 0)), 0);
                      const commonNet = commonPlayers.reduce((sum, pair) => sum + pair.diff, 0);

                      const unionPlayers = new Set([...team1Enriched.map((p) => p.compareKey), ...team2Enriched.map((p) => p.compareKey)]);
                      const overlapPct = unionPlayers.size > 0 ? Math.round((commonPairs.length / unionPlayers.size) * 100) : 0;
                      const team1Score = compareTeam1.score ?? 0;
                      const team2Score = compareTeam2.score ?? 0;
                      const team1UniqueShare = team1Score > 0 ? Math.round((team1UniqueTotal / team1Score) * 100) : 0;
                      const team2UniqueShare = team2Score > 0 ? Math.round((team2UniqueTotal / team2Score) * 100) : 0;

                      const differentialNet = uniqueNet + cvcNet + commonNet;
                      const trendIconClass = (value: number) =>
                        value > 0 ? 'text-success-text' : value < 0 ? 'text-danger-text' : 'text-text-secondary';
                      const TrendIcon = ({ value }: { value: number }) =>
                        value > 0 ? <TrendingUp size={14} className="text-success-text" /> :
                          value < 0 ? <TrendingDown size={14} className="text-danger-text" /> :
                            <Minus size={14} className="text-text-secondary" />;

                      const getRoleColor = (role: string) => {
                        switch (role) {
                          case 'batsman': return 'bg-info-bg/30 text-info-text';
                          case 'bowler': return 'bg-danger-bg/30 text-danger-text';
                          case 'all-rounder': return 'bg-card-purple/50 text-text-primary';
                          case 'wicket-keeper': return 'bg-success-bg/30 text-success-text';
                          default: return 'bg-gray-500/20 text-gray-400';
                        }
                      };

                      return (
                        <>
                          <div
                            className={cn(
                              "sticky top-16 z-10 rounded-2xl border border-accent/35 bg-surface/90 backdrop-blur-md p-3 shadow-[0_10px_24px_rgba(31,41,55,0.22)] transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '180ms' }}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="rounded-xl border border-primary/20 bg-surface-light/60 px-3 py-2 flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-text-secondary">Overall Swing</p>
                                  <p className={cn('text-lg font-bold', trendIconClass(differentialNet))}>
                                    <AnimatedNumber value={differentialNet} precision={2} showSign />
                                  </p>
                                </div>
                                <TrendIcon value={differentialNet} />
                              </div>
                              <div className="rounded-xl border border-primary/20 bg-surface-light/60 px-3 py-2 flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-text-secondary">C/VC Swing</p>
                                  <p className={cn('text-lg font-bold', trendIconClass(cvcNet))}>
                                    <AnimatedNumber value={cvcNet} precision={2} showSign />
                                  </p>
                                </div>
                                <TrendIcon value={cvcNet} />
                              </div>
                              <div className="rounded-xl border border-primary/20 bg-surface-light/60 px-3 py-2 flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-text-secondary">Unique Picks Swing</p>
                                  <p className={cn('text-lg font-bold', trendIconClass(uniqueNet))}>
                                    <AnimatedNumber value={uniqueNet} precision={2} showSign />
                                  </p>
                                </div>
                                <TrendIcon value={uniqueNet} />
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '220ms' }}
                          >
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                              <p className="text-xs text-text-secondary">Unique Total • {compareTeam1.user?.displayName}</p>
                              <p className="text-xl font-bold text-accent flex items-center gap-1">
                                <AnimatedNumber value={team1UniqueTotal} precision={2} />
                                <TrendIcon value={team1UniqueTotal} />
                              </p>
                            </div>
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30 text-center">
                              <p className="text-xs text-text-secondary">Net Differential Impact</p>
                              <p className={cn("text-xl font-bold inline-flex items-center gap-1", trendIconClass(differentialNet))}>
                                <AnimatedNumber value={differentialNet} precision={2} showSign />
                                <TrendIcon value={differentialNet} />
                              </p>
                            </div>
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30 text-right">
                              <p className="text-xs text-text-secondary">Unique Total • {compareTeam2.user?.displayName}</p>
                              <p className="text-xl font-bold text-accent inline-flex items-center gap-1 justify-end">
                                <AnimatedNumber value={team2UniqueTotal} precision={2} />
                                <TrendIcon value={team2UniqueTotal} />
                              </p>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "grid grid-cols-1 md:grid-cols-4 gap-3 transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '260ms' }}
                          >
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                              <p className="text-xs text-text-secondary">Captain/Vice Swing</p>
                              <p className={cn("text-lg font-bold inline-flex items-center gap-1", trendIconClass(cvcNet))}>
                                <AnimatedNumber value={cvcNet} precision={2} showSign />
                                <TrendIcon value={cvcNet} />
                              </p>
                            </div>
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                              <p className="text-xs text-text-secondary">Player Overlap</p>
                              <p className="text-lg font-bold text-accent">{overlapPct}%</p>
                            </div>
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                              <p className="text-xs text-text-secondary">Unique Reliance • {compareTeam1.user?.displayName}</p>
                              <p className="text-lg font-bold text-info-text">{team1UniqueShare}%</p>
                            </div>
                            <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                              <p className="text-xs text-text-secondary">Unique Reliance • {compareTeam2.user?.displayName}</p>
                              <p className="text-lg font-bold text-info-text">{team2UniqueShare}%</p>
                            </div>
                          </div>

                          <div className={cn(
                            "rounded-2xl border p-3 transition-shadow",
                            cvcNet > 0 ? "border-success-border/40 shadow-[0_0_22px_rgba(34,197,94,0.2)]" :
                            cvcNet < 0 ? "border-danger-border/40 shadow-[0_0_22px_rgba(239,68,68,0.18)]" :
                            "border-primary/20"
                          ) + ' ' + cn(compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2', 'transition-all duration-500')}
                            style={{ transitionDelay: '300ms' }}>
                            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-danger-text"></span>
                              Different Captain & Vice-Captain ({cvcDifferences.length})
                            </h4>
                            {cvcDifferences.length === 0 ? (
                              <p className="text-xs text-text-secondary">Both teams have same Captain and Vice-Captain.</p>
                            ) : (
                              <div className="space-y-2">
                                {cvcDifferences.map((row) => {
                                  const diff = (row.team1?.points || 0) - (row.team2?.points || 0);
                                  return (
                                    <div key={row.label} className="grid grid-cols-12 gap-2 items-center p-3 bg-surface/80 rounded-xl border border-primary/20">
                                      <div className="col-span-12 md:col-span-2 text-xs uppercase tracking-wide text-text-secondary font-semibold">{row.label}</div>

                                      <div className="col-span-12 md:col-span-4 min-w-0 flex items-center gap-2 overflow-hidden">
                                        {row.team1 ? (
                                          <>
                                            <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(row.team1.role))}>{row.team1.role}</span>
                                            <div className="min-w-0">
                                              <p className="text-[11px] text-text-secondary truncate">{compareTeam1.user?.displayName}</p>
                                              <p className="text-sm font-semibold text-text-primary truncate">{row.team1.name}</p>
                                            </div>
                                          </>
                                        ) : <span className="text-xs text-text-secondary">-</span>}
                                      </div>

                                      <div className="col-span-12 md:col-span-2 text-center text-sm font-bold text-text-primary bg-surface-light/70 rounded-lg px-2 py-1">
                                        {row.team1?.points || 0} vs {row.team2?.points || 0}
                                      </div>

                                      <div className="col-span-12 md:col-span-3 min-w-0 flex items-center gap-2 overflow-hidden justify-start md:justify-end">
                                        {row.team2 ? (
                                          <>
                                            <div className="min-w-0 text-left md:text-right">
                                              <p className="text-[11px] text-text-secondary truncate">{compareTeam2.user?.displayName}</p>
                                              <p className="text-sm font-semibold text-text-primary truncate">{row.team2.name}</p>
                                            </div>
                                            <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(row.team2.role))}>{row.team2.role}</span>
                                          </>
                                        ) : <span className="text-xs text-text-secondary">-</span>}
                                      </div>

                                      <div className={cn("col-span-12 md:col-span-1 text-right text-sm font-bold", diff > 0 ? "text-success-text" : diff < 0 ? "text-danger-text" : "text-text-secondary")}>
                                        {diff > 0 ? '+' : ''}{Math.round(diff * 100) / 100}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div
                            className={cn(
                              "grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '340ms' }}
                          >
                            <div className={cn(
                              "rounded-2xl border p-3 transition-shadow",
                              uniqueNet > 0 ? "border-success-border/40 shadow-[0_0_20px_rgba(34,197,94,0.18)]" : "border-primary/20"
                            )}>
                              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-info-text"></span>
                                Differential Picks • {compareTeam1.user?.displayName} ({onlyInTeam1.length})
                              </h4>
                              <p className="text-xs text-text-secondary mb-2">
                                {uniqueNet > 0
                                  ? `${compareTeam1.user?.displayName} leads this section by ${Math.round(Math.abs(uniqueNet) * 100) / 100} pts`
                                  : uniqueNet < 0
                                    ? `${compareTeam2.user?.displayName} leads this section by ${Math.round(Math.abs(uniqueNet) * 100) / 100} pts`
                                    : 'This section is tied'}
                              </p>
                              <div className="space-y-2">
                                {onlyInTeam1.map(player => {
                                  return (
                                    <div key={player.playerId} className="flex items-center justify-between p-2 bg-surface rounded">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(player.role))}>
                                          {player.role}
                                        </span>
                                        <span className="text-sm text-text-primary truncate">{player.name}</span>
                                      </div>
                                      <span className="text-sm font-bold text-accent ml-2">{player.points}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className={cn(
                              "rounded-2xl border p-3 transition-shadow",
                              uniqueNet < 0 ? "border-success-border/40 shadow-[0_0_20px_rgba(34,197,94,0.18)]" : "border-primary/20"
                            )}>
                              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-success-text"></span>
                                Differential Picks • {compareTeam2.user?.displayName} ({onlyInTeam2.length})
                              </h4>
                              <p className="text-xs text-text-secondary mb-2">
                                Net section swing: {uniqueNet > 0 ? '+' : ''}{Math.round(uniqueNet * 100) / 100}
                              </p>
                              <div className="space-y-2">
                                {onlyInTeam2.map(player => {
                                  return (
                                    <div key={player.playerId} className="flex items-center justify-between p-2 bg-surface rounded">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(player.role))}>
                                          {player.role}
                                        </span>
                                        <span className="text-sm text-text-primary truncate">{player.name}</span>
                                      </div>
                                      <span className="text-sm font-bold text-accent ml-2">{player.points}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '380ms' }}
                          >
                            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-warning-text"></span>
                              Common Players (No C/VC Differences) ({commonPlayers.length})
                            </h4>
                            <p className="text-xs text-text-secondary mb-2">
                              Net swing from this section: {Math.round(commonNet * 100) / 100} (expected close to 0)
                            </p>
                            <div className="space-y-2">
                              {commonPlayers
                                .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
                                .map(({ key, p1, p2, diff }) => (
                                  <div key={key} className="grid grid-cols-12 md:grid-cols-5 gap-2 items-center p-2 bg-surface rounded border border-primary/20">
                                    <div className="col-span-5 md:col-span-2 flex items-center gap-2 min-w-0">
                                      <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(p1.role))}>{p1.role}</span>
                                      <span className="text-sm text-text-primary truncate">{p1.name}</span>
                                      {p1.isCaptain && p2.isCaptain && <Crown size={10} className="text-accent" />}
                                      {p1.isViceCaptain && p2.isViceCaptain && <Star size={10} className="text-warning-text" />}
                                    </div>
                                    <div className="col-span-2 md:col-span-1 text-center text-sm font-bold text-text-primary">{p1?.points || 0}</div>
                                    <div className="col-span-2 md:col-span-1 text-center text-sm font-bold text-text-primary">{p2?.points || 0}</div>
                                    <div className={cn("col-span-1 md:col-span-1 text-right text-sm font-bold", diff > 0 ? "text-success-text" : diff < 0 ? "text-danger-text" : "text-text-secondary")}>
                                      <AnimatedNumber value={Math.round(diff * 100) / 100} precision={2} showSign />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            onClick={() => { setCompareTeam1(null); setCompareTeam2(null); }}
                            className={cn(
                              "w-full mt-4 transition-all duration-500",
                              compareRevealReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            )}
                            style={{ transitionDelay: '420ms' }}
                          >
                            Compare Different Teams
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}