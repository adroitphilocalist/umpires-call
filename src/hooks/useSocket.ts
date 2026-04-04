'use client';

import { useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      connectSocket();
    } else {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}