import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  role?: "admin" | "agent";
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { user, token, isAuthenticated, needsPasswordChange } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change if required
  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Check role-based access
  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
