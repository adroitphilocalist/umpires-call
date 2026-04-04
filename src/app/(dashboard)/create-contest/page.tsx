'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Button, Badge, PageLoader } from '@/components/ui';
import { Match } from '@/types';
import { Trophy, Users } from 'lucide-react';

export default function CreateContestPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches?status=upcoming');
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatchId) {
      setError('Please select a match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedMatch = matches.find(m => m._id === selectedMatchId);
      if (!selectedMatch) {
        setError('Invalid match selected');
        setIsSubmitting(false);
        return;
      }

      // Auto-generate contest name from match
      const contestName = `${selectedMatch.team1.shortName} vs ${selectedMatch.team2.shortName} - Private Contest`;
      
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contestName,
          description: 'Private contest with friends',
          matchId: selectedMatchId,
          entryFee: 0, // Always free
          maxParticipants: 10, // Always 10 members
          prizePool: 0,
          creatorId: user?._id,
          startTime: selectedMatch.date,
          endTime: new Date(new Date(selectedMatch.date).getTime() + 4 * 60 * 60 * 1000), // 4 hours after match
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/contest/${data.contest._id}`);
      } else {
        setError(data.error || 'Failed to create contest');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">Create Contest</h1>
          <p className="text-text-secondary mt-2">Create a private contest for you and your friends</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Select Match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Choose an upcoming match
                </label>
                <select
                  className="w-full bg-surface border border-primary rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  required
                >
                  <option value="">Select a match</option>
                  {matches.map((match) => (
                    <option key={match._id} value={match._id}>
                      {match.team1.shortName} vs {match.team2.shortName} - {new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {match.venue.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatchId && (
                <div className="p-4 bg-surface-light rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-accent" />
                    <span className="text-sm text-text-secondary">Entry Fee:</span>
                    <span className="text-lg font-bold text-accent">FREE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-accent" />
                    <span className="text-sm text-text-secondary">Participants:</span>
                    <span className="text-lg font-bold text-accent">10 Players</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedMatchId}
              className="flex-1"
            >
              Create Contest
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}