import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import {
  Bot,
  User,
  Send,
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  HelpCircle,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface SuggestedAction {
  label: string;
  action: string;
  data?: any;
}

interface AgentResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
  needsHumanEscalation?: boolean;
  conversationId: string;
  contextUpdates?: any;
}

interface AIAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  initialMessage?: string;
  context?: {
    page?: string;
    sessionData?: any;
  };
}

export default function AIAgentChat({ 
  isOpen, 
  onClose, 
  onMinimize, 
  isMinimized, 
  initialMessage,
  context 
}: AIAgentChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Send initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: initialMessage || `👋 Hi! I'm Scout AI, your intelligent assistant for Platinum Scout. I can help you with:

• **Player searches** - "Show me midfielders from Ghana"
• **Analytics questions** - "Explain this performance chart"
• **Platform guidance** - "How do I upload a video?"
• **Getting started** - "I'm new, what should I do first?"

What would you like to explore today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, initialMessage, messages.length]);

  // Send message to AI agent
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { message: string; conversationId?: string; context?: any }) =>
      apiRequest<AgentResponse>('/api/ai-agent/chat', {
        method: 'POST',
        body: messageData
      }),
    onSuccess: (response) => {
      setIsTyping(false);
      
      // Add AI response to messages
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          suggestedActions: response.suggestedActions,
          needsEscalation: response.needsHumanEscalation
        }
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setConversationId(response.conversationId);
      
      // Show escalation toast if needed
      if (response.needsHumanEscalation) {
        toast({
          title: "Human Support Needed",
          description: "This inquiry requires human assistance. A support agent will be notified.",
          variant: "default"
        });
      }
    },
    onError: (error) => {
      setIsTyping(false);
      console.error('AI Agent error:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having technical difficulties right now. Please try again in a moment or contact our support team if the issue persists.",
        timestamp: new Date(),
        metadata: { needsEscalation: true }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Send to AI agent
    sendMessageMutation.mutate({
      message: inputMessage,
      conversationId: conversationId || undefined,
      context: {
        page: context?.page || window.location.pathname,
        userId: user?.id,
        userRole: user?.role,
        sessionData: context?.sessionData
      }
    });

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    switch (action.action) {
      case 'navigate':
        if (action.data?.path) {
          window.location.href = action.data.path;
        }
        break;
      case 'search':
        // Trigger search with parameters
        setInputMessage(`Search for ${JSON.stringify(action.data)}`);
        break;
      case 'escalate':
        toast({
          title: "Connecting to Support",
          description: "A human agent will assist you shortly.",
        });
        break;
      default:
        // Send action as message
        setInputMessage(action.label);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <Card className="h-full border-2 border-blue-200 shadow-2xl">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm">Scout AI</CardTitle>
                <p className="text-xs text-gray-500">
                  {isTyping ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[420px] px-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg' 
                          : 'bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-tl-lg'
                      } p-3`}>
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                          )}
                          {message.role === 'user' && (
                            <User className="w-4 h-4 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Suggested Actions */}
                        {message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium opacity-80">Suggested actions:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.metadata.suggestedActions.map((action: SuggestedAction, actionIndex: number) => (
                                <Button
                                  key={actionIndex}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestedAction(action)}
                                  className="text-xs h-7"
                                >
                                  {action.label}
                                  {action.action === 'navigate' && <ExternalLink className="w-3 h-3 ml-1" />}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Escalation indicator */}
                        {message.metadata?.needsEscalation && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Human support has been notified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-tl-lg p-3">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>

            <Separator />

            {/* Input */}
            <div className="p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask me anything about Platinum Scout..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMessage("How do I search for players?")}
                  className="text-xs h-6"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Help
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMessage("Show me recent players")}
                  className="text-xs h-6"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Quick Start
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}