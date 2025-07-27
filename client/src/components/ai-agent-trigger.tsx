import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import AIAgentChat from './ai-agent-chat';

interface AIAgentTriggerProps {
  context?: {
    page?: string;
    sessionData?: any;
  };
  showWelcome?: boolean;
  initialMessage?: string;
}

export default function AIAgentTrigger({ 
  context, 
  showWelcome = false, 
  initialMessage 
}: AIAgentTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Show welcome animation for new users
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setHasNewMessage(true);
        setShowPulse(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Hide pulse after interaction
  useEffect(() => {
    if (isOpen) {
      setShowPulse(false);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setShowPulse(false);
    setHasNewMessage(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="relative">
            {/* Pulse animation */}
            {showPulse && (
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
            )}
            
            {/* New message indicator */}
            {hasNewMessage && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs p-0 z-10">
                <Sparkles className="w-3 h-3" />
              </Badge>
            )}
            
            <Button
              onClick={handleOpen}
              className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Bot className="w-6 h-6 text-white" />
            </Button>
          </div>
          
          {/* Welcome tooltip */}
          {showWelcome && hasNewMessage && (
            <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-64 border">
              <div className="flex items-start gap-2">
                <Bot className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">👋 Welcome to Platinum Scout!</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    I'm Scout AI, your intelligent assistant. Click to get started!
                  </p>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute bottom-0 right-6 transform translate-y-1">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat interface */}
      <AIAgentChat
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={isMinimized}
        initialMessage={initialMessage}
        context={context}
      />
    </>
  );
}