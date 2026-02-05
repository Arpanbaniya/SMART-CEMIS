import { useCallback, useRef, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { queryClient } from "@/lib/queryClient";

type WebSocketMessage = {
  type: string;
  eventId?: string;
  count?: number;
  data?: any;
  feedbackId?: string;
  timestamp?: string;
};

type SubscriptionId = string | null;

export function useWebSocket(eventId?: SubscriptionId) {
  const [isConnected, setIsConnected] = useState(false);
  const socket = useRef<Socket | null>(null);
  const subscriptions = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (!eventId) return;

    try {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? `wss://your-domain.com`
        : `http://localhost:3101`; // Backend runs on port 3101
      
      socket.current = io(socketUrl, {
        transports: ['websocket'],
        withCredentials: true
      });
      
      socket.current.on('connect', () => {
        console.log('✅ WebSocket connected!');
        setIsConnected(true);
        
        // Subscribe to event updates
        if (eventId && !subscriptions.current.has(eventId)) {
          socket.current?.emit('joinEvent', eventId);
          subscriptions.current.add(eventId);
        }
      });

      socket.current.on('eventUpdate', (message: WebSocketMessage) => {
        console.log('📡 Real-time update received:', message);
        
        // Handle different types of real-time updates
        switch (message.type) {
          case 'feedback':
          case 'feedback_updated':
          case 'feedback_deleted':
            // Invalidate feedback queries for real-time sentiment analysis updates
            if (message.eventId) {
              queryClient.invalidateQueries({ queryKey: ["/api/events", message.eventId, "feedback"] });
              queryClient.invalidateQueries({ queryKey: ["/api/events", message.eventId, "sentiment"] });
              console.log(`🔄 Refreshed feedback and sentiment data for event ${message.eventId}`);
            }
            break;
          case 'registration':
          case 'unregistration':
            // Invalidate registration and event data
            if (message.eventId) {
              queryClient.invalidateQueries({ queryKey: ["/api/events", message.eventId, "check-registration"] });
              queryClient.invalidateQueries({ queryKey: ["/api/events", message.eventId] });
              console.log(`🔄 Refreshed registration data for event ${message.eventId}`);
            }
            break;
          case 'eventCreated':
          case 'eventUpdated':
          case 'eventDeleted':
            // Refresh events list for all pages
            queryClient.invalidateQueries({ queryKey: ["/api/events"] });
            if (message.eventId) {
              queryClient.invalidateQueries({ queryKey: ["/api/events", message.eventId] });
            }
            console.log(`🔄 Refreshed events list`);
            break;
          case 'favoriteAdded':
          case 'favoriteRemoved':
            // Refresh favorites data
            queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
            if (message.eventId) {
              queryClient.invalidateQueries({ queryKey: ["/api/favorites/check", message.eventId] });
            }
            console.log(`🔄 Refreshed favorites data`);
            break;
          case 'requestCreated':
          case 'requestUpdated':
          case 'requestApproved':
          case 'requestRejected':
            // Refresh admin dashboard
            queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
            console.log(`🔄 Refreshed admin requests`);
            break;
        }
      });

      socket.current.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        subscriptions.current.clear();
      });

      socket.current.on('connect_error', (error: any) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [eventId]);

  const sendSubscription = useCallback((id: SubscriptionId) => {
    if (!id || !socket.current || !socket.current.connected) {
      return;
    }

    try {
      socket.current?.emit('joinEvent', id);
      subscriptions.current.add(id);
    } catch (error) {
      console.error('Failed to send subscription:', error);
    }
  }, []);

  const unsubscribe = useCallback((id: SubscriptionId) => {
    if (!id || !socket.current || !socket.current.connected) {
      return;
    }

    try {
      socket.current?.emit('leaveEvent', id);
      subscriptions.current.delete(id);
    } catch (error) {
      console.error('Failed to send unsubscribe:', error);
    }
  }, []);

  useEffect(() => {
    if (eventId) {
      connect();
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [eventId, connect]);

  return {
    isConnected,
    sendSubscription,
    unsubscribe
  };
}
