import { useUser } from '@/hooks/use-user';
import { 
  getUserPermissions, 
  hasPermission, 
  getUpgradeMessage,
  type FeaturePermissions,
  type SubscriptionTier,
  type UserRole
} from '../../../shared/feature-permissions';

export function usePermissions() {
  const { user } = useUser();
  
  const tier = (user?.subscriptionTier || 'freemium') as SubscriptionTier;
  const role = (user?.role || 'scout') as UserRole;
  
  // Super Admin Bypass: Super admins get all features
  if (role === 'super_admin' || role === 'admin') {
    // Admin users get full access - no logging needed in production
  }
  
  const permissions = getUserPermissions(tier, role);
  
  const checkPermission = (feature: keyof FeaturePermissions): boolean => {
    return hasPermission(tier, role, feature);
  };
  
  const getUpgradePrompt = (feature: keyof FeaturePermissions): string | null => {
    if (checkPermission(feature)) return null;
    return getUpgradeMessage(tier, feature);
  };
  
  const canAccess = (feature: keyof FeaturePermissions): {
    allowed: boolean;
    upgradeMessage?: string;
  } => {
    const allowed = checkPermission(feature);
    return {
      allowed,
      upgradeMessage: allowed ? undefined : getUpgradePrompt(feature) || undefined
    };
  };
  
  return {
    tier,
    role,
    permissions,
    checkPermission,
    hasFeature: checkPermission, // Alias for backwards compatibility
    getUpgradePrompt,
    canAccess,
    user
  };
}