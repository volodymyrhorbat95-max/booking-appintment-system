import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../store';
import { ENV } from '../config/env';

// WebSocket event types (must match backend)
export const WebSocketEvent = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Appointment events
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_UPDATED: 'appointment:updated',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_CONFIRMED: 'appointment:confirmed',
  APPOINTMENT_STATUS_CHANGED: 'appointment:status_changed',

  // Availability events
  AVAILABILITY_UPDATED: 'availability:updated',
  BLOCKED_DATE_ADDED: 'blocked_date:added',
  BLOCKED_DATE_REMOVED: 'blocked_date:removed',

  // Professional events
  PROFESSIONAL_UPDATED: 'professional:updated',
  PROFESSIONAL_SETTINGS_UPDATED: 'professional:settings_updated',

  // Admin events
  PLATFORM_STATS_UPDATED: 'platform:stats_updated',
  PROFESSIONAL_STATUS_CHANGED: 'professional:status_changed',

  // Error events
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized'
} as const;

export type WebSocketEvent = typeof WebSocketEvent[keyof typeof WebSocketEvent];

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: WebSocketEvent, callback: (data: any) => void) => void;
  unsubscribe: (event: WebSocketEvent, callback: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

// WebSocket URL from validated environment configuration (RULE: no hardcoded values)
const WS_URL = ENV.apiUrl.replace('/api', ''); // Remove /api for WebSocket connection

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !token) {
      // Disconnect if no longer authenticated
      if (socket) {
        console.log('[WebSocket] User logged out, disconnecting...');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Socket.IO connection
    console.log('[WebSocket] Initializing connection to:', WS_URL);

    const newSocket = io(WS_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      path: '/socket.io/'
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected successfully:', newSocket.id);
      setIsConnected(true);

      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        console.log('[WebSocket] Server disconnected, attempting to reconnect...');
        reconnectTimeoutRef.current = setTimeout(() => {
          newSocket.connect();
        }, 2000);
      }
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on(WebSocketEvent.ERROR, (data: { message: string }) => {
      console.error('[WebSocket] Server error:', data.message);
    });

    newSocket.on(WebSocketEvent.UNAUTHORIZED, (data: { message: string }) => {
      console.error('[WebSocket] Unauthorized:', data.message);
      newSocket.disconnect();
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  // Subscribe to a specific event
  const subscribe = (event: WebSocketEvent, callback: (data: any) => void) => {
    if (!socket) {
      console.warn('[WebSocket] Cannot subscribe, socket not initialized');
      return;
    }

    console.log(`[WebSocket] Subscribing to event: ${event}`);
    socket.on(event, callback);
  };

  // Unsubscribe from a specific event
  const unsubscribe = (event: WebSocketEvent, callback: (data: any) => void) => {
    if (!socket) {
      return;
    }

    console.log(`[WebSocket] Unsubscribing from event: ${event}`);
    socket.off(event, callback);
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    subscribe,
    unsubscribe
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
};

// Custom hook to subscribe to a specific event
export const useWebSocketEvent = (
  event: WebSocketEvent,
  callback: (data: any) => void,
  dependencies: any[] = []
) => {
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    subscribe(event, callback);

    return () => {
      unsubscribe(event, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...dependencies]);
};
