import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Zap, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { SUBSCRIPTION_TIERS, SubscriptionManager } from '@/../../shared/subscription-tiers';

interface UsageData {
  creditsUsed: number;
  creditsTotal: number;
  videoUploads: number;
  videoUploadsLimit: number;
  reportDownloads: number;
  reportDownloadsLimit: number;
  resetDate: Date;
}

interface SubscriptionStatusProps {
  usageData?: UsageData;
  compact?: boolean;
}

export function SubscriptionStatus({ usageData, compact = false }: SubscriptionStatusProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  const userTier = user.subscriptionTier || 'freemium';
  const tier = SUBSCRIPTION_TIERS[userTier];
  const limits = tier?.limits;

  // Mock usage data if not provided
  const usage: UsageData = usageData || {
    creditsUsed: 3,
    creditsTotal: limits?.monthlyCredits || 5,
    videoUploads: 0,
    videoUploadsLimit: limits?.videoUploads || 0,
    reportDownloads: 2,
    reportDownloadsLimit: limits?.reportDownloads || 0,
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  };

  const getTierIcon = () => {
    switch (userTier) {
      case 'enterprise':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'academy':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'scoutpro':
        return <Zap className="w-5 h-5 text-blue-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTierColor = () => {
    switch (userTier) {
      case 'enterprise':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'academy':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'scoutpro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getUsagePercentage = (used: number, total: number) => {
    if (total === -1) return 0; // Unlimited
    return Math.min((used / total) * 100, 100);
  };

  const isNearLimit = (used: number, total: number) => {
    if (total === -1) return false;
    return (used / total) >= 0.8;
  };

  const formatResetDate = () => {
    return usage.resetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (compact) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTierIcon()}
              <div>
                <h4 className="font-semibold text-sm">{tier?.name}</h4>
                <p className="text-xs text-gray-500">
                  {usage.creditsUsed}/{usage.creditsTotal === -1 ? '∞' : usage.creditsTotal} credits
                </p>
              </div>
            </div>
            {userTier === 'freemium' && (
              <Button size="sm" variant="outline">
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`text-white ${getTierColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTierIcon()}
            <div>
              <CardTitle className="text-lg font-bold">{tier?.name} Plan</CardTitle>
              <p className="text-sm opacity-90">
                {userTier === 'freemium' 
                  ? 'Free tier with basic features' 
                  : `$${tier?.price}/month - Premium features included`
                }
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Usage Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Monthly Usage</h4>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Resets {formatResetDate()}
            </div>
          </div>

          {/* Credits Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credits</span>
              <span className="text-sm text-gray-600">
                {usage.creditsUsed}/{usage.creditsTotal === -1 ? '∞' : usage.creditsTotal}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(usage.creditsUsed, usage.creditsTotal)} 
              className="h-2"
            />
            {isNearLimit(usage.creditsUsed, usage.creditsTotal) && (
              <div className="flex items-center gap-2 text-orange-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                Approaching monthly limit
              </div>
            )}
          </div>

          {/* Video Uploads */}
          {limits?.videoUploads !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Video Uploads</span>
                <span className="text-sm text-gray-600">
                  {usage.videoUploads}/{usage.videoUploadsLimit === -1 ? '∞' : usage.videoUploadsLimit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(usage.videoUploads, usage.videoUploadsLimit)} 
                className="h-2"
              />
            </div>
          )}

          {/* Report Downloads */}
          {limits?.reportDownloads !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PDF Reports</span>
                <span className="text-sm text-gray-600">
                  {usage.reportDownloads}/{usage.reportDownloadsLimit === -1 ? '∞' : usage.reportDownloadsLimit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(usage.reportDownloads, usage.reportDownloadsLimit)} 
                className="h-2"
              />
            </div>
          )}
        </div>

        {/* Features Available */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Available Features</h4>
          <div className="grid grid-cols-1 gap-2">
            {tier?.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
            {tier?.features.length > 4 && (
              <div className="text-sm text-gray-500">
                +{tier.features.length - 4} more features
              </div>
            )}
          </div>
        </div>

        {/* Upgrade CTA */}
        {userTier === 'freemium' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-blue-900">Unlock Premium Features</h5>
                <p className="text-sm text-blue-700">
                  Get AI analytics, video uploads, and unlimited comparisons
                </p>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Manage Subscription */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm">
              View Billing
            </Button>
            <Button variant="outline" size="sm">
              Change Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}