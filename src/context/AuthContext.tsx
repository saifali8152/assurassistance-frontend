import React, { createContext, useContext, useState, useEffect } from "react";
import type { LoginResponse } from "../api/interfaces";
import type {ReactNode} from "react";
import { sessionManager, type SessionData } from "../utils/sessionManager";
import { logoutApi } from "../api/authApi";

interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  login: (data: LoginResponse) => void;
  logout: () => Promise<void>;
  updateUser: (userData: LoginResponse["user"]) => void;
  isAuthenticated: boolean;
  needsPasswordChange: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Initialize from secure session storage
    const initializeAuth = () => {
      try {
        const session = sessionManager.getSession();
        
        if (session && sessionManager.isSessionValid()) {
          setUser(session.user);
          setToken(session.token);
          setIsAuthenticated(true);
        } else {
          // Clear invalid session
          sessionManager.clearSession();
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
        
        // Mark as initialized
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        sessionManager.clearSession();
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = (data: LoginResponse) => {
    const sessionData: SessionData = {
      token: data.token,
      user: data.user,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    sessionManager.setSession(sessionData);
    setUser(data.user);
    setToken(data.token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Call logout API to log the activity on backend
      await logoutApi();
    } catch (error) {
      // Even if API call fails, we should still clear the local session
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local session regardless of API call result
      sessionManager.clearSession();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData: LoginResponse["user"]) => {
    setUser(userData);
    // Update session storage with new user data
    const currentSession = sessionManager.getSession();
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        user: userData
      };
      sessionManager.setSession(updatedSession);
    }
  };

  const needsPasswordChange = sessionManager.needsPasswordChange();

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      updateUser,
      isAuthenticated, 
      needsPasswordChange,
      isInitialized
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
