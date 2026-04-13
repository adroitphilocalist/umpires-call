'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ArrowRightLeft, Crown, Info, Minus, Star, TrendingDown, TrendingUp, X } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { ContestTeam, TeamPlayer } from './types';

interface CompareTeamsModalProps {
  isOpen: boolean;
  teams: ContestTeam[];
  compareTeam1: ContestTeam | null;
  compareTeam2: ContestTeam | null;
  compareRevealReady: boolean;
  setCompareTeam1: (team: ContestTeam | null) => void;
  setCompareTeam2: (team: ContestTeam | null) => void;
  onClose: () => void;
  getPlayerPoints: (player: TeamPlayer) => number;
}

function StatInfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={text}
        aria-expanded={open}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-surface text-text-primary hover:text-accent hover:border-accent/50 transition-colors"
      >
        <Info size={11} />
      </button>
      <div
        role="tooltip"
        className={cn(
          'absolute right-0 top-7 z-20 w-56 rounded-lg border border-accent/45 bg-[#0B1220] px-3 py-2.5 text-xs leading-relaxed text-white shadow-[0_14px_30px_rgba(0,0,0,0.55)] origin-top-right transition-all duration-150',
          open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        )}
      >
        {text}
      </div>
    </div>
  );
}

export function CompareTeamsModal({
  isOpen,
  teams,
  compareTeam1,
  compareTeam2,
  compareRevealReady,
  setCompareTeam1,
  setCompareTeam2,
  onClose,
  getPlayerPoints,
}: CompareTeamsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[92vh] overflow-y-auto border-accent/40 bg-gradient-to-br from-card via-surface to-card-purple/20 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-gradient-to-r from-card via-surface-light/70 to-card border-b border-accent/25 z-10">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-accent" />
            Team Comparison
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
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
                    className="p-4 bg-surface/80 rounded-xl cursor-pointer hover:bg-surface border border-primary/30 hover:border-accent hover:shadow-[0_8px_20px_rgba(96,165,250,0.18)] transition-all"
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
                {teams.filter((t) => t._id !== compareTeam1._id).map((team) => (
                  <div
                    key={team._id}
                    onClick={() => setCompareTeam2(team)}
                    className="p-4 bg-surface/80 rounded-xl cursor-pointer hover:bg-surface border border-primary/30 hover:border-accent hover:shadow-[0_8px_20px_rgba(96,165,250,0.18)] transition-all"
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
            <div className={cn(
              'space-y-6 transition-all duration-500',
              compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}>
              {(() => {
                const team1Score = compareTeam1.score ?? 0;
                const team2Score = compareTeam2.score ?? 0;
                const overallDiff = team1Score - team2Score;
                const leader = overallDiff > 0 ? compareTeam1.user?.displayName : overallDiff < 0 ? compareTeam2.user?.displayName : null;

                return (
                  <>
                    <div
                      className={cn(
                        'grid grid-cols-2 gap-3 sm:gap-4 transition-all duration-500',
                        compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      )}
                      style={{ transitionDelay: '40ms' }}
                    >
                      <div className={cn('text-center p-4 rounded-2xl border-2 bg-surface/80 transition-shadow', overallDiff > 0 ? 'border-accent bg-accent/10 shadow-[0_0_28px_rgba(56,189,248,0.25)]' : overallDiff === 0 ? 'border-primary/30' : 'border-primary/30')}>
                        <p className="font-bold text-text-primary text-sm sm:text-lg truncate">{compareTeam1.user?.displayName}</p>
                        <p className="text-accent text-2xl sm:text-3xl font-bold"><AnimatedNumber value={team1Score} precision={0} /></p>
                        <p className="text-text-secondary text-sm">points</p>
                      </div>
                      <div className={cn('text-center p-4 rounded-2xl border-2 bg-surface/80 transition-shadow', overallDiff < 0 ? 'border-accent bg-accent/10 shadow-[0_0_28px_rgba(56,189,248,0.25)]' : overallDiff === 0 ? 'border-primary/30' : 'border-primary/30')}>
                        <p className="font-bold text-text-primary text-sm sm:text-lg truncate">{compareTeam2.user?.displayName}</p>
                        <p className="text-accent text-2xl sm:text-3xl font-bold"><AnimatedNumber value={team2Score} precision={0} /></p>
                        <p className="text-text-secondary text-sm">points</p>
                      </div>
                    </div>

                    {leader ? (
                      <div
                        className={cn(
                          'text-center p-3 bg-accent/10 rounded-lg border border-accent/30 transition-all duration-500',
                          compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        )}
                        style={{ transitionDelay: '100ms' }}
                      >
                        <p className="text-text-primary font-medium">
                          🏆 <span className="text-accent font-bold">{leader}</span> leads by <span className="text-accent font-bold text-2xl"><AnimatedNumber value={Math.abs(overallDiff)} precision={0} /> pts</span>
                        </p>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'text-center p-3 bg-surface rounded-lg border border-warning-border/30 transition-all duration-500',
                          compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        )}
                        style={{ transitionDelay: '100ms' }}
                      >
                        <p className="text-warning-text font-medium">⚖️ Equal points!</p>
                      </div>
                    )}

                    <div
                      className={cn(
                        'flex items-center justify-center gap-8 p-2 bg-surface rounded-lg transition-all duration-500',
                        compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      )}
                      style={{ transitionDelay: '140ms' }}
                    >
                      <div className="text-center">
                        <p className="text-xs text-text-secondary">Difference</p>
                        <p className={cn('text-lg font-bold', overallDiff > 0 ? 'text-success-text' : overallDiff < 0 ? 'text-danger-text' : 'text-text-secondary')}>
                          <AnimatedNumber value={overallDiff} precision={0} showSign />
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}

              {(() => {
                const team1Players = compareTeam1.players.map((p) => {
                  const points = getPlayerPoints(p);
                  return {
                    ...p,
                    points,
                    isCaptain: p.playerId === compareTeam1.captainId,
                    isViceCaptain: p.playerId === compareTeam1.viceCaptainId,
                  };
                });
                const team2Players = compareTeam2.players.map((p) => {
                  const points = getPlayerPoints(p);
                  return {
                    ...p,
                    points,
                    isCaptain: p.playerId === compareTeam2.captainId,
                    isViceCaptain: p.playerId === compareTeam2.viceCaptainId,
                  };
                });

                const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();
                const getCompareKey = (player: typeof team1Players[number]) => {
                  if (player.externalId) return `ext:${player.externalId}`;
                  if (player.playerId) return `id:${player.playerId}`;
                  return `name:${normalizeName(player.name)}`;
                };

                const team1Enriched = team1Players.map((p) => ({ ...p, compareKey: getCompareKey(p) }));
                const team2Enriched = team2Players.map((p) => ({ ...p, compareKey: getCompareKey(p) }));

                const team2ByKey = new Map(team2Enriched.map((p) => [p.compareKey, p]));
                const matchedKeys = new Set<string>();

                const commonPairs = team1Enriched
                  .map((p1) => {
                    const key = p1.compareKey;
                    const p2 = team2ByKey.get(key);
                    if (!p2) return null;
                    matchedKeys.add(key);
                    return {
                      key,
                      p1,
                      p2,
                      diff: (p1.points || 0) - (p2.points || 0),
                    };
                  })
                  .filter((entry): entry is { key: string; p1: typeof team1Enriched[number]; p2: typeof team2Enriched[number]; diff: number } => !!entry);

                const onlyInTeam1All = team1Enriched.filter((p1) => !team2ByKey.has(p1.compareKey));
                const onlyInTeam2All = team2Enriched.filter((p2) => !matchedKeys.has(p2.compareKey));

                const team1Captain = team1Enriched.find((p) => p.isCaptain);
                const team1ViceCaptain = team1Enriched.find((p) => p.isViceCaptain);
                const team2Captain = team2Enriched.find((p) => p.isCaptain);
                const team2ViceCaptain = team2Enriched.find((p) => p.isViceCaptain);

                const sameCaptain = !!team1Captain && !!team2Captain && team1Captain.compareKey === team2Captain.compareKey;
                const sameViceCaptain = !!team1ViceCaptain && !!team2ViceCaptain && team1ViceCaptain.compareKey === team2ViceCaptain.compareKey;

                const cvcDifferences = [
                  {
                    label: 'Captain',
                    team1: team1Captain,
                    team2: team2Captain,
                    isDifferent: !sameCaptain,
                  },
                  {
                    label: 'Vice-Captain',
                    team1: team1ViceCaptain,
                    team2: team2ViceCaptain,
                    isDifferent: !sameViceCaptain,
                  },
                ].filter((row) => row.isDifferent);

                const commonPlayers = commonPairs.filter((pair) => {
                  const hasCvcTag = pair.p1.isCaptain || pair.p1.isViceCaptain || pair.p2.isCaptain || pair.p2.isViceCaptain;
                  if (!hasCvcTag) return true;
                  const sameRoleCaptain = pair.p1.isCaptain && pair.p2.isCaptain;
                  const sameRoleVice = pair.p1.isViceCaptain && pair.p2.isViceCaptain;
                  return sameRoleCaptain || sameRoleVice;
                });

                const onlyInTeam1 = onlyInTeam1All;
                const onlyInTeam2 = onlyInTeam2All;

                const team1UniqueTotal = onlyInTeam1.reduce((sum, p) => sum + (p.points || 0), 0);
                const team2UniqueTotal = onlyInTeam2.reduce((sum, p) => sum + (p.points || 0), 0);
                const uniqueNet = team1UniqueTotal - team2UniqueTotal;
                const cvcNet = cvcDifferences.reduce((sum, row) => sum + ((row.team1?.points || 0) - (row.team2?.points || 0)), 0);
                const commonNet = commonPlayers.reduce((sum, pair) => sum + pair.diff, 0);

                const unionPlayers = new Set([...team1Enriched.map((p) => p.compareKey), ...team2Enriched.map((p) => p.compareKey)]);
                const overlapPct = unionPlayers.size > 0 ? Math.round((commonPairs.length / unionPlayers.size) * 100) : 0;
                const team1Score = compareTeam1.score ?? 0;
                const team2Score = compareTeam2.score ?? 0;
                const team1UniqueShare = team1Score > 0 ? Math.round((team1UniqueTotal / team1Score) * 100) : 0;
                const team2UniqueShare = team2Score > 0 ? Math.round((team2UniqueTotal / team2Score) * 100) : 0;

                const differentialNet = uniqueNet + cvcNet + commonNet;
                const trendIconClass = (value: number) =>
                  value > 0 ? 'text-success-text' : value < 0 ? 'text-danger-text' : 'text-text-secondary';
                const TrendIcon = ({ value }: { value: number }) =>
                  value > 0 ? <TrendingUp size={14} className="text-success-text" /> :
                    value < 0 ? <TrendingDown size={14} className="text-danger-text" /> :
                      <Minus size={14} className="text-text-secondary" />;

                const getRoleColor = (role: string) => {
                  switch (role) {
                    case 'batsman': return 'bg-info-bg/30 text-info-text';
                    case 'bowler': return 'bg-danger-bg/30 text-danger-text';
                    case 'all-rounder': return 'bg-card-purple/50 text-text-primary';
                    case 'wicket-keeper': return 'bg-success-bg/30 text-success-text';
                    default: return 'bg-gray-500/20 text-gray-400';
                  }
                };

                return (
                  <>
                    <div className={cn(
                      'rounded-2xl border p-3 transition-shadow',
                      cvcNet > 0 ? 'border-success-border/40 shadow-[0_0_22px_rgba(34,197,94,0.2)]' :
                        cvcNet < 0 ? 'border-danger-border/40 shadow-[0_0_22px_rgba(239,68,68,0.18)]' :
                          'border-primary/20'
                    ) + ' ' + cn(compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2', 'transition-all duration-500')}
                      style={{ transitionDelay: '300ms' }}>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-danger-text"></span>
                        Different Captain & Vice-Captain ({cvcDifferences.length})
                      </h4>
                      {cvcDifferences.length === 0 ? (
                        <p className="text-xs text-text-secondary">Both teams have same Captain and Vice-Captain.</p>
                      ) : (
                        <div className="space-y-2">
                          {cvcDifferences.map((row) => {
                            const diff = (row.team1?.points || 0) - (row.team2?.points || 0);
                            return (
                              <div key={row.label} className="grid grid-cols-12 gap-2 items-center p-3 bg-surface/80 rounded-xl border border-primary/20">
                                <div className="col-span-12 md:col-span-2 text-xs uppercase tracking-wide text-text-secondary font-semibold">{row.label}</div>

                                <div className="col-span-5 md:col-span-4 min-w-0 flex items-start gap-2 overflow-hidden">
                                  {row.team1 ? (
                                    <>
                                      <span className={cn('hidden sm:inline-flex text-xs px-2 py-0.5 rounded', getRoleColor(row.team1.role))}>{row.team1.role}</span>
                                      <div className="min-w-0">
                                        <p className="text-[11px] text-text-secondary truncate">{compareTeam1.user?.displayName}</p>
                                        <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">{row.team1.name}</p>
                                      </div>
                                    </>
                                  ) : <span className="text-xs text-text-secondary">-</span>}
                                </div>

                                <div className="col-span-2 md:col-span-2 text-center text-xs sm:text-sm font-bold text-text-primary bg-surface-light/70 rounded-lg px-1 sm:px-2 py-1">
                                  {row.team1?.points || 0} vs {row.team2?.points || 0}
                                </div>

                                <div className="col-span-5 md:col-span-3 min-w-0 flex items-start gap-2 overflow-hidden justify-end">
                                  {row.team2 ? (
                                    <>
                                      <div className="min-w-0 text-left md:text-right">
                                        <p className="text-[11px] text-text-secondary truncate">{compareTeam2.user?.displayName}</p>
                                        <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">{row.team2.name}</p>
                                      </div>
                                      <span className={cn('hidden sm:inline-flex text-xs px-2 py-0.5 rounded', getRoleColor(row.team2.role))}>{row.team2.role}</span>
                                    </>
                                  ) : <span className="text-xs text-text-secondary">-</span>}
                                </div>

                                <div className={cn('col-span-12 md:col-span-1 text-right text-sm font-bold', diff > 0 ? 'text-success-text' : diff < 0 ? 'text-danger-text' : 'text-text-secondary')}>
                                  {diff > 0 ? '+' : ''}{Math.round(diff * 100) / 100}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        'grid grid-cols-2 gap-3 sm:gap-4 transition-all duration-500',
                        compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      )}
                      style={{ transitionDelay: '340ms' }}
                    >
                      <div className={cn(
                        'rounded-2xl border p-3 transition-shadow',
                        uniqueNet > 0 ? 'border-success-border/40 shadow-[0_0_20px_rgba(34,197,94,0.18)]' : 'border-primary/20'
                      )}>
                        <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-info-text"></span>
                          Differential Picks • {compareTeam1.user?.displayName} ({onlyInTeam1.length})
                        </h4>
                        <p className="text-xs text-text-secondary mb-2">
                          {uniqueNet > 0
                            ? `${compareTeam1.user?.displayName} leads this section by ${Math.round(Math.abs(uniqueNet) * 100) / 100} pts`
                            : uniqueNet < 0
                              ? `${compareTeam2.user?.displayName} leads this section by ${Math.round(Math.abs(uniqueNet) * 100) / 100} pts`
                              : 'This section is tied'}
                        </p>
                        <div className="space-y-2">
                          {onlyInTeam1.map((player) => {
                            return (
                              <div key={player.playerId} className="flex items-center justify-between p-2 bg-surface rounded">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className={cn('text-xs px-2 py-0.5 rounded', getRoleColor(player.role))}>
                                    {player.role}
                                  </span>
                                  <span className="text-sm text-text-primary truncate">{player.name}</span>
                                </div>
                                <span className="text-sm font-bold text-accent ml-2">{player.points}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className={cn(
                        'rounded-2xl border p-3 transition-shadow',
                        uniqueNet < 0 ? 'border-success-border/40 shadow-[0_0_20px_rgba(34,197,94,0.18)]' : 'border-primary/20'
                      )}>
                        <h4 className="text-xs sm:text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success-text"></span>
                          Differential Picks • {compareTeam2.user?.displayName} ({onlyInTeam2.length})
                        </h4>
                        <p className="text-xs text-text-secondary mb-2">
                          Net section swing: {uniqueNet > 0 ? '+' : ''}{Math.round(uniqueNet * 100) / 100}
                        </p>
                        <div className="space-y-2">
                          {onlyInTeam2.map((player) => {
                            return (
                              <div key={player.playerId} className="flex items-center justify-between p-2 bg-surface rounded">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className={cn('text-xs px-2 py-0.5 rounded', getRoleColor(player.role))}>
                                    {player.role}
                                  </span>
                                  <span className="text-sm text-text-primary truncate">{player.name}</span>
                                </div>
                                <span className="text-sm font-bold text-accent ml-2">{player.points}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'transition-all duration-500',
                        compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      )}
                      style={{ transitionDelay: '380ms' }}
                    >
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-warning-text"></span>
                        Common Players (No C/VC Differences) ({commonPlayers.length})
                      </h4>
                      <p className="text-xs text-text-secondary mb-2">
                        Net swing from this section: {Math.round(commonNet * 100) / 100} (expected close to 0)
                      </p>
                      <div className="space-y-2">
                        {commonPlayers
                          .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
                          .map(({ key, p1, p2, diff }) => (
                            <div key={key} className="grid grid-cols-12 md:grid-cols-5 gap-2 items-center p-2 bg-surface rounded border border-primary/20">
                              <div className="col-span-5 md:col-span-2 flex items-center gap-2 min-w-0">
                                <span className={cn('text-xs px-2 py-0.5 rounded', getRoleColor(p1.role))}>{p1.role}</span>
                                <span className="text-sm text-text-primary truncate">{p1.name}</span>
                                {p1.isCaptain && p2.isCaptain && <Crown size={10} className="text-accent" />}
                                {p1.isViceCaptain && p2.isViceCaptain && <Star size={10} className="text-warning-text" />}
                              </div>
                              <div className="col-span-2 md:col-span-1 text-center text-sm font-bold text-text-primary">{p1?.points || 0}</div>
                              <div className="col-span-2 md:col-span-1 text-center text-sm font-bold text-text-primary">{p2?.points || 0}</div>
                              <div className={cn('col-span-1 md:col-span-1 text-right text-sm font-bold', diff > 0 ? 'text-success-text' : diff < 0 ? 'text-danger-text' : 'text-text-secondary')}>
                                <AnimatedNumber value={Math.round(diff * 100) / 100} precision={2} showSign />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'rounded-2xl border border-accent/30 bg-surface/70 p-3 sm:p-4 space-y-3 transition-all duration-500',
                        compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      )}
                      style={{ transitionDelay: '420ms' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-text-primary">Interesting Stats</h4>
                        <p className="text-[11px] text-text-secondary">Quick read of why one team is ahead</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded-xl border border-primary/20 bg-surface-light/60 px-3 py-2">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[11px] uppercase tracking-wide text-text-secondary">Overall Swing</p>
                            <StatInfoHint text="Total point swing from all comparison sections combined." />
                          </div>
                          <p className={cn('text-lg font-bold inline-flex items-center gap-1', trendIconClass(differentialNet))}>
                            <AnimatedNumber value={differentialNet} precision={2} showSign />
                            <TrendIcon value={differentialNet} />
                          </p>
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-surface-light/60 px-3 py-2">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[11px] uppercase tracking-wide text-text-secondary">C/VC Swing</p>
                            <StatInfoHint text="Point gap created only by captain and vice-captain choices." />
                          </div>
                          <p className={cn('text-lg font-bold inline-flex items-center gap-1', trendIconClass(cvcNet))}>
                            <AnimatedNumber value={cvcNet} precision={2} showSign />
                            <TrendIcon value={cvcNet} />
                          </p>
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-surface-light/60 px-3 py-2">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[11px] uppercase tracking-wide text-text-secondary">Unique Picks Swing</p>
                            <StatInfoHint text="Point gap from players picked by one team but not the other." />
                          </div>
                          <p className={cn('text-lg font-bold inline-flex items-center gap-1', trendIconClass(uniqueNet))}>
                            <AnimatedNumber value={uniqueNet} precision={2} showSign />
                            <TrendIcon value={uniqueNet} />
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs text-text-secondary">Unique Total • {compareTeam1.user?.displayName}</p>
                            <StatInfoHint text="Total points scored by players only this team has." />
                          </div>
                          <p className="text-xl font-bold text-accent flex items-center gap-1">
                            <AnimatedNumber value={team1UniqueTotal} precision={2} />
                            <TrendIcon value={team1UniqueTotal} />
                          </p>
                        </div>

                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30 text-center">
                          <div className="flex items-start justify-between gap-2 mb-1 text-left">
                            <p className="text-xs text-text-secondary">Net Differential Impact</p>
                            <StatInfoHint text="Final net edge from common picks, unique picks, and C/VC picks together." />
                          </div>
                          <p className={cn('text-xl font-bold inline-flex items-center gap-1', trendIconClass(differentialNet))}>
                            <AnimatedNumber value={differentialNet} precision={2} showSign />
                            <TrendIcon value={differentialNet} />
                          </p>
                        </div>

                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30 text-right">
                          <div className="flex items-start justify-between gap-2 mb-1 text-left">
                            <p className="text-xs text-text-secondary">Unique Total • {compareTeam2.user?.displayName}</p>
                            <StatInfoHint text="Total points scored by players only this team has." />
                          </div>
                          <p className="text-xl font-bold text-accent inline-flex items-center gap-1 justify-end">
                            <AnimatedNumber value={team2UniqueTotal} precision={2} />
                            <TrendIcon value={team2UniqueTotal} />
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs text-text-secondary">Captain/Vice Swing</p>
                            <StatInfoHint text="How many points C and VC decisions added or lost." />
                          </div>
                          <p className={cn('text-lg font-bold inline-flex items-center gap-1', trendIconClass(cvcNet))}>
                            <AnimatedNumber value={cvcNet} precision={2} showSign />
                            <TrendIcon value={cvcNet} />
                          </p>
                        </div>

                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs text-text-secondary">Player Overlap</p>
                            <StatInfoHint text="How much both teams are similar in player picks." />
                          </div>
                          <p className="text-lg font-bold text-accent">{overlapPct}%</p>
                        </div>

                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs text-text-secondary">Unique Reliance • {compareTeam1.user?.displayName}</p>
                            <StatInfoHint text="Percent of this team's score coming from unique players." />
                          </div>
                          <p className="text-lg font-bold text-info-text">{team1UniqueShare}%</p>
                        </div>

                        <div className="p-3 bg-surface/80 rounded-xl border border-primary/30">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs text-text-secondary">Unique Reliance • {compareTeam2.user?.displayName}</p>
                            <StatInfoHint text="Percent of this team's score coming from unique players." />
                          </div>
                          <p className="text-lg font-bold text-info-text">{team2UniqueShare}%</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => { setCompareTeam1(null); setCompareTeam2(null); }}
                      className={cn(
                        'w-full mt-4 transition-all duration-500',
                        compareRevealReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      )}
                      style={{ transitionDelay: '470ms' }}
                    >
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
  );
}
