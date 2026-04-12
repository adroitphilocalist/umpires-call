'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface MatchCountdownCardProps {
  matchDate: Date;
  isMatchStarted: boolean;
  isUrgent: boolean;
  isSoon: boolean;
  countdownProgressPct: number;
  countdown: CountdownParts;
}

export function MatchCountdownCard({
  matchDate,
  isMatchStarted,
  isUrgent,
  isSoon,
  countdownProgressPct,
  countdown,
}: MatchCountdownCardProps) {
  return (
    <Card className="relative overflow-hidden border-accent/40 bg-gradient-to-br from-accent/20 via-surface to-warning-bg/30 shadow-[0_20px_55px_rgba(96,165,250,0.15)]">
      <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-warning-bg/40 blur-3xl" />

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock size={18} className={cn('text-accent', isSoon && 'animate-pulse')} />
              Match Countdown
            </CardTitle>
          </div>
          <Badge
            variant={isMatchStarted ? 'success' : isUrgent ? 'danger' : isSoon ? 'warning' : 'info'}
            className="gap-1"
          >
            <Sparkles size={12} />
            {isMatchStarted ? 'Live' : isUrgent ? 'Starting Very Soon' : isSoon ? 'Starts Soon' : 'Upcoming'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {isMatchStarted ? (
          <div className="rounded-2xl border border-success-border bg-success-bg/45 p-4 text-center">
            <p className="text-success-text font-semibold">Live Now</p>
            <p className="text-xs text-text-secondary mt-1">You can now track points and leaderboard movement.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-2 rounded-full bg-surface-light overflow-hidden border border-accent/30">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isUrgent
                    ? 'bg-gradient-to-r from-danger-text to-warning-text'
                    : 'bg-gradient-to-r from-accent to-accent-light'
                )}
                style={{ width: `${countdownProgressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Days', value: countdown.days, accent: 'text-info-text' },
                { label: 'Hours', value: countdown.hours, accent: 'text-accent' },
                { label: 'Min', value: countdown.minutes, accent: 'text-warning-text' },
                { label: 'Sec', value: countdown.seconds, accent: isUrgent ? 'text-danger-text' : 'text-success-text', highlight: true },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className={cn(
                    'rounded-2xl border bg-surface/85 p-2 text-center shadow-sm transition-all',
                    unit.highlight ? 'border-accent/60 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'border-accent/30'
                  )}
                >
                  <p className={cn('text-xl font-bold tabular-nums', unit.accent)}>{String(unit.value).padStart(2, '0')}</p>
                  <p className="text-[10px] uppercase tracking-wide text-text-secondary">{unit.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-accent/30 bg-surface/70 px-3 py-2 text-center">
              <p className="text-xs text-text-secondary">
                Starts at {matchDate.toLocaleString('en-IN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
