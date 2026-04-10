'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Input, Button, Badge, PageLoader } from '@/components/ui';
import { Player, Team, Contest } from '@/types';
import { Users, Save, ArrowLeft, Target, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedPlayer {
  playerId: string;
  name: string;
  role: string;
  externalId: string;
}

const MAX_PLAYERS = 11;
const MAX_CREDITS = 100;
const getNormalizedMatchTime = (date: Date) => new Date(date);

type RoleFilter = 'all' | 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'wicket-keeper', label: 'WK' },
  { key: 'batsman', label: 'BAT' },
  { key: 'all-rounder', label: 'AR' },
  { key: 'bowler', label: 'BOWL' },
];

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batters',
  bowler: 'Bowlers',
  'all-rounder': 'All-rounders',
  'wicket-keeper': 'Wicket Keepers',
};

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
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const revalidateOnResume = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    const revalidateOnPageShow = () => {
      fetchData();
    };

    document.addEventListener('visibilitychange', revalidateOnResume);
    window.addEventListener('pageshow', revalidateOnPageShow);

    return () => {
      document.removeEventListener('visibilitychange', revalidateOnResume);
      window.removeEventListener('pageshow', revalidateOnPageShow);
    };
  }, [contestId, user?._id]);

  const fetchData = async () => {
    try {
      let externalIdByPlayerId: Record<string, string> = {};

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
            externalIdByPlayerId = allPlayers.reduce((acc: Record<string, string>, p: Player) => {
              if (p.externalId) {
                acc[String(p._id)] = p.externalId;
              }
              return acc;
            }, {});
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
          externalId: p.externalId || externalIdByPlayerId[String(p.playerId)] || '',
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

  const filteredPlayers = players.filter((p) => {
    const roleMatches = roleFilter === 'all' || p.role === roleFilter;
    const query = searchTerm.trim().toLowerCase();
    const textMatches =
      query.length === 0 ||
      p.name.toLowerCase().includes(query) ||
      getTeamAbbreviation(p.team).toLowerCase().includes(query);
    return roleMatches && textMatches;
  });

  const groupedFilteredPlayers = {
    batsman: filteredPlayers.filter(p => p.role === 'batsman'),
    bowler: filteredPlayers.filter(p => p.role === 'bowler'),
    'all-rounder': filteredPlayers.filter(p => p.role === 'all-rounder'),
    'wicket-keeper': filteredPlayers.filter(p => p.role === 'wicket-keeper'),
  };

  const getPlayerCredit = (playerId: string) => {
    const selected = players.find(p => String(p._id) === String(playerId));
    return selected?.creditValue || 0;
  };

  const totalCredits = selectedPlayers.reduce((sum, p) => sum + getPlayerCredit(p.playerId), 0);
  const creditsRemaining = MAX_CREDITS - totalCredits;

  const renderPlayerGroup = (title: string, playerList: Player[]) => {
    if (playerList.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <Badge variant="info">{playerList.length}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {playerList.map(player => {
            const playerIdStr = String(player._id);
            const isSelected = selectedPlayers.some(p => String(p.playerId) === playerIdStr);
            const canSelect =
              !isMatchStarted &&
              selectedPlayers.length < MAX_PLAYERS &&
              !isSelected &&
              totalCredits + player.creditValue <= MAX_CREDITS;
            const isCaptain = String(captainId) === playerIdStr;
            const isViceCaptain = String(viceCaptainId) === playerIdStr;

            return (
              <div
                key={player._id}
                className={cn(
                  'p-3 rounded-2xl border transition-all cursor-pointer',
                  isMatchStarted ? 'bg-surface/50 border-primary/20 opacity-50 cursor-not-allowed' :
                  isSelected
                    ? 'bg-accent/15 border-accent shadow-[var(--shadow-soft)]'
                    : canSelect
                      ? 'bg-surface border-primary/30 hover:border-accent hover:-translate-y-0.5'
                      : 'bg-surface/50 border-primary/20 opacity-50 cursor-not-allowed'
                )}
                onClick={() => isMatchStarted ? undefined : (canSelect || isSelected ? handleSelectPlayer(player) : undefined)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary leading-tight">{player.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{getTeamAbbreviation(player.team)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{player.creditValue}</p>
                    <p className="text-[10px] uppercase tracking-wide text-text-secondary">credits</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    player.role === 'batsman' && 'bg-info-bg/30 text-info-text',
                    player.role === 'bowler' && 'bg-danger-bg/30 text-danger-text',
                    player.role === 'all-rounder' && 'bg-card-purple/50 text-text-primary',
                    player.role === 'wicket-keeper' && 'bg-success-bg/30 text-success-text'
                  )}>
                    {ROLE_LABELS[player.role] || player.role}
                  </span>

                  <div className="flex items-center gap-1">
                    {isCaptain && <Badge variant="warning">C</Badge>}
                    {isViceCaptain && <Badge variant="info">VC</Badge>}
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      isSelected ? 'bg-success-bg/70 text-success-text' : 'bg-surface-light text-text-secondary'
                    )}>
                      {isSelected ? 'Selected' : 'Tap to Add'}
                    </span>
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
    if (totalCredits + player.creditValue > MAX_CREDITS) return;

    setSelectedPlayers([...selectedPlayers, {
      playerId: player._id,
      name: player.name,
      role: player.role,
      externalId: player.externalId || '',
    }]);
  };

  const handleRemovePlayer = (playerId: string) => {
    const playerIdStr = String(playerId);
    if (String(captainId) === playerIdStr) setCaptainId('');
    if (String(viceCaptainId) === playerIdStr) setViceCaptainId('');
    setSelectedPlayers(selectedPlayers.filter(p => String(p.playerId) !== playerIdStr));
  };

  const handleMakeCaptain = (playerId: string) => {
    if (captainId === playerId) {
      setCaptainId('');
      return;
    }

    if (viceCaptainId === playerId) {
      setViceCaptainId('');
    }

    setCaptainId(playerId);
  };

  const handleMakeViceCaptain = (playerId: string) => {
    if (viceCaptainId === playerId) {
      setViceCaptainId('');
      return;
    }

    if (captainId === playerId) {
      setCaptainId('');
    }

    setViceCaptainId(playerId);
  };

  const handleSaveTeam = async () => {
    if (isMatchStarted) {
      alert('Match started - team editing locked');
      return;
    }

    if (selectedPlayers.length < 11) {
      alert('You must select exactly 11 players');
      return;
    }

    if (totalCredits > MAX_CREDITS) {
      alert('Credit limit exceeded. Please adjust your team.');
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

    if (selectedPlayers.some((p) => !p.externalId)) {
      alert('Some selected players are missing external IDs. Please reselect players and try again.');
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
  const normalizedMatchTime = matchDate ? getNormalizedMatchTime(matchDate) : null;
  const isMatchStarted = normalizedMatchTime ? now >= normalizedMatchTime : false;

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
                      {String(player.playerId) === String(captainId) && <Badge variant="warning">C</Badge>}
                      {String(player.playerId) === String(viceCaptainId) && <Badge variant="info">VC</Badge>}
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

  const roleRequirementsMet =
    roleCounts.batsman >= 1 &&
    roleCounts.bowler >= 1 &&
    roleCounts['all-rounder'] >= 1 &&
    roleCounts['wicket-keeper'] >= 1;

  const canSaveTeam =
    selectedPlayers.length === MAX_PLAYERS &&
    roleRequirementsMet &&
    !!captainId &&
    !!viceCaptainId &&
    captainId !== viceCaptainId &&
    totalCredits <= MAX_CREDITS &&
    !isMatchStarted;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-surface-light/30 to-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Contest</span>
        </button>

        <Card className="mb-6 border-primary/30 bg-surface/80 backdrop-blur-sm">
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-text-primary font-heading">Create Your Fantasy XI</h1>
                <p className="text-text-secondary mt-1">Pick 11 players, then assign captain and vice-captain from your selected squad.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Badge variant={selectedPlayers.length === MAX_PLAYERS ? 'success' : 'warning'}>
                  Players: {selectedPlayers.length}/{MAX_PLAYERS}
                </Badge>
                <Badge variant={creditsRemaining >= 0 ? 'info' : 'danger'}>
                  Credits: {totalCredits}/{MAX_CREDITS}
                </Badge>
                <Badge variant={roleRequirementsMet ? 'success' : 'warning'}>
                  Role Rules: {roleRequirementsMet ? 'Met' : 'Pending'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-primary/30">
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {ROLE_TABS.map((tab) => {
                        const tabCount =
                          tab.key === 'all'
                            ? players.length
                            : groupedPlayers[tab.key as Exclude<RoleFilter, 'all'>].length;

                        return (
                          <button
                            key={tab.key}
                            onClick={() => setRoleFilter(tab.key)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                              roleFilter === tab.key
                                ? 'bg-accent/20 border-accent text-text-primary'
                                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-primary/50'
                            )}
                          >
                            {tab.label} ({tabCount})
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-full sm:max-w-xs">
                      <Input
                        placeholder="Search player or team"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={16} />}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-light rounded-full border border-border">
                      <Users size={16} className="text-accent" />
                      <span className="text-text-secondary">{selectedPlayers.length}/{MAX_PLAYERS} selected</span>
                    </div>

                    <div className={cn(
                      'px-3 py-1.5 rounded-full border text-sm',
                      creditsRemaining >= 0
                        ? 'bg-info-bg/30 border-info-border text-info-text'
                        : 'bg-danger-bg/40 border-danger-border text-danger-text'
                    )}>
                      Credits Left: {creditsRemaining}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="pt-4">
                {roleFilter === 'all' ? (
                  <>
                    {renderPlayerGroup('Batters', groupedFilteredPlayers.batsman)}
                    {renderPlayerGroup('Bowlers', groupedFilteredPlayers.bowler)}
                    {renderPlayerGroup('All-rounders', groupedFilteredPlayers['all-rounder'])}
                    {renderPlayerGroup('Wicket Keepers', groupedFilteredPlayers['wicket-keeper'])}
                  </>
                ) : (
                  renderPlayerGroup(
                    ROLE_LABELS[roleFilter] || roleFilter,
                    groupedFilteredPlayers[roleFilter as Exclude<RoleFilter, 'all'>]
                  )
                )}

                {filteredPlayers.length === 0 && (
                  <div className="py-12 text-center text-text-secondary">
                    No players found for the current filters.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="sticky top-24 border-primary/30 bg-surface/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Team Preview</CardTitle>
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

                <div className="rounded-2xl border border-border bg-gradient-to-b from-success-bg/20 via-surface to-info-bg/10 p-3 mb-4">
                  <div className="text-xs text-text-secondary text-center mb-3">On-field Preview</div>

                  {['wicket-keeper', 'batsman', 'all-rounder', 'bowler'].map((role) => {
                    const list = selectedPlayers.filter((p) => p.role === role);

                    return (
                      <div key={role} className="mb-3 last:mb-0">
                        <div className="text-[11px] uppercase tracking-wide text-text-secondary text-center mb-2">
                          {ROLE_LABELS[role] || role}
                        </div>

                        <div className="flex flex-wrap justify-center gap-2">
                          {list.length > 0 ? list.map((player) => (
                            <div
                              key={`${role}-${player.playerId}`}
                              className={cn(
                                'px-2.5 py-1.5 rounded-full border text-xs flex items-center gap-1',
                                String(player.playerId) === String(captainId)
                                  ? 'bg-warning-bg/70 border-warning-border text-warning-text'
                                  : String(player.playerId) === String(viceCaptainId)
                                    ? 'bg-info-bg/40 border-info-border text-info-text'
                                    : 'bg-surface border-border text-text-primary'
                              )}
                            >
                              <span className="truncate max-w-[90px]">{player.name}</span>
                              {String(player.playerId) === String(captainId) && <span className="font-bold">C</span>}
                              {String(player.playerId) === String(viceCaptainId) && <span className="font-bold">VC</span>}
                            </div>
                          )) : (
                            <span className="text-xs text-text-secondary">No player</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-border p-3 mb-4 bg-surface-light/70">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-text-primary">Captain & Vice-Captain</p>
                    <Badge variant={captainId && viceCaptainId ? 'success' : 'warning'}>
                      {captainId && viceCaptainId ? 'Selected' : 'Pending'}
                    </Badge>
                  </div>

                  <p className="text-xs text-text-secondary mb-3">
                    Quick assign: tap C or VC beside any selected player.
                  </p>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedPlayers.map((player) => {
                      const isCaptain = String(player.playerId) === String(captainId);
                      const isViceCaptain = String(player.playerId) === String(viceCaptainId);

                      return (
                        <div
                          key={`selector-${player.playerId}`}
                          className={cn(
                            'p-2.5 rounded-xl border bg-surface flex items-center justify-between gap-2',
                            isCaptain && 'border-warning-border bg-warning-bg/20',
                            isViceCaptain && 'border-info-border bg-info-bg/20'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-text-primary truncate">{player.name}</p>
                            <p className="text-xs text-text-secondary">{ROLE_LABELS[player.role] || player.role}</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMakeCaptain(String(player.playerId))}
                              className={cn(
                                'px-2 py-1 rounded-lg text-xs font-semibold border transition-colors',
                                isCaptain
                                  ? 'bg-warning-bg/70 border-warning-border text-warning-text'
                                  : 'bg-surface-light border-border text-text-secondary hover:text-text-primary'
                              )}
                            >
                              C
                            </button>
                            <button
                              onClick={() => handleMakeViceCaptain(String(player.playerId))}
                              className={cn(
                                'px-2 py-1 rounded-lg text-xs font-semibold border transition-colors',
                                isViceCaptain
                                  ? 'bg-info-bg/60 border-info-border text-info-text'
                                  : 'bg-surface-light border-border text-text-secondary hover:text-text-primary'
                              )}
                            >
                              VC
                            </button>
                            <button
                              onClick={() => handleRemovePlayer(String(player.playerId))}
                              className="px-2 py-1 rounded-lg text-xs border border-danger-border text-danger-text hover:bg-danger-bg/40 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {selectedPlayers.length === 0 && (
                      <p className="text-sm text-center text-text-secondary py-3">No players selected yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">WK</span>
                      <span className="font-semibold text-text-primary">{roleCounts['wicket-keeper']}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">BAT</span>
                      <span className="font-semibold text-text-primary">{roleCounts.batsman}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">AR</span>
                      <span className="font-semibold text-text-primary">{roleCounts['all-rounder']}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">BOWL</span>
                      <span className="font-semibold text-text-primary">{roleCounts.bowler}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveTeam}
                  isLoading={isSaving}
                  disabled={!canSaveTeam}
                >
                  <Save size={18} className="mr-2" />
                  Save Team
                </Button>

                {!isMatchStarted && !canSaveTeam && (
                  <div className="mt-3 text-xs text-text-secondary space-y-1">
                    {selectedPlayers.length < MAX_PLAYERS && (
                      <p>Select {MAX_PLAYERS - selectedPlayers.length} more player(s).</p>
                    )}
                    {!roleRequirementsMet && (
                      <p>Need at least 1 WK, 1 BAT, 1 AR and 1 BOWL.</p>
                    )}
                    {selectedPlayers.length === MAX_PLAYERS && (!captainId || !viceCaptainId) && (
                      <p>Assign both captain and vice-captain.</p>
                    )}
                    {creditsRemaining < 0 && (
                      <p>Credit limit exceeded by {Math.abs(creditsRemaining)}.</p>
                    )}
                  </div>
                )}

                {isMatchStarted && (
                  <div className="mt-3 p-3 rounded-xl bg-danger-bg/40 border border-danger-border text-danger-text text-sm text-center">
                    Match started - team editing locked
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
