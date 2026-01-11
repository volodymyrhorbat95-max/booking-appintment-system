import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

// SECURITY FIX: Remove fallback to default secret
// WebSocket authentication must use the same secret as REST API
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set for WebSocket authentication. ' +
    'This is required to verify WebSocket connections. Set JWT_SECRET in your .env file.'
  );
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// WebSocket event types for type safety
export enum WebSocketEvent {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',

  // Appointment events
  APPOINTMENT_CREATED = 'appointment:created',
  APPOINTMENT_UPDATED = 'appointment:updated',
  APPOINTMENT_CANCELLED = 'appointment:cancelled',
  APPOINTMENT_CONFIRMED = 'appointment:confirmed',
  APPOINTMENT_STATUS_CHANGED = 'appointment:status_changed',

  // Availability events
  AVAILABILITY_UPDATED = 'availability:updated',
  BLOCKED_DATE_ADDED = 'blocked_date:added',
  BLOCKED_DATE_REMOVED = 'blocked_date:removed',

  // Professional events
  PROFESSIONAL_UPDATED = 'professional:updated',
  PROFESSIONAL_SETTINGS_UPDATED = 'professional:settings_updated',

  // Admin events
  PLATFORM_STATS_UPDATED = 'platform:stats_updated',
  PROFESSIONAL_STATUS_CHANGED = 'professional:status_changed',

  // Room events
  JOIN_PROFESSIONAL_ROOM = 'join:professional_room',
  JOIN_ADMIN_ROOM = 'join:admin_room',
  LEAVE_ROOM = 'leave:room',

  // Error events
  ERROR = 'error',
  UNAUTHORIZED = 'unauthorized'
}

// Interface for authenticated socket
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
  professionalId?: string;
}

// JWT payload structure
interface JWTPayload {
  userId: string;
  role: UserRole;
  professionalId?: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server with authentication
 * This provides real-time updates across the platform
 */
export const initializeWebSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST']
    },
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
    // Namespace
    path: '/socket.io/'
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.professionalId = decoded.professionalId;

      next();
    } catch (error) {
      return next(new Error('Invalid authentication token'));
    }
  });

  // Handle connections
  io.on(WebSocketEvent.CONNECTION, (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`);

    // Join user to their role-specific room
    if (socket.userRole === UserRole.ADMIN) {
      socket.join('admin');
      console.log(`[WebSocket] Admin joined admin room: ${socket.id}`);
    }

    // Join professional to their specific room
    if (socket.userRole === UserRole.PROFESSIONAL && socket.professionalId) {
      const professionalRoom = `professional:${socket.professionalId}`;
      socket.join(professionalRoom);
      console.log(`[WebSocket] Professional joined room: ${professionalRoom}`);
    }

    // Handle manual room joining
    socket.on(WebSocketEvent.JOIN_PROFESSIONAL_ROOM, (professionalId: string) => {
      if (socket.userRole === UserRole.PROFESSIONAL && socket.professionalId === professionalId) {
        const room = `professional:${professionalId}`;
        socket.join(room);
        console.log(`[WebSocket] Joined professional room: ${room}`);
      } else {
        socket.emit(WebSocketEvent.UNAUTHORIZED, { message: 'Cannot join this room' });
      }
    });

    socket.on(WebSocketEvent.JOIN_ADMIN_ROOM, () => {
      if (socket.userRole === UserRole.ADMIN) {
        socket.join('admin');
        console.log(`[WebSocket] Joined admin room`);
      } else {
        socket.emit(WebSocketEvent.UNAUTHORIZED, { message: 'Admin access required' });
      }
    });

    socket.on(WebSocketEvent.LEAVE_ROOM, (room: string) => {
      socket.leave(room);
      console.log(`[WebSocket] Left room: ${room}`);
    });

    // Handle disconnection
    socket.on(WebSocketEvent.DISCONNECT, (reason: string) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      console.error(`[WebSocket] Socket error: ${socket.id}`, error);
      socket.emit(WebSocketEvent.ERROR, { message: error.message });
    });
  });

  console.log('[WebSocket] Socket.IO server initialized');
  return io;
};

/**
 * Get Socket.IO server instance
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeWebSocket first.');
  }
  return io;
};

/**
 * Emit event to specific professional's room
 */
export const emitToProfessional = (professionalId: string, event: WebSocketEvent, data: any) => {
  if (!io) return;

  const room = `professional:${professionalId}`;
  io.to(room).emit(event, data);
  console.log(`[WebSocket] Emitted ${event} to professional room: ${room}`);
};

/**
 * Emit event to all admins
 */
export const emitToAdmins = (event: WebSocketEvent, data: any) => {
  if (!io) return;

  io.to('admin').emit(event, data);
  console.log(`[WebSocket] Emitted ${event} to admin room`);
};

/**
 * Emit event to all connected clients
 */
export const emitToAll = (event: WebSocketEvent, data: any) => {
  if (!io) return;

  io.emit(event, data);
  console.log(`[WebSocket] Emitted ${event} to all clients`);
};

/**
 * Check if Socket.IO is initialized
 */
export const isWebSocketInitialized = (): boolean => {
  return io !== null;
};
