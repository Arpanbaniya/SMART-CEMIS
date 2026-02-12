import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface RealTimeRegistrationUpdate {
  eventId: string;
  type: 'registration' | 'unregistration';
  participantCount: number;
  message: string;
  timestamp: string;
}

export const useRealTimeRegistrations = (userId: string | null, eventId?: string) => {
  const [registrationUpdates, setRegistrationUpdates] = useState<RealTimeRegistrationUpdate[]>([]);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const socket = useSocket(userId);

  useEffect(() => {
    if (!socket.connected) return;

    const handleEventUpdate = (data: RealTimeRegistrationUpdate) => {
      if (data.type === 'registration' || data.type === 'unregistration') {
        console.log('Registration update:', data);
        
        // Update participant count for this specific event
        if (data.eventId === eventId) {
          setParticipantCount(data.participantCount);
        }
        
        // Add to updates list
        setRegistrationUpdates(prev => [data, ...prev.slice(0, 24)]); // Keep last 25 updates
      }
    };

    // Subscribe to real-time updates
    const unsubscribeEventUpdate = socket.onEventUpdate(handleEventUpdate);

    return () => {
      unsubscribeEventUpdate();
    };
  }, [socket.connected, socket.onEventUpdate, eventId]);

  useEffect(() => {
    if (eventId && socket.connected) {
      socket.joinEvent(eventId);
      
      return () => {
        socket.leaveEvent(eventId);
      };
    }
  }, [eventId, socket.connected, socket.joinEvent, socket.leaveEvent]);

  const clearUpdates = useCallback(() => {
    setRegistrationUpdates([]);
  }, []);

  return {
    registrationUpdates,
    participantCount,
    clearUpdates,
    isConnected: socket.connected
  };
};
