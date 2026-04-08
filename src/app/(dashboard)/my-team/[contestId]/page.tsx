'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Input, Button, Badge, PageLoader } from '@/components/ui';
import { Player, Team, Contest } from '@/types';
import { Users, Save, ArrowLeft, Target, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedPlayer {
  playerId: string;
  name: string;
  role: string;
  creditCost: number;
}

const MAX_PLAYERS = 11;
const MAX_CREDITS = 100;

export default function MyTeamPage() {
  const params = useParams();
  const contestId = params.contestId as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [existingTeam, setExistingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('My Team');
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [viceCaptainId, setViceCaptainId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      const [contestRes, teamRes] = await Promise.all([
        fetch(`/api/contests/${contestId}`),
        fetch(`/api/teams?userId=${user?._id}&contestId=${contestId}`),
      ]);

      const [contestData, teamData] = await Promise.all([
        contestRes.json(),
        teamRes.json(),
      ]);

      if (contestData.success) {
        setContest(contestData.contest);
        
        const match = contestData.contest.match;
        if (match) {
          const team1Short = match.team1?.shortName;
          const team2Short = match.team2?.shortName;
          
          const playersRes = await fetch('/api/players');
          const playersData = await playersRes.json();
          
          if (playersData.success) {
            const allPlayers = playersData.players;
            const filteredPlayers = allPlayers.filter((p: Player) => {
              const playerTeamShort = getTeamShortName(p.team);
              return playerTeamShort === team1Short || playerTeamShort === team2Short;
            });
            setPlayers(filteredPlayers);
          }
        }
      }

      if (teamData.success && teamData.teams.length > 0) {
        const team = teamData.teams[0];
        setExistingTeam(team);
        setTeamName(team.name);
        setSelectedPlayers(team.players.map((p: any) => ({
          playerId: p.playerId,
          name: p.name,
          role: p.role,
          creditCost: p.creditCost,
        })));
        setCaptainId(team.captainId);
        setViceCaptainId(team.viceCaptainId);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamShortName = (fullName: string): string => {
    const teamMap: Record<string, string> = {
      'Chennai Super Kings': 'CSK',
      'Delhi Capitals': 'DC',
      'Gujarat Titans': 'GT',
      'Royal Challengers Bangalore': 'RCB',
      'Punjab Kings': 'PBKS',
      'Kolkata Knight Riders': 'KKR',
      'Lucknow Super Giants': 'LSG',
      'Mumbai Indians': 'MI',
      'Rajasthan Royals': 'RR',
      'Sunrisers Hyderabad': 'SRH',
    };
    return teamMap[fullName] || fullName;
  };

  const getTeamAbbreviation = (fullName: string): string => {
    return getTeamShortName(fullName);
  };

  const groupedPlayers = {
    batsman: players.filter(p => p.role === 'batsman'),
    bowler: players.filter(p => p.role === 'bowler'),
    'all-rounder': players.filter(p => p.role === 'all-rounder'),
    'wicket-keeper': players.filter(p => p.role === 'wicket-keeper'),
  };

  const renderPlayerGroup = (title: string, playerList: Player[]) => {
    if (playerList.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playerList.map(player => {
            const playerIdStr = String(player._id);
            const isSelected = selectedPlayers.some(p => String(p.playerId) === playerIdStr);
            const canSelect = !isMatchStarted && selectedPlayers.length < MAX_PLAYERS && 
              !isSelected;
            const isCaptain = String(captainId) === playerIdStr;
            const isViceCaptain = String(viceCaptainId) === playerIdStr;
            
            return (
              <div
                key={player._id}
                className={cn(
                  'p-3 rounded-lg border transition-all cursor-pointer',
                  isMatchStarted ? 'bg-surface/50 border-primary/20 opacity-50 cursor-not-allowed' :
                  isSelected 
                    ? 'bg-accent/20 border-accent' 
                    : canSelect 
                      ? 'bg-surface border-primary/30 hover:border-accent' 
                      : 'bg-surface/50 border-primary/20 opacity-50 cursor-not-allowed'
                )}
                onClick={() => isMatchStarted ? undefined : (canSelect || isSelected ? handleSelectPlayer(player) : undefined)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{player.name}</p>
                    <p className="text-xs text-text-secondary">{getTeamAbbreviation(player.team)}</p>
                  </div>
                  <span className="text-sm font-bold text-accent">{player.creditValue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    player.role === 'batsman' && 'bg-info-bg/30 text-info-text',
                    player.role === 'bowler' && 'bg-danger-bg/30 text-danger-text',
                    player.role === 'all-rounder' && 'bg-card-purple/50 text-text-primary',
                    player.role === 'wicket-keeper' && 'bg-success-bg/30 text-success-text'
                  )}>
                    {player.role}
                  </span>
                  <div className="flex gap-1">
                    {isSelected && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMakeCaptain(player._id); }}
                          className={cn(
                            'p-1 rounded hover:bg-accent/20',
                            isCaptain ? 'text-accent' : 'text-text-secondary'
                          )}
                          title="Make Captain"
                        >
                          <Crown size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMakeViceCaptain(player._id); }}
                          className={cn(
                            'p-1 rounded hover:bg-warning-bg/30',
                            isViceCaptain ? 'text-warning-text' : 'text-text-secondary'
                          )}
                          title="Make Vice-Captain"
                        >
                          <Star size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleSelectPlayer = (player: Player) => {
    const playerIdStr = String(player._id);
    const isSelected = selectedPlayers.some(p => String(p.playerId) === playerIdStr);
    
    if (isSelected) {
      handleRemovePlayer(playerIdStr);
      return;
    }

    if (selectedPlayers.length >= MAX_PLAYERS) return;

    setSelectedPlayers([...selectedPlayers, {
      playerId: player._id,
      name: player.name,
      role: player.role,
      creditCost: player.creditValue,
    }]);
  };

  const handleRemovePlayer = (playerId: string) => {
    const playerIdStr = String(playerId);
    const player = selectedPlayers.find(p => String(p.playerId) === playerIdStr);
    if (String(captainId) === playerIdStr) setCaptainId('');
    if (String(viceCaptainId) === playerIdStr) setViceCaptainId('');
    setSelectedPlayers(selectedPlayers.filter(p => String(p.playerId) !== playerIdStr));
  };

  const handleMakeCaptain = (playerId: string) => {
    if (captainId && captainId !== playerId && viceCaptainId === playerId) {
      setViceCaptainId('');
    }
    setCaptainId(playerId);
  };

  const handleMakeViceCaptain = (playerId: string) => {
    if (viceCaptainId === playerId) {
      setViceCaptainId('');
    } else {
      setViceCaptainId(playerId);
    }
  };

  const totalCredits = selectedPlayers.reduce((sum, p) => sum + p.creditCost, 0);
  const creditsRemaining = MAX_CREDITS - totalCredits;

  const handleSaveTeam = async () => {
    if (selectedPlayers.length < 11) {
      alert('You must select exactly 11 players');
      return;
    }

    const roleCounts = {
      batsman: selectedPlayers.filter(p => p.role === 'batsman').length,
      bowler: selectedPlayers.filter(p => p.role === 'bowler').length,
      'all-rounder': selectedPlayers.filter(p => p.role === 'all-rounder').length,
      'wicket-keeper': selectedPlayers.filter(p => p.role === 'wicket-keeper').length,
    };

    if (roleCounts.batsman < 1 || roleCounts.bowler < 1 || roleCounts['all-rounder'] < 1 || roleCounts['wicket-keeper'] < 1) {
      alert('You must select at least 1 batsman, 1 wicket keeper, 1 bowler, and 1 all-rounder');
      return;
    }

    if (!captainId || !viceCaptainId) {
      alert('Please select both captain and vice-captain');
      return;
    }
    if (captainId === viceCaptainId) {
      alert('Captain and vice-captain must be different');
      return;
    }

    setIsSaving(true);
    try {
      const method = existingTeam ? 'PUT' : 'POST';
      const url = existingTeam ? `/api/teams/${existingTeam._id}` : '/api/teams';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id,
          contestId,
          name: teamName,
          players: selectedPlayers,
          totalCredits,
          captainId,
          viceCaptainId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/contest/${contestId}`);
      } else {
        alert(data.error || 'Failed to save team');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const matchDate = contest?.match?.date ? new Date(contest.match.date) : null;
  const now = new Date();
  const isMatchStarted = matchDate && now > matchDate;
  const canEdit = !isMatchStarted && !existingTeam;

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isMatchStarted && existingTeam) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Contest</span>
          </button>
          <Card>
            <CardHeader>
              <CardTitle>{teamName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/30 mb-4">
                <p className="text-accent font-medium">Match started - team editing locked</p>
              </div>
              <div className="space-y-2">
                {selectedPlayers.map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between p-3 bg-surface rounded">
                    <div>
                      <p className="text-text-primary">{player.name}</p>
                      <p className="text-xs text-text-secondary">{player.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.playerId === captainId && <Crown size={16} className="text-accent" />}
                      {player.playerId === viceCaptainId && <Star size={16} className="text-warning-text" />}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => router.push(`/contest/${contestId}`)} className="w-full mt-4">
                Back to Contest
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const roleCounts = {
    batsman: selectedPlayers.filter(p => p.role === 'batsman').length,
    bowler: selectedPlayers.filter(p => p.role === 'bowler').length,
    'all-rounder': selectedPlayers.filter(p => p.role === 'all-rounder').length,
    'wicket-keeper': selectedPlayers.filter(p => p.role === 'wicket-keeper').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Contest</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary font-heading">Build Your Team</h1>
                <p className="text-text-secondary">Select 11 players with required roles</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded">
                <Users size={16} className="text-accent" />
                <span className="text-text-secondary">{selectedPlayers.length}/{MAX_PLAYERS} players</span>
              </div>
              {Object.entries(roleCounts).map(([role, count]) => (
                <Badge key={role} variant="info">
                  {role.replace('-', ' ')}: {count}
                </Badge>
              ))}
            </div>

            {renderPlayerGroup('Batters', groupedPlayers.batsman)}
            {renderPlayerGroup('Bowlers', groupedPlayers.bowler)}
            {renderPlayerGroup('All-rounders', groupedPlayers['all-rounder'])}
            {renderPlayerGroup('Wicket Keepers', groupedPlayers['wicket-keeper'])}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Your Team</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  label="Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  icon={<Target size={18} />}
                  className="mb-4"
                />

                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {selectedPlayers.map((player) => (
                    <div
                      key={player.playerId}
                      className={cn(
                        'flex items-center justify-between p-2 bg-surface rounded group',
                        player.playerId === captainId && 'ring-2 ring-accent',
                        player.playerId === viceCaptainId && 'ring-2 ring-yellow-400'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{player.name}</p>
                        <p className="text-xs text-text-secondary">{player.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.playerId === captainId && <Crown size={14} className="text-accent" />}
                        {player.playerId === viceCaptainId && <Star size={14} className="text-warning-text" />}
                        <span className="text-sm font-bold text-accent">{player.creditCost}</span>
                        <button
                          onClick={() => handleRemovePlayer(player.playerId)}
                          className="text-text-secondary hover:text-danger-text opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-primary/30 pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Role Requirements</span>
                    <span className={cn(
                      "font-bold",
                      roleCounts.batsman >= 1 && roleCounts.bowler >= 1 && roleCounts['all-rounder'] >= 1 && roleCounts['wicket-keeper'] >= 1
                        ? "text-success-text" : "text-warning-text"
                    )}>
                      {roleCounts.batsman >= 1 && roleCounts.bowler >= 1 && roleCounts['all-rounder'] >= 1 && roleCounts['wicket-keeper'] >= 1 ? "Met" : "Not Met"}
                    </span>
                  </div>
                </div>

                {selectedPlayers.length === MAX_PLAYERS && captainId && viceCaptainId && !isMatchStarted && (
                  <Button
                    className="w-full"
                    onClick={handleSaveTeam}
                    isLoading={isSaving}
                  >
                    <Save size={18} className="mr-2" />
                    Save Team
                  </Button>
                )}

                {isMatchStarted && (
                  <p className="text-sm text-danger-text text-center">
                    Match started - team editing locked
                  </p>
                )}

                {selectedPlayers.length < MAX_PLAYERS && !isMatchStarted && (
                  <p className="text-sm text-text-secondary text-center">
                    Select {MAX_PLAYERS - selectedPlayers.length} more players
                  </p>
                )}
                {selectedPlayers.length === MAX_PLAYERS && (!captainId || !viceCaptainId) && !isMatchStarted && (
                  <p className="text-sm text-center text-warning-text">
                    Select captain and vice-captain
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}