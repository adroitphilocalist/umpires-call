'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Calendar, MapPin } from 'lucide-react';
import { Match } from '@/types';

interface MatchDetailsCardProps {
  match: Match;
  matchDate: Date | null;
}

export function MatchDetailsCard({ match, matchDate }: MatchDetailsCardProps) {
  return (
    <Card className="order-3 opacity-85 hover:opacity-100 transition-opacity">
      <CardHeader>
        <CardTitle>Match Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-text-primary">{match.team1?.name}</p>
              <p className="text-sm text-text-secondary">{match.team1?.shortName}</p>
            </div>
            <div className="px-4">
              <p className="text-lg font-bold text-accent">VS</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-text-primary">{match.team2?.name}</p>
              <p className="text-sm text-text-secondary">{match.team2?.shortName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-text-secondary">
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{match.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>
                {matchDate ? matchDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'TBD'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
