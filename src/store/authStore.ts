import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user?: User) => void;
  logout: () => void;
  initialize: () => void;
}

// Helper to decode JWT token
const decodeToken = (token: string): User | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem('token', token);
    const decodedUser = user || decodeToken(token);
    set({ token, user: decodedUser, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        const user = decodeToken(token);
        if (user) {
          // Check if token is expired
          const isExpired = (user as any).exp * 1000 < Date.now();
          if (isExpired) {
            localStorage.removeItem('token');
            set({ token: null, user: null, isAuthenticated: false });
          } else {
            set({ token, user, isAuthenticated: true });
          }
        }
      }
    }
  },
}));
