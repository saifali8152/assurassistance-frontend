// Secure session management utilities
export interface SessionData {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "agent";
    force_password_change?: boolean;
  };
  expiresAt: number;
}

class SessionManager {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  // Store session data securely
  setSession(data: SessionData): void {
    try {
      const expiresAt = Date.now() + this.SESSION_TIMEOUT;
      
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('session_expires', expiresAt.toString());
      
      // Set up auto-cleanup
      this.setupAutoCleanup();
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  // Get session data
  getSession(): SessionData | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userData = localStorage.getItem(this.USER_KEY);
      
      if (!token || !userData) {
        return null;
      }

      const user = JSON.parse(userData);
      
      // Check if session has expired
      const sessionData = localStorage.getItem('session_expires');
      if (sessionData) {
        const expiresAt = parseInt(sessionData);
        const now = Date.now();
        if (now > expiresAt) {
          this.clearSession();
          return null;
        }
      }
      return {
        token,
        user,
        expiresAt: parseInt(sessionData || '0')
      };
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      this.clearSession();
      return null;
    }
  }

  // Check if session is valid
  isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null && Date.now() < session.expiresAt;
  }

  // Clear session data
  clearSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('session_expires');
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  // Refresh session (extend expiry)
  refreshSession(): void {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
      localStorage.setItem('session_expires', session.expiresAt.toString());
    }
  }

  // Setup automatic session cleanup
  private setupAutoCleanup(): void {
    // Set up a timeout to clear expired sessions
    setTimeout(() => {
      if (!this.isSessionValid()) {
        this.clearSession();
      }
    }, this.SESSION_TIMEOUT);
  }

  // Get token for API requests
  getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  // Get user data
  getUser(): SessionData['user'] | null {
    const session = this.getSession();
    if (session?.user) {
      // Ensure role is properly typed
      return {
        ...session.user,
        role: session.user.role as "admin" | "agent"
      };
    }
    return null;
  }

  // Check if user needs to change password
  needsPasswordChange(): boolean {
    const user = this.getUser();
    return user?.force_password_change || false;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is agent
  isAgent(): boolean {
    return this.hasRole('agent');
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (!sessionManager.isSessionValid()) {
    sessionManager.clearSession();
  }
});

// Auto-refresh session on user activity
let lastActivity = Date.now();
const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

document.addEventListener('mousedown', () => {
  lastActivity = Date.now();
});

document.addEventListener('keydown', () => {
  lastActivity = Date.now();
});

// Check for activity every minute
setInterval(() => {
  if (Date.now() - lastActivity > ACTIVITY_TIMEOUT) {
    // User has been inactive, refresh session if valid
    if (sessionManager.isSessionValid()) {
      sessionManager.refreshSession();
    }
  }
}, 60000); // Check every minute
