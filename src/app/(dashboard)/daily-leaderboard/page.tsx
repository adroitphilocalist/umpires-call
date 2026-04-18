'use client';

import { useEffect, useMemo, useState } from 'react';
import { Navbar, Button, PageLoader, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, Crown, Lock, PencilLine, Save, RefreshCcw, Trophy, Sparkles, BarChart3, TrendingUp, TrendingDown, Target, Users, Percent, BookOpen } from 'lucide-react';
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
  wins: number;
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

  const normalizeRows = (incoming: LeaderboardRow[]): LeaderboardRow[] => {
    return (incoming || []).map((row) => {
      const mp = Math.max(0, Math.floor(Number(row.mp) || 0));
      const gain = Number(row.gain) || 0;
      const winsFromPayload = Number((row as any).wins);
      const fallbackWins = Math.max(0, Math.round((mp * (Number(row.winPct) || 0)) / 100));
      const winsRaw = Number.isFinite(winsFromPayload) ? Math.max(0, Math.floor(winsFromPayload)) : fallbackWins;
      const wins = mp > 0 ? Math.min(winsRaw, mp) : 0;
      const given = mp * 10;
      const net = gain - given;
      const winPct = mp > 0 ? Number(((wins / mp) * 100).toFixed(2)) : 0;

      return {
        ...row,
        mp,
        gain,
        wins,
        given,
        net,
        winPct,
      };
    });
  };

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

      const normalizedRows = normalizeRows(data.rows || []);
      setCanEdit(!!data.canEdit);
      setRows(normalizedRows);
      setDraftRows(normalizedRows);
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

  const analytics = useMemo(() => {
    const allRows = rows || [];
    const totalGiven = allRows.reduce((sum, row) => sum + row.given, 0);
    const totalWins = allRows.reduce((sum, row) => sum + row.wins, 0);
    const totalMp = allRows.reduce((sum, row) => sum + row.mp, 0);
    const leagueWinPct = totalMp > 0 ? Number(((totalWins / totalMp) * 100).toFixed(2)) : 0;
    const profitableCount = allRows.filter((row) => row.net > 0).length;
    const profitablePct = allRows.length > 0 ? Number(((profitableCount / allRows.length) * 100).toFixed(2)) : 0;

    const mostActive = allRows.reduce<LeaderboardRow | null>((best, row) => {
      if (!best || row.mp > best.mp) return row;
      return best;
    }, null);

    const bestWinPct = allRows.reduce<LeaderboardRow | null>((best, row) => {
      if (row.mp <= 0) return best;
      if (!best || row.winPct > best.winPct) return row;
      return best;
    }, null);

    const highestProfit = allRows.reduce<LeaderboardRow | null>((best, row) => {
      if (!best || row.net > best.net) return row;
      return best;
    }, null);

    const biggestDrawdown = allRows.reduce<LeaderboardRow | null>((best, row) => {
      if (!best || row.net < best.net) return row;
      return best;
    }, null);

    const netSpread = highestProfit && biggestDrawdown ? highestProfit.net - biggestDrawdown.net : 0;

    const currentUserEntry = allRows.find((row) => {
      if (!user?._id) return false;
      if (row.linkedUser?.id && row.linkedUser.id === user._id) return true;
      const userEmail = String(user.email || '').toLowerCase();
      const rowEmail = String(row.email || '').toLowerCase();
      return !!userEmail && !!rowEmail && userEmail === rowEmail;
    }) || null;

    const topEntry = allRows[0] || null;
    const aboveEntry = currentUserEntry && currentUserEntry.rank > 1
      ? allRows.find((row) => row.rank === currentUserEntry.rank - 1) || null
      : null;

    const gapToTop = currentUserEntry && topEntry ? topEntry.net - currentUserEntry.net : null;
    const jumpToNext = currentUserEntry && aboveEntry
      ? Math.max(0, aboveEntry.net - currentUserEntry.net + 1)
      : null;

    return {
      totalGiven,
      totalWins,
      totalMp,
      leagueWinPct,
      profitableCount,
      profitablePct,
      mostActive,
      bestWinPct,
      highestProfit,
      biggestDrawdown,
      netSpread,
      currentUserEntry,
      gapToTop,
      jumpToNext,
    };
  }, [rows, user?._id, user?.email]);

  const updateDraftField = (id: string, field: 'name' | 'email' | 'mp' | 'gain' | 'wins', value: string) => {
    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === 'name' || field === 'email') {
          return { ...row, [field]: value };
        }

        if (field === 'mp') {
          const nextMp = Math.max(0, Math.floor(Number(value) || 0));
          const currentWins = Math.max(0, Math.floor(Number(row.wins) || 0));
          const nextWins = nextMp > 0 ? Math.min(currentWins, nextMp) : 0;
          const nextWinPct = nextMp > 0 ? Number(((nextWins / nextMp) * 100).toFixed(2)) : 0;
          return { ...row, mp: nextMp, wins: nextWins, winPct: nextWinPct };
        }

        if (field === 'wins') {
          const mp = Math.max(0, Math.floor(Number(row.mp) || 0));
          const rawWins = Math.max(0, Math.floor(Number(value) || 0));
          const nextWins = mp > 0 ? Math.min(rawWins, mp) : 0;
          const nextWinPct = mp > 0 ? Number(((nextWins / mp) * 100).toFixed(2)) : 0;
          return { ...row, wins: nextWins, winPct: nextWinPct };
        }

        const numeric = Number(value);
        const next = Number.isFinite(numeric) ? numeric : 0;
        return { ...row, [field]: Number(next.toFixed(2)) };
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
            wins: row.wins,
          })),
        }),
      });

      const data: LeaderboardResponse = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save changes');
        return;
      }

      const normalizedRows = normalizeRows(data.rows || []);
      setRows(normalizedRows);
      setDraftRows(normalizedRows);
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
                  Ranking: Net-first with MP gap rule, then MP desc, then Win% desc. Given is auto-computed as MP x 10.
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
                    <th className="px-3 py-3 text-right font-semibold text-text-secondary">Wins</th>
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
                    const computedMp = Math.max(0, Math.floor(Number(draft.mp) || 0));
                    const computedWins = computedMp > 0 ? Math.min(Math.max(0, Math.floor(Number(draft.wins) || 0)), computedMp) : 0;
                    const computedWinPct = computedMp > 0 ? Number(((computedWins / computedMp) * 100).toFixed(2)) : 0;
                    const computedGiven = computedMp * 10;
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
                              value={computedMp}
                              onChange={(e) => updateDraftField(row.id, 'mp', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-text-primary">{row.mp}</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              className="w-20 rounded-md border border-primary/30 bg-background px-2 py-1 text-right text-text-primary"
                              value={computedWins}
                              onChange={(e) => updateDraftField(row.id, 'wins', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-text-primary">{row.wins}</span>
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
                          <div className="inline-flex items-center justify-end gap-2 w-full">
                            <span className="font-mono text-text-primary">{computedWinPct.toFixed(2)}</span>
                            {isEditing && <span className="text-[10px] text-text-secondary">auto</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={16} className="text-info-text" />
                  <h2 className="text-base font-semibold text-text-primary">League Stats</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                    <p className="text-xs text-text-secondary flex items-center gap-1"><BarChart3 size={12} /> Total Given</p>
                    <p className="text-xl font-semibold text-text-primary">{analytics.totalGiven}</p>
                    <p className="text-[11px] text-text-secondary mt-1">Combined entry across all players</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                    <p className="text-xs text-text-secondary flex items-center gap-1"><Percent size={12} /> League Win Rate</p>
                    <p className="text-xl font-semibold text-info-text">{analytics.leagueWinPct.toFixed(2)}%</p>
                    <p className="text-[11px] text-text-secondary mt-1">{analytics.totalWins} wins in {analytics.totalMp} matches</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                    <p className="text-xs text-text-secondary flex items-center gap-1"><Users size={12} /> Most Active</p>
                    <p className="text-xl font-semibold text-text-primary">{analytics.mostActive?.name || '-'}</p>
                    <p className="text-[11px] text-text-secondary mt-1">{analytics.mostActive?.mp ?? 0} matches played</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                    <p className="text-xs text-text-secondary flex items-center gap-1"><Target size={12} /> Best Win %</p>
                    <p className="text-xl font-semibold text-success-text">{analytics.bestWinPct?.winPct.toFixed(2) || '0.00'}%</p>
                    <p className="text-[11px] text-text-secondary mt-1">{analytics.bestWinPct?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-success-border/25 bg-success-bg/10 p-3">
                    <p className="text-xs text-text-secondary flex items-center gap-1"><TrendingUp size={12} /> Highest Profit</p>
                    <p className="text-xl font-semibold text-success-text">
                      {analytics.highestProfit ? `${analytics.highestProfit.net >= 0 ? '+' : ''}${analytics.highestProfit.net}` : '+0'}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">{analytics.highestProfit?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-danger-border/25 bg-danger-bg/10 p-3">
                    <p className="text-xs text-text-secondary flex items-center gap-1"><TrendingDown size={12} /> Lowest Net</p>
                    <p className="text-xl font-semibold text-danger-text">
                      {analytics.biggestDrawdown ? `${analytics.biggestDrawdown.net >= 0 ? '+' : ''}${analytics.biggestDrawdown.net}` : '0'}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">{analytics.biggestDrawdown?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                    <p className="text-xs text-text-secondary">Positive Net Players</p>
                    <p className="text-xl font-semibold text-text-primary">
                      {analytics.profitableCount}
                      <span className="text-sm text-text-secondary">/{rows.length}</span>
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">{analytics.profitablePct.toFixed(2)}% are profitable</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-surface/80 p-3">
                    <p className="text-xs text-text-secondary">Net Spread</p>
                    <p className="text-xl font-semibold text-text-primary">{analytics.netSpread}</p>
                    <p className="text-[11px] text-text-secondary mt-1">Difference between top and bottom net</p>
                  </div>
                </div>

                {analytics.currentUserEntry && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="rounded-xl border border-accent/35 bg-accent/10 p-3">
                      <p className="text-xs text-text-secondary">Your Snapshot</p>
                      <p className="text-lg font-semibold text-accent mt-1">
                        Rank #{analytics.currentUserEntry.rank} • Net {analytics.currentUserEntry.net >= 0 ? '+' : ''}{analytics.currentUserEntry.net}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-1">
                        MP {analytics.currentUserEntry.mp} • Wins {analytics.currentUserEntry.wins} • Win% {analytics.currentUserEntry.winPct.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-warning-border/35 bg-warning-bg/10 p-3">
                      <p className="text-xs text-text-secondary">Climb Metrics</p>
                      <p className="text-lg font-semibold text-warning-text mt-1">
                        {analytics.jumpToNext !== null ? `${analytics.jumpToNext} net needed for next rank` : 'You are leading'}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-1">
                        {analytics.gapToTop !== null ? `Gap to top: ${analytics.gapToTop}` : 'No gap'}
                      </p>
                    </div>
                  </div>
                )}

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
              </section>

              <section className="rounded-2xl border border-accent/30 bg-gradient-to-br from-surface/85 via-card/90 to-surface-light/85 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-accent" />
                  <h2 className="text-base font-semibold text-text-primary">Rules Doc</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-3">
                    <p className="text-sm text-text-primary font-medium">How ranking works</p>
                    <p className="text-xs text-text-secondary mt-1">
                      We prioritize net performance first, then consistency, then conversion quality. This keeps ranking fair between high-volume and low-volume players.
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary/25 bg-surface/60 p-3">
                    <p className="text-sm font-semibold text-text-primary mb-2">Ranking Order</p>
                    <ol className="space-y-1.5 text-sm text-text-secondary list-decimal pl-5">
                      <li>Higher Net Gain ranks above lower Net Gain.</li>
                      <li>If Net Gain is equal, higher Matches Played (MP) ranks above.</li>
                      <li>If MP is also equal, higher Win% ranks above.</li>
                      <li>
                        Special MP-gap rule: if a player has better Net Gain but has played more than 4 fewer matches than another player,
                        the higher-volume player is ranked above.
                      </li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-info-border/35 bg-info-bg/15 p-3">
                      <p className="text-sm font-semibold text-info-text">Core Formulas</p>
                      <p className="text-xs text-text-secondary mt-2">Given = MP x 10</p>
                      <p className="text-xs text-text-secondary">Net Gain = Gain - Given</p>
                      <p className="text-xs text-text-secondary">Win% = (Wins / MP) x 100</p>
                    </div>

                    <div className="rounded-xl border border-warning-border/35 bg-warning-bg/15 p-3">
                      <p className="text-sm font-semibold text-warning-text">Editing Behavior</p>
                      <p className="text-xs text-text-secondary mt-2">Editable: Name, Email, MP, Wins, Gain</p>
                      <p className="text-xs text-text-secondary">Auto-computed: Given, Net Gain, Win%</p>
                      <p className="text-xs text-text-secondary">Wins are capped at MP automatically.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
