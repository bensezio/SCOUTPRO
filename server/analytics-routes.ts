import { Express, Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from './auth-routes';
import { requireFeature, FEATURES } from './feature-gate-middleware';
import { storage } from './storage';
import { z } from 'zod';

// Analytics event schema
const analyticsEventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.any()),
  sessionId: z.string().optional(),
  userAgent: z.string().optional()
});

// Revenue metrics interface
interface RevenueMetrics {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  totalActiveSubscriptions: number;
  churnRate: number;
  conversionRate: number;
}

// Conversion metrics interface
interface ConversionMetrics {
  freemiumToScoutPro: number;
  scoutProToAgentClub: number;
  agentClubToEnterprise: number;
  enterpriseToPlatin: number;
  overallConversionRate: number;
  timeToConversion: number;
}

// Feature usage metrics interface
interface FeatureUsageMetrics {
  teamSheetUsage: number;
  videoAnalyticsUsage: number;
  aiReportsGenerated: number;
  playerComparisons: number;
  pdfExports: number;
  bulkOperations: number;
}

export function registerAnalyticsRoutes(app: Express) {
  
  // Track analytics events
  app.post('/api/analytics/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventData = analyticsEventSchema.parse(req.body);
      
      // Store analytics event
      await storage.createAnalyticsEvent({
        userId: req.user!.id,
        eventType: eventData.eventType,
        eventData: eventData.eventData,
        sessionId: eventData.sessionId,
        userAgent: eventData.userAgent || req.headers['user-agent'],
        ipAddress: req.ip,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      res.status(500).json({ error: 'Failed to track event' });
    }
  });

  // Get revenue metrics (Admin only)
  app.get('/api/analytics/revenue', authenticateToken, requireFeature(FEATURES.ADMIN_DASHBOARD), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics: RevenueMetrics = {
        monthlyRecurringRevenue: await calculateMRR(),
        annualRecurringRevenue: await calculateARR(),
        averageRevenuePerUser: await calculateARPU(),
        totalActiveSubscriptions: await getActiveSubscriptions(),
        churnRate: await calculateChurnRate(),
        conversionRate: await calculateConversionRate()
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      res.status(500).json({ error: 'Failed to fetch revenue metrics' });
    }
  });

  // Get conversion metrics (Admin only)
  app.get('/api/analytics/conversions', authenticateToken, requireFeature(FEATURES.ADMIN_DASHBOARD), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics: ConversionMetrics = {
        freemiumToScoutPro: await getConversionRate('freemium', 'scoutpro'),
        scoutProToAgentClub: await getConversionRate('scoutpro', 'agent_club'),
        agentClubToEnterprise: await getConversionRate('agent_club', 'enterprise'),
        enterpriseToPlatin: await getConversionRate('enterprise', 'platinum'),
        overallConversionRate: await calculateConversionRate(),
        timeToConversion: await getAverageTimeToConversion()
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching conversion metrics:', error);
      res.status(500).json({ error: 'Failed to fetch conversion metrics' });
    }
  });

  // Get feature usage metrics (Admin only)
  app.get('/api/analytics/feature-usage', authenticateToken, requireFeature(FEATURES.ADMIN_DASHBOARD), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics: FeatureUsageMetrics = {
        teamSheetUsage: await getFeatureUsage('team_sheets'),
        videoAnalyticsUsage: await getFeatureUsage('video_analytics'),
        aiReportsGenerated: await getFeatureUsage('ai_reports'),
        playerComparisons: await getFeatureUsage('player_comparison'),
        pdfExports: await getFeatureUsage('pdf_export'),
        bulkOperations: await getFeatureUsage('bulk_operations')
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching feature usage metrics:', error);
      res.status(500).json({ error: 'Failed to fetch feature usage metrics' });
    }
  });

  // Get tier-specific analytics
  app.get('/api/analytics/tiers', authenticateToken, requireFeature(FEATURES.ADMIN_DASHBOARD), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tierAnalytics = await getTierAnalytics();
      res.json(tierAnalytics);
    } catch (error) {
      console.error('Error fetching tier analytics:', error);
      res.status(500).json({ error: 'Failed to fetch tier analytics' });
    }
  });

  // Get user engagement metrics
  app.get('/api/analytics/engagement', authenticateToken, requireFeature(FEATURES.ADMIN_DASHBOARD), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const engagement = await getUserEngagementMetrics();
      res.json(engagement);
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      res.status(500).json({ error: 'Failed to fetch engagement metrics' });
    }
  });

  // Get real-time dashboard data
  app.get('/api/analytics/dashboard', authenticateToken, requireFeature(FEATURES.ADMIN_DASHBOARD), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboard = {
        revenue: await calculateMRR(),
        activeUsers: await getActiveUsers(),
        newSignups: await getNewSignups(),
        conversionRate: await calculateConversionRate(),
        topFeatures: await getTopFeatures(),
        tierDistribution: await getTierDistribution()
      };
      
      res.json(dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });
}

// Helper functions for analytics calculations
async function calculateMRR(): Promise<number> {
  const users = await storage.getAllUsers();
  const tierPricing = {
    freemium: 0,
    scoutpro: 99,
    agent_club: 299,
    enterprise: 999,
    platinum: 499
  };
  
  return users.reduce((total, user) => {
    const tierPrice = tierPricing[user.subscriptionTier as keyof typeof tierPricing] || 0;
    return total + tierPrice;
  }, 0);
}

async function calculateARR(): Promise<number> {
  const mrr = await calculateMRR();
  return mrr * 12;
}

async function calculateARPU(): Promise<number> {
  const totalRevenue = await calculateMRR();
  const totalUsers = await storage.getUserCount();
  return totalUsers > 0 ? totalRevenue / totalUsers : 0;
}

async function getActiveSubscriptions(): Promise<number> {
  const users = await storage.getAllUsers();
  return users.filter(user => user.subscriptionTier !== 'freemium').length;
}

async function calculateChurnRate(): Promise<number> {
  // This would require subscription history tracking
  // For now, return a placeholder
  return 0.05; // 5% monthly churn
}

async function calculateConversionRate(): Promise<number> {
  const totalUsers = await storage.getUserCount();
  const paidUsers = await getActiveSubscriptions();
  return totalUsers > 0 ? paidUsers / totalUsers : 0;
}

async function getConversionRate(fromTier: string, toTier: string): Promise<number> {
  // This would require tier change tracking
  // For now, return placeholder data
  return 0.15; // 15% conversion rate between tiers
}

async function getAverageTimeToConversion(): Promise<number> {
  // This would require timestamp tracking
  // For now, return placeholder
  return 14; // 14 days average
}

async function getFeatureUsage(feature: string): Promise<number> {
  // This would require feature usage tracking
  // For now, return placeholder data
  const usageMap = {
    team_sheets: 450,
    video_analytics: 1200,
    ai_reports: 890,
    player_comparison: 2100,
    pdf_export: 340,
    bulk_operations: 180
  };
  return usageMap[feature as keyof typeof usageMap] || 0;
}

async function getTierAnalytics() {
  const users = await storage.getAllUsers();
  const tierCounts = users.reduce((acc, user) => {
    acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    distribution: tierCounts,
    totalUsers: users.length,
    paidUsers: users.filter(u => u.subscriptionTier !== 'freemium').length
  };
}

async function getUserEngagementMetrics() {
  // This would require session tracking
  return {
    averageSessionDuration: 1800, // 30 minutes
    dailyActiveUsers: 1250,
    weeklyActiveUsers: 3400,
    monthlyActiveUsers: 8900,
    featureAdoption: {
      team_sheets: 0.34,
      video_analytics: 0.78,
      ai_reports: 0.56,
      player_comparison: 0.89
    }
  };
}

async function getActiveUsers(): Promise<number> {
  const users = await storage.getAllUsers();
  return users.length;
}

async function getNewSignups(): Promise<number> {
  // This would require date-based user tracking
  return 125; // Daily new signups
}

async function getTopFeatures() {
  return [
    { name: 'Player Comparison', usage: 2100 },
    { name: 'Video Analytics', usage: 1200 },
    { name: 'AI Reports', usage: 890 },
    { name: 'Team Sheets', usage: 450 },
    { name: 'PDF Export', usage: 340 }
  ];
}

async function getTierDistribution() {
  const analytics = await getTierAnalytics();
  return analytics.distribution;
}