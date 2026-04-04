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
import { Copy, Check, Users, Calendar, MapPin, Trophy, ArrowLeft, ArrowRight, DollarSign } from 'lucide-react';
import { Contest, Match } from '@/types';

interface Team {
  _id: string;
  userId: string;
  contestId: string;
  name: string;
  score?: number;
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
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
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
                <CardTitle className="flex items-center gap-2">
                  <Trophy size={20} className="text-accent" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">No teams have joined yet</p>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team, index) => {
                      const rank = index + 1;
                      const rankStyles = {
                        1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
                        2: 'bg-gray-300/20 text-gray-300 border-gray-300',
                        3: 'bg-amber-700/20 text-amber-700 border-amber-700',
                      };
                      const rankStyle = rankStyles[rank as keyof typeof rankStyles];
                      
                      return (
                        <div
                          key={team._id}
                          className={`flex items-center gap-4 p-3 rounded-lg bg-surface ${
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
      </main>
    </div>
  );
}