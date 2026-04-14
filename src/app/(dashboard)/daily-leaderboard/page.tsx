'use client';

import { useEffect, useMemo, useState } from 'react';
import { Navbar, Button, PageLoader, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, Crown, Lock, PencilLine, Save, RefreshCcw, Trophy, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type LeaderboardRow = {
  id: string;
  name: string;
  email: string;
  linkedUser: { id: string; displayName: string; email: string } | null;
  mp: number;
  given: number;
  gain: number;
  net: number;
  winPct: number;
  rank: number;
};

type LeaderboardResponse = {
  success: boolean;
  canEdit: boolean;
  rows: LeaderboardRow[];
  updatedAt: string;
  error?: string;
};

export default function DailyLeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [draftRows, setDraftRows] = useState<LeaderboardRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-leaderboard', { cache: 'no-store' });
      const data: LeaderboardResponse = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to load leaderboard');
        return;
      }

      setCanEdit(!!data.canEdit);
      setRows(data.rows || []);
      setDraftRows(data.rows || []);
      setUpdatedAt(data.updatedAt || null);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const visibleRows = isEditing ? draftRows : rows;

  const isCurrentUserRow = (row: LeaderboardRow) => {
    if (!user?._id) return false;
    if (row.linkedUser?.id && row.linkedUser.id === user._id) return true;

    const userEmail = String(user.email || '').toLowerCase();
    const rowEmail = String(row.email || '').toLowerCase();
    return !!userEmail && !!rowEmail && userEmail === rowEmail;
  };

  const totals = useMemo(() => {
    return (rows || []).reduce(
      (acc, row) => {
        acc.mp += row.mp;
        acc.given += row.given;
        acc.gain += row.gain;
        acc.net += row.net;
        return acc;
      },
      { mp: 0, given: 0, gain: 0, net: 0 }
    );
  }, [rows]);

  const updateDraftField = (id: string, field: 'name' | 'email' | 'mp' | 'gain' | 'winPct', value: string) => {
    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === 'name' || field === 'email') {
          return { ...row, [field]: value };
        }

        const numeric = Number(value);
        const next = Number.isFinite(numeric) ? numeric : 0;
        return { ...row, [field]: field === 'mp' ? Math.max(0, Math.floor(next)) : Number(next.toFixed(2)) };
      })
    );
  };

  const cancelEditing = () => {
    setDraftRows(rows);
    setIsEditing(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-leaderboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: draftRows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            mp: row.mp,
            gain: row.gain,
            winPct: row.winPct,
          })),
        }),
      });

      const data: LeaderboardResponse = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save changes');
        return;
      }

      setRows(data.rows || []);
      setDraftRows(data.rows || []);
      setUpdatedAt(data.updatedAt || null);
      setIsEditing(false);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
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

        <Card className="relative overflow-hidden border border-accent/40 shadow-2xl shadow-accent/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.15),transparent_35%),radial-gradient(circle_at_85%_5%,rgba(250,204,21,0.14),transparent_35%),radial-gradient(circle_at_75%_85%,rgba(16,185,129,0.14),transparent_30%)] pointer-events-none" />
          <CardHeader className="relative z-10 border-b border-primary/20 bg-gradient-to-r from-surface/90 via-card to-surface-light/70">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="text-warning-text" size={24} />
                  Daily Friends Leaderboard
                </CardTitle>
                <CardDescription className="mt-2 text-sm">
                  Ranking: Net desc, then MP desc, then Win% desc. Given is auto-computed as MP x 10.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {canEdit ? (
                  <Badge variant="success" className="gap-1">
                    <Sparkles size={12} /> Editor Mode Enabled
                  </Badge>
                ) : (
                  <Badge variant="warning" className="gap-1">
                    <Lock size={12} /> View Only
                  </Badge>
                )}
                <Button variant="secondary" onClick={fetchBoard}>
                  <RefreshCcw size={16} className="mr-2" /> Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                <p className="text-xs text-text-secondary">Total MP</p>
                <p className="text-xl font-semibold text-text-primary">{totals.mp}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                <p className="text-xs text-text-secondary">Total Given</p>
                <p className="text-xl font-semibold text-text-primary">{totals.given}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                <p className="text-xs text-text-secondary">Total Gain</p>
                <p className="text-xl font-semibold text-text-primary">{totals.gain}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                <p className="text-xs text-text-secondary">Total Net</p>
                <p className={`text-xl font-semibold ${totals.net >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
                  {totals.net >= 0 ? '+' : ''}{totals.net}
                </p>
              </div>
            </div>

            {updatedAt && (
              <p className="text-xs text-text-secondary mt-3">
                Last updated: {new Date(updatedAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            )}
          </CardHeader>

          <CardContent className="relative z-10 pt-6">
            <div className="flex flex-wrap justify-end gap-2 mb-4">
              {canEdit && !isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  <PencilLine size={16} className="mr-2" /> Edit Table
                </Button>
              )}

              {canEdit && isEditing && (
                <>
                  <Button variant="secondary" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={saveChanges} isLoading={saving}>
                    <Save size={16} className="mr-2" /> Save Changes
                  </Button>
                </>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-danger-border bg-danger-bg/30 p-3 text-sm text-danger-text">
                {error}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-primary/25 bg-surface/55">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-light/80 border-b border-primary/20">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-text-secondary">Rank</th>
                    <th className="px-3 py-3 text-left font-semibold text-text-secondary">Name</th>
                    <th className="px-3 py-3 text-right font-semibold text-text-secondary">MP</th>
                    <th className="px-3 py-3 text-right font-semibold text-text-secondary">Given</th>
                    <th className="px-3 py-3 text-right font-semibold text-text-secondary">Gain</th>
                    <th className="px-3 py-3 text-right font-semibold text-text-secondary">Net</th>
                    <th className="px-3 py-3 text-right font-semibold text-text-secondary">Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const idx = draftRows.findIndex((d) => d.id === row.id);
                    const draft = idx >= 0 ? draftRows[idx] : row;
                    const computedGiven = Math.max(0, Math.floor(Number(draft.mp) || 0)) * 10;
                    const computedNet = Number(draft.gain) - computedGiven;
                    const isYou = isCurrentUserRow(row);

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-primary/15 transition-colors ${
                          isYou
                            ? 'bg-accent/10 ring-1 ring-inset ring-accent/40 hover:bg-accent/15'
                            : 'hover:bg-surface-light/40'
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="inline-flex items-center gap-1">
                            {row.rank === 1 ? <Crown size={14} className="text-warning-text" /> : null}
                            <span className="font-semibold text-text-primary">#{row.rank}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 min-w-[300px]">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                className="w-full rounded-md border border-primary/30 bg-background px-2 py-1 text-text-primary"
                                value={draft.name}
                                onChange={(e) => updateDraftField(row.id, 'name', e.target.value)}
                              />
                              <input
                                className="w-full rounded-md border border-primary/30 bg-background px-2 py-1 text-text-secondary text-xs"
                                placeholder="email for identity linking"
                                value={draft.email || ''}
                                onChange={(e) => updateDraftField(row.id, 'email', e.target.value)}
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-text-primary">{row.name}</p>
                                {isYou && (
                                  <Badge variant="info" className="text-[10px] px-2 py-0.5">You</Badge>
                                )}
                              </div>
                              <p className="text-xs text-text-secondary">{row.email || 'No email linked'}</p>
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              className="w-20 rounded-md border border-primary/30 bg-background px-2 py-1 text-right text-text-primary"
                              value={draft.mp}
                              onChange={(e) => updateDraftField(row.id, 'mp', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-text-primary">{row.mp}</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right font-mono text-text-secondary">{isEditing ? computedGiven : row.given}</td>

                        <td className="px-3 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-24 rounded-md border border-primary/30 bg-background px-2 py-1 text-right text-text-primary"
                              value={draft.gain}
                              onChange={(e) => updateDraftField(row.id, 'gain', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-text-primary">{row.gain}</span>
                          )}
                        </td>

                        <td className={`px-3 py-3 text-right font-mono ${
                          (isEditing ? computedNet : row.net) >= 0 ? 'text-success-text' : 'text-danger-text'
                        }`}>
                          {(isEditing ? computedNet : row.net) >= 0 ? '+' : ''}{isEditing ? computedNet : row.net}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-24 rounded-md border border-primary/30 bg-background px-2 py-1 text-right text-text-primary"
                              value={draft.winPct}
                              onChange={(e) => updateDraftField(row.id, 'winPct', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-text-primary">{row.winPct.toFixed(2)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
