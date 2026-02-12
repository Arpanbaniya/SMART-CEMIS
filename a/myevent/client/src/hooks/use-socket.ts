import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '@/lib/socket';
import { useAuth } from './use-auth';

export function useSocket(): Socket | null {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const connectedSocket = socketService.connect(user.id);
    setSocket(connectedSocket);

    return () => {
      // Don't disconnect on unmount as other components might be using it
    };
  }, [user?.id]);

  return socket;
}
