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
        setMatches(data.matches.slice(0, 10));
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

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary font-heading">Upcoming Matches</h2>
          <Link href="/matches" className="text-accent hover:underline flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mb-12">
          <MatchList matches={matches} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary font-heading">Active Contests</h2>
          <Link href="/contests" className="text-accent hover:underline flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contests.slice(0, 3).map((contest) => (
            <Card key={contest._id} className="hover:border-accent/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{contest.name}</CardTitle>
                    <Badge variant="success" className="mt-2">{contest.status}</Badge>
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
          ))}
        </div>

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