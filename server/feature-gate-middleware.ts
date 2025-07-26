import type { Express, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth-routes.js";
import { SUBSCRIPTION_TIERS } from "../shared/subscription-tiers.js";

// Feature constants for easy reference
export const FEATURES = {
  // Core features
  PLAYER_PROFILES: 'player_profiles',
  BASIC_SEARCH: 'basic_search',
  ADVANCED_SEARCH: 'advanced_search',
  
  // Player operations
  ADD_PLAYERS: 'addPlayers',
  EDIT_PLAYERS: 'editPlayers',
  DELETE_PLAYERS: 'deletePlayers',
  
  // Analytics features
  AI_ANALYTICS: 'ai_analytics',
  PLAYER_COMPARISON: 'player_comparison',
  PERFORMANCE_ANALYTICS: 'performance_analytics',
  MARKET_VALUE_ANALYSIS: 'market_value_analysis',
  
  // Video features
  VIDEO_UPLOAD: 'video_upload',
  VIDEO_ANALYSIS: 'video_analysis',
  VIDEO_TAGGING: 'video_tagging',
  VIDEO_HIGHLIGHTS: 'video_highlights',
  
  // Team features
  TEAM_MANAGEMENT: 'team_management',
  TEAM_SHEETS: 'team_sheets',
  MULTI_USER_ACCESS: 'multi_user_access',
  
  // Reports and exports
  PDF_EXPORT: 'pdf_export',
  SCOUTING_REPORTS: 'scouting_reports',
  DATA_EXPORT: 'data_export',
  BULK_OPERATIONS: 'bulk_operations',
  
  // Skills Challenge
  SKILL_CHALLENGES: 'skill_challenges',
  CHALLENGE_CREATION: 'challenge_creation',
  CHALLENGE_PARTICIPATION: 'challenge_participation',
  
  // API and integrations
  API_ACCESS: 'api_access',
  WEBHOOKS: 'webhooks',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  
  // Premium features
  CUSTOM_BRANDING: 'custom_branding',
  WHITE_LABEL: 'white_label',
  PRIORITY_SUPPORT: 'priority_support',
  CONCIERGE_SERVICE: 'concierge_service'
};

// Feature access matrix by subscription tier
export const FEATURE_ACCESS = {
  freemium: {
    [FEATURES.PLAYER_PROFILES]: { enabled: true, limit: 10 },
    [FEATURES.BASIC_SEARCH]: { enabled: true, limit: null },
    [FEATURES.PLAYER_COMPARISON]: { enabled: true, limit: 2 },
    [FEATURES.ADD_PLAYERS]: { enabled: false, limit: 0 },
    [FEATURES.EDIT_PLAYERS]: { enabled: false, limit: 0 },
    [FEATURES.DELETE_PLAYERS]: { enabled: false, limit: 0 },
    [FEATURES.AI_ANALYTICS]: { enabled: false, limit: 0 },
    [FEATURES.VIDEO_UPLOAD]: { enabled: false, limit: 0 },
    [FEATURES.PDF_EXPORT]: { enabled: false, limit: 0 },
    [FEATURES.TEAM_MANAGEMENT]: { enabled: false, limit: 0 },
    [FEATURES.SKILL_CHALLENGES]: { enabled: false, limit: 0 },
    [FEATURES.API_ACCESS]: { enabled: false, limit: 0 }
  },
  scoutpro: {
    [FEATURES.PLAYER_PROFILES]: { enabled: true, limit: null },
    [FEATURES.BASIC_SEARCH]: { enabled: true, limit: null },
    [FEATURES.ADVANCED_SEARCH]: { enabled: true, limit: null },
    [FEATURES.PLAYER_COMPARISON]: { enabled: true, limit: 50 },
    [FEATURES.ADD_PLAYERS]: { enabled: true, limit: 100 },
    [FEATURES.EDIT_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.DELETE_PLAYERS]: { enabled: false, limit: 0 },
    [FEATURES.AI_ANALYTICS]: { enabled: true, limit: 100 },
    [FEATURES.VIDEO_UPLOAD]: { enabled: true, limit: 25 },
    [FEATURES.VIDEO_ANALYSIS]: { enabled: true, limit: 25 },
    [FEATURES.PDF_EXPORT]: { enabled: true, limit: 50 },
    [FEATURES.SCOUTING_REPORTS]: { enabled: true, limit: 50 },
    [FEATURES.SKILL_CHALLENGES]: { enabled: true, limit: 5 },
    [FEATURES.TEAM_MANAGEMENT]: { enabled: false, limit: 0 },
    [FEATURES.API_ACCESS]: { enabled: false, limit: 0 }
  },
  agent_club: {
    [FEATURES.PLAYER_PROFILES]: { enabled: true, limit: null },
    [FEATURES.BASIC_SEARCH]: { enabled: true, limit: null },
    [FEATURES.ADVANCED_SEARCH]: { enabled: true, limit: null },
    [FEATURES.PLAYER_COMPARISON]: { enabled: true, limit: 200 },
    [FEATURES.ADD_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.EDIT_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.DELETE_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.AI_ANALYTICS]: { enabled: true, limit: 200 },
    [FEATURES.VIDEO_UPLOAD]: { enabled: true, limit: 50 },
    [FEATURES.VIDEO_ANALYSIS]: { enabled: true, limit: 50 },
    [FEATURES.VIDEO_TAGGING]: { enabled: true, limit: 50 },
    [FEATURES.PDF_EXPORT]: { enabled: true, limit: 100 },
    [FEATURES.SCOUTING_REPORTS]: { enabled: true, limit: 100 },
    [FEATURES.TEAM_MANAGEMENT]: { enabled: true, limit: 5 },
    [FEATURES.TEAM_SHEETS]: { enabled: true, limit: 20 },
    [FEATURES.MULTI_USER_ACCESS]: { enabled: true, limit: 5 },
    [FEATURES.SKILL_CHALLENGES]: { enabled: true, limit: 10 },
    [FEATURES.CHALLENGE_CREATION]: { enabled: true, limit: 2 },
    [FEATURES.API_ACCESS]: { enabled: true, limit: 1000 },
    [FEATURES.BULK_OPERATIONS]: { enabled: true, limit: 100 }
  },
  enterprise: {
    [FEATURES.PLAYER_PROFILES]: { enabled: true, limit: null },
    [FEATURES.BASIC_SEARCH]: { enabled: true, limit: null },
    [FEATURES.ADVANCED_SEARCH]: { enabled: true, limit: null },
    [FEATURES.PLAYER_COMPARISON]: { enabled: true, limit: 1000 },
    [FEATURES.ADD_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.EDIT_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.DELETE_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.AI_ANALYTICS]: { enabled: true, limit: 1000 },
    [FEATURES.VIDEO_UPLOAD]: { enabled: true, limit: 200 },
    [FEATURES.VIDEO_ANALYSIS]: { enabled: true, limit: 200 },
    [FEATURES.VIDEO_TAGGING]: { enabled: true, limit: 200 },
    [FEATURES.VIDEO_HIGHLIGHTS]: { enabled: true, limit: 200 },
    [FEATURES.PDF_EXPORT]: { enabled: true, limit: 500 },
    [FEATURES.SCOUTING_REPORTS]: { enabled: true, limit: 500 },
    [FEATURES.TEAM_MANAGEMENT]: { enabled: true, limit: 50 },
    [FEATURES.TEAM_SHEETS]: { enabled: true, limit: 100 },
    [FEATURES.MULTI_USER_ACCESS]: { enabled: true, limit: 50 },
    [FEATURES.SKILL_CHALLENGES]: { enabled: true, limit: 50 },
    [FEATURES.CHALLENGE_CREATION]: { enabled: true, limit: 10 },
    [FEATURES.API_ACCESS]: { enabled: true, limit: 10000 },
    [FEATURES.WEBHOOKS]: { enabled: true, limit: 100 },
    [FEATURES.BULK_OPERATIONS]: { enabled: true, limit: 1000 },
    [FEATURES.CUSTOM_BRANDING]: { enabled: true, limit: null },
    [FEATURES.PRIORITY_SUPPORT]: { enabled: true, limit: null }
  },
  platinum: {
    [FEATURES.PLAYER_PROFILES]: { enabled: true, limit: null },
    [FEATURES.BASIC_SEARCH]: { enabled: true, limit: null },
    [FEATURES.ADVANCED_SEARCH]: { enabled: true, limit: null },
    [FEATURES.PLAYER_COMPARISON]: { enabled: true, limit: null },
    [FEATURES.ADD_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.EDIT_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.DELETE_PLAYERS]: { enabled: true, limit: null },
    [FEATURES.AI_ANALYTICS]: { enabled: true, limit: null },
    [FEATURES.VIDEO_UPLOAD]: { enabled: true, limit: null },
    [FEATURES.VIDEO_ANALYSIS]: { enabled: true, limit: null },
    [FEATURES.VIDEO_TAGGING]: { enabled: true, limit: null },
    [FEATURES.VIDEO_HIGHLIGHTS]: { enabled: true, limit: null },
    [FEATURES.PDF_EXPORT]: { enabled: true, limit: null },
    [FEATURES.SCOUTING_REPORTS]: { enabled: true, limit: null },
    [FEATURES.TEAM_MANAGEMENT]: { enabled: true, limit: null },
    [FEATURES.TEAM_SHEETS]: { enabled: true, limit: null },
    [FEATURES.MULTI_USER_ACCESS]: { enabled: true, limit: null },
    [FEATURES.SKILL_CHALLENGES]: { enabled: true, limit: null },
    [FEATURES.CHALLENGE_CREATION]: { enabled: true, limit: null },
    [FEATURES.API_ACCESS]: { enabled: true, limit: null },
    [FEATURES.WEBHOOKS]: { enabled: true, limit: null },
    [FEATURES.BULK_OPERATIONS]: { enabled: true, limit: null },
    [FEATURES.CUSTOM_BRANDING]: { enabled: true, limit: null },
    [FEATURES.WHITE_LABEL]: { enabled: true, limit: null },
    [FEATURES.PRIORITY_SUPPORT]: { enabled: true, limit: null },
    [FEATURES.CONCIERGE_SERVICE]: { enabled: true, limit: null },
    [FEATURES.CUSTOM_INTEGRATIONS]: { enabled: true, limit: null }
  }
};

// Admin and super admin get all features
const ADMIN_FEATURES = Object.keys(FEATURES).reduce((acc, key) => {
  acc[FEATURES[key]] = { enabled: true, limit: null };
  return acc;
}, {});

FEATURE_ACCESS.admin = ADMIN_FEATURES;
FEATURE_ACCESS.super_admin = ADMIN_FEATURES;

// Feature gate middleware function
export function requireFeature(feature: string, options: { 
  checkUsage?: boolean, 
  usageType?: string,
  errorMessage?: string 
} = {}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          upgradeRequired: true,
          suggestedTier: 'scoutpro'
        });
      }

      const userTier = req.user.subscriptionTier || 'freemium';
      const userRole = req.user.role || 'scout';
      
      // Super Admin Bypass: admins and super_admins get all features
      if (userRole === 'admin' || userRole === 'super_admin') {
        console.log(`🔓 SERVER ADMIN BYPASS: ${userRole} ${req.user.email} granted access to ${feature}`);
        next();
        return;
      }

      const featureAccess = FEATURE_ACCESS[userTier]?.[feature];

      console.log(`🔍 SERVER Feature Check:`, {
        feature,
        user: req.user.email,
        tier: userTier,
        role: userRole,
        featureAccess,
        enabled: featureAccess?.enabled
      });

      if (!featureAccess || !featureAccess.enabled) {
        const suggestedTier = getSuggestedTierForFeature(feature);
        return res.status(403).json({
          error: options.errorMessage || `Feature '${feature}' requires ${suggestedTier} subscription`,
          feature: feature,
          currentTier: userTier,
          suggestedTier: suggestedTier,
          upgradeRequired: true,
          upgradeUrl: '/pricing'
        });
      }

      // Check usage limits if specified
      if (options.checkUsage && featureAccess.limit !== null) {
        // TODO: Implement usage tracking
        // For now, we'll skip the usage check
      }

      next();
    } catch (error) {
      console.error('Feature gate middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Helper function to get suggested tier for a feature
function getSuggestedTierForFeature(feature: string): string {
  const tiers = ['scoutpro', 'agent_club', 'enterprise', 'platinum'];
  
  for (const tier of tiers) {
    if (FEATURE_ACCESS[tier]?.[feature]?.enabled) {
      return tier;
    }
  }
  
  return 'scoutpro';
}

// Function to check if user has access to a feature
export function hasFeatureAccess(userTier: string, feature: string, userRole?: string): boolean {
  // Super Admin Bypass
  if (userRole === 'admin' || userRole === 'super_admin') {
    return true;
  }
  
  const featureAccess = FEATURE_ACCESS[userTier]?.[feature];
  return featureAccess?.enabled || false;
}

// Function to get feature limit for a user
export function getFeatureLimit(userTier: string, feature: string): number | null {
  const featureAccess = FEATURE_ACCESS[userTier]?.[feature];
  return featureAccess?.limit || null;
}

// Function to get all available features for a user
export function getUserFeatures(userTier: string): string[] {
  const tierFeatures = FEATURE_ACCESS[userTier] || {};
  return Object.keys(tierFeatures).filter(feature => tierFeatures[feature].enabled);
}

// Function to get upgrade path for a user
export function getUpgradePath(currentTier: string): { nextTier: string; newFeatures: string[] } | null {
  const tierHierarchy = ['freemium', 'scoutpro', 'agent_club', 'enterprise', 'platinum'];
  const currentIndex = tierHierarchy.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex === tierHierarchy.length - 1) {
    return null;
  }
  
  const nextTier = tierHierarchy[currentIndex + 1];
  const currentFeatures = getUserFeatures(currentTier);
  const nextFeatures = getUserFeatures(nextTier);
  const newFeatures = nextFeatures.filter(feature => !currentFeatures.includes(feature));
  
  return { nextTier, newFeatures };
}

// Middleware to add feature access information to requests
export function addFeatureContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    const userTier = req.user.subscriptionTier || 'freemium';
    req.userFeatures = {
      tier: userTier,
      features: getUserFeatures(userTier),
      hasFeature: (feature: string) => hasFeatureAccess(userTier, feature),
      getLimit: (feature: string) => getFeatureLimit(userTier, feature),
      upgradePath: getUpgradePath(userTier)
    };
  }
  
  next();
}

// Extend the AuthenticatedRequest interface
declare module './auth-routes.js' {
  interface AuthenticatedRequest {
    userFeatures?: {
      tier: string;
      features: string[];
      hasFeature: (feature: string) => boolean;
      getLimit: (feature: string) => number | null;
      upgradePath: { nextTier: string; newFeatures: string[] } | null;
    };
  }
}