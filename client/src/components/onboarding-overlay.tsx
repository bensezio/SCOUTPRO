import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useAuth } from '@/contexts/auth-context';
import { Link } from 'wouter';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Database,
  Search,
  Brain,
  Video,
  Play,
  SkipForward,
  Star
} from 'lucide-react';

const stepIcons = {
  welcome: Star,
  profile: Users,
  database: Database,
  search: Search,
  analytics: Brain,
  video: Video
};

export default function OnboardingOverlay() {
  const {
    onboardingFlow,
    shouldShowOnboarding,
    getCurrentStep,
    completeStep,
    skipStep,
    nextStep,
    previousStep,
    dismissOnboarding
  } = useOnboarding();
  
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(shouldShowOnboarding());
  }, [shouldShowOnboarding]);

  if (!isVisible || !onboardingFlow) return null;

  const currentStep = getCurrentStep();
  if (!currentStep) return null;

  const StepIcon = stepIcons[currentStep.id as keyof typeof stepIcons] || Star;

  const handleComplete = () => {
    completeStep(currentStep.id);
  };

  const handleSkip = () => {
    skipStep(currentStep.id);
  };

  const getStepContent = (step: typeof currentStep) => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Welcome to Platinum Scout! I'm your AI assistant, Scout AI. I'll help you get started with our football scouting platform.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What you'll learn:</h4>
              <ul className="text-sm space-y-1">
                <li>• Navigate our global player database</li>
                <li>• Use AI-powered search and analytics</li>
                <li>• Upload and analyze video content</li>
                <li>• Generate comprehensive reports</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleComplete} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Tour
              </Button>
              <Button variant="outline" onClick={dismissOnboarding}>
                Skip All
              </Button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Complete your profile to get personalized recommendations and access role-specific features.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Your current role: {user?.role}</h4>
              <p className="text-sm">
                {user?.role === 'scout' && 'Access player database, generate reports, and discover talent.'}
                {user?.role === 'agent' && 'Manage player portfolios, track client progress, and facilitate transfers.'}
                {user?.role === 'club' && 'Evaluate potential signings, compare players, and analyze performance data.'}
                {user?.role === 'admin' && 'Full platform access including user management and analytics.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/profile">
                <Button onClick={handleComplete} className="flex-1">
                  Complete Profile
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Explore our database of 50,000+ players from underrepresented regions worldwide.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <span className="font-medium">Players:</span> 50,000+
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <span className="font-medium">Regions:</span> Global
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <span className="font-medium">Positions:</span> All
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <span className="font-medium">Analytics:</span> AI-Powered
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/player-database">
                <Button onClick={handleComplete} className="flex-1">
                  Explore Database
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Try our intelligent search system. Search by position, nationality, age, or performance metrics.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Try searching for:</h4>
              <ul className="text-sm space-y-1">
                <li>• "Midfielders from Ghana"</li>
                <li>• "Young strikers under 21"</li>
                <li>• "Felix Afena-Gyan"</li>
                <li>• "Defenders with high passing accuracy"</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Link href="/player-database?demo=search">
                <Button onClick={handleComplete} className="flex-1">
                  Try Search
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Experience our AI-powered analytics including player comparisons, performance predictions, and market value analysis.
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Brain className="w-4 h-4 text-blue-600" />
                <span>AI Performance Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <Users className="w-4 h-4 text-green-600" />
                <span>Player Comparison Tools</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Market Value Predictions</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/ai-reports">
                <Button onClick={handleComplete} className="flex-1">
                  Try AI Analytics
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Upload player videos for AI-powered analysis including event detection, performance metrics, and highlight generation.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Video Analysis Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• Automatic event detection (goals, passes, tackles)</li>
                <li>• Performance heat maps</li>
                <li>• Highlight clip generation</li>
                <li>• Player positioning analysis</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Link href="/video-analysis">
                <Button onClick={handleComplete} className="flex-1">
                  Upload Video
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
            <div className="flex gap-2">
              <Button onClick={handleComplete} className="flex-1">
                Continue
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentStep.title}
                  {currentStep.optional && (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Step {onboardingFlow.currentStep + 1} of {onboardingFlow.steps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissOnboarding}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={onboardingFlow.progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(onboardingFlow.progress)}% complete
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {getStepContent(currentStep)}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={previousStep}
              disabled={onboardingFlow.currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {onboardingFlow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    index === onboardingFlow.currentStep
                      ? 'bg-blue-500'
                      : step.completed
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              onClick={nextStep}
              disabled={onboardingFlow.currentStep === onboardingFlow.steps.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}