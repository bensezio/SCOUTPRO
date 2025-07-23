// Platinum Scout Subscription Tiers and Feature Gating

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  priceYearly: number;
  features: string[];
  limits: {
    monthlyCredits: number;
    videoUploads: number;
    reportDownloads: number;
    playerComparisons: number;
    bulkUploads: number;
    apiCalls: number;
    skillChallenges: number;
  };
  premiumFeatures: string[];
  restrictions: string[];
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  freemium: {
    id: 'freemium',
    name: 'Freemium',
    price: 0,
    priceYearly: 0,
    features: [
      'Basic player search',
      'Limited analytics dashboard',
      'View-only scouting reports',
      'Basic player profiles',
      'Community access'
    ],
    limits: {
      monthlyCredits: 5,
      videoUploads: 1,
      reportDownloads: 1,
      playerComparisons: 2,
      bulkUploads: 0,
      apiCalls: 0,
      skillChallenges: 0
    },
    premiumFeatures: [],
    restrictions: [
      'Limited PDF reports (1/month)',
      'Limited video uploads (1/month)',
      'No AI analytics',
      'No bulk operations'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceYearly: 790, // ~17% discount (2 months free)
    features: [
      'Full AI analytics suite',
      'Video upload & tagging (5/month)',
      'PDF report exports (5/month)',
      'Player comparisons (10/month)',
      'Heat maps & visualizations',
      'Advanced search filters',
      'Priority email support',
      'Export capabilities (CSV/Excel)'
    ],
    limits: {
      monthlyCredits: 50,
      videoUploads: 5,
      reportDownloads: 5,
      playerComparisons: 10,
      bulkUploads: 0,
      apiCalls: 0,
      skillChallenges: 0
    },
    premiumFeatures: [
      'ai_analytics',
      'video_tagging',
      'pdf_export',
      'advanced_search',
      'heat_maps',
      'player_comparisons'
    ],
    restrictions: [
      'No bulk upload capabilities',
      'No API access',
      'No team management features',
      'Single user only'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    priceYearly: 2990, // ~17% discount (2 months free)
    features: [
      'Everything in Pro',
      'Video uploads & analysis (10/month)',
      'PDF report exports (10/month)',
      'Player comparisons (20/month)',
      'Bulk upload capabilities',
      'Team management dashboard',
      'Multi-user access (up to 5 users)',
      'Custom branding & white-label',
      'Dedicated account manager',
      'Priority phone & chat support',
      'Advanced team analytics'
    ],
    limits: {
      monthlyCredits: 100,
      videoUploads: 10,
      reportDownloads: 10,
      playerComparisons: 20,
      bulkUploads: 5,
      apiCalls: 0,
      skillChallenges: 0
    },
    premiumFeatures: [
      'ai_analytics',
      'video_tagging',
      'pdf_export',
      'advanced_search',
      'heat_maps',
      'bulk_upload',
      'team_management',
      'enhanced_video_analytics',
      'team_sheet_management',
      'custom_branding',
      'multi_user',
      'dedicated_support',
      'white_label'
    ],
    restrictions: []
  }
};

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: string;
  usageRemaining?: number;
  resetDate?: Date;
}

export class SubscriptionManager {
  static checkFeatureAccess(
    userTier: string,
    feature: string,
    currentUsage: number = 0
  ): FeatureAccess {
    const tier = SUBSCRIPTION_TIERS[userTier];
    
    if (!tier) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription tier',
        upgradeRequired: 'scoutpro'
      };
    }

    // Check if feature is in premium features list
    if (!tier.premiumFeatures.includes(feature)) {
      const requiredTier = this.getRequiredTierForFeature(feature);
      return {
        hasAccess: false,
        reason: `Feature not available in ${tier.name} plan`,
        upgradeRequired: requiredTier
      };
    }

    // Check usage limits
    const limit = this.getFeatureLimit(tier, feature);
    if (limit !== -1 && currentUsage >= limit) {
      return {
        hasAccess: false,
        reason: `Monthly limit exceeded (${limit} ${feature} per month)`,
        upgradeRequired: this.getNextTier(userTier),
        usageRemaining: 0
      };
    }

    return {
      hasAccess: true,
      usageRemaining: limit === -1 ? -1 : limit - currentUsage
    };
  }

  static getRequiredTierForFeature(feature: string): string {
    for (const [tierId, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
      if (tier.premiumFeatures.includes(feature)) {
        return tierId;
      }
    }
    return 'scoutpro';
  }

  static getFeatureLimit(tier: SubscriptionTier, feature: string): number {
    const featureLimitMap: Record<string, keyof typeof tier.limits> = {
      'ai_analytics': 'monthlyCredits',
      'video_tagging': 'videoUploads',
      'enhanced_video_analytics': 'videoUploads',
      'team_sheet_management': 'monthlyCredits',
      'pdf_export': 'reportDownloads',
      'player_comparison': 'playerComparisons',
      'bulk_upload': 'bulkUploads',
      'api_access': 'apiCalls',
      'skill_challenges': 'skillChallenges'
    };

    const limitKey = featureLimitMap[feature];
    return limitKey ? tier.limits[limitKey] : -1;
  }

  static getNextTier(currentTier: string): string {
    const tierOrder = ['freemium', 'scoutpro', 'agent_club'];
    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : 'agent_club';
  }

  static getUpgradeMessage(feature: string, userTier: string): string {
    const access = this.checkFeatureAccess(userTier, feature);
    if (access.hasAccess) return '';

    const requiredTier = SUBSCRIPTION_TIERS[access.upgradeRequired || 'scoutpro'];
    return `Upgrade to ${requiredTier.name} ($${requiredTier.price}/month) to access ${feature.replace('_', ' ')}`;
  }

  static canAccessFeature(userTier: string, feature: string): boolean {
    return this.checkFeatureAccess(userTier, feature).hasAccess;
  }

  static getTierFeatures(tierId: string): string[] {
    return SUBSCRIPTION_TIERS[tierId]?.features || [];
  }

  static getTierLimits(tierId: string) {
    return SUBSCRIPTION_TIERS[tierId]?.limits || SUBSCRIPTION_TIERS.freemium.limits;
  }
}

// Feature constants for easy reference
export const FEATURES = {
  AI_ANALYTICS: 'ai_analytics',
  VIDEO_TAGGING: 'video_tagging',
  PDF_EXPORT: 'pdf_export',
  ADVANCED_SEARCH: 'advanced_search',
  HEAT_MAPS: 'heat_maps',
  BULK_UPLOAD: 'bulk_upload',
  API_ACCESS: 'api_access',
  TEAM_MANAGEMENT: 'team_management',
  ENHANCED_VIDEO_ANALYTICS: 'enhanced_video_analytics',
  TEAM_SHEET_MANAGEMENT: 'team_sheet_management',
  CUSTOM_BRANDING: 'custom_branding',
  SKILL_CHALLENGES: 'skill_challenges',
  MULTI_USER: 'multi_user',
  DEDICATED_SUPPORT: 'dedicated_support',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  WHITE_LABEL: 'white_label',
  PLATINUM_CONCIERGE: 'platinum_concierge',
  UNLIMITED_ACCESS: 'unlimited_access'
} as const;

export type FeatureType = typeof FEATURES[keyof typeof FEATURES];