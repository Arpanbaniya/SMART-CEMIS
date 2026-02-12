import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export interface RealTimeEventUpdate {
  eventId: string;
  type: 'eventCreated' | 'eventUpdated' | 'eventDeleted' | 'registration' | 'unregistration' | 'adminRequest' | 'adminRequestApproved' | 'adminRequestRejected' | 'adminRequestUsed' | 'paymentReceived' | 'userRegistered' | 'roleUpdated' | 'tournamentUpdate';
  event?: any;
  participantCount?: number;
  message?: string;
  userName?: string;
  eventTitle?: string;
  role?: string;
  rejectionReason?: string;
  request?: any;
  timestamp: string;
}

export const useRealTimeEvents = (userId: string | null) => {
  const [updates, setUpdates] = useState<RealTimeEventUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<RealTimeEventUpdate | null>(null);
  const socket = useSocket(userId);
  const lastUpdateRef = useRef<{ key: string; ts: number } | null>(null);

  useEffect(() => {
    if (!socket.connected) return;

    const shouldAcceptUpdate = (data: RealTimeEventUpdate) => {
      const key = `${data.type}:${data.eventId}:${data.eventTitle || data.message || ''}`;
      const now = Date.now();
      const last = lastUpdateRef.current;
      if (last && last.key === key && now - last.ts < 1000) {
        return false;
      }
      lastUpdateRef.current = { key, ts: now };
      return true;
    };

    const handleEventUpdate = (data: RealTimeEventUpdate) => {
      if (!shouldAcceptUpdate(data)) return;
      console.log('Real-time event update:', data);
      setLatestUpdate(data);
      setUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
    };

    const handleGlobalEventUpdate = (data: RealTimeEventUpdate) => {
      if (!shouldAcceptUpdate(data)) return;
      console.log('Global event update:', data);
      setLatestUpdate(data);
      setUpdates(prev => [data, ...prev.slice(0, 49)]);
    };

    const handleUserUpdate = (data: RealTimeEventUpdate) => {
      console.log('User update:', data);
      setLatestUpdate(data);
      setUpdates(prev => [data, ...prev.slice(0, 49)]);
      
      // If role was updated, trigger page refresh after 1 second
      if (data.type === 'roleUpdated') {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Subscribe to real-time updates
    const unsubscribeEventUpdate = socket.onEventUpdate(handleEventUpdate);
    const unsubscribeGlobalUpdate = socket.onGlobalEventUpdate(handleGlobalEventUpdate);
    const unsubscribeUserUpdate = socket.onUserUpdate(handleUserUpdate);

    return () => {
      unsubscribeEventUpdate();
      unsubscribeGlobalUpdate();
      unsubscribeUserUpdate();
    };
  }, [socket.connected, socket.onEventUpdate, socket.onGlobalEventUpdate]);

  const joinEventRoom = useCallback((eventId: string) => {
    socket.joinEvent(eventId);
  }, [socket.joinEvent]);

  const leaveEventRoom = useCallback((eventId: string) => {
    socket.leaveEvent(eventId);
  }, [socket.leaveEvent]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLatestUpdate(null);
  }, []);

  return {
    updates,
    latestUpdate,
    joinEventRoom,
    leaveEventRoom,
    clearUpdates,
    isConnected: socket.connected
  };
};
