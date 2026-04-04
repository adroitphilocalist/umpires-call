'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Card, CardHeader, CardTitle, CardContent, Badge, PageLoader } from '@/components/ui';
import { Match } from '@/types';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface GroupedMatches {
  [date: string]: Match[];
}

export default function MatchesPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupedMatches, setGroupedMatches] = useState<GroupedMatches>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches();
    }
  }, [isAuthenticated]);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
        groupMatchesByDate(data.matches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const groupMatchesByDate = (matches: Match[]) => {
    const grouped: GroupedMatches = {};
    matches.forEach((match, index) => {
      const dateObj = new Date(match.date);
      const dateKey = dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push({ ...match, matchNumber: index + 1 } as Match & { matchNumber: number });
    });
    setGroupedMatches(grouped);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'live':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'warning';
    }
  };

  const getMatchNumber = (match: Match, dateKey: string, index: number) => {
    const dateMatches = groupedMatches[dateKey] || [];
    const matchIndex = dateMatches.findIndex(m => m._id === match._id);
    let globalIndex = 0;
    Object.keys(groupedMatches).forEach(key => {
      if (key === dateKey) {
        globalIndex += matchIndex;
      } else if (key < dateKey) {
        globalIndex += groupedMatches[key].length;
      }
    });
    return globalIndex + 1;
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const dateKeys = Object.keys(groupedMatches).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-heading">
            IPL 2026 Matches
          </h1>
          <p className="text-text-secondary mt-2">All matches for the season</p>
        </div>

        {dateKeys.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="py-12 text-center">
              <p className="text-text-secondary">No matches found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-accent" />
                  <h2 className="text-xl font-bold text-text-primary">{dateKey}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(groupedMatches[dateKey] || []).map((match, idx) => (
                    <Card
                      key={match._id}
                      variant="elevated"
                      className="hover:border-accent/50 transition-all"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="default" className="text-xs">
                                Match {getMatchNumber(match, dateKey, idx)}
                              </Badge>
                              <Badge variant={getStatusVariant(match.status) as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
                                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">
                              {match.team1.shortName} vs {match.team2.shortName}
                            </CardTitle>
                            <p className="text-sm text-text-secondary mt-1">
                              {match.team1.name} vs {match.team2.name}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Clock size={16} className="text-accent" />
                            <span>
                              {new Date(match.date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <MapPin size={16} className="text-accent" />
                            <span>{match.venue}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}