import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "@/lib/auth";

const defaultRoutes: Record<Role, string> = {
  employee: "/new-ticket",
  supervisor: "/active-queue",
  admin: "/manage-branches",
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRoutes[user.role]} replace />;
  }

  return <>{children}</>;
}
