import type { Response, NextFunction } from "express";
import { hasPermission, type FeaturePermissions } from "../../shared/feature-permissions.js";
import type { AuthenticatedRequest } from "../auth-routes.js";

// Middleware to check feature permissions
export function requireFeature(feature: keyof FeaturePermissions) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        feature: feature 
      });
    }

    const userTier = req.user.subscriptionTier || 'freemium';
    const userRole = req.user.role || 'scout';

    const hasAccess = hasPermission(userTier as any, userRole as any, feature);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Feature not available on your current plan',
        feature: feature,
        currentTier: userTier,
        upgradeRequired: true,
        message: `Upgrade your subscription to access ${feature}`
      });
    }

    next();
  };
}

// Middleware to check usage limits
export function checkUsageLimit(
  limitType: 'maxPlayers' | 'maxVideos' | 'maxReports' | 'maxApiCalls',
  currentCount: number
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const userTier = req.user.subscriptionTier || 'freemium';
    const userRole = req.user.role || 'scout';

    // Get user permissions to check limits
    const { getUserPermissions } = require("../../shared/feature-permissions.js");
    const permissions = getUserPermissions(userTier as any, userRole as any);
    
    const limit = permissions[limitType];
    
    // -1 means unlimited
    if (limit !== -1 && currentCount >= limit) {
      return res.status(403).json({
        error: `${limitType} limit exceeded`,
        currentCount,
        limit,
        upgradeRequired: true,
        message: `You've reached your ${limitType} limit. Upgrade to increase your limits.`
      });
    }

    next();
  };
}

// Helper to track analytics events for gated features
export async function trackFeatureAccess(
  req: AuthenticatedRequest,
  feature: keyof FeaturePermissions,
  allowed: boolean,
  storage: any
) {
  try {
    await storage.createAnalyticsEvent({
      userId: req.user?.id,
      eventType: 'feature_access_attempt',
      eventData: {
        feature,
        allowed,
        userTier: req.user?.subscriptionTier,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      },
      sessionId: req.sessionId || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      ipAddress: req.ip
    });
  } catch (error) {
    console.error('Failed to track feature access:', error);
  }
}