import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  fullName: string;
  role: string;
  expedition: string;
  initials: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const DEMO_USERS: Record<string, User> = {
  'operator@polar.demo': {
    email: 'operator@polar.demo',
    fullName: 'Cmdr. Dr. A. Sharma',
    role: 'Station Commander',
    expedition: 'Expedition 44',
    initials: 'AS',
  },
  'admin@polar.demo': {
    email: 'admin@polar.demo',
    fullName: 'Dr. R. Patel',
    role: 'System Administrator',
    expedition: 'Expedition 44',
    initials: 'RP',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,

      login: async (email: string, password: string) => {
        const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

        if (isDemoMode) {
          // Demo login
          const validPasswords: Record<string, string> = {
            'operator@polar.demo': 'polar123',
            'admin@polar.demo': 'admin123',
          };
          if (validPasswords[email] === password) {
            const user = DEMO_USERS[email];
            set({ isAuthenticated: true, token: 'demo-token', user });
            return true;
          }
          return false;
        }

        // Live API login
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          set({ isAuthenticated: true, token: data.access_token, user: data.user });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false, token: null, user: null });
      },
    }),
    { name: 'polar-auth' }
  )
);
