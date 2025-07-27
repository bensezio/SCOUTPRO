// Token management utility for programmatic token updates
export const TokenManager = {
  // Update token in localStorage and trigger authentication context updates
  updateToken: (newToken: string) => {
    localStorage.setItem('token', newToken);
    
    // Dispatch a custom event to notify authentication context
    window.dispatchEvent(new CustomEvent('tokenUpdated', { 
      detail: { token: newToken } 
    }));
  },
  
  // Get current token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  // Clear token
  clearToken: () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('tokenCleared'));
  },
  
  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};

// Super admin token for testing - loaded from environment variable for security
export const SUPER_ADMIN_TOKEN = import.meta.env.VITE_SUPER_ADMIN_TOKEN || "";

// Auto-fix token function for development
export const ensureValidToken = () => {
  const currentToken = TokenManager.getToken();
  
  if (!currentToken || TokenManager.isTokenExpired(currentToken)) {
    console.log('Auto-updating expired token with super admin token');
    TokenManager.updateToken(SUPER_ADMIN_TOKEN);
    return SUPER_ADMIN_TOKEN;
  }
  
  return currentToken;
};