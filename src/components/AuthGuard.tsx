import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePasswordChange?: boolean;
  allowedRoles?: ('admin' | 'agent')[];
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  requirePasswordChange = false,
  allowedRoles = [],
  redirectTo
}) => {
  const { user, isAuthenticated, needsPasswordChange, isInitialized } = useAuth();
  

  // Show loading while auth state is being determined
  if (!isInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }


  // If authentication is required but user is not authenticated
  if (requireAuth && (!isAuthenticated || !user)) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but trying to access public routes (login, forgot-password)
  // Only redirect if this is a public route (requireAuth = false)
  if (!requireAuth && isAuthenticated && user) {
    // If user needs to change password, redirect to change password
    if (needsPasswordChange) {
      return <Navigate to="/change-password" replace />;
    }
    
    // Otherwise redirect to appropriate dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'agent') {
      return <Navigate to="/user" replace />;
    }
  }

  // If password change is required but user doesn't need to change password
  if (requirePasswordChange && !needsPasswordChange) {
    // Redirect to appropriate dashboard
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'agent') {
      return <Navigate to="/user" replace />;
    }
  }

  // If user needs to change password but trying to access protected routes
  if (requireAuth && needsPasswordChange && !requirePasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Check role-based access
  if (requireAuth && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If custom redirect is specified
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
