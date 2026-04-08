'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, PageLoader } from '@/components/ui';
import { Match } from '@/types';
import { Calendar, Edit3, Save, X, Zap, CheckCircle, Loader2 } from 'lucide-react';

interface MatchWithScores extends Match {
  hasScores?: boolean;
}

export default function AdminMatchesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithScores[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ scorecardUrl: '', cricbuzzId: '' });
  const [saving, setSaving] = useState<string | null>(null);
  const [calculating, setCalculating] = useState<string | null>(null);
  const [autoCalcMinutes, setAutoCalcMinutes] = useState(1);
  const [nextAutoRunAt, setNextAutoRunAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());

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
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ scorecardUrl: '', cricbuzzId: '' });
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

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <Card variant="outlined" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light border-b border-primary/30">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Match</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Date</th>
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
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Calendar size={14} className="text-accent" />
                        <span>
                          {new Date(match.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
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
      </main>
    </div>
  );
}