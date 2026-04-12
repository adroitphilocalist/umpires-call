'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Calendar, DollarSign, Trophy, Users } from 'lucide-react';
import { Contest } from '@/types';

interface ContestOverviewCardProps {
  contest: Contest;
  matchDate: Date | null;
}

export function ContestOverviewCard({ contest, matchDate }: ContestOverviewCardProps) {
  return (
    <Card className="order-2 opacity-90 hover:opacity-100 transition-opacity">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{contest.name}</CardTitle>
            <CardDescription className="mt-2">{contest.description}</CardDescription>
          </div>
          <Badge
            variant={contest.status === 'open' ? 'success' : contest.status === 'filled' ? 'warning' : 'info'}
          >
            {contest.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
            <Users size={24} className="text-accent" />
            <div>
              <p className="text-sm text-text-secondary">Participants</p>
              <p className="text-xl font-bold text-text-primary">
                {contest.participantCount} / {contest.maxParticipants}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
            <Trophy size={24} className="text-accent" />
            <div>
              <p className="text-sm text-text-secondary">Prize Pool</p>
              <p className="text-xl font-bold text-text-primary">₹{contest.prizePool?.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
            <DollarSign size={24} className="text-accent" />
            <div>
              <p className="text-sm text-text-secondary">Entry Fee</p>
              <p className="text-xl font-bold text-text-primary">₹{contest.entryFee}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface rounded-lg">
            <Calendar size={24} className="text-accent" />
            <div>
              <p className="text-sm text-text-secondary">Starts</p>
              <p className="text-xl font-bold text-text-primary">
                {matchDate ? matchDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'TBD'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
