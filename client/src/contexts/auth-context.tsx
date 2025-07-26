import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: number;
  isActive: boolean;
  emailVerified: boolean;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  creditsRemaining?: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
  remainingTime: number;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem('token'));
  const [remainingTime, setRemainingTime] = useState(30 * 60 * 1000); // 30 minutes in ms
  const [showWarning, setShowWarning] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Refs for timers
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Session configuration
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
  
  // CRITICAL FIX: Enhanced token decoding with proper validation and expiry check
  const decodeToken = useCallback((token: string) => {
    try {
      // Validate token format before decode
      if (!token || typeof token !== 'string') {
        console.warn('Invalid token format:', typeof token);
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid JWT format: expected 3 parts, got', parts.length);
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token has expired, clearing from storage');
        localStorage.removeItem('token');
        setHasToken(false);
        setIsAuthenticated(false);
        setUser(null);
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }, []);
  
  // Fetch current user with better error handling
  const { data: serverUser, isLoading, refetch: refetchUser, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasToken, // Only run if token exists
  });

  // Update user state when server data arrives
  useEffect(() => {
    if (serverUser && hasToken) {
      setUser(serverUser as User);
      setIsAuthenticated(true);
    }
  }, [serverUser, hasToken]);

  // Auto-refresh token mechanism
  useEffect(() => {
    const checkAndRefreshToken = () => {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = decodeToken(token);
        if (!payload) {
          // Token is expired or invalid, force re-authentication
          console.log('Token expired, clearing authentication state');
          setHasToken(false);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    // Check token validity every 5 minutes
    const tokenCheckInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    
    // Check immediately on load
    checkAndRefreshToken();

    return () => clearInterval(tokenCheckInterval);
  }, [decodeToken]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    inactivityTimer.current = null;
    warningTimer.current = null;
    countdownTimer.current = null;
  }, []);

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  // Force logout function
  const forceLogout = useCallback((reason: string) => {
    clearAllTimers();
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    setHasToken(false);
    setIsAuthenticated(false);
    setShowWarning(false);
    queryClient.clear();
    
    toast({
      title: "Session Expired",
      description: reason,
      variant: "destructive",
    });
    
    // Clear browser history and prevent back button access
    window.history.replaceState(null, '', '/login');
    window.location.href = '/login';
  }, [clearAllTimers, queryClient, toast]);

  // Start session timers after login
  const startSessionTimers = useCallback(() => {
    console.log('Starting session timers after login...');
    clearAllTimers();
    setShowWarning(false);
    setRemainingTime(INACTIVITY_TIMEOUT);
    updateLastActivity();
    
    // Set main timeout timer
    inactivityTimer.current = setTimeout(() => {
      forceLogout('Session expired due to inactivity');
    }, INACTIVITY_TIMEOUT);
    
    // Set warning timer (5 minutes before timeout)
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_TIME);
      
      // Start countdown
      countdownTimer.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1000) {
            clearInterval(countdownTimer.current!);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
  }, [clearAllTimers, forceLogout, updateLastActivity, INACTIVITY_TIMEOUT, WARNING_TIME]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (isAuthenticated) {
      startSessionTimers();
    }
  }, [isAuthenticated, startSessionTimers]);

  // Activity detection
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        updateLastActivity();
        resetInactivityTimer();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, updateLastActivity, resetInactivityTimer]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log('Token found, initializing auth state...');
        
        // CRITICAL FIX: Use safe token decoding
        const payload = decodeToken(token);
        
        if (payload) {
          // Set auth state immediately from token
          setHasToken(true);
          setIsAuthenticated(true);
          
          // Store user info from token for immediate role-based routing
          const userFromToken = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            username: payload.username || payload.email,
            displayName: payload.displayName || payload.username || (payload.email ? payload.email.split('@')[0] : 'User'),
            firstName: payload.firstName,
            lastName: payload.lastName,
            organizationId: payload.organizationId,
            isActive: payload.isActive !== false,
            emailVerified: payload.emailVerified || false,
            subscriptionTier: payload.subscriptionTier,
            subscriptionStatus: payload.subscriptionStatus,
            creditsRemaining: payload.creditsRemaining,
            createdAt: payload.createdAt || new Date().toISOString(),
          };
          
          setUser(userFromToken);
          
          // Start session timers
          startSessionTimers();
          
          // Trigger user fetch to update with latest server data
          refetchUser();
        } else {
          console.warn('Invalid token found, clearing auth state');
          localStorage.removeItem('token');
          localStorage.removeItem('lastActivity');
          setHasToken(false);
          setIsAuthenticated(false);
        }
      } else {
        setHasToken(false);
        setIsAuthenticated(false);
      }
    };

    initializeAuth();
  }, [decodeToken, startSessionTimers, refetchUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        // Store token
        localStorage.setItem('token', data.token);
        
        // CRITICAL FIX: Decode token safely for user info
        const payload = decodeToken(data.token);
        
        if (payload) {
          const userFromToken = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            username: payload.username || payload.email,
            displayName: payload.displayName || payload.username || (payload.email ? payload.email.split('@')[0] : 'User'),
            firstName: payload.firstName,
            lastName: payload.lastName,
            organizationId: payload.organizationId,
            isActive: payload.isActive !== false,
            emailVerified: payload.emailVerified || false,
            subscriptionTier: payload.subscriptionTier,
            subscriptionStatus: payload.subscriptionStatus,
            creditsRemaining: payload.creditsRemaining,
            createdAt: payload.createdAt || new Date().toISOString(),
          };
          
          setUser(userFromToken);
          setHasToken(true);
          setIsAuthenticated(true);
          
          // Start session timers
          startSessionTimers();
          
          // Trigger user fetch for latest server data
          refetchUser();
          
          toast({
            title: "Login Successful",
            description: "Welcome back to PlatinumEdge Analytics!",
          });
        }
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAllTimers();
      localStorage.removeItem('token');
      localStorage.removeItem('lastActivity');
      setHasToken(false);
      setIsAuthenticated(false);
      setShowWarning(false);
      queryClient.clear();
      setUser(null);
    }
  }, [clearAllTimers, queryClient]);

  // Extend session
  const extendSession = useCallback(() => {
    if (isAuthenticated) {
      setShowWarning(false);
      startSessionTimers();
      updateLastActivity();
      
      toast({
        title: "Session Extended",
        description: "Your session has been extended for another 30 minutes.",
      });
    }
  }, [isAuthenticated, startSessionTimers, updateLastActivity, toast]);

  // Login function for form submission
  const login = useCallback(async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const value: AuthContextType = {
    user: (user as User) || null,
    isLoading: isLoading || loginMutation.isPending,
    isAuthenticated,
    login,
    logout,
    refetchUser,
    remainingTime,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}