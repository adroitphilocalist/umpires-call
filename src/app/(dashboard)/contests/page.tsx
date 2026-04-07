'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Badge, Button, PageLoader } from '@/components/ui';
import { Contest } from '@/types';
import { Trophy, Users, ArrowLeft } from 'lucide-react';

function ContestsContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContests();
    }
  }, [isAuthenticated, matchId]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const url = matchId ? `/api/contests?matchId=${matchId}` : '/api/contests';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setContests(data.contests);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'filled':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        {matchId && (
          <Link href={`/matches`} className="inline-flex items-center gap-1 text-text-secondary hover:text-accent mb-4">
            <ArrowLeft size={16} />
            Back to Matches
          </Link>
        )}
        <h1 className="text-3xl font-bold text-text-primary font-heading">
          {matchId ? 'Contests for this Match' : 'All Contests'}
        </h1>
        <p className="text-text-secondary mt-2">
          {matchId ? 'Browse contests available for the selected match' : 'Join contests and build your winning team'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <PageLoader />
        </div>
      ) : contests.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <Trophy size={48} className="mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary text-lg">No contests found</p>
            {matchId && (
              <p className="text-text-secondary text-sm mt-2">No contests available for this match yet</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <Card key={contest._id} variant="elevated" className="hover:border-accent/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contest.name}</CardTitle>
                    {contest.match && (
                      <p className="text-sm text-text-secondary mt-1">
                        {contest.match.team1.shortName} vs {contest.match.team2.shortName}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(contest.status) as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
                    {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-accent" />
                    <span className="text-text-secondary">
                      {contest.participantCount} / {contest.maxParticipants} participants
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Entry Fee</span>
                    <span className="font-bold text-text-primary">₹{contest.entryFee}</span>
                  </div>
                  {contest.prizePool > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Prize Pool</span>
                      <span className="font-bold text-success-text">₹{contest.prizePool.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="mt-4">
                <Link href={`/contest/${contest._id}`}>
                  <Button variant="secondary" className="w-full">View Contest</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default function ContestsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[50vh]">
          <PageLoader />
        </div>
      }>
        <ContestsContent />
      </Suspense>
    </div>
  );
}
