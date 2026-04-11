'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Activity, Flame, Timer, Trophy, Sparkles, Radio, ChevronDown, ChevronUp } from 'lucide-react';

interface InningsBatsman {
  id: number;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  outDesc: string;
}

interface InningsBowler {
  id: number;
  name: string;
  overs: string | number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  scorecardDots: number;
  liveDots: number;
}

interface InningsSummary {
  inningsId: number;
  battingTeamName: string;
  battingTeamShortName: string;
  bowlingTeamName: string;
  bowlingTeamShortName: string;
  totalRuns: number;
  wickets: number;
  overs: number;
  runRate: number;
  topScorer: InningsBatsman | null;
  bestBowler: InningsBowler | null;
  batsmen: InningsBatsman[];
  bowlers: InningsBowler[];
}

interface RecentOver {
  innings: number;
  over: number;
  summary: string;
  bowlerName: string;
}

export interface LiveScorecardData {
  fetchedAt: string;
  match: {
    id: string;
    status: string;
    team1?: { name?: string; shortName?: string };
    team2?: { name?: string; shortName?: string };
  };
  innings: InningsSummary[];
  recentOvers: RecentOver[];
}

const getOverTokenClass = (token: string) => {
  const normalized = token.toUpperCase();

  if (normalized === 'W') {
    return 'bg-danger-bg/60 border-danger-border text-danger-text';
  }
  if (normalized === '6') {
    return 'bg-warning-bg/70 border-warning-border text-warning-text';
  }
  if (normalized === '4') {
    return 'bg-info-bg/60 border-info-border text-info-text';
  }
  if (normalized === '.') {
    return 'bg-surface-light border-primary/25 text-text-secondary';
  }
  if (normalized === 'WD' || normalized === 'NB') {
    return 'bg-card-purple/60 border-primary/30 text-text-primary';
  }

  return 'bg-success-bg/35 border-success-border text-success-text';
};

export function LiveScorecardPanel({ data }: { data: LiveScorecardData }) {
  const [isRecentOversOpen, setIsRecentOversOpen] = useState(true);
  const [openInningsIds, setOpenInningsIds] = useState<number[]>(
    data.innings.map((innings) => innings.inningsId)
  );

  const updatedLabel = new Date(data.fetchedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const toggleInnings = (inningsId: number) => {
    setOpenInningsIds((prev) =>
      prev.includes(inningsId) ? prev.filter((id) => id !== inningsId) : [...prev, inningsId]
    );
  };

  useEffect(() => {
    setOpenInningsIds((prev) => {
      const incoming = data.innings.map((innings) => innings.inningsId);
      const merged = new Set([...prev, ...incoming]);
      return Array.from(merged);
    });
  }, [data.innings]);

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden border border-accent/40 bg-gradient-to-br from-accent/10 via-surface to-card-purple/20 shadow-[0_22px_55px_rgba(96,165,250,0.14)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-warning-bg/30 blur-3xl" />

        <CardHeader className="relative z-10 bg-gradient-to-r from-accent/15 via-card to-warning-bg/20 border-b border-accent/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              Live Scorecard Engine
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="gap-1 border border-info-border/50">
                <Timer size={12} /> Updated {updatedLabel}
              </Badge>
              <Badge variant={data.match.status === 'live' ? 'danger' : data.match.status === 'completed' ? 'success' : 'warning'} className="gap-1">
                {data.match.status === 'live' && <Radio size={12} className="animate-pulse" />}
                {data.match.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl border border-accent/30 bg-surface/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-secondary">Team 1</p>
              <p className="text-sm font-semibold text-text-primary truncate">{data.match.team1?.name || 'TBA'}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-surface/70 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-text-secondary">Match State</p>
              <p className="text-sm font-semibold text-accent">{data.match.status.toUpperCase()}</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-surface/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-secondary">Team 2</p>
              <p className="text-sm font-semibold text-text-primary truncate">{data.match.team2?.name || 'TBA'}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-4">
          <div className="rounded-2xl border border-primary/25 bg-surface/65 p-3">
            <button
              type="button"
              onClick={() => setIsRecentOversOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-surface/60 px-3 py-2.5 hover:border-accent/45 hover:bg-surface/80 transition-all"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" />
                  Last 10 Overs (Ball by Ball)
                </p>
                <p className="text-xs text-text-secondary mt-0.5">Latest {Math.min(data.recentOvers.length, 10)} overs</p>
              </div>
              <div className="text-text-secondary">
                {isRecentOversOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isRecentOversOpen && (
              <div className="space-y-2 mt-3">
                {data.recentOvers.slice(0, 10).map((over, idx) => {
                  const tokens = String(over.summary || '')
                    .split(/\s+/)
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(-8);

                  return (
                    <div key={`${over.innings}-${over.over}-${idx}`} className="rounded-xl border border-primary/20 bg-surface px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[11px] text-text-secondary uppercase tracking-wide">Innings {over.innings} • Over {over.over}</p>
                        <p className="text-xs text-text-secondary truncate">{over.bowlerName}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {tokens.length === 0 ? (
                          <span className="text-xs text-text-secondary">No ball events available</span>
                        ) : tokens.map((token, tokenIdx) => (
                          <span
                            key={`${over.innings}-${over.over}-${tokenIdx}`}
                            className={`inline-flex h-7 min-w-[1.8rem] items-center justify-center rounded-full border px-2 text-xs font-bold ${getOverTokenClass(token)}`}
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {data.recentOvers.length === 0 && (
                  <p className="text-sm text-text-secondary">Recent over feed will appear once over-by-over data is available.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.innings.map((innings, index) => {
        const inningsOrderLabel =
          index === 0 ? '1st Innings Scorecard' : index === 1 ? '2nd Innings Scorecard' : `Innings ${index + 1} Scorecard`;
        const isInningsOpen = openInningsIds.includes(innings.inningsId);

        return (
          <Card key={innings.inningsId || innings.battingTeamName} className="overflow-hidden border border-primary/30 bg-gradient-to-b from-surface/95 to-surface-light/45 shadow-[0_10px_34px_rgba(31,41,55,0.08)]">
            <CardHeader className="bg-gradient-to-r from-surface-light/95 via-card to-surface-light/45 border-b border-primary/20">
              <button
                type="button"
                onClick={() => toggleInnings(innings.inningsId)}
                className="w-full text-left rounded-xl border border-primary/25 bg-surface/70 px-3 py-3 hover:border-accent/40 hover:bg-surface transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">{inningsOrderLabel}</p>
                    <CardTitle className="text-xl flex flex-wrap items-end gap-2">
                      <span>{innings.battingTeamName}</span>
                      <span className="text-accent">{innings.totalRuns}/{innings.wickets}</span>
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-primary/25 bg-surface/70 px-2 py-1 text-text-secondary">Overs {innings.overs}</span>
                      <span className="rounded-full border border-info-border/40 bg-info-bg/30 px-2 py-1 text-info-text">RR {innings.runRate}</span>
                      <span className="rounded-full border border-primary/25 bg-surface/70 px-2 py-1 text-text-secondary">Bowling: {innings.bowlingTeamName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-text-secondary">
                      {isInningsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {innings.topScorer && (
                        <Badge variant="success" className="justify-start gap-1">
                          <Trophy size={12} /> Top Batter: {innings.topScorer.name} ({innings.topScorer.runs})
                        </Badge>
                      )}
                      {innings.bestBowler && (
                        <Badge variant="warning" className="justify-start gap-1">
                          <Flame size={12} /> Best Bowler: {innings.bestBowler.name} ({innings.bestBowler.wickets}/{innings.bestBowler.runs})
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </CardHeader>

            {isInningsOpen && (
              <CardContent className="space-y-5 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Batting Card</h4>
                  <div className="overflow-x-auto rounded-xl border border-primary/30 bg-surface/80">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-surface-light to-card text-text-secondary">
                        <tr>
                          <th className="px-3 py-2 text-left">Batter</th>
                          <th className="px-3 py-2 text-right">R</th>
                          <th className="px-3 py-2 text-right">B</th>
                          <th className="px-3 py-2 text-right">4s</th>
                          <th className="px-3 py-2 text-right">6s</th>
                          <th className="px-3 py-2 text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.batsmen.slice(0, 12).map((b) => (
                          <tr key={`${b.id}-${b.name}`} className="border-t border-primary/20 hover:bg-surface-light/50 transition-colors">
                            <td className="px-3 py-2">
                              <p className="text-text-primary font-semibold">{b.name}</p>
                              <p className="text-xs text-text-secondary truncate max-w-[280px]">{b.outDesc}</p>
                            </td>
                            <td className="px-3 py-2 text-right text-accent font-bold">{b.runs}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{b.balls}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{b.fours}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{b.sixes}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{Number(b.strikeRate || 0).toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Bowling Card</h4>
                  <div className="overflow-x-auto rounded-xl border border-primary/30 bg-surface/80">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-surface-light to-card text-text-secondary">
                        <tr>
                          <th className="px-3 py-2 text-left">Bowler</th>
                          <th className="px-3 py-2 text-right">O</th>
                          <th className="px-3 py-2 text-right">M</th>
                          <th className="px-3 py-2 text-right">R</th>
                          <th className="px-3 py-2 text-right">W</th>
                          <th className="px-3 py-2 text-right">Eco</th>
                          <th className="px-3 py-2 text-right">Dots</th>
                        </tr>
                      </thead>
                      <tbody>
                        {innings.bowlers.map((b) => (
                          <tr key={`${b.id}-${b.name}`} className="border-t border-primary/20 hover:bg-surface-light/50 transition-colors">
                            <td className="px-3 py-2 text-text-primary font-semibold">{b.name}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{b.overs}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{b.maidens}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{b.runs}</td>
                            <td className="px-3 py-2 text-right text-accent font-bold">{b.wickets}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{Number(b.economy || 0).toFixed(1)}</td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-text-primary font-semibold">{b.liveDots || b.scorecardDots || 0}</span>
                              {b.liveDots > 0 && b.scorecardDots > 0 && b.liveDots !== b.scorecardDots && (
                                <span className="text-[10px] text-text-secondary ml-1">(api {b.scorecardDots})</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
