import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Football mascot SVG component
const FootballMascot = ({ animation = 'idle' }: { animation?: 'idle' | 'kick' | 'point' | 'wave' }) => {
  const animationClasses = {
    idle: 'animate-bounce',
    kick: 'animate-pulse',
    point: 'animate-bounce',
    wave: 'animate-pulse'
  };

  return (
    <div className={`w-16 h-16 ${animationClasses[animation]} transition-all duration-300`}>
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Football mascot body */}
        <circle cx="32" cy="32" r="28" fill="#2563eb" stroke="#1e40af" strokeWidth="2"/>
        
        {/* Football pattern */}
        <path d="M20 25 L32 20 L44 25 L44 35 L32 40 L20 35 Z" fill="white" stroke="#1e40af"/>
        <path d="M24 28 L40 28 M24 32 L40 32 M24 36 L40 36" stroke="#1e40af" strokeWidth="1"/>
        
        {/* Eyes */}
        <circle cx="26" cy="26" r="3" fill="white"/>
        <circle cx="38" cy="26" r="3" fill="white"/>
        <circle cx="26" cy="26" r="1.5" fill="black"/>
        <circle cx="38" cy="26" r="1.5" fill="black"/>
        
        {/* Smile */}
        <path d="M24 36 Q32 42 40 36" stroke="white" strokeWidth="2" fill="none"/>
        
        {/* Arms based on animation */}
        {animation === 'point' && (
          <path d="M8 32 L20 28" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
        )}
        {animation === 'wave' && (
          <path d="M44 28 L52 20" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
        )}
        {animation === 'kick' && (
          <path d="M32 44 L36 52" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
        )}
      </svg>
    </div>
  );
};

interface HelpBubbleProps {
  id: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'click' | 'hover' | 'auto';
  animation?: 'idle' | 'kick' | 'point' | 'wave';
  children?: React.ReactNode;
}

interface HelpStep {
  title: string;
  content: string;
  animation?: 'idle' | 'kick' | 'point' | 'wave';
}

const ContextualHelp: React.FC<HelpBubbleProps> = ({
  id,
  title,
  content,
  position = 'bottom',
  trigger = 'click',
  animation = 'idle',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Multi-step help content
  const steps: HelpStep[] = Array.isArray(content) ? content : [{ title, content, animation }];

  useEffect(() => {
    // Check if help has been seen before
    const seen = localStorage.getItem(`help-seen-${id}`);
    setHasBeenSeen(!!seen);

    // Auto-trigger on first visit for certain help bubbles
    if (trigger === 'auto' && !seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [id, trigger]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasBeenSeen) {
      localStorage.setItem(`help-seen-${id}`, 'true');
      setHasBeenSeen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="relative inline-block">
      {/* Help trigger button */}
      <Button
        variant="ghost"
        size="sm"
        className={`
          w-8 h-8 p-0 rounded-full transition-all duration-300 
          ${!hasBeenSeen ? 'animate-pulse bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600'}
        `}
        onClick={handleOpen}
        onMouseEnter={trigger === 'hover' ? handleOpen : undefined}
        onMouseLeave={trigger === 'hover' ? handleClose : undefined}
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      {/* Help bubble */}
      {isOpen && (
        <div className={`
          absolute z-50 ${positionClasses[position]}
          w-80 max-w-[90vw] min-w-[300px]
        `}>
          <Card className="shadow-xl border-2 border-blue-200 bg-white">
            <CardContent className="p-4">
              {/* Header with mascot */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FootballMascot animation={currentStepData.animation || animation} />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {currentStepData.title}
                    </h3>
                    {steps.length > 1 && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Step {currentStep + 1} of {steps.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentStepData.content}
                </p>
              </div>

              {/* Navigation for multi-step help */}
              {steps.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentStep ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleNext}
                    className="flex items-center gap-1"
                  >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                    {currentStep !== steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                  </Button>
                </div>
              )}

              {/* Single step action */}
              {steps.length === 1 && (
                <div className="flex justify-end">
                  <Button variant="default" size="sm" onClick={handleClose}>
                    Got it!
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optional children (content that the help relates to) */}
      {children}
    </div>
  );
};

// Pre-defined help content for common sections
export const HelpContent = {
  dashboard: {
    title: "Dashboard Overview",
    content: "Welcome to your football analytics dashboard! Here you can track players, analyze performance, and manage your scouting activities. The mascot will guide you through key features.",
    animation: 'wave' as const
  },
  
  playerDatabase: {
    title: "Player Database",
    content: [
      {
        title: "Search & Filter",
        content: "Use our advanced search to find players by position, nationality, age, and performance metrics. Filter by leagues, clubs, or specific attributes.",
        animation: 'point' as const
      },
      {
        title: "Player Profiles",
        content: "Click on any player to view detailed profiles with stats, videos, and AI-powered analysis. Export professional scouting reports.",
        animation: 'kick' as const
      },
      {
        title: "Comparison Tools",
        content: "Select multiple players to compare their attributes side-by-side. Our AI provides insights on strengths and compatibility.",
        animation: 'wave' as const
      }
    ]
  },

  aiAnalytics: {
    title: "AI-Powered Analytics",
    content: [
      {
        title: "Performance Analysis",
        content: "Our AI analyzes player performance using advanced algorithms. Get market value predictions, injury risk assessments, and transfer recommendations.",
        animation: 'kick' as const
      },
      {
        title: "Visual Insights",
        content: "Interactive charts and radar graphs help you understand player capabilities. Compare technical, physical, and mental attributes.",
        animation: 'point' as const
      }
    ]
  },

  videoAnalysis: {
    title: "Video Analysis",
    content: "Upload player videos for AI-powered analysis. Our system identifies key moments, tracks performance, and generates highlight reels automatically.",
    animation: 'kick' as const
  },

  reports: {
    title: "Professional Reports",
    content: [
      {
        title: "Generate Reports",
        content: "Create detailed scouting reports with our professional templates. Include player stats, analysis, and recommendations.",
        animation: 'point' as const
      },
      {
        title: "Export & Share",
        content: "Export reports as PDF with your branding. Share with clubs, agents, or clients with secure links.",
        animation: 'wave' as const
      }
    ]
  },

  subscription: {
    title: "Subscription Benefits",
    content: [
      {
        title: "Feature Access",
        content: "Your current subscription tier determines available features. Upgrade for advanced AI analytics, unlimited reports, and premium tools.",
        animation: 'wave' as const
      },
      {
        title: "Usage Tracking",
        content: "Monitor your monthly usage limits and feature access. Get notified when approaching limits or when new features are available.",
        animation: 'point' as const
      }
    ]
  }
};

export default ContextualHelp;