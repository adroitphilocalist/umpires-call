import { useCallback, useEffect, useState } from 'react';
import { Contest, Match } from '@/types';
import { ContestTeam, ExpandedPlayerState, ScoreDetail, TeamPlayer } from '@/components/contest/types';
import { LiveScorecardData } from '@/components/live/LiveScorecardPanel';
import { buildDetailedBreakdown, getCountdownParts, getNormalizedMatchTime } from '@/lib/contest-scoring';

interface MinimalUser {
  _id?: string;
}

interface UseContestDetailDataParams {
  contestId: string;
  user: MinimalUser | null;
  onJoinSuccess: () => void;
}

export function useContestDetailData({
  contestId,
  user,
  onJoinSuccess,
}: UseContestDetailDataParams) {
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

  const fetchPlayerScores = useCallback(async (
    matchId: string
  ): Promise<{ scoresMap: Record<string, number>; scoreDetailsMap: Record<string, ScoreDetail> }> => {
    if (!matchId) return { scoresMap: {}, scoreDetailsMap: {} };
    setLoadingScores(true);
    try {
      const res = await fetch(`/api/scores?matchId=${matchId}`);
      const data = await res.json();

      if (data.success && data.scores) {
        const scoresMap: Record<string, number> = {};
        const scoreDetailsMap: Record<string, ScoreDetail> = {};
        data.scores.forEach((score: any) => {
          const key = score.externalId ? String(score.externalId) : score.playerId ? String(score.playerId) : null;
          if (key) {
            scoresMap[key] = score.points;
            scoreDetailsMap[key] = {
              points: Number(score.points) || 0,
              stats: score.stats,
            };
          }
        });

        setPlayerScores(scoresMap);
        setPlayerScoreDetails(scoreDetailsMap);

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
  }, []);

  const fetchContestDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}`);
      const data = await res.json();
      if (data.success) {
        setContest(data.contest);
      }
    } catch (error) {
      console.error('Error fetching contest:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contestId]);

  const checkUserTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams?userId=${user?._id}&contestId=${contestId}`);
      const data = await res.json();

      if (data.success && data.teams.length > 0) {
        setUserTeam(data.teams[0]);
      }
    } catch (error) {
      console.error('Error checking team:', error);
    }
  }, [contestId, user?._id]);

  const fetchAllTeams = useCallback(async () => {
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

          const breakdown = buildDetailedBreakdown(scoreDetail?.stats, basePoints);

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
  }, [contest?.matchId, contestId, fetchPlayerScores]);

  const fetchLiveScorecard = useCallback(async (matchId: string) => {
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
  }, []);

  useEffect(() => {
    if (user && contestId) {
      fetchContestDetails();
      checkUserTeam();
    }
  }, [checkUserTeam, contestId, fetchContestDetails, user]);

  useEffect(() => {
    if (user && contestId) {
      fetchAllTeams();
    }
  }, [contestId, contest?.matchId, fetchAllTeams, user]);

  useEffect(() => {
    if (!contest?.matchId) return;
    fetchLiveScorecard(contest.matchId);
  }, [contest?.matchId, fetchLiveScorecard]);

  useEffect(() => {
    if (!contest?.matchId) return;

    const timer = setInterval(() => {
      fetchLiveScorecard(contest.matchId as string);
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, [contest?.matchId, fetchLiveScorecard]);

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

  const getPlayerPoints = useCallback((player: TeamPlayer): number => {
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
  }, [playerScoreDetails, playerScores]);

  const toggleTeamExpand = useCallback(async (team: ContestTeam) => {
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
  }, [contest?.matchId, expandedTeamId, fetchPlayerScores, isFromCache, playerScores]);

  const handleJoin = useCallback(async () => {
    if (!user?._id) return;

    setIsJoining(true);
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();
      if (data.success) {
        onJoinSuccess();
      } else {
        alert(data.error || 'Failed to join contest');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setIsJoining(false);
    }
  }, [contestId, onJoinSuccess, user?._id]);

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

  return {
    contest,
    userTeam,
    teams,
    isLoading,
    isJoining,
    copied,
    joinLinkCopied,
    expandedTeamId,
    expandedPlayerId,
    loadingScores,
    showCompare,
    compareTeam1,
    compareTeam2,
    compareRevealReady,
    lastScoreUpdate,
    isFromCache,
    match,
    matchDate,
    isMatchStarted,
    countdown,
    countdownProgressPct,
    isUrgent,
    isSoon,
    liveScorecard,
    loadingScorecardPanel,
    scorecardPanelError,
    hasJoined,
    getPlayerPoints,
    toggleTeamExpand,
    handleJoin,
    copyInviteCode,
    copyJoinLink,
    setExpandedPlayerId,
    setShowCompare,
    setCompareTeam1,
    setCompareTeam2,
  };
}
