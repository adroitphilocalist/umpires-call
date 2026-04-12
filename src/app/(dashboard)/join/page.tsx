'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Input, Button, PageLoader } from '@/components/ui';
import { ArrowLeft, Ticket, AlertCircle, CheckCircle } from 'lucide-react';

export default function JoinContestPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundContest, setFoundContest] = useState<{ _id: string; name: string } | null>(null);
  const [linkPrefillTried, setLinkPrefillTried] = useState(false);
  const [linkCodeDetected, setLinkCodeDetected] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const findContestByCode = async (rawCode: string) => {
    setError('');
    setFoundContest(null);

    const code = rawCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contests?inviteCode=${code}`);
      const data = await res.json();

      if (data.success && data.contests && data.contests.length > 0) {
        setFoundContest({
          _id: data.contests[0]._id,
          name: data.contests[0].name,
        });
      } else {
        setError('No contest found with this invite code');
      }
    } catch {
      setError('Failed to find contest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated || linkPrefillTried) {
      return;
    }

    const codeFromLink = new URLSearchParams(window.location.search).get('code')?.trim().toUpperCase() || '';
    if (!codeFromLink) {
      setLinkPrefillTried(true);
      return;
    }

    setInviteCode(codeFromLink);
    setLinkCodeDetected(true);
    setLinkPrefillTried(true);
    void findContestByCode(codeFromLink);
  }, [authLoading, isAuthenticated, linkPrefillTried]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await findContestByCode(inviteCode);
  };

  const handleJoin = () => {
    if (foundContest) {
      router.push(`/contest/${foundContest._id}`);
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Join Contest</CardTitle>
          </CardHeader>
          <CardContent>
            {!foundContest ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-3 text-center">
                    Enter the 6-character invite code
                  </label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="text-center text-xl tracking-widest font-mono"
                    autoFocus
                  />
                  {linkCodeDetected && (
                    <p className="text-xs text-success-text mt-2 text-center">
                      Invite code detected from shared link.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-danger-text text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || inviteCode.length !== 6}
                  className="w-full"
                >
                  {isSubmitting ? 'Searching...' : 'Find Contest'}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-success-text justify-center">
                  <CheckCircle size={24} />
                  <span className="font-medium">Contest Found!</span>
                </div>

                <div className="bg-surface rounded-lg p-4 text-center">
                  <p className="text-text-secondary text-sm mb-1">Contest Name</p>
                  <p className="text-text-primary font-semibold">{foundContest.name}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFoundContest(null);
                      setInviteCode('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleJoin} className="flex-1">
                    Join Contest
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="max-w-md mx-auto mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
            <Ticket size={16} />
            <span>Ask your friend for the invite code to join their contest</span>
          </div>
        </div>
      </main>
    </div>
  );
}
