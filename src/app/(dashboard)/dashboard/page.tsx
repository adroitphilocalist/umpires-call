'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Button, Badge, PageLoader } from '@/components/ui';
import { MatchList } from '@/components/live/MatchCard';
import { Trophy, Users, Calendar, TrendingUp, PlusCircle, ArrowRight } from 'lucide-react';
import { Contest, Match } from '@/types';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState({ contestsJoined: 0, totalWins: 0, avgRank: 0 });

  const activeContests = contests.filter(
    (contest) => contest.match?.status === 'upcoming' || contest.match?.status === 'live'
  );
  const previousContests = contests.filter(
    (contest) => contest.match?.status === 'completed'
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchContests();
      fetchMatches();
      fetchStats();
    }
  }, [user]);

  const fetchContests = async () => {
    try {
      const res = await fetch('/api/contests');
      const data = await res.json();
      if (data.success) {
        setContests(data.contests.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches?status=upcoming');
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchStats = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`/api/users/${user._id}/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
      // If 404 or error, just use default stats
    } catch (error) {
      console.error('Error fetching stats:', error);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Cricketer'}!
          </h1>
          <p className="text-text-secondary mt-2">Ready to build your winning team?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Trophy, label: 'Contests Joined', value: stats.contestsJoined, color: 'text-accent' },
            { icon: Users, label: 'Total Wins', value: stats.totalWins, color: 'text-success-text' },
            { icon: TrendingUp, label: 'Avg Rank', value: stats.avgRank || '-', color: 'text-info-text' },
            { icon: Calendar, label: 'Credits Left', value: '1000', color: 'text-text-primary' },
          ].map((stat, index) => (
            <Card key={index} variant="elevated">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-lg">
                  <stat.icon size={24} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <section className="relative mb-12 overflow-hidden rounded-2xl border border-accent/35 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.15),0_18px_60px_rgba(251,191,36,0.16)] sm:p-8">
          <div className="pointer-events-none absolute -left-16 top-0 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-info/15 blur-3xl" />

          <div className="relative flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Featured Zone</p>
              <h2 className="text-2xl font-bold text-text-primary font-heading">Active Contests</h2>
            </div>
            <Link href="/contests" className="text-accent hover:underline flex items-center gap-1 font-semibold">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeContests.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3 text-center py-10 border-accent/30 bg-card/90">
                <CardContent>
                  <p className="text-text-secondary">No active contests right now.</p>
                </CardContent>
              </Card>
            ) : (
              activeContests.slice(0, 3).map((contest) => {
                const spotsLeft = Math.max(contest.maxParticipants - contest.participantCount, 0);

                return (
                  <Card
                    key={contest._id}
                    className="group relative border-2 border-accent/35 bg-gradient-to-br from-card via-card to-primary/10 transition-all duration-300 hover:-translate-y-1 hover:border-accent/70 hover:shadow-[0_10px_35px_rgba(251,191,36,0.28)]"
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg leading-tight">{contest.name}</CardTitle>
                          <Badge
                            variant={contest.match?.status === 'live' ? 'info' : 'success'}
                            className={`mt-2 ${contest.match?.status === 'live' ? 'animate-pulse' : ''}`}
                          >
                            {contest.match?.status || contest.status}
                          </Badge>
                        </div>
                        {/* <Badge variant="warning" className="font-semibold">Top Pick</Badge> */}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
                        <span>{contest.participantCount} / {contest.maxParticipants} players</span>
                        <span className="font-semibold text-text-primary">Entry: ₹{contest.entryFee}</span>
                      </div>
                      <p className="text-xs text-warning-text font-medium">
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Contest is full'}
                      </p>
                    </CardContent>
                    <div className="mt-4">
                      <Link href={`/contest/${contest._id}`}>
                        <Button className="w-full font-semibold">Join/View Contest</Button>
                      </Link>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary font-heading">Upcoming Matches</h2>
          <Link href="/matches" className="text-accent hover:underline flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mb-12">
          <MatchList matches={matches} />
        </div>

        {/* <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary font-heading">Previous Contests</h2>
          <Link href="/contests" className="text-accent hover:underline flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div> */}

        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {previousContests.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3 text-center py-10">
              <CardContent>
                <p className="text-text-secondary">No previous contests yet.</p>
              </CardContent>
            </Card>
          ) : (
            previousContests.slice(0, 3).map((contest) => (
              <Card key={contest._id} className="hover:border-accent/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{contest.name}</CardTitle>
                      <Badge variant="default" className="mt-2">completed</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{contest.participantCount} / {contest.maxParticipants} players</span>
                    <span>Entry: ₹{contest.entryFee}</span>
                  </div>
                </CardContent>
                <div className="mt-4">
                  <Link href={`/contest/${contest._id}`}>
                    <Button variant="secondary" className="w-full">View Contest</Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div> */}

        <div className="text-center">
          <Link href="/create-contest">
            <Button size="lg">
              <PlusCircle size={20} className="mr-2" />
              Create New Contest
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}