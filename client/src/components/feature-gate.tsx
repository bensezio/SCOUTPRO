import { useState, ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { UpgradeModal } from './upgrade-modal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';
import { type FeaturePermissions } from '../../../shared/feature-permissions';

interface FeatureGateProps {
  feature: keyof FeaturePermissions;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
  className?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradeButton = true,
  className 
}: FeatureGateProps) {
  const { canAccess, tier } = usePermissions();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const access = canAccess(feature);
  
  if (access.allowed) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgradeButton) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`opacity-50 cursor-not-allowed ${className}`}
                onClick={() => setShowUpgradeModal(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Upgrade Required
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{access.upgradeMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentTier={tier}
          restrictedFeature={feature}
          message={access.upgradeMessage || 'Upgrade to access this feature'}
        />
      </>
    );
  }
  
  return null;
}

// Higher-order component for gating entire sections
export function withFeatureGate<T extends object>(
  Component: React.ComponentType<T>,
  feature: keyof FeaturePermissions,
  fallback?: ReactNode
) {
  return function FeatureGatedComponent(props: T) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Component for inline feature restrictions
export function FeatureRestriction({ 
  feature, 
  children, 
  onClick 
}: { 
  feature: keyof FeaturePermissions; 
  children: ReactNode;
  onClick?: () => void;
}) {
  const { canAccess, tier } = usePermissions();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const access = canAccess(feature);
  
  const handleClick = () => {
    if (access.allowed) {
      onClick?.();
    } else {
      setShowUpgradeModal(true);
    }
  };
  
  return (
    <>
      <div
        onClick={handleClick}
        className={`${!access.allowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {children}
        {!access.allowed && (
          <Lock className="w-4 h-4 ml-2 inline-block text-muted-foreground" />
        )}
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={tier}
        restrictedFeature={feature}
        message={access.upgradeMessage || 'Upgrade to access this feature'}
      />
    </>
  );
}