import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { UserRole } from '../types';
import type { UserRole as UserRoleType } from '../types';

// RULE: Navigation uses programmatic navigation ONLY (useNavigate)

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRoleType[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to appropriate login page
      if (allowedRoles.includes(UserRole.ADMIN)) {
        navigate('/login/admin');
      } else {
        navigate('/login/professional');
      }
      return;
    }

    // Check if user has required role
    if (user && !allowedRoles.includes(user.role)) {
      // User doesn't have permission - redirect to their dashboard
      if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      } else if (user.role === UserRole.PROFESSIONAL) {
        navigate('/professional/calendar');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, allowedRoles, navigate]);

  // If not authenticated or wrong role, render nothing while redirecting
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
