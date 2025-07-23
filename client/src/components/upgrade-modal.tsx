import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Crown, Zap, Shield, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { UPGRADE_MESSAGES, type SubscriptionTier } from '../../../shared/feature-permissions';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  restrictedFeature: string;
  message: string;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentTier, 
  restrictedFeature, 
  message 
}: UpgradeModalProps) {
  const [, setLocation] = useLocation();
  const upgradeInfo = UPGRADE_MESSAGES[currentTier];
  
  const handleUpgrade = () => {
    setLocation('/pricing');
    onClose();
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'scoutpro': return <Zap className="w-5 h-5" />;
      case 'agent_club': return <Shield className="w-5 h-5" />;
      case 'enterprise': return <Crown className="w-5 h-5" />;
      case 'platinum': return <Star className="w-5 h-5" />;
      default: return <Check className="w-5 h-5" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'scoutpro': return 'bg-blue-500';
      case 'agent_club': return 'bg-green-500';
      case 'enterprise': return 'bg-purple-500';
      case 'platinum': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Defensive check for missing upgrade info
  if (!upgradeInfo) {
    console.warn(`Missing upgrade info for tier: ${currentTier}`);
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Upgrade Information Unavailable
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We're unable to display upgrade options for your current subscription tier. 
              Please contact support for assistance.
            </p>
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if there's a next tier to upgrade to
  if (!upgradeInfo.nextTier) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTierIcon(upgradeInfo.nextTier)}
            Upgrade Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4">
              <Badge 
                variant="secondary" 
                className={`${getTierColor(upgradeInfo.nextTier)} text-white px-3 py-1`}
              >
                {upgradeInfo.nextTier === 'scoutpro' && 'ScoutPro'}
                {upgradeInfo.nextTier === 'agent_club' && 'Agent/Club'}
                {upgradeInfo.nextTier === 'enterprise' && 'Enterprise'}
                {upgradeInfo.nextTier === 'platinum' && 'Platinum'}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {message}
            </p>
            
            <div className="text-2xl font-bold text-primary mb-2">
              {upgradeInfo.price}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Unlock these features:</h4>
            <ul className="space-y-1">
              {upgradeInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Not Now
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}