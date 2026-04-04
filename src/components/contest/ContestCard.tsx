'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button } from '@/components/ui';
import { Users, Trophy, Clock, ArrowRight } from 'lucide-react';
import { Contest } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ContestCardProps {
  contest: Contest;
  matchName?: string;
}

export function ContestCard({ contest, matchName }: ContestCardProps) {
  const statusVariant = {
    open: 'success' as const,
    filled: 'warning' as const,
    completed: 'default' as const,
  };

  const participantPercent = Math.round((contest.participantCount / contest.maxParticipants) * 100);

  return (
    <Card className="hover:border-accent/50 transition-all group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contest.name}</CardTitle>
            {matchName && (
              <p className="text-sm text-text-secondary mt-1">{matchName}</p>
            )}
          </div>
          <Badge variant={statusVariant[contest.status]}>{contest.status}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Trophy size={16} className="text-accent" />
            <span>Prize: {formatCurrency(contest.prizePool)}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Users size={16} className="text-accent" />
            <span>{contest.participantCount}/{contest.maxParticipants}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock size={16} className="text-accent" />
            <span>{formatDate(contest.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <span>Entry: {formatCurrency(contest.entryFee)}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Participants</span>
            <span>{participantPercent}%</span>
          </div>
          <div className="h-2 bg-primary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${participantPercent}%` }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/contest/${contest._id}`} className="w-full">
          <Button variant="secondary" className="w-full group-hover:bg-accent group-hover:text-background">
            <span>View Contest</span>
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export function ContestList({ contests }: { contests: Contest[] }) {
  if (contests.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy size={48} className="mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No Contests Yet</h3>
        <p className="text-text-secondary">Create your first contest to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contests.map((contest) => (
        <ContestCard key={contest._id} contest={contest} />
      ))}
    </div>
  );
}