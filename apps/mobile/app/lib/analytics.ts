import posthog from 'posthog-react-native';

type AnalyticsEvent =
  | 'auth_login_success'
  | 'auth_logout'
  | 'match_created'
  | 'match_joined'
  | 'match_started'
  | 'round_started'
  | 'round_ended'
  | 'reaction_sent'
  | 'vote_submitted'
  | 'ai_score_requested';

class Analytics {
  private initialized = false;

  init() {
    if (this.initialized) {
      return;
    }
    const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    if (!key) {
      console.warn('PostHog key missing');
      return;
    }
    posthog.init(key, {
      apiHost: 'https://app.posthog.com',
      captureApplicationLifecycleEvents: true
    });
    this.initialized = true;
  }

  identify(userId: string) {
    if (!this.initialized) {
      return;
    }
    posthog.identify(userId);
  }

  capture(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (!this.initialized) {
      return;
    }
    posthog.capture(event, properties);
  }
}

export const analytics = new Analytics();
