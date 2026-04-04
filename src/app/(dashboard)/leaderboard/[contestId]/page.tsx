'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Button, Badge, Avatar, PageLoader } from '@/components/ui';
import { Team, Contest, MatchScore } from '@/types';
import { Trophy, Medal, ArrowLeft, Crown, Star, TrendingUp, TrendingDown, Minus, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamWithUser extends Team {
  user?: {
    displayName: string;
    username: string;
    avatar?: string;
  };
}

interface PlayerWithScore {
  playerId: string;
  name: string;
  role: string;
  creditCost: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  points: number;
  stats?: {
    runs: number;
    wickets: number;
    catches: number;
  };
}

export default function LeaderboardPage() {
  const params = useParams();
  const contestId = params.contestId as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<TeamWithUser[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && contestId) {
      fetchData();
    }
  }, [user, contestId]);

  const fetchData = async () => {
    try {
      const [contestRes, teamsRes] = await Promise.all([
        fetch(`/api/contests/${contestId}`),
        fetch(`/api/teams?contestId=${contestId}`),
      ]);

      const [contestData, teamsData] = await Promise.all([
        contestRes.json(),
        teamsRes.json(),
      ]);

      if (contestData.success) setContest(contestData.contest);
      if (teamsData.success) setTeams(teamsData.teams);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerScores = async (matchId: string, playerIds: string[]) => {
    if (!matchId || playerIds.length === 0) return;
    
    setLoadingScores(true);
    try {
      const res = await fetch(`/api/scores?matchId=${matchId}`);
      const data = await res.json();
      
      if (data.success && data.scores) {
        const scoresMap: Record<string, number> = {};
        data.scores.forEach((score: any) => {
          scoresMap[score.playerId] = score.points;
        });
        setPlayerScores(scoresMap);
      }
    } catch (error) {
      console.error('Error fetching player scores:', error);
    } finally {
      setLoadingScores(false);
    }
  };

  const toggleTeamExpand = async (team: TeamWithUser) => {
    if (expandedTeamId === team._id) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(team._id);
      if (contest?.matchId) {
        const playerIds = team.players.map(p => p.playerId);
        await fetchPlayerScores(contest.matchId, playerIds);
      }
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={20} className="text-gray-400" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-text-secondary font-mono">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400/20 border-yellow-400';
    if (rank === 2) return 'bg-gray-400/20 border-gray-400';
    if (rank === 3) return 'bg-amber-600/20 border-amber-600';
    return '';
  };

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Contest</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">Leaderboard</h1>
          <p className="text-text-secondary mt-2">{contest?.name}</p>
        </div>

        {teams.length === 0 ? (
          <Card className="text-center py-12">
            <Trophy size={48} className="mx-auto text-text-secondary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No Teams Yet</h3>
            <p className="text-text-secondary">Be the first to join this contest!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {teams
              .sort((a, b) => b.score - a.score)
              .map((team, index) => {
                const rank = index + 1;
                const isCurrentUser = team.userId === user?._id;
                const isExpanded = expandedTeamId === team._id;

                return (
                  <div key={team._id}>
                    <Card
                      className={cn(
                        'transition-all cursor-pointer',
                        isCurrentUser && 'border-accent ring-1 ring-accent',
                        getRankColor(rank) && 'border-2'
                      )}
                      onClick={() => toggleTeamExpand(team)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-text-primary truncate">
                              {team.name}
                            </h4>
                            {isCurrentUser && (
                              <Badge variant="info" className="text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary flex items-center gap-1">
                            <Users size={14} />
                            {team.players.length} players
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-accent font-mono">
                            {team.score}
                          </p>
                          <p className="text-xs text-text-secondary">points</p>
                        </div>

                        <div className="text-text-secondary">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </Card>

                    {isExpanded && (
                      <Card className="mt-2 border-primary/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Team Players</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingScores ? (
                            <p className="text-text-secondary text-sm">Loading scores...</p>
                          ) : (
                            <div className="space-y-2">
                              {team.players.map((player) => {
                                const isCaptain = player.playerId === team.captainId;
                                const isViceCaptain = player.playerId === team.viceCaptainId;
                                const playerPoints = playerScores[player.playerId] || 0;
                                
                                return (
                                  <div
                                    key={player.playerId}
                                    className="flex items-center justify-between p-2 bg-surface rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        {isCaptain && <Crown size={14} className="text-accent" />}
                                        {isViceCaptain && <Star size={14} className="text-yellow-400" />}
                                      </div>
                                      <div>
                                        <p className="text-sm text-text-primary font-medium">
                                          {player.name}
                                        </p>
                                        <p className="text-xs text-text-secondary capitalize">
                                          {player.role.replace('-', ' ')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={cn(
                                        "font-bold font-mono",
                                        isCaptain ? "text-accent" : isViceCaptain ? "text-yellow-400" : "text-text-primary"
                                      )}>
                                        {playerPoints}
                                      </p>
                                      {isCaptain && (
                                        <p className="text-xs text-accent">2x</p>
                                      )}
                                      {isViceCaptain && (
                                        <p className="text-xs text-yellow-400">1.5x</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {contest && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Contest Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Total Participants</span>
                  <p className="font-medium text-text-primary">{teams.length}/{contest.maxParticipants}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Prize Pool</span>
                  <p className="font-medium text-accent">₹{contest.prizePool}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Entry Fee</span>
                  <p className="font-medium text-text-primary">₹{contest.entryFee}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Status</span>
                  <Badge variant={contest.status === 'open' ? 'success' : 'warning'}>
                    {contest.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}