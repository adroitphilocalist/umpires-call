'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface LiveScoreData {
  matchId: string;
  team1Score: string;
  team2Score: string;
  team1Wickets: number;
  team2Wickets: number;
  team1Overs: number;
  team2Overs: number;
  battingTeam: string;
  lastUpdate: number;
}

export function useLiveScore(matchId?: string) {
  const [liveScore, setLiveScore] = useState<LiveScoreData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const initSocket = async () => {
      const { getSocket, connectSocket } = await import('@/lib/socket');
      const socketInstance = getSocket();
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('match:scoreUpdate', (data: LiveScoreData) => {
        if (!matchId || data.matchId === matchId) {
          setLiveScore(data);
        }
      });

      connectSocket();

      return () => {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('match:scoreUpdate');
      };
    };

    initSocket();
  }, [matchId]);

  const joinMatch = useCallback((id: string) => {
    if (socket) {
      socket.emit('join-match', id);
    }
  }, [socket]);

  const leaveMatch = useCallback((id: string) => {
    if (socket) {
      socket.emit('leave-match', id);
    }
  }, [socket]);

  return {
    liveScore,
    isConnected,
    joinMatch,
    leaveMatch,
  };
}