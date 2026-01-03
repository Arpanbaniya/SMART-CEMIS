import { useEffect, useCallback, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";

type WebSocketMessage = {
  type: string;
  eventId: string;
  count?: number;
  data?: any;
};

export function useWebSocket(eventId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pendingSubscriptionsRef = useRef<Set<string>>(new Set());

  const sendSubscription = useCallback((id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", eventId: id }));
    } else {
      pendingSubscriptionsRef.current.add(id);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setIsConnected(true);
      
      pendingSubscriptionsRef.current.forEach((id) => {
        ws.send(JSON.stringify({ type: "subscribe", eventId: id }));
      });
      pendingSubscriptionsRef.current.clear();
      
      if (eventId) {
        ws.send(JSON.stringify({ type: "subscribe", eventId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === "participant_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          if (data.eventId) {
            queryClient.invalidateQueries({ queryKey: ["/api/events", data.eventId] });
          }
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      setTimeout(connect, 3000);
    };

    wsRef.current = ws;
  }, [eventId]);

  const subscribe = useCallback((id: string) => {
    sendSubscription(id);
  }, [sendSubscription]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    if (eventId) {
      sendSubscription(eventId);
    }
  }, [eventId, sendSubscription]);

  return { isConnected, subscribe };
}
