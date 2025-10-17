import create from 'zustand';
import { persist } from 'zustand/middleware';
import auth from '@react-native-firebase/auth';

import { apiClient } from '../lib/api';
import { analytics } from '../lib/analytics';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

type ProfileMode = 'SOLO' | 'FAMILY' | 'COUPLE';

type UserProfile = {
  id: string;
  mode: ProfileMode;
  bio?: string | null;
  interests: string[];
  locale: string;
};

type UserRecord = {
  id: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'MOD' | 'ADMIN';
  parentId?: string | null;
  profiles: UserProfile[];
};

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: UserRecord | null;
  bootstrap: () => Promise<void>;
  signInWithFirebaseIdToken: (firebaseIdToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileMode: (mode: ProfileMode) => Promise<void>;
  updateProfile: (payload: Partial<{ displayName: string; avatarUrl?: string | null; bio?: string | null; interests?: string[]; locale?: string }>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      token: null,
      user: null,
      bootstrap: async () => {
        const { status, token } = get();
        if (status !== 'idle') {
          return;
        }
        if (!token) {
          set({ status: 'unauthenticated' });
          return;
        }
        try {
          set({ status: 'loading' });
          apiClient.setToken(token);
          const me = await apiClient.get<UserRecord>('/v1/me');
          set({ user: me, status: 'authenticated' });
        } catch (error) {
          console.warn('Failed to bootstrap session', error);
          set({ status: 'unauthenticated', token: null, user: null });
        }
      },
      signInWithFirebaseIdToken: async (firebaseIdToken: string) => {
        set({ status: 'loading' });
        const response = await apiClient.post<{ token: string; user: UserRecord }>(
          '/v1/auth/verify',
          {
            firebaseIdToken
          }
        );
        set({ token: response.token, user: response.user, status: 'authenticated' });
        analytics.capture('auth_login_success');
        apiClient.setToken(response.token);
      },
      logout: async () => {
        await auth().signOut();
        apiClient.setToken(null);
        analytics.capture('auth_logout');
        set({ token: null, user: null, status: 'unauthenticated' });
      },
      updateProfileMode: async (mode: ProfileMode) => {
        const { user } = get();
        if (!user) {
          throw new Error('No authenticated user');
        }
        try {
          await apiClient.patch<UserRecord>('/v1/me', {});
        } catch (error) {
          console.warn('Mode update fallback applied', error);
        }
        set({
          user: {
            ...user,
            profiles: user.profiles.map((profile, index) =>
              index === 0
                ? {
                    ...profile,
                    mode
                  }
                : profile
            )
          }
        });
      },
      updateProfile: async (payload) => {
        const { user } = get();
        if (!user) {
          throw new Error('No authenticated user');
        }
        const updated = await apiClient.patch<UserRecord>('/v1/me', payload);
        set({ user: updated });
      }
    }),
    {
      name: 'echoplay-auth-store',
      partialize: ({ token, user }) => ({ token, user }),
      onRehydrateStorage: () => state => {
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      }
    }
  )
);
