
import { useAuth } from "@/hooks/useAuth";

export const Permission = ({ children, permission }) => {
  const { user } = useAuth();

  if (user?.is_super_admin) {
    return <>{children}</>;
  }

  const userPermissions = user?.role?.permissions?.map(p => p.name) || [];

  if (userPermissions.includes(permission)) {
    return <>{children}</>;
  }

  return null;
};
