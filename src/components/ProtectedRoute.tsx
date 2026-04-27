import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-admins away from the main dashboard.
  // The "Client" role should be redirected to the client portal.
  const isClient = user?.role?.name === 'Client';
  if (window.location.pathname.startsWith('/dashboard') && isClient) {
    return <Navigate to="/client-portal" replace />;
  }

  return <Outlet />;
};
