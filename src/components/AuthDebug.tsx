import React from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionManager } from '../utils/sessionManager';

const AuthDebug: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();

  const checkLocalStorage = () => {
    const authToken = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    const sessionExpires = localStorage.getItem('session_expires');
    
    console.log('LocalStorage Check:');
    console.log('- auth_token:', authToken ? 'exists' : 'null');
    console.log('- user_data:', userData ? 'exists' : 'null');
    console.log('- session_expires:', sessionExpires);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('- parsed user:', user);
      } catch (e) {
        console.error('- user_data parse error:', e);
      }
    }
  };

  const checkSessionManager = () => {
    const session = sessionManager.getSession();
    const isValid = sessionManager.isSessionValid();
    const tokenFromManager = sessionManager.getToken();
    const userFromManager = sessionManager.getUser();
    
    console.log('SessionManager Check:');
    console.log('- session:', session);
    console.log('- isValid:', isValid);
    console.log('- token:', tokenFromManager ? 'exists' : 'null');
    console.log('- user:', userFromManager);
  };

  const clearAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg z-50 max-w-md">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user ? `${user.name} (${user.role})` : 'None'}</div>
        <div>Token: {token ? 'Exists' : 'None'}</div>
      </div>
      <div className="mt-2 space-x-2">
        <button 
          onClick={checkLocalStorage}
          className="bg-blue-500 px-2 py-1 rounded text-xs"
        >
          Check Storage
        </button>
        <button 
          onClick={checkSessionManager}
          className="bg-green-500 px-2 py-1 rounded text-xs"
        >
          Check Manager
        </button>
        <button 
          onClick={clearAll}
          className="bg-red-500 px-2 py-1 rounded text-xs"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
