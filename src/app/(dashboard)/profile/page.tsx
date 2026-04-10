'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Button, Avatar, Badge, PageLoader } from '@/components/ui';
import { LogOut, Trophy, Users, TrendingUp, Calendar, Settings, Crown, Star } from 'lucide-react';

interface UserStats {
  contestsJoined: number;
  totalWins: number;
  avgRank: number;
  totalContests: number;
}

interface ContestHistory {
  _id: string;
  name: string;
  rank: number;
  score: number;
  prize: number;
  date: Date;
}

export default function ProfilePage() {
  const { user, dbUser, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats>({
    contestsJoined: 0,
    totalWins: 0,
    avgRank: 0,
    totalContests: 0,
  });
  const [history, setHistory] = useState<ContestHistory[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/users/${user?._id}/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }

      const historyRes = await fetch(`/api/users/${user?._id}/history`);
      const historyData = await historyRes.json();
      if (historyData.success) {
        setHistory(historyData.history);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">Profile</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1 text-center">
            <div className="py-6">
              <Avatar
                src={user?.avatar}
                name={user?.displayName || 'User'}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="text-xl font-bold text-text-primary">{user?.displayName || 'Cricketer'}</h2>
              <p className="text-text-secondary">{user?.phone}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
                <Trophy size={16} className="text-accent" />
                <span className="text-accent font-medium">{dbUser?.credits || user?.credits || 1000} Credits</span>
              </div>
            </div>
          </Card>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <Card variant="elevated">
              <div className="text-center py-4">
                <Trophy size={32} className="mx-auto text-accent mb-2" />
                <p className="text-3xl font-bold text-text-primary">{stats.contestsJoined}</p>
                <p className="text-sm text-text-secondary">Contests Joined</p>
              </div>
            </Card>
            <Card variant="elevated">
              <div className="text-center py-4">
                <Crown size={32} className="mx-auto text-warning-text mb-2" />
                <p className="text-3xl font-bold text-text-primary">{stats.totalWins}</p>
                <p className="text-sm text-text-secondary">Total Wins</p>
              </div>
            </Card>
            <Card variant="elevated">
              <div className="text-center py-4">
                <TrendingUp size={32} className="mx-auto text-success-text mb-2" />
                <p className="text-3xl font-bold text-text-primary">{stats.avgRank || '-'}</p>
                <p className="text-sm text-text-secondary">Avg Rank</p>
              </div>
            </Card>
            <Card variant="elevated">
              <div className="text-center py-4">
                <Users size={32} className="mx-auto text-info-text mb-2" />
                <p className="text-3xl font-bold text-text-primary">{stats.totalContests}</p>
                <p className="text-sm text-text-secondary">Created</p>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contest History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <Trophy size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary">No contest history yet</p>
                <Button variant="secondary" className="mt-4" onClick={() => router.push('/dashboard')}>
                  Join Your First Contest
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((contest) => (
                  <div
                    key={contest._id}
                    className="flex items-center justify-between p-4 bg-surface-light rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-text-primary">{contest.name}</h4>
                      <p className="text-sm text-text-secondary">
                        {new Date(contest.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={contest.rank <= 3 ? 'warning' : 'default'}
                        >
                          #{contest.rank}
                        </Badge>
                        <span className="text-lg font-bold text-accent">{contest.score} pts</span>
                      </div>
                      {contest.prize > 0 && (
                        <p className="text-sm text-success-text">Won ₹{contest.prize}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}