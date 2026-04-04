'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contest } from '@/types';

export function useContest(contestId?: string) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/contests');
      const data = await response.json();
      if (data.success) {
        setContests(data.contests);
      } else {
        setError(data.error || 'Failed to fetch contests');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchContest = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contests/${id}`);
      const data = await response.json();
      if (data.success) {
        setContest(data.contest);
      } else {
        setError(data.error || 'Failed to fetch contest');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContest = useCallback(async (contestData: Partial<Contest>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contestData),
      });
      const data = await response.json();
      if (data.success) {
        return data.contest;
      } else {
        setError(data.error || 'Failed to create contest');
        return null;
      }
    } catch (err) {
      setError('Network error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinContest = useCallback(async (id: string, teamId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contests/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      const data = await response.json();
      if (data.success) {
        return true;
      } else {
        setError(data.error || 'Failed to join contest');
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contestId) {
      fetchContests();
    }
  }, [contestId, fetchContests]);

  useEffect(() => {
    if (contestId) {
      fetchContest(contestId);
    }
  }, [contestId, fetchContest]);

  return {
    contests,
    contest,
    isLoading,
    error,
    fetchContests,
    fetchContest,
    createContest,
    joinContest,
  };
}