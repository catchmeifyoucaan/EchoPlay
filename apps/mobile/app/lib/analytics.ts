// Analytics stub - replace with actual PostHog integration when ready

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
      console.log('[Analytics] PostHog key missing - using stub mode');
      this.initialized = true;
      return;
    }
    // TODO: Initialize PostHog when configured
    // posthog.init(key, { apiHost: 'https://app.posthog.com' });
    console.log('[Analytics] Initialized (stub mode)');
    this.initialized = true;
  }

  identify(userId: string) {
    if (!this.initialized) {
      return;
    }
    console.log('[Analytics] Identify:', userId);
  }

  capture(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (!this.initialized) {
      this.init();
    }
    console.log('[Analytics]', event, properties);
  }
}

export const analytics = new Analytics();
