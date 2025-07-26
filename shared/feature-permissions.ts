// Centralized Feature Permissions Matrix for Platinum Scout
// This file defines what features are available for each subscription tier

export type SubscriptionTier = 'freemium' | 'pro' | 'enterprise';
export type UserRole = 'scout' | 'agent' | 'coach' | 'club_director' | 'admin' | 'super_admin';

export interface FeaturePermissions {
  // Core Features
  viewPlayers: boolean;
  addPlayers: boolean;
  editPlayers: boolean;
  deletePlayers: boolean;
  exportPlayers: boolean;
  
  // Player Analytics
  playerComparison: boolean;
  advancedAnalytics: boolean;
  aiReports: boolean;
  pdfExport: boolean;
  
  // Video Features
  videoUpload: boolean;
  videoAnalysis: boolean;
  videoTagging: boolean;
  videoHighlights: boolean;
  
  // Team Management
  teamSheets: boolean;
  multiUserAccess: boolean;
  bulkOperations: boolean;
  
  // Organization Features
  organizationManagement: boolean;
  
  // Scouting Features
  scoutingReports: boolean;
  advancedSearch: boolean;
  
  // Premium Features
  webhooks: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
  conciergeService: boolean;
  
  // Admin Features
  userManagement: boolean;
  systemSettings: boolean;
  platformAnalytics: boolean;
  contentModeration: boolean;
  
  // Usage Limits
  maxPlayers: number;
  maxVideos: number;
  maxReports: number;
  maxApiCalls: number;
  credits: number;
}

// Permission matrix for each subscription tier
export const TIER_PERMISSIONS: Record<SubscriptionTier, FeaturePermissions> = {
  freemium: {
    // Core Features
    viewPlayers: true,
    addPlayers: false,
    editPlayers: false,
    deletePlayers: false,
    exportPlayers: false,
    
    // Player Analytics
    playerComparison: true,
    advancedAnalytics: false,
    aiReports: false,
    pdfExport: false,
    
    // Video Features
    videoUpload: false,
    videoAnalysis: false,
    videoTagging: false,
    videoHighlights: false,
    
    // Team Management
    teamSheets: false,
    multiUserAccess: false,
    bulkOperations: false,
    
    // Organization Features
    organizationManagement: false,
    
    // Scouting Features
    scoutingReports: false,
    advancedSearch: false,
    
    // Premium Features
    webhooks: false,
    customBranding: false,
    whiteLabel: false,
    conciergeService: false,
    
    // Admin Features
    userManagement: false,
    systemSettings: false,
    platformAnalytics: false,
    contentModeration: false,
    
    // Usage Limits
    maxPlayers: 50,
    maxVideos: 1,
    maxReports: 1,
    maxApiCalls: 0,
    credits: 5
  },
  
  pro: {
    // Core Features
    viewPlayers: true,
    addPlayers: true,
    editPlayers: true,
    deletePlayers: false,
    exportPlayers: true,
    
    // Player Analytics
    playerComparison: true,
    advancedAnalytics: true,
    aiReports: true,
    pdfExport: true,
    
    // Video Features
    videoUpload: true,
    videoAnalysis: true,
    videoTagging: true,
    videoHighlights: true,
    
    // Team Management
    teamSheets: false,
    multiUserAccess: false,
    bulkOperations: false,
    
    // Organization Features
    organizationManagement: false,
    
    // Scouting Features
    scoutingReports: true,
    advancedSearch: true,
    
    // Premium Features
    webhooks: false,
    customBranding: false,
    whiteLabel: false,
    conciergeService: false,
    
    // Admin Features
    userManagement: false,
    systemSettings: false,
    platformAnalytics: false,
    contentModeration: false,
    
    // Usage Limits
    maxPlayers: 500,
    maxVideos: 5,
    maxReports: 5,
    maxApiCalls: 0,
    credits: 50
  },
  
  enterprise: {
    // Core Features
    viewPlayers: true,
    addPlayers: true,
    editPlayers: true,
    deletePlayers: true,
    exportPlayers: true,
    
    // Player Analytics
    playerComparison: true,
    advancedAnalytics: true,
    aiReports: true,
    pdfExport: true,
    
    // Video Features
    videoUpload: true,
    videoAnalysis: true,
    videoTagging: true,
    videoHighlights: true,
    
    // Team Management
    teamSheets: true,
    multiUserAccess: true,
    bulkOperations: true,
    
    // Organization Features
    organizationManagement: true,
    
    // Scouting Features
    scoutingReports: true,
    advancedSearch: true,
    
    // Premium Features
    webhooks: true,
    customBranding: true,
    whiteLabel: true,
    conciergeService: false,
    
    // Admin Features
    userManagement: false,
    systemSettings: false,
    platformAnalytics: true,
    contentModeration: false,
    
    // Usage Limits
    maxPlayers: 1000,
    maxVideos: 10,
    maxReports: 10,
    maxApiCalls: 0,
    credits: 100
  }
};

// Special permissions for admin roles (override tier permissions)
export const ADMIN_PERMISSIONS: Record<UserRole, Partial<FeaturePermissions>> = {
  scout: {}, // No special permissions
  agent: {}, // No special permissions
  coach: {}, // No special permissions
  club_director: {}, // No special permissions
  admin: {
    // Admin users should have access to all core player operations
    addPlayers: true,
    editPlayers: true,
    deletePlayers: true,
    exportPlayers: true,
    
    // Video features for admin users
    videoUpload: true,
    videoAnalysis: true,
    videoTagging: true,
    videoHighlights: true,
    
    // Analytics features for admin users
    advancedAnalytics: true,
    aiReports: true,
    pdfExport: true,
    playerComparison: true,
    
    // Team management features
    teamSheets: true,
    multiUserAccess: true,
    scoutingReports: true,
    advancedSearch: true,
    skillChallenges: true,
    
    // Admin-specific features
    userManagement: true,
    systemSettings: true,
    platformAnalytics: true,
    contentModeration: true,
    bulkOperations: true,
    organizationManagement: true,
    
    // API access
    apiAccess: true,
    
    // Inherit all other permissions from tier
  },
  super_admin: {
    // All permissions unlocked
    viewPlayers: true,
    addPlayers: true,
    editPlayers: true,
    deletePlayers: true,
    exportPlayers: true,
    playerComparison: true,
    advancedAnalytics: true,
    aiReports: true,
    pdfExport: true,
    videoUpload: true,
    videoAnalysis: true,
    videoTagging: true,
    videoHighlights: true,
    teamSheets: true,
    multiUserAccess: true,
    bulkOperations: true,
    organizationManagement: true,
    scoutingReports: true,
    advancedSearch: true,
    apiAccess: true,
    webhooks: true,
    customBranding: true,
    whiteLabel: true,
    conciergeService: true,
    userManagement: true,
    systemSettings: true,
    platformAnalytics: true,
    contentModeration: true,
    maxPlayers: -1,
    maxVideos: -1,
    maxReports: -1,
    maxApiCalls: -1,
    credits: 9999
  }
};

// Upgrade messages for each tier
export const UPGRADE_MESSAGES: Record<SubscriptionTier, {
  nextTier: SubscriptionTier | null;
  price: string;
  features: string[];
}> = {
  freemium: {
    nextTier: 'pro',
    price: '$79/month',
    features: [
      'Full AI analytics suite',
      'Video upload & tagging (5/month)',
      'PDF report exports (5/month)',
      'Player comparisons (10/month)',
      'Advanced search filters',
      'Priority email support'
    ]
  },
  pro: {
    nextTier: 'enterprise',
    price: '$299/month',
    features: [
      'Video uploads & analysis (10/month)',
      'PDF report exports (10/month)',
      'Player comparisons (20/month)',
      'Bulk upload capabilities',
      'Team management dashboard',
      'Multi-user access (up to 5 users)',
      'Custom branding & white-label',
      'Dedicated account manager'
    ]
  },
  enterprise: {
    nextTier: null,
    price: '',
    features: []
  }
};

// Helper function to get effective permissions for a user
export function getUserPermissions(tier: SubscriptionTier, role: UserRole): FeaturePermissions {
  const basePermissions = TIER_PERMISSIONS[tier];
  const adminOverrides = ADMIN_PERMISSIONS[role] || {};
  
  return {
    ...basePermissions,
    ...adminOverrides
  };
}

// Helper function to check if user has permission for a feature
export function hasPermission(
  tier: SubscriptionTier, 
  role: UserRole, 
  feature: keyof FeaturePermissions
): boolean {
  // Super Admin Bypass: Super admins and admins get full access to all features
  if (role === 'super_admin' || role === 'admin') {
    return true;
  }
  
  const permissions = getUserPermissions(tier, role);
  return permissions[feature] as boolean;
}

// Helper function to get upgrade message for a feature
export function getUpgradeMessage(
  currentTier: SubscriptionTier, 
  feature: keyof FeaturePermissions
): string | null {
  const upgradeInfo = UPGRADE_MESSAGES[currentTier];
  if (!upgradeInfo || !upgradeInfo.nextTier) return null;
  
  const featureNames: Record<keyof FeaturePermissions, string> = {
    viewPlayers: 'view players',
    addPlayers: 'add players',
    editPlayers: 'edit players',
    deletePlayers: 'delete players',
    exportPlayers: 'export player data',
    playerComparison: 'compare players',
    advancedAnalytics: 'advanced analytics',
    aiReports: 'AI-powered reports',
    pdfExport: 'PDF export',
    videoUpload: 'video upload',
    videoAnalysis: 'video analysis',
    videoTagging: 'video tagging',
    videoHighlights: 'video highlights',
    teamSheets: 'team sheet management',
    multiUserAccess: 'multi-user access',
    bulkOperations: 'bulk operations',
    organizationManagement: 'organization management',
    scoutingReports: 'scouting reports',
    advancedSearch: 'advanced search',
    skillChallenges: 'skills challenges',
    apiAccess: 'API access',
    webhooks: 'webhooks',
    customBranding: 'custom branding',
    whiteLabel: 'white-label options',
    conciergeService: 'concierge service',
    userManagement: 'user management',
    systemSettings: 'system settings',
    platformAnalytics: 'platform analytics',
    contentModeration: 'content moderation',
    maxPlayers: 'higher player limits',
    maxVideos: 'higher video limits',
    maxReports: 'higher report limits',
    maxApiCalls: 'higher API limits',
    credits: 'more credits'
  };
  
  const featureName = featureNames[feature];
  const tierName = upgradeInfo.nextTier === 'scoutpro' ? 'ScoutPro' : 
                   upgradeInfo.nextTier === 'agent_club' ? 'Agent/Club' :
                   upgradeInfo.nextTier === 'enterprise' ? 'Enterprise' :
                   upgradeInfo.nextTier === 'platinum' ? 'Platinum' : '';
  
  return `Upgrade to ${tierName} (${upgradeInfo.price}) to access ${featureName} and unlock powerful analytics!`;
}