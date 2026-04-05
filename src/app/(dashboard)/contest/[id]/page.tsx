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
  Badge, 
  PageLoader,
  Input 
} from '@/components/ui';
import { Copy, Check, Users, Calendar, MapPin, Trophy, ArrowLeft, ArrowRight, DollarSign, ChevronDown, ChevronUp, Crown, Star, GitCompare, X, ArrowRightLeft } from 'lucide-react';
import { Contest, Match } from '@/types';
import { cn } from '@/lib/utils';

interface Team {
  _id: string;
  userId: string;
  contestId: string;
  name: string;
  score?: number;
  rank?: number;
  captainId: string;
  viceCaptainId: string;
  players: Array<{
    playerId: string;
    name: string;
    role: string;
    creditCost: number;
  }>;
  user?: {
    _id: string;
    displayName: string;
  } | null;
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
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareTeam1, setCompareTeam1] = useState<Team | null>(null);
  const [compareTeam2, setCompareTeam2] = useState<Team | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && contestId) {
      fetchContestDetails();
      checkUserTeam();
      fetchAllTeams();
    }
  }, [user, contestId]);

  const fetchContestDetails = async () => {
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
      const res = await fetch(`/api/teams?contestId=${contestId}`);
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams);
        if (contest?.matchId && data.teams.length > 0) {
          await fetchPlayerScores(contest.matchId);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchPlayerScores = async (matchId: string) => {
    if (!matchId) return;
    
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

  const toggleTeamExpand = async (team: Team) => {
    if (expandedTeamId === team._id) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(team._id);
      if (contest?.matchId && Object.keys(playerScores).length === 0) {
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
      setTimeout(() => setCopied(false), 2000);
    }
  }, [contest?.inviteCode]);

  const hasJoined = contest?.participants?.includes(user?._id || '') || !!userTeam;
  const match = contest?.match as Match | undefined;
  const matchDate = match?.date ? new Date(match.date) : null;

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
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
              <Card>
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
              <Card>
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
                      {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
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
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">No teams have joined yet</p>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team, index) => {
                      const rank = index + 1;
                      const isExpanded = expandedTeamId === team._id;
                      const rankStyles = {
                        1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
                        2: 'bg-gray-300/20 text-gray-300 border-gray-300',
                        3: 'bg-amber-700/20 text-amber-700 border-amber-700',
                      };
                      const rankStyle = rankStyles[rank as keyof typeof rankStyles];
                      
                      return (
                        <div key={team._id}>
                          <div
                            onClick={() => toggleTeamExpand(team)}
                            className={`flex items-center gap-4 p-3 rounded-lg bg-surface cursor-pointer hover:bg-surface/80 transition-colors ${
                              rank <= 3 ? 'border' : ''
                            } ${rankStyle || ''}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              rank <= 3 ? rankStyle : 'bg-surface text-text-secondary'
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
                              {loadingScores ? (
                                <p className="text-text-secondary text-sm">Loading scores...</p>
                              ) : (
                                <div className="space-y-1">
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
                                            <p className="text-sm text-text-primary">
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contest Status</CardTitle>
              </CardHeader>
              <CardContent>
                {hasJoined ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-400">
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
                      <Link href={`/my-team/${contestId}`}>
                        <Button className="w-full">
                          Create Team
                          <ArrowRight size={18} className="ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contest.status === 'open' ? (
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
                        Contest {contest.status}
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

            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">1.</span>
                    <span>Join the contest</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">2.</span>
                    <span>Create your team of 11 players</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">3.</span>
                    <span>Select captain and vice-captain</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">4.</span>
                    <span>Earn points based on player performance</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {showCompare && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10">
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
                          className="p-4 bg-surface rounded-lg cursor-pointer hover:bg-surface/80 border border-primary/30 hover:border-accent transition-all"
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
                          className="p-4 bg-surface rounded-lg cursor-pointer hover:bg-surface/80 border border-primary/30 hover:border-accent transition-all"
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
                  <div className="space-y-6">
                    {(() => {
                      const team1Score = compareTeam1.score ?? 0;
                      const team2Score = compareTeam2.score ?? 0;
                      const overallDiff = team1Score - team2Score;
                      const leader = overallDiff > 0 ? compareTeam1.user?.displayName : overallDiff < 0 ? compareTeam2.user?.displayName : null;
                      
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className={cn("text-center p-4 rounded-lg border-2", overallDiff > 0 ? "border-accent bg-accent/10" : overallDiff === 0 ? "bg-surface" : "bg-surface")}>
                              <p className="font-bold text-text-primary text-lg">{compareTeam1.user?.displayName}</p>
                              <p className="text-accent text-3xl font-bold">{team1Score}</p>
                              <p className="text-text-secondary text-sm">points</p>
                            </div>
                            <div className={cn("text-center p-4 rounded-lg border-2", overallDiff < 0 ? "border-accent bg-accent/10" : overallDiff === 0 ? "bg-surface" : "bg-surface")}>
                              <p className="font-bold text-text-primary text-lg">{compareTeam2.user?.displayName}</p>
                              <p className="text-accent text-3xl font-bold">{team2Score}</p>
                              <p className="text-text-secondary text-sm">points</p>
                            </div>
                          </div>
                          
                          {leader ? (
                            <div className="text-center p-3 bg-accent/10 rounded-lg border border-accent/30">
                              <p className="text-text-primary font-medium">
                                🏆 <span className="text-accent font-bold">{leader}</span> leads by <span className="text-accent font-bold text-2xl">{Math.abs(overallDiff)} pts</span>
                              </p>
                            </div>
                          ) : (
                            <div className="text-center p-3 bg-surface rounded-lg border border-yellow-500/30">
                              <p className="text-yellow-400 font-medium">⚖️ Equal points!</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-center gap-8 p-2 bg-surface rounded-lg">
                            <div className="text-center">
                              <p className="text-xs text-text-secondary">Difference</p>
                              <p className={cn("text-lg font-bold", overallDiff > 0 ? "text-green-400" : overallDiff < 0 ? "text-red-400" : "text-text-secondary")}>
                                {overallDiff > 0 ? '+' : ''}{overallDiff}
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {(() => {
                      const team1Players = compareTeam1.players.map(p => ({ ...p, points: playerScores[p.playerId] || 0 }));
                      const team2Players = compareTeam2.players.map(p => ({ ...p, points: playerScores[p.playerId] || 0 }));
                      
                      const commonPlayers = team1Players.filter(p1 => team2Players.some(p2 => p2.playerId === p1.playerId));
                      const onlyInTeam1 = team1Players.filter(p1 => !team2Players.some(p2 => p2.playerId === p1.playerId));
                      const onlyInTeam2 = team2Players.filter(p2 => !team1Players.some(p1 => p1.playerId === p2.playerId));
                      
                      const team1Captain = compareTeam1.players.find(p => p.playerId === compareTeam1.captainId);
                      const team1ViceCaptain = compareTeam1.players.find(p => p.playerId === compareTeam1.viceCaptainId);
                      const team2Captain = compareTeam2.players.find(p => p.playerId === compareTeam2.captainId);
                      const team2ViceCaptain = compareTeam2.players.find(p => p.playerId === compareTeam2.viceCaptainId);
                      
                      const getRoleColor = (role: string) => {
                        switch(role) {
                          case 'batsman': return 'bg-blue-500/20 text-blue-400';
                          case 'bowler': return 'bg-red-500/20 text-red-400';
                          case 'all-rounder': return 'bg-purple-500/20 text-purple-400';
                          case 'wicket-keeper': return 'bg-green-500/20 text-green-400';
                          default: return 'bg-gray-500/20 text-gray-400';
                        }
                      };
                      
                      return (
                        <>
                          {commonPlayers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                Common Players ({commonPlayers.length})
                              </h4>
                              <div className="space-y-2">
                                {commonPlayers.map(player => {
                                  const p1 = team1Players.find(p => p.playerId === player.playerId);
                                  const p2 = team2Players.find(p => p.playerId === player.playerId);
                                  const diff = (p1?.points || 0) - (p2?.points || 0);
                                  
                                  return (
                                    <div key={player.playerId} className="grid grid-cols-5 gap-2 items-center p-2 bg-surface rounded">
                                      <div className="col-span-2 flex items-center gap-2">
                                        <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(player.role))}>
                                          {player.role}
                                        </span>
                                        <span className="text-sm text-text-primary truncate">{player.name}</span>
                                      </div>
                                      <div className="text-center">
                                        <span className="text-sm font-bold text-text-primary">{p1?.points || 0}</span>
                                        {player.playerId === team1Captain?.playerId && <Crown size={10} className="inline ml-1 text-accent" />}
                                        {player.playerId === team1ViceCaptain?.playerId && <Star size={10} className="inline ml-1 text-yellow-400" />}
                                      </div>
                                      <div className="text-center">
                                        <span className="text-sm font-bold text-text-primary">{p2?.points || 0}</span>
                                        {player.playerId === team2Captain?.playerId && <Crown size={10} className="inline ml-1 text-accent" />}
                                        {player.playerId === team2ViceCaptain?.playerId && <Star size={10} className="inline ml-1 text-yellow-400" />}
                                      </div>
                                      <div className="text-right">
                                        <span className={cn("text-sm font-bold", diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-text-secondary")}>
                                          {diff > 0 ? '+' : ''}{diff}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                Only in {compareTeam1.user?.displayName} ({onlyInTeam1.length})
                              </h4>
                              <div className="space-y-2">
                                {onlyInTeam1.map(player => {
                                  const isCaptain = player.playerId === compareTeam1.captainId;
                                  const isViceCaptain = player.playerId === compareTeam1.viceCaptainId;
                                  return (
                                    <div key={player.playerId} className="flex items-center justify-between p-2 bg-surface rounded">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(player.role))}>
                                          {player.role}
                                        </span>
                                        <span className="text-sm text-text-primary truncate">{player.name}</span>
                                        {isCaptain && <Crown size={12} className="text-accent flex-shrink-0" />}
                                        {isViceCaptain && <Star size={12} className="text-yellow-400 flex-shrink-0" />}
                                      </div>
                                      <span className="text-sm font-bold text-accent ml-2">{player.points}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                Only in {compareTeam2.user?.displayName} ({onlyInTeam2.length})
                              </h4>
                              <div className="space-y-2">
                                {onlyInTeam2.map(player => {
                                  const isCaptain = player.playerId === compareTeam2.captainId;
                                  const isViceCaptain = player.playerId === compareTeam2.viceCaptainId;
                                  return (
                                    <div key={player.playerId} className="flex items-center justify-between p-2 bg-surface rounded">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={cn("text-xs px-2 py-0.5 rounded", getRoleColor(player.role))}>
                                          {player.role}
                                        </span>
                                        <span className="text-sm text-text-primary truncate">{player.name}</span>
                                        {isCaptain && <Crown size={12} className="text-accent flex-shrink-0" />}
                                        {isViceCaptain && <Star size={12} className="text-yellow-400 flex-shrink-0" />}
                                      </div>
                                      <span className="text-sm font-bold text-accent ml-2">{player.points}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/30">
                            <div className="text-center p-3 bg-surface rounded-lg">
                              <p className="text-text-secondary text-sm mb-1">Captain</p>
                              <p className="font-medium text-text-primary">{team1Captain?.name || '-'}</p>
                              <p className="text-accent text-sm">{playerScores[team1Captain?.playerId || ''] || 0} pts</p>
                            </div>
                            <div className="text-center p-3 bg-surface rounded-lg">
                              <p className="text-text-secondary text-sm mb-1">Captain</p>
                              <p className="font-medium text-text-primary">{team2Captain?.name || '-'}</p>
                              <p className="text-accent text-sm">{playerScores[team2Captain?.playerId || ''] || 0} pts</p>
                            </div>
                            <div className="text-center p-3 bg-surface rounded-lg">
                              <p className="text-text-secondary text-sm mb-1">Vice-Captain</p>
                              <p className="font-medium text-text-primary">{team1ViceCaptain?.name || '-'}</p>
                              <p className="text-yellow-400 text-sm">{playerScores[team1ViceCaptain?.playerId || ''] || 0} pts</p>
                            </div>
                            <div className="text-center p-3 bg-surface rounded-lg">
                              <p className="text-text-secondary text-sm mb-1">Vice-Captain</p>
                              <p className="font-medium text-text-primary">{team2ViceCaptain?.name || '-'}</p>
                              <p className="text-yellow-400 text-sm">{playerScores[team2ViceCaptain?.playerId || ''] || 0} pts</p>
                            </div>
                          </div>

                          <Button variant="secondary" onClick={() => { setCompareTeam1(null); setCompareTeam2(null); }} className="w-full mt-4">
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