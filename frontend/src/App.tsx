import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import AppRoutes from './routes';
import { WebSocketProvider } from './contexts/WebSocketContext';

// RULE: All API calls go through Redux, NO direct calls from components
// App.tsx handles initial auth check when app loads
// WebSocket provides real-time updates for appointments, availability, and platform stats

function App() {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  // On app load, if there's a token, fetch current user
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated]);

  return (
    <WebSocketProvider>
      <AppRoutes />
    </WebSocketProvider>
  );
}

export default App;
