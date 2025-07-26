import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Target, Zap, Users, BarChart3, FileText, Video } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
  action?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  tourType: 'scout' | 'agent' | 'admin' | 'general';
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  scout: [
    {
      id: 'welcome',
      title: 'Welcome to PlatinumEdge Analytics',
      description: 'The most comprehensive football scouting platform for discovering African talent. Let\'s explore your scout dashboard.',
      target: 'dashboard-header',
      position: 'bottom',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'player-database',
      title: 'Player Database',
      description: 'Access thousands of African player profiles with detailed statistics, performance data, and career information.',
      target: 'sidebar-players',
      position: 'right',
      icon: <Users className="w-5 h-5" />,
      action: {
        text: 'Explore Players',
        href: '/players'
      }
    },
    {
      id: 'player-comparison',
      title: 'Player Comparison',
      description: 'Compare up to 4 players side-by-side with AI-powered insights and detailed attribute analysis.',
      target: 'sidebar-comparison',
      position: 'right',
      icon: <BarChart3 className="w-5 h-5" />,
      action: {
        text: 'Try Comparison',
        href: '/comparison'
      }
    },
    {
      id: 'scouting-reports',
      title: 'Scouting Reports',
      description: 'Create professional scouting reports with standardized ratings and export them as PDF documents.',
      target: 'sidebar-reports',
      position: 'right',
      icon: <FileText className="w-5 h-5" />,
      action: {
        text: 'View Reports',
        href: '/reports'
      }
    },
    {
      id: 'ai-analytics',
      title: 'AI Analytics',
      description: 'Use advanced AI to analyze players, predict market values, and get intelligent recommendations.',
      target: 'sidebar-analytics',
      position: 'right',
      icon: <Zap className="w-5 h-5" />,
      action: {
        text: 'Explore AI',
        href: '/analytics'
      }
    },
    {
      id: 'video-analysis',
      title: 'Video Analysis',
      description: 'Upload and analyze player videos with computer vision technology for detailed performance insights.',
      target: 'sidebar-video',
      position: 'right',
      icon: <Video className="w-5 h-5" />,
      action: {
        text: 'Upload Video',
        href: '/video-analysis'
      }
    }
  ],
  agent: [
    {
      id: 'welcome',
      title: 'Welcome Football Agent',
      description: 'Manage your player portfolio and discover new talent with advanced analytics and market insights.',
      target: 'dashboard-header',
      position: 'bottom',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'player-portfolio',
      title: 'Player Portfolio',
      description: 'Manage your represented players, track their performance, and identify transfer opportunities.',
      target: 'sidebar-players',
      position: 'right',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Use AI-powered market value predictions and transfer recommendations to guide your decisions.',
      target: 'sidebar-analytics',
      position: 'right',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'organizations',
      title: 'Club Network',
      description: 'Connect with football clubs, academies, and other agents to facilitate transfers and partnerships.',
      target: 'sidebar-organizations',
      position: 'right',
      icon: <Users className="w-5 h-5" />
    }
  ],
  admin: [
    {
      id: 'welcome',
      title: 'Administrator Dashboard',
      description: 'Manage users, monitor system health, and oversee platform operations with comprehensive admin tools.',
      target: 'dashboard-header',
      position: 'bottom',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Create, edit, and manage user accounts. Handle verification requests and user permissions.',
      target: 'admin-users',
      position: 'right',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'system-monitoring',
      title: 'System Monitoring',
      description: 'Monitor platform performance, security logs, and system health metrics.',
      target: 'admin-analytics',
      position: 'right',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'platform-settings',
      title: 'Platform Settings',
      description: 'Configure system settings, manage subscriptions, and control feature availability.',
      target: 'admin-settings',
      position: 'right',
      icon: <Zap className="w-5 h-5" />
    }
  ],
  general: [
    {
      id: 'welcome',
      title: 'Welcome to PlatinumEdge',
      description: 'Your comprehensive football analytics platform. Let\'s get you started with the basics.',
      target: 'dashboard-header',
      position: 'bottom',
      icon: <Target className="w-5 h-5" />
    }
  ]
};

export function OnboardingTour({ isOpen, onClose, tourType }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tourStarted, setTourStarted] = useState(false);
  const { user } = useAuth();
  
  const steps = TOUR_STEPS[tourType] || TOUR_STEPS.general;
  const step = steps[currentStep];

  useEffect(() => {
    if (isOpen && !tourStarted) {
      setTourStarted(true);
      setCurrentStep(0);
    }
  }, [isOpen, tourStarted]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    // Mark tour as completed for this user
    localStorage.setItem(`tour-completed-${tourType}`, 'true');
    onClose();
  };

  const skipTour = () => {
    localStorage.setItem(`tour-skipped-${tourType}`, 'true');
    onClose();
  };

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      {/* Tour overlay */}
      <div className="absolute inset-0" onClick={skipTour} />
      
      {/* Tour card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60">
        <Card className="w-96 max-w-[90vw] shadow-2xl border-2 border-blue-200">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {step.icon}
                </div>
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={skipTour}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Action button */}
              {step.action && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (step.action?.href) {
                        window.location.href = step.action.href;
                      } else if (step.action?.onClick) {
                        step.action.onClick();
                      }
                    }}
                  >
                    {step.action.text}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep 
                          ? 'bg-blue-600' 
                          : index < currentStep 
                            ? 'bg-blue-300' 
                            : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant={currentStep === steps.length - 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={handleNext}
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome message for first step */}
      {currentStep === 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-60">
          <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="text-center">
                <h2 className="text-lg font-bold mb-1">
                  Welcome, {user?.displayName || user?.username}!
                </h2>
                <p className="text-blue-100 text-sm">
                  Let's explore PlatinumEdge Analytics together
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Hook for managing tour state
export function useTour() {
  const { user } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);
  
  const startTour = (type: 'scout' | 'agent' | 'admin' | 'general') => {
    setTourOpen(true);
  };

  const shouldShowTour = (type: string) => {
    if (!user) return false;
    
    const completed = localStorage.getItem(`tour-completed-${type}`);
    const skipped = localStorage.getItem(`tour-skipped-${type}`);
    
    return !completed && !skipped;
  };

  return {
    tourOpen,
    setTourOpen,
    startTour,
    shouldShowTour
  };
}