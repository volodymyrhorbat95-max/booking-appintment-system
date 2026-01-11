import { useEffect } from 'react';
import { useWebSocket, WebSocketEvent } from '../contexts/WebSocketContext';
import { useAppDispatch, useAppSelector } from '../store';
import {
  handleAppointmentCreated,
  handleAppointmentCancelled,
  handleAppointmentStatusChanged
} from '../store/slices/professionalAppointmentsSlice';

/**
 * Custom hook to sync WebSocket events with Redux store
 * Call this hook in the professional dashboard to enable real-time updates
 */
export const useWebSocketSync = () => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !isConnected) {
      return;
    }

    console.log('[WebSocketSync] Setting up real-time event listeners');

    // Appointment created (new booking)
    const onAppointmentCreated = (data: any) => {
      console.log('[WebSocketSync] Appointment created:', data);
      dispatch(handleAppointmentCreated(data));
    };

    // Appointment cancelled
    const onAppointmentCancelled = (data: any) => {
      console.log('[WebSocketSync] Appointment cancelled:', data);
      dispatch(handleAppointmentCancelled(data));
    };

    // Appointment status changed
    const onAppointmentStatusChanged = (data: any) => {
      console.log('[WebSocketSync] Appointment status changed:', data);
      dispatch(handleAppointmentStatusChanged(data));
    };

    // Appointment confirmed (via WhatsApp)
    const onAppointmentConfirmed = (data: any) => {
      console.log('[WebSocketSync] Appointment confirmed:', data);
      dispatch(handleAppointmentStatusChanged({
        ...data,
        status: 'CONFIRMED'
      }));
    };

    // Subscribe to events
    subscribe(WebSocketEvent.APPOINTMENT_CREATED, onAppointmentCreated);
    subscribe(WebSocketEvent.APPOINTMENT_CANCELLED, onAppointmentCancelled);
    subscribe(WebSocketEvent.APPOINTMENT_STATUS_CHANGED, onAppointmentStatusChanged);
    subscribe(WebSocketEvent.APPOINTMENT_CONFIRMED, onAppointmentConfirmed);

    // Cleanup
    return () => {
      console.log('[WebSocketSync] Cleaning up event listeners');
      unsubscribe(WebSocketEvent.APPOINTMENT_CREATED, onAppointmentCreated);
      unsubscribe(WebSocketEvent.APPOINTMENT_CANCELLED, onAppointmentCancelled);
      unsubscribe(WebSocketEvent.APPOINTMENT_STATUS_CHANGED, onAppointmentStatusChanged);
      unsubscribe(WebSocketEvent.APPOINTMENT_CONFIRMED, onAppointmentConfirmed);
    };
  }, [isAuthenticated, isConnected, dispatch, subscribe, unsubscribe]);

  return { isConnected };
};
