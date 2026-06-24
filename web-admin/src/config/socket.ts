import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const socketUrl = apiUrl.replace('/api/v1', '');

export const socket = io(socketUrl, {
  autoConnect: true,
});
