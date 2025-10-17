import { io, Socket } from 'socket.io-client';

import { useAuthStore } from '../state/authStore';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }
  const token = useAuthStore.getState().token;
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE ?? '';
  const wsUrl = baseUrl.startsWith('https')
    ? baseUrl.replace('https', 'wss')
    : baseUrl.replace('http', 'ws');
  socket = io(`${wsUrl}/realtime`, {
    auth: token
      ? {
          token
        }
      : undefined,
    transports: ['websocket']
  });
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
