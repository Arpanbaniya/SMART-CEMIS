import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3101';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.socket?.emit('authenticate', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  joinEvent(eventId: string) {
    if (this.socket) {
      this.socket.emit('joinEvent', eventId);
    }
  }

  leaveEvent(eventId: string) {
    if (this.socket) {
      this.socket.emit('leaveEvent', eventId);
    }
  }

  joinAdmin() {
    if (this.socket) {
      this.socket.emit('joinAdmin');
    }
  }

  requestEventUpdate(eventId: string) {
    if (this.socket) {
      this.socket.emit('requestEventUpdate', eventId);
    }
  }

  onEventUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('eventUpdate', callback);
    }
  }

  onGlobalEventUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('globalEventUpdate', callback);
    }
  }

  onUserUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('userUpdate', callback);
    }
  }

  onAdminUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('adminUpdate', callback);
    }
  }

  offEventUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('eventUpdate', callback);
    }
  }

  offGlobalEventUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('globalEventUpdate', callback);
    }
  }

  offUserUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('userUpdate', callback);
    }
  }

  offAdminUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('adminUpdate', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
