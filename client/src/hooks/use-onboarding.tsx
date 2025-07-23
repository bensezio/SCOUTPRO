import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: string;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingFlow {
  currentStep: number;
  steps: OnboardingStep[];
  isComplete: boolean;
  progress: number;
}

const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Platinum Scout',
    description: 'Get familiar with your new football scouting platform',
    completed: false
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your organization and scouting preferences',
    completed: false
  },
  {
    id: 'database',
    title: 'Explore Player Database',
    description: 'Discover 50,000+ players from underrepresented regions',
    completed: false
  },
  {
    id: 'search',
    title: 'Try Player Search',
    description: 'Search for players by position, nationality, or skills',
    completed: false
  },
  {
    id: 'analytics',
    title: 'AI Analytics Demo',
    description: 'See our AI-powered player analysis in action',
    completed: false,
    optional: true
  },
  {
    id: 'video',
    title: 'Upload First Video',
    description: 'Experience our video analysis capabilities',
    completed: false,
    optional: true
  }
];

export function useOnboarding() {
  const { user } = useAuth();
  const [onboardingFlow, setOnboardingFlow] = useState<OnboardingFlow | null>(null);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

  // Initialize onboarding for new users
  useEffect(() => {
    if (user) {
      const storageKey = `onboarding_${user.id}`;
      const savedFlow = localStorage.getItem(storageKey);
      
      if (savedFlow) {
        try {
          const parsedFlow = JSON.parse(savedFlow);
          setOnboardingFlow(parsedFlow);
          
          // Show onboarding if not complete
          if (!parsedFlow.isComplete) {
            setIsOnboardingVisible(true);
          }
        } catch (error) {
          console.error('Error parsing saved onboarding:', error);
          initializeOnboarding();
        }
      } else {
        // New user - initialize onboarding
        initializeOnboarding();
      }
    }
  }, [user]);

  const initializeOnboarding = () => {
    const newFlow: OnboardingFlow = {
      currentStep: 0,
      steps: [...DEFAULT_ONBOARDING_STEPS],
      isComplete: false,
      progress: 0
    };
    
    setOnboardingFlow(newFlow);
    setIsOnboardingVisible(true);
    saveOnboardingFlow(newFlow);
  };

  const saveOnboardingFlow = (flow: OnboardingFlow) => {
    if (user) {
      const storageKey = `onboarding_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(flow));
    }
  };

  const completeStep = (stepId: string) => {
    if (!onboardingFlow) return;

    const updatedSteps = onboardingFlow.steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );

    const completedCount = updatedSteps.filter(step => step.completed).length;
    const totalSteps = updatedSteps.length;
    const progress = (completedCount / totalSteps) * 100;
    
    // Move to next incomplete step
    const nextStepIndex = updatedSteps.findIndex(step => !step.completed);
    const currentStep = nextStepIndex >= 0 ? nextStepIndex : totalSteps - 1;
    
    const isComplete = completedCount === totalSteps || 
      updatedSteps.filter(step => !step.optional && !step.completed).length === 0;

    const updatedFlow: OnboardingFlow = {
      ...onboardingFlow,
      steps: updatedSteps,
      currentStep,
      progress,
      isComplete
    };

    setOnboardingFlow(updatedFlow);
    saveOnboardingFlow(updatedFlow);

    // Hide onboarding if complete
    if (isComplete) {
      setIsOnboardingVisible(false);
    }
  };

  const skipStep = (stepId: string) => {
    completeStep(stepId); // For now, skipping is same as completing
  };

  const goToStep = (stepIndex: number) => {
    if (!onboardingFlow || stepIndex < 0 || stepIndex >= onboardingFlow.steps.length) return;

    const updatedFlow = {
      ...onboardingFlow,
      currentStep: stepIndex
    };

    setOnboardingFlow(updatedFlow);
    saveOnboardingFlow(updatedFlow);
  };

  const nextStep = () => {
    if (!onboardingFlow) return;
    
    const nextIndex = Math.min(onboardingFlow.currentStep + 1, onboardingFlow.steps.length - 1);
    goToStep(nextIndex);
  };

  const previousStep = () => {
    if (!onboardingFlow) return;
    
    const prevIndex = Math.max(onboardingFlow.currentStep - 1, 0);
    goToStep(prevIndex);
  };

  const dismissOnboarding = () => {
    setIsOnboardingVisible(false);
    
    if (onboardingFlow) {
      const updatedFlow = {
        ...onboardingFlow,
        isComplete: true
      };
      setOnboardingFlow(updatedFlow);
      saveOnboardingFlow(updatedFlow);
    }
  };

  const resetOnboarding = () => {
    if (user) {
      const storageKey = `onboarding_${user.id}`;
      localStorage.removeItem(storageKey);
      initializeOnboarding();
    }
  };

  const getCurrentStep = () => {
    if (!onboardingFlow) return null;
    return onboardingFlow.steps[onboardingFlow.currentStep];
  };

  const isStepComplete = (stepId: string) => {
    if (!onboardingFlow) return false;
    const step = onboardingFlow.steps.find(s => s.id === stepId);
    return step?.completed || false;
  };

  const shouldShowOnboarding = () => {
    return isOnboardingVisible && onboardingFlow && !onboardingFlow.isComplete;
  };

  // Auto-trigger onboarding based on user actions
  const triggerOnboardingStep = (stepId: string, context?: any) => {
    if (!onboardingFlow) return;

    const step = onboardingFlow.steps.find(s => s.id === stepId);
    if (step && !step.completed) {
      const stepIndex = onboardingFlow.steps.findIndex(s => s.id === stepId);
      if (stepIndex >= 0) {
        goToStep(stepIndex);
        setIsOnboardingVisible(true);
      }
    }
  };

  return {
    onboardingFlow,
    isOnboardingVisible,
    completeStep,
    skipStep,
    goToStep,
    nextStep,
    previousStep,
    dismissOnboarding,
    resetOnboarding,
    getCurrentStep,
    isStepComplete,
    shouldShowOnboarding,
    triggerOnboardingStep,
    setIsOnboardingVisible
  };
}