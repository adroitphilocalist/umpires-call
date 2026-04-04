'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const joinContest = (contestId: string) => {
  const socket = getSocket();
  socket.emit('join-contest', contestId);
};

export const leaveContest = (contestId: string) => {
  const socket = getSocket();
  socket.emit('leave-contest', contestId);
};

export const joinMatch = (matchId: string) => {
  const socket = getSocket();
  socket.emit('join-match', matchId);
};

export default socket;