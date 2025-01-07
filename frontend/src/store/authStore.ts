import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUserAuthData: (id: string, email: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('authToken'),
  userId: null,
  userEmail: null,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setUserAuthData: (id, email) => set({ userId: id, userEmail: email }),
}));