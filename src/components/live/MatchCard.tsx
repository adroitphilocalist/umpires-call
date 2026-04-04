'use client';

import { Match } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import { MapPin, Calendar, Clock, Cpu } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  
  const statusColors = {
    upcoming: 'info' as const,
    live: 'danger' as const,
    completed: 'default' as const,
  };

  const handleViewContests = () => {
    router.push(`/contests?matchId=${match._id}`);
  };

  return (
    <Card className="hover:border-accent/30 transition-all overflow-hidden">
      {/* Header with status */}
      <div className="flex items-center justify-between mb-3 px-4 pt-3">
        <Badge variant={statusColors[match.status]}>
          {match.status === 'live' && <span className="animate-pulse mr-1">●</span>}
          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </Badge>
        <span className="text-xs text-text-secondary bg-primary/30 px-2 py-1 rounded">{match.format}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="text-center flex-1">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-sm font-bold text-accent">
              {match.team1.shortName}
            </span>
          </div>
          <p className="text-xs font-medium text-text-primary truncate max-w-[80px]">{match.team1.name}</p>
        </div>

        <div className="text-center px-2">
          {match.status === 'live' && match.liveScore ? (
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary font-mono">
                {match.liveScore.team1Score}/{match.liveScore.team1Wickets}
              </p>
              <p className="text-xs text-text-secondary">vs</p>
              <p className="text-md font-semibold text-text-primary font-mono">
                {match.liveScore.team2Score}/{match.liveScore.team2Wickets}
              </p>
            </div>
          ) : (
            <div className="text-lg text-text-secondary font-heading">VS</div>
          )}
        </div>

        <div className="text-center flex-1">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-sm font-bold text-accent">
              {match.team2.shortName}
            </span>
          </div>
          <p className="text-xs font-medium text-text-primary truncate max-w-[80px]">{match.team2.name}</p>
        </div>
      </div>

      {/* Venue and Date */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-4 mb-3">
        <div className="flex items-center gap-1 truncate">
          <MapPin size={12} />
          <span className="truncate">{match.venue.split(',')[0]}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(match.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatTime(match.date)}</span>
          </div>
        </div>
      </div>

      {/* Button */}
      {match.status !== 'completed' && (
        <div className="px-4 pb-3">
          <Button variant="secondary" size="sm" className="w-full" onClick={handleViewContests}>
            <Cpu size={14} className="mr-2" />
            View Contests
          </Button>
        </div>
      )}
    </Card>
  );
}

export function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No Matches</h3>
        <p className="text-text-secondary">Check back later for upcoming matches</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => (
        <MatchCard key={match._id} match={match} />
      ))}
    </div>
  );
}