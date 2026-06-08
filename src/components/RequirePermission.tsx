import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface RequirePermissionProps {
  permission?: string;
  adminOnly?: boolean;
  feature?: string;
}

export const RequirePermission = ({ permission, adminOnly = false, feature }: RequirePermissionProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { hasFeature, isLoading: featuresLoading, isSubscriptionExpired } = usePlanFeatures();

  if (authLoading || featuresLoading) return null;

  if (user?.is_super_admin) return <Outlet />;

  if (adminOnly) return <Navigate to="/dashboard/unauthorized" replace />;

  // Feature not available on current plan (expired subscriptions allow through — gate handles UI)
  if (feature && !isSubscriptionExpired && !hasFeature(feature)) {
    return <Navigate to={`/dashboard/billing?locked=${feature}`} replace />;
  }

  if (permission) {
    const userPermissions = user?.role?.permissions?.map((p) => p.name) ?? [];
    if (!userPermissions.includes(permission)) {
      return <Navigate to="/dashboard/unauthorized" replace />;
    }
  }

  return <Outlet />;
};
