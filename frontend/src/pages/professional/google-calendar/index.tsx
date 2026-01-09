import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getCalendarStatus,
  getConnectUrl,
  disconnectCalendar,
  syncCalendar,
  getExternalEvents,
  clearError,
  clearSuccessMessage,
  clearAuthUrl
} from '../../../store/slices/googleCalendarSlice';
import GoogleCalendarHeader from './GoogleCalendarHeader';
import ConnectionStatusCard from './ConnectionStatusCard';
import SyncSection from './SyncSection';
import ExternalEventsList from './ExternalEventsList';
import GoogleCalendarInfoSection from './GoogleCalendarInfoSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const GoogleCalendarPage = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    connected,
    calendarId,
    externalEvents,
    error,
    successMessage,
    lastSynced
  } = useAppSelector((state) => state.googleCalendar);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success === 'true') {
      // Clear URL params and refresh status
      setSearchParams({});
      dispatch(getCalendarStatus());
    } else if (errorParam) {
      // Clear URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, dispatch]);

  // Load status on mount
  useEffect(() => {
    dispatch(getCalendarStatus());
  }, [dispatch]);

  // Load external events when connected
  useEffect(() => {
    if (connected) {
      dispatch(getExternalEvents());
    }
  }, [connected, dispatch]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
      dispatch(clearAuthUrl());
    };
  }, [dispatch]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Handle connect click
  const handleConnect = async () => {
    const result = await dispatch(getConnectUrl());
    if (getConnectUrl.fulfilled.match(result)) {
      // Redirect to Google OAuth
      window.location.href = result.payload;
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (window.confirm('¿Estás seguro de que deseas desconectar Google Calendar?')) {
      await dispatch(disconnectCalendar());
    }
  };

  // Handle manual sync
  const handleSync = async () => {
    await dispatch(syncCalendar());
    dispatch(getExternalEvents());
  };

  return (
    <div className="mx-auto max-w-3xl zoom-in-normal">
      {/* Header Section */}
      <GoogleCalendarHeader error={error} successMessage={successMessage} />

      {/* Connection Status Card */}
      <ConnectionStatusCard
        connected={connected}
        calendarId={calendarId}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Connected features */}
      {connected && (
        <>
          {/* Sync Section */}
          <SyncSection lastSynced={lastSynced} onSync={handleSync} />

          {/* External Events List */}
          <ExternalEventsList events={externalEvents} />
        </>
      )}

      {/* Info Section */}
      <GoogleCalendarInfoSection />
    </div>
  );
};

export default GoogleCalendarPage;
