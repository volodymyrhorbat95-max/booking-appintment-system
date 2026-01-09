import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import AppRoutes from './routes';

// RULE: All API calls go through Redux, NO direct calls from components
// App.tsx handles initial auth check when app loads

function App() {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  // On app load, if there's a token, fetch current user
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated]);

  return <AppRoutes />;
}

export default App;
