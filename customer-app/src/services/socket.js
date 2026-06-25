import { io } from 'socket.io-client';
import storage from '../utils/storage';

import { serverOrigin } from './api';

const SOCKET_URL = serverOrigin;

class SocketService {
  constructor() {
    this.socket = null;
  }

  async connect() {
    if (this.socket?.connected) return;

    try {
      const savedUser = await storage.getItem('user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      
      if (!user || !user.id) return; // Only connect if user is logged in

      this.socket = io(SOCKET_URL, {
        query: { userId: user.id },
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected for user', user.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    } catch (e) {
      console.error('Error connecting socket', e);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }
}

export const socketService = new SocketService();
