'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, PageLoader, Modal } from '@/components/ui';
import { Match } from '@/types';
import { Calendar, Edit3, Save, X, Zap, CheckCircle, Loader2, PlusCircle, ClipboardList, Database } from 'lucide-react';

interface MatchWithScores extends Match {
  hasScores?: boolean;
}

interface LineupPlayerEntry {
  rawName: string;
  playerName?: string;
  resolution: 'exact' | 'fuzzy' | 'unresolved';
}

interface TeamLineupSection {
  teamName: string;
  playingXI: LineupPlayerEntry[];
  impactSubs: LineupPlayerEntry[];
}

interface MatchLineupData {
  _id: string;
  matchId: string;
  rawText: string;
  status: 'draft' | 'approved';
  team1: TeamLineupSection;
  team2: TeamLineupSection;
  validation?: { errors?: string[]; warnings?: string[] };
  approvedAt?: string;
}

export default function AdminMatchesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithScores[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ scorecardUrl: '', cricbuzzId: '', startTime: '' });
  const [newMatchForm, setNewMatchForm] = useState({
    team1Name: '',
    team1ShortName: '',
    team2Name: '',
    team2ShortName: '',
    startTime: '',
    venue: '',
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [calculating, setCalculating] = useState<string | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [autoCalcMinutes, setAutoCalcMinutes] = useState(1);
  const [nextAutoRunAt, setNextAutoRunAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [lineupModalMatch, setLineupModalMatch] = useState<MatchWithScores | null>(null);
  const [lineupRawText, setLineupRawText] = useState('');
  const [lineupData, setLineupData] = useState<MatchLineupData | null>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupParsing, setLineupParsing] = useState(false);
  const [lineupApproving, setLineupApproving] = useState(false);
  const [lineupError, setLineupError] = useState<string | null>(null);
  const [finalizingMatchId, setFinalizingMatchId] = useState<string | null>(null);
  const [finalizedMatchIds, setFinalizedMatchIds] = useState<Record<string, boolean>>({});

  const formatDateTimeLocal = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || autoCalcMinutes < 1) {
      setNextAutoRunAt(null);
      return;
    }

    const eligibleLiveMatches = matches.filter((m) => m.status === 'live' && !!m.scorecardUrl);
    if (eligibleLiveMatches.length === 0) {
      setNextAutoRunAt(null);
      return;
    }

    const intervalMs = autoCalcMinutes * 60 * 1000;
    setNextAutoRunAt(Date.now() + intervalMs);

    const timer = setInterval(() => {
      const liveMatches = matches.filter((m) => m.status === 'live' && !!m.scorecardUrl);
      if (liveMatches.length === 0) {
        setNextAutoRunAt(null);
        return;
      }

      liveMatches.forEach((liveMatch) => {
        calculatePoints(liveMatch, true);
      });
      setNextAutoRunAt(Date.now() + intervalMs);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAuthenticated, autoCalcMinutes, matches]);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const startEditing = (match: Match) => {
    setEditingId(match._id);
    setFormData({
      scorecardUrl: match.scorecardUrl || '',
      cricbuzzId: match.cricbuzzId || '',
      startTime: formatDateTimeLocal(match.date),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ scorecardUrl: '', cricbuzzId: '', startTime: '' });
  };

  const saveScorecard = async (matchId: string) => {
    setSaving(matchId);
    try {
      const res = await fetch('/api/matches/update-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          scorecardUrl: formData.scorecardUrl,
          cricbuzzId: formData.cricbuzzId,
          date: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatches(matches.map(m => m._id === matchId ? { ...m, ...data.match } : m));
        setEditingId(null);
      } else {
        console.error('Error saving scorecard:', data.error);
      }
    } catch (error) {
      console.error('Error saving scorecard:', error);
    } finally {
      setSaving(null);
    }
  };

  const createTestMatch = async () => {
    setCreateError(null);

    if (!newMatchForm.team1Name.trim() || !newMatchForm.team2Name.trim() || !newMatchForm.startTime) {
      setCreateError('Team 1, Team 2, and Start Time are required.');
      return;
    }

    const parsed = new Date(newMatchForm.startTime);
    if (Number.isNaN(parsed.getTime())) {
      setCreateError('Invalid start time.');
      return;
    }

    setCreatingMatch(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: {
            name: newMatchForm.team1Name.trim(),
            shortName: newMatchForm.team1ShortName.trim() || undefined,
          },
          team2: {
            name: newMatchForm.team2Name.trim(),
            shortName: newMatchForm.team2ShortName.trim() || undefined,
          },
          date: parsed.toISOString(),
          venue: newMatchForm.venue.trim() || undefined,
          status: 'upcoming',
          format: 'T20',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setCreateError(data.error || 'Failed to create test match');
        return;
      }

      setMatches((prev) => {
        const next = [...prev, data.match as MatchWithScores];
        next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return next;
      });

      setNewMatchForm({
        team1Name: '',
        team1ShortName: '',
        team2Name: '',
        team2ShortName: '',
        startTime: '',
        venue: '',
      });
    } catch (error) {
      setCreateError('Failed to create test match');
    } finally {
      setCreatingMatch(false);
    }
  };

  const calculatePoints = async (match: MatchWithScores, silent = false) => {
    if (!match.scorecardUrl) {
      if (!silent) {
        alert('Please set the scorecard URL first');
      }
      return;
    }

    if (!silent) {
      setCalculating(match._id);
    }

    try {
      const res = await fetch('/api/scores/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match._id,
          scorecardUrl: match.scorecardUrl,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMatches(prev => prev.map(m => {
          if (m._id !== match._id || m.hasScores) {
            return m;
          }
          return { ...m, hasScores: true };
        }));

        if (!silent) {
          alert(`Points calculated successfully! ${data.data.playerScores?.length || 0} players updated.`);
        }
      } else {
        if (!silent) {
          alert(data.error || 'Failed to calculate points');
        }
      }
    } catch (error) {
      console.error('Error calculating points:', error);
      if (!silent) {
        alert('Failed to calculate points');
      }
    } finally {
      if (!silent) {
        setCalculating(null);
      }
    }
  };

  const finalizeMatchResults = async (match: MatchWithScores, force = false) => {
    if (match.status !== 'completed') {
      alert('Final results can be saved only after match completion.');
      return;
    }

    const confirmMessage = force
      ? 'This will rebuild and overwrite previously saved final results for this match. Continue?'
      : 'Save final results for all contests of this completed match?';

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    setFinalizingMatchId(match._id);
    try {
      const res = await fetch('/api/scores/save-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match._id, force }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to save final results');
        return;
      }

      const saved = Number(data?.meta?.savedContests || 0);
      const skipped = Number(data?.meta?.skippedContests || 0);
      const totalTeams = Number(data?.meta?.totalTeams || 0);

      setFinalizedMatchIds((prev) => ({ ...prev, [match._id]: true }));
      alert(`Finalization complete. Saved contests: ${saved}, skipped: ${skipped}, total teams snapshotted: ${totalTeams}.`);
    } catch (error) {
      alert('Failed to save final results');
    } finally {
      setFinalizingMatchId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'live':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'warning';
    }
  };

  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const hasEligibleLiveMatches = matches.some((m) => m.status === 'live' && !!m.scorecardUrl);
  const remainingMs = nextAutoRunAt ? nextAutoRunAt - nowTs : 0;

  const openLineupModal = async (match: MatchWithScores) => {
    setLineupModalMatch(match);
    setLineupLoading(true);
    setLineupError(null);
    setLineupData(null);
    setLineupRawText('');

    try {
      const res = await fetch(`/api/matches/${match._id}/lineup`);
      const data = await res.json();
      if (data.success && data.lineup) {
        setLineupData(data.lineup);
        setLineupRawText(data.lineup.rawText || '');
      }
    } catch (error) {
      setLineupError('Failed to load lineup data');
    } finally {
      setLineupLoading(false);
    }
  };

  const closeLineupModal = () => {
    setLineupModalMatch(null);
    setLineupRawText('');
    setLineupData(null);
    setLineupError(null);
  };

  const parseLineupText = async () => {
    if (!lineupModalMatch) return;
    if (!lineupRawText.trim()) {
      setLineupError('Please paste lineup text first');
      return;
    }

    setLineupParsing(true);
    setLineupError(null);

    try {
      const res = await fetch(`/api/matches/${lineupModalMatch._id}/lineup/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: lineupRawText }),
      });
      const data = await res.json();
      if (!data.success) {
        setLineupError(data.error || 'Failed to parse lineup text');
        return;
      }

      setLineupData(data.lineup);
    } catch (error) {
      setLineupError('Failed to parse lineup text');
    } finally {
      setLineupParsing(false);
    }
  };

  const approveLineup = async () => {
    if (!lineupModalMatch) return;

    setLineupApproving(true);
    setLineupError(null);
    try {
      const res = await fetch(`/api/matches/${lineupModalMatch._id}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', approvedBy: user?.displayName || user?._id }),
      });
      const data = await res.json();
      if (!data.success) {
        setLineupError(data.error || 'Failed to approve lineup');
        return;
      }
      setLineupData(data.lineup);
    } catch (error) {
      setLineupError('Failed to approve lineup');
    } finally {
      setLineupApproving(false);
    }
  };

  const renderLineupList = (entries: LineupPlayerEntry[]) => {
    return (
      <div className="space-y-1.5">
        {entries.map((entry, idx) => {
          const variant = entry.resolution === 'exact' ? 'success' : entry.resolution === 'fuzzy' ? 'warning' : 'danger';
          return (
            <div key={`${entry.rawName}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-surface/70 px-2 py-1.5">
              <span className="text-sm text-text-primary truncate">{entry.playerName || entry.rawName}</span>
              <Badge variant={variant as 'default' | 'success' | 'warning' | 'danger' | 'info'} className="shrink-0">
                {entry.resolution}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[92rem] mx-auto px-2 sm:px-3 lg:px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">
            Manage Match Scorecards
          </h1>
          <p className="text-text-secondary mt-2">Set Cricbuzz scorecard URLs and IDs for matches</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-text-secondary">Auto-calculate live matches every</span>
            <Input
              type="number"
              min={1}
              value={autoCalcMinutes}
              onChange={(e) => setAutoCalcMinutes(Math.max(1, Number(e.target.value) || 3))}
              className="w-24 text-sm"
            />
            <span className="text-sm text-text-secondary">minute(s)</span>
          </div>
          <div className="mt-2 text-sm text-text-secondary">
            Next auto-calculate:{' '}
            {!hasEligibleLiveMatches ? (
              <span className="text-warning-text font-medium">Paused (no live match with scorecard URL)</span>
            ) : remainingMs <= 0 ? (
              <span className="text-accent font-medium">Refreshing...</span>
            ) : (
              <span className="text-accent font-medium">{formatRemaining(remainingMs)}</span>
            )}
          </div>
        </div>

        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle size={18} className="text-accent" />
              Create Test Match (After Match 70)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <Input
                label="Team 1 Name"
                value={newMatchForm.team1Name}
                onChange={(e) => setNewMatchForm((p) => ({ ...p, team1Name: e.target.value }))}
                placeholder="Chennai Super Kings"
              />
              <Input
                label="Team 1 Short"
                value={newMatchForm.team1ShortName}
                onChange={(e) => setNewMatchForm((p) => ({ ...p, team1ShortName: e.target.value }))}
                placeholder="CSK"
              />
              <Input
                label="Team 2 Name"
                value={newMatchForm.team2Name}
                onChange={(e) => setNewMatchForm((p) => ({ ...p, team2Name: e.target.value }))}
                placeholder="Mumbai Indians"
              />
              <Input
                label="Team 2 Short"
                value={newMatchForm.team2ShortName}
                onChange={(e) => setNewMatchForm((p) => ({ ...p, team2ShortName: e.target.value }))}
                placeholder="MI"
              />
              <Input
                label="Start Time"
                type="datetime-local"
                value={newMatchForm.startTime}
                onChange={(e) => setNewMatchForm((p) => ({ ...p, startTime: e.target.value }))}
              />
              <Input
                label="Venue (optional)"
                value={newMatchForm.venue}
                onChange={(e) => setNewMatchForm((p) => ({ ...p, venue: e.target.value }))}
                placeholder="Can be left empty"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={createTestMatch} isLoading={creatingMatch}>
                <PlusCircle size={14} className="mr-1" />
                Create Test Match
              </Button>
              {createError && <p className="text-sm text-danger-text">{createError}</p>}
            </div>
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light border-b border-primary/30">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Match</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Start Time</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Scorecard URL</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Cricbuzz ID</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-text-primary">Points</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-text-primary">API Calls</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/30">
                {matches.map((match) => (
                  <tr key={match._id} className="hover:bg-surface-light/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {match.team1.shortName} vs {match.team2.shortName}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {match.team1.name} vs {match.team2.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === match._id ? (
                        <Input
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="text-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Calendar size={14} className="text-accent" />
                          <span>
                            {new Date(match.date).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Kolkata',
                            })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(match.status) as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === match._id ? (
                        <Input
                          placeholder="https://www.cricbuzz.com/api/mcenter/scorecard/..."
                          value={formData.scorecardUrl}
                          onChange={(e) => setFormData({ ...formData, scorecardUrl: e.target.value })}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm text-text-secondary font-mono">
                          {match.scorecardUrl || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === match._id ? (
                        <Input
                          placeholder="e.g., 149684"
                          value={formData.cricbuzzId}
                          onChange={(e) => setFormData({ ...formData, cricbuzzId: e.target.value })}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm text-text-secondary">
                          {match.cricbuzzId || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {(match as any).apiCallCount || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {match.hasScores ? (
                          <span className="flex items-center gap-1 text-success-text text-sm">
                            <CheckCircle size={14} />
                            Done
                          </span>
                        ) : match.scorecardUrl ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => calculatePoints(match)}
                            disabled={calculating === match._id}
                            className="text-xs"
                          >
                            {calculating === match._id ? (
                              <>
                                <Loader2 size={12} className="mr-1 animate-spin" />
                                Calculating...
                              </>
                            ) : (
                              <>
                                <Zap size={12} className="mr-1" />
                                Calculate
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-text-secondary text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openLineupModal(match)}
                        >
                          <ClipboardList size={14} className="mr-1" />
                          Lineup
                        </Button>
                        {match.status === 'completed' && (
                          <Button
                            size="sm"
                            variant={finalizedMatchIds[match._id] ? 'secondary' : 'danger'}
                            onClick={() => finalizeMatchResults(match)}
                            isLoading={finalizingMatchId === match._id}
                          >
                            <Database size={14} className="mr-1" />
                            {finalizedMatchIds[match._id] ? 'Finalized' : 'Save Final'}
                          </Button>
                        )}
                        {editingId === match._id ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => saveScorecard(match._id)}
                              isLoading={saving === match._id}
                            >
                              <Save size={14} className="mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                            >
                              <X size={14} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startEditing(match)}
                          >
                            <Edit3 size={14} className="mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {matches.length === 0 && (
          <Card variant="elevated">
            <CardContent className="py-12 text-center">
              <p className="text-text-secondary">No matches found</p>
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={!!lineupModalMatch}
          onClose={closeLineupModal}
          title={lineupModalMatch ? `Lineup Parser • ${lineupModalMatch.team1.shortName} vs ${lineupModalMatch.team2.shortName}` : 'Lineup Parser'}
          className="max-w-6xl max-h-[92vh] overflow-hidden"
        >
          <div className="space-y-4 max-h-[calc(92vh-110px)] overflow-y-auto pr-1">
            <p className="text-sm text-text-secondary">
              Paste Cricbuzz text exactly as-is, click Parse, verify 11+11 and 5+5, then approve.
            </p>

            <textarea
              className="w-full min-h-[180px] rounded-xl border border-primary/30 bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              placeholder="Paste playing XI + impact subs text here..."
              value={lineupRawText}
              onChange={(e) => setLineupRawText(e.target.value)}
            />

            {lineupError && (
              <div className="rounded-lg border border-danger-border bg-danger-bg/30 px-3 py-2 text-sm text-danger-text">
                {lineupError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={parseLineupText} isLoading={lineupParsing}>
                Parse
              </Button>
              <Button
                variant="secondary"
                onClick={approveLineup}
                isLoading={lineupApproving}
                disabled={!lineupData}
              >
                Approve and Save
              </Button>
              {lineupData?.status === 'approved' && (
                <Badge variant="success">Approved</Badge>
              )}
            </div>

            {lineupLoading ? (
              <p className="text-sm text-text-secondary">Loading lineup...</p>
            ) : lineupData ? (
              <div className="space-y-4">
                {(lineupData.validation?.errors?.length || 0) > 0 && (
                  <div className="rounded-lg border border-danger-border bg-danger-bg/25 p-3">
                    <p className="text-sm font-semibold text-danger-text mb-2">Validation Errors</p>
                    <ul className="list-disc list-inside text-sm text-danger-text/90 space-y-1">
                      {(lineupData.validation?.errors || []).map((error, idx) => (
                        <li key={`err-${idx}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(lineupData.validation?.warnings?.length || 0) > 0 && (
                  <div className="rounded-lg border border-warning-border bg-warning-bg/25 p-3">
                    <p className="text-sm font-semibold text-warning-text mb-2">Warnings</p>
                    <ul className="list-disc list-inside text-sm text-warning-text/90 space-y-1">
                      {(lineupData.validation?.warnings || []).map((warning, idx) => (
                        <li key={`warn-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {[lineupData.team1, lineupData.team2].map((teamBlock, idx) => (
                    <Card key={`${teamBlock.teamName}-${idx}`} className="border-primary/30">
                      <CardHeader>
                        <CardTitle className="text-base">{teamBlock.teamName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary mb-2">Playing XI ({teamBlock.playingXI.length})</p>
                          {renderLineupList(teamBlock.playingXI)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary mb-2">Impact Subs ({teamBlock.impactSubs.length})</p>
                          {renderLineupList(teamBlock.impactSubs)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No parsed lineup yet.</p>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
}