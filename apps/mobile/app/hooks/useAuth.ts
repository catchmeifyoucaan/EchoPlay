import { useEffect } from 'react';

import { analytics } from '../lib/analytics';
import { useAuthStore } from '../state/authStore';

export const useAuth = () => {
  const { status, user, bootstrap } = useAuthStore();

  useEffect(() => {
    analytics.init();
    if (user?.id) {
      analytics.identify(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return useAuthStore();
};
