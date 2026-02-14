import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  admin: any;
  token: string | null;
  login: (token: string, admin: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists on mount
    console.log('[AuthContext] Checking for stored token...');
    const storedToken = localStorage.getItem('adminAccessToken');
    const storedAdmin = localStorage.getItem('adminData');
    
    if (storedToken && storedAdmin) {
      try {
        console.log('[AuthContext] Found stored credentials, restoring session...');
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
        setIsAuthenticated(true);
        console.log('[AuthContext] Session restored successfully');
      } catch (error) {
        console.error('[AuthContext] Failed to parse stored admin data:', error);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminData');
      }
    } else {
      console.log('[AuthContext] No stored credentials found');
    }
    setIsLoading(false);
    console.log('[AuthContext] Auth initialization complete');
  }, []);

  const login = (accessToken: string, adminData: any) => {
    console.log('[AuthContext] Logging in user:', adminData?.name || adminData?.email);
    localStorage.setItem('adminAccessToken', accessToken);
    localStorage.setItem('adminData', JSON.stringify(adminData));
    setToken(accessToken);
    setAdmin(adminData);
    setIsAuthenticated(true);
    console.log('[AuthContext] Login successful');
  };

  const logout = () => {
    console.log('[AuthContext] Logging out user');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminData');
    setToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
    console.log('[AuthContext] Logout complete');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, admin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
