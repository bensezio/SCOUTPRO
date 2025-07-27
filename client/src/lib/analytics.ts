import { apiRequest } from './queryClient';

// Analytics event types
export const ANALYTICS_EVENTS = {
  USER_REGISTERED: 'user_registered',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  FEATURE_ACCESSED: 'feature_accessed',
  FEATURE_BLOCKED: 'feature_blocked',
  PAYMENT_SUCCESSFUL: 'payment_successful',
  PAYMENT_FAILED: 'payment_failed',
  TEAM_SHEET_USAGE: 'team_sheet_usage',
  VIDEO_ANALYTICS_USAGE: 'video_analytics_usage',
  AI_REPORT_GENERATED: 'ai_report_generated',
  PLAYER_COMPARISON: 'player_comparison',
  PDF_EXPORT: 'pdf_export',
  BULK_OPERATION: 'bulk_operation',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PAGE_VIEW: 'page_view',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  UPGRADE_PROMPT_CLICKED: 'upgrade_prompt_clicked'
} as const;

// Analytics service
class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPageTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPageTracking() {
    // Track page views
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });

    // Track initial page load
    if (document.readyState === 'complete') {
      this.trackPageView(window.location.pathname);
    } else {
      window.addEventListener('load', () => {
        this.trackPageView(window.location.pathname);
      });
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  async track(eventType: string, eventData: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    try {
      // Only track if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        eventType,
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          sessionId: this.sessionId
        },
        sessionId: this.sessionId,
        userAgent: navigator.userAgent
      };

      await apiRequest('POST', '/api/analytics/events', payload);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // User lifecycle events
  trackUserRegistration(tier: string, method: string = 'email') {
    this.track(ANALYTICS_EVENTS.USER_REGISTERED, {
      tier,
      method,
      source: 'web'
    });
  }

  trackLogin(method: string = 'email') {
    this.track(ANALYTICS_EVENTS.LOGIN, {
      method,
      source: 'web'
    });
  }

  trackLogout() {
    this.track(ANALYTICS_EVENTS.LOGOUT, {
      sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[1])
    });
  }

  // Subscription events
  trackSubscriptionCreated(tier: string, amount: number, paymentMethod: string = 'stripe') {
    this.track(ANALYTICS_EVENTS.SUBSCRIPTION_CREATED, {
      tier,
      amount,
      currency: 'USD',
      paymentMethod
    });
  }

  trackSubscriptionUpgraded(fromTier: string, toTier: string, reason: string = 'feature_access') {
    this.track(ANALYTICS_EVENTS.SUBSCRIPTION_UPGRADED, {
      fromTier,
      toTier,
      reason
    });
  }

  trackSubscriptionCancelled(tier: string, reason: string = 'user_initiated') {
    this.track(ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED, {
      tier,
      reason
    });
  }

  // Payment events
  trackPaymentSuccessful(amount: number, tier: string) {
    this.track(ANALYTICS_EVENTS.PAYMENT_SUCCESSFUL, {
      amount,
      tier,
      currency: 'USD'
    });
  }

  trackPaymentFailed(amount: number, tier: string, errorCode: string) {
    this.track(ANALYTICS_EVENTS.PAYMENT_FAILED, {
      amount,
      tier,
      currency: 'USD',
      errorCode
    });
  }

  // Feature access events
  trackFeatureAccessed(feature: string, tier: string, context: string = 'user_interaction') {
    this.track(ANALYTICS_EVENTS.FEATURE_ACCESSED, {
      feature,
      tier,
      granted: true,
      context
    });
  }

  trackFeatureBlocked(feature: string, tier: string, requiredTier: string) {
    this.track(ANALYTICS_EVENTS.FEATURE_BLOCKED, {
      feature,
      tier,
      requiredTier,
      granted: false
    });
  }

  // Feature-specific events
  trackTeamSheetUsage(action: string, matchId: number, tier: string) {
    this.track(ANALYTICS_EVENTS.TEAM_SHEET_USAGE, {
      action, // 'create', 'update', 'delete', 'view'
      matchId,
      tier
    });
  }

  trackVideoAnalyticsUsage(action: string, videoId: number, analysisType: string) {
    this.track(ANALYTICS_EVENTS.VIDEO_ANALYTICS_USAGE, {
      action,
      videoId,
      analysisType
    });
  }

  trackAIReportGenerated(reportType: string, playerId: number, tier: string) {
    this.track(ANALYTICS_EVENTS.AI_REPORT_GENERATED, {
      reportType,
      playerId,
      tier
    });
  }

  trackPlayerComparison(playerIds: number[], tier: string) {
    this.track(ANALYTICS_EVENTS.PLAYER_COMPARISON, {
      playerIds,
      playerCount: playerIds.length,
      tier
    });
  }

  trackPDFExport(contentType: string, tier: string) {
    this.track(ANALYTICS_EVENTS.PDF_EXPORT, {
      contentType,
      tier
    });
  }

  trackBulkOperation(operation: string, itemCount: number, tier: string) {
    this.track(ANALYTICS_EVENTS.BULK_OPERATION, {
      operation,
      itemCount,
      tier
    });
  }

  // Conversion events
  trackUpgradePromptShown(currentTier: string, suggestedTier: string, feature: string) {
    this.track(ANALYTICS_EVENTS.UPGRADE_PROMPT_SHOWN, {
      currentTier,
      suggestedTier,
      feature,
      context: 'feature_gate'
    });
  }

  trackUpgradePromptClicked(currentTier: string, suggestedTier: string, feature: string) {
    this.track(ANALYTICS_EVENTS.UPGRADE_PROMPT_CLICKED, {
      currentTier,
      suggestedTier,
      feature,
      context: 'feature_gate'
    });
  }

  // Page tracking
  trackPageView(path: string) {
    this.track(ANALYTICS_EVENTS.PAGE_VIEW, {
      path,
      title: document.title
    });
  }

  // Performance tracking
  trackApiPerformance(endpoint: string, tier: string, responseTime: number, status: number) {
    this.track('api_performance', {
      endpoint,
      tier,
      responseTime,
      status,
      performance: responseTime < 1000 ? 'good' : 'slow'
    });
  }

  trackFeaturePerformance(feature: string, tier: string, loadTime: number) {
    this.track('feature_performance', {
      feature,
      tier,
      loadTime,
      userExperience: loadTime < 2000 ? 'excellent' : 'needs_improvement'
    });
  }

  // Error tracking
  trackError(error: Error, context: string, tier: string) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      tier
    });
  }

  // A/B testing support
  trackExperiment(experimentId: string, variant: string, tier: string) {
    this.track('experiment_exposure', {
      experimentId,
      variant,
      tier
    });
  }

  // Custom events
  trackCustomEvent(eventName: string, properties: Record<string, any>) {
    this.track(eventName, properties);
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Hook for React components
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackFeatureAccessed: analytics.trackFeatureAccessed.bind(analytics),
    trackFeatureBlocked: analytics.trackFeatureBlocked.bind(analytics),
    trackTeamSheetUsage: analytics.trackTeamSheetUsage.bind(analytics),
    trackVideoAnalyticsUsage: analytics.trackVideoAnalyticsUsage.bind(analytics),
    trackAIReportGenerated: analytics.trackAIReportGenerated.bind(analytics),
    trackPlayerComparison: analytics.trackPlayerComparison.bind(analytics),
    trackPDFExport: analytics.trackPDFExport.bind(analytics),
    trackUpgradePromptShown: analytics.trackUpgradePromptShown.bind(analytics),
    trackUpgradePromptClicked: analytics.trackUpgradePromptClicked.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics)
  };
}

// Performance observer for Core Web Vitals
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  // Track Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    analytics.track('core_web_vitals', {
      metric: 'LCP',
      value: lastEntry.startTime,
      rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor'
    });
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Track First Input Delay (FID)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      analytics.track('core_web_vitals', {
        metric: 'FID',
        value: entry.processingStart - entry.startTime,
        rating: entry.processingStart - entry.startTime < 100 ? 'good' : 
                entry.processingStart - entry.startTime < 300 ? 'needs_improvement' : 'poor'
      });
    });
  }).observe({ entryTypes: ['first-input'] });

  // Track Cumulative Layout Shift (CLS)
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    analytics.track('core_web_vitals', {
      metric: 'CLS',
      value: clsValue,
      rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs_improvement' : 'poor'
    });
  }).observe({ entryTypes: ['layout-shift'] });
}