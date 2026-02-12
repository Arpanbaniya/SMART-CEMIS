import { useCallback, useRef, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

type UserWebSocketMessage = {
  type: string;
  message: string;
  rejectionReason?: string;
  request?: any;
  userName?: string;
  timestamp?: string;
};

export function useUserWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socket = useRef<Socket | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (!user?.id) return;

    try {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? `wss://your-domain.com`
        : `http://localhost:3101`; // Backend runs on port 3101
      
      socket.current = io(socketUrl, {
        transports: ['websocket'],
        withCredentials: true
      });
      
      socket.current.on('connect', () => {
        console.log('✅ User WebSocket connected!');
        setIsConnected(true);
        
        // Subscribe to user-specific updates
        socket.current?.emit('joinUser', user.id);
      });

      socket.current.on('userUpdate', (message: UserWebSocketMessage) => {
        console.log('📡 User notification received:', message);
        
        // Handle different types of user notifications
        switch (message.type) {
          case 'adminRequestRejected':
            toast({
              title: "Admin Request Rejected",
              description: message.rejectionReason 
                ? `Your admin request has been rejected. Reason: ${message.rejectionReason}`
                : "Your admin request has been rejected.",
              variant: "destructive",
            });
            break;
          
          case 'adminRequestApproved':
            toast({
              title: "Admin Request Approved",
              description: "Your admin request has been approved! You now have admin privileges.",
            });
            break;
          
          default:
            console.log('Unknown user notification type:', message.type);
        }
      });

      socket.current.on('disconnect', () => {
        console.log('❌ User WebSocket disconnected');
        setIsConnected(false);
      });

      socket.current.on('error', (error) => {
        console.error('User WebSocket error:', error);
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Failed to connect user WebSocket:', error);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    connect();
    
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
  };
}
