import { useEffect, useState, useCallback } from 'react';
import socketService from '../lib/socket';

interface SocketState {
  connected: boolean;
  error: string | null;
}

export const useSocket = (userId: string | null) => {
  const [state, setState] = useState<SocketState>({
    connected: false,
    error: null
  });

  useEffect(() => {
    if (!userId) {
      console.log('🔌 Socket: No userId, disconnecting');
      socketService.disconnect();
      setState({ connected: false, error: null });
      return;
    }

    console.log('🔌 Socket: Connecting with userId:', userId);
    const socket = socketService.connect(userId);

    socket.on('connect', () => {
      console.log('✅ Socket: Connected successfully');
      setState({ connected: true, error: null });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket: Disconnected');
      setState({ connected: false, error: null });
    });

    socket.on('connect_error', (error) => {
      console.error('💥 Socket: Connection error:', error);
      setState({ connected: false, error: error.message });
    });

    return () => {
      console.log('🧹 Socket: Cleaning up listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [userId]);

  const joinEvent = useCallback((eventId: string) => {
    socketService.joinEvent(eventId);
  }, []);

  const leaveEvent = useCallback((eventId: string) => {
    socketService.leaveEvent(eventId);
  }, []);

  const joinAdmin = useCallback(() => {
    socketService.joinAdmin();
  }, []);

  const requestEventUpdate = useCallback((eventId: string) => {
    socketService.requestEventUpdate(eventId);
  }, []);

  const onEventUpdate = useCallback((callback: (data: any) => void) => {
    socketService.onEventUpdate(callback);
    return () => socketService.offEventUpdate(callback);
  }, []);

  const onGlobalEventUpdate = useCallback((callback: (data: any) => void) => {
    socketService.onGlobalEventUpdate(callback);
    return () => socketService.offGlobalEventUpdate(callback);
  }, []);

  const onUserUpdate = useCallback((callback: (data: any) => void) => {
    socketService.onUserUpdate(callback);
    return () => socketService.offUserUpdate(callback);
  }, []);

  const onAdminUpdate = useCallback((callback: (data: any) => void) => {
    socketService.onAdminUpdate(callback);
    return () => socketService.offAdminUpdate(callback);
  }, []);

  return {
    ...state,
    joinEvent,
    leaveEvent,
    joinAdmin,
    requestEventUpdate,
    onEventUpdate,
    onGlobalEventUpdate,
    onUserUpdate,
    onAdminUpdate
  };
};
