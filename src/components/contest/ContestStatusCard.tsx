'use client';

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ArrowRight, Check } from 'lucide-react';
import { Contest } from '@/types';
import { ContestTeam } from './types';

interface ContestStatusCardProps {
  hasJoined: boolean;
  userTeam: ContestTeam | null;
  contestId: string;
  contest: Contest;
  isMatchStarted: boolean;
  isJoining: boolean;
  onJoin: () => void;
}

export function ContestStatusCard({
  hasJoined,
  userTeam,
  contestId,
  contest,
  isMatchStarted,
  isJoining,
  onJoin,
}: ContestStatusCardProps) {
  return (
    <Card className="sticky top-24 opacity-90 hover:opacity-100 transition-opacity">
      <CardHeader>
        <CardTitle>Contest Status</CardTitle>
      </CardHeader>
      <CardContent>
        {hasJoined ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success-text">
              <Check size={20} />
              <span className="font-medium">You have joined this contest</span>
            </div>

            {userTeam ? (
              <Link href={`/my-team/${contestId}`}>
                <Button className="w-full">
                  View My Team
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
            ) : (
              isMatchStarted ? (
                <Button className="w-full" disabled>
                  Team Creation Locked
                </Button>
              ) : (
                <Link href={`/my-team/${contestId}`}>
                  <Button className="w-full">
                    Create Team
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contest.status === 'open' && !isMatchStarted ? (
              <Button
                className="w-full"
                onClick={onJoin}
                isLoading={isJoining}
                disabled={contest.participantCount >= contest.maxParticipants}
              >
                Join Contest
              </Button>
            ) : (
              <Button className="w-full" disabled>
                {isMatchStarted ? 'Match Started' : `Contest ${contest.status}`}
              </Button>
            )}

            {contest.participantCount >= contest.maxParticipants && (
              <p className="text-sm text-text-secondary text-center">
                Contest is full
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
