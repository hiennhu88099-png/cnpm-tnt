import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { PageLoading } from '../components/ui';

// Pages that need login; remembers where the user wanted to go so login can send them back
export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

// Login/register pages: a logged-in user has no reason to see them
export function GuestRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) return <PageLoading />;
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return <Outlet />;
}
