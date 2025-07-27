import OpenAI from 'openai';
import { Request, Response } from 'express';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for AI Agent
interface AgentContext {
  userId?: number;
  userRole?: string;
  conversationId: string;
  sessionData?: any;
}

interface AgentResponse {
  message: string;
  suggestedActions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
  needsHumanEscalation?: boolean;
  conversationId: string;
  contextUpdates?: any;
}

interface ConversationHistory {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  userId?: number;
  startedAt: Date;
  lastActivity: Date;
  status: 'active' | 'completed' | 'escalated';
  summary?: string;
}

// In-memory conversation storage (in production, use Redis or database)
const conversations = new Map<string, ConversationHistory>();

// AI Agent knowledge base
const AGENT_SYSTEM_PROMPT = `You are Scout AI, the intelligent assistant for Platinum Scout - an AI-powered football data solutions platform.

PLATFORM KNOWLEDGE:
- Platinum Scout helps scouts, agents, and clubs discover global football talent
- Focus on players from underrepresented regions (Africa, South America, Middle East, Asia)
- Features: Player database, video analysis, AI reports, scouting tools, team management
- Subscription tiers: Freemium (limited), Pro ($79/month), Enterprise ($299/month)

YOUR CAPABILITIES:
1. ONBOARDING: Guide new users through platform features and setup
2. PLAYER QUERIES: Answer questions about players, statistics, matches using live database
3. ANALYTICS HELP: Explain reports, comparisons, and insights
4. TECHNICAL SUPPORT: Help with platform navigation and troubleshooting
5. ESCALATION: When queries require human intervention, clearly indicate this

RESPONSE GUIDELINES:
- Be professional, knowledgeable, and football-focused
- Provide specific, actionable guidance
- Use football terminology correctly
- Suggest relevant platform features
- Ask clarifying questions when needed
- Always prioritize data privacy and security

ESCALATION TRIGGERS:
- Payment/billing issues
- Account access problems requiring admin intervention
- Complex technical bugs
- Contract negotiations or business partnerships
- Compliance or legal questions

When you need to access live database information, respond with: "I'll fetch that information from our database for you." and include the specific query needed.`;

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  context: z.object({
    page: z.string().optional(),
    userId: z.number().optional(),
    userRole: z.string().optional(),
    sessionData: z.any().optional()
  }).optional()
});

export function setupAIAgentRoutes(app: any) {
  // Start or continue conversation with AI Agent
  app.post('/api/ai-agent/chat', async (req: Request, res: Response) => {
    try {
      const { message, conversationId, context } = chatMessageSchema.parse(req.body);
      
      // Get or create conversation
      let conversation: ConversationHistory;
      const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (conversationId && conversations.has(conversationId)) {
        conversation = conversations.get(conversationId)!;
        conversation.lastActivity = new Date();
      } else {
        conversation = {
          id: convId,
          messages: [],
          userId: context?.userId,
          startedAt: new Date(),
          lastActivity: new Date(),
          status: 'active'
        };
        conversations.set(convId, conversation);
      }

      // Add user message to conversation
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: { context }
      });

      // Determine if this needs database access
      const needsDbAccess = await checkIfNeedsDatabase(message);
      let dbResults = null;

      if (needsDbAccess.needed) {
        dbResults = await handleDatabaseQuery(needsDbAccess.queryType, needsDbAccess.parameters);
      }

      // Generate AI response
      const aiResponse = await generateAIResponse(conversation, context, dbResults);

      // Add AI response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        metadata: { 
          suggestedActions: aiResponse.suggestedActions,
          needsEscalation: aiResponse.needsHumanEscalation 
        }
      });

      // Update conversation status if escalation needed
      if (aiResponse.needsHumanEscalation) {
        conversation.status = 'escalated';
      }

      // Log for analysis
      await logConversationMetrics(conversation, message, aiResponse);

      res.json({
        ...aiResponse,
        conversationId: convId
      });

    } catch (error) {
      console.error('AI Agent chat error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request format', 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: 'Sorry, I\'m having technical difficulties. Please try again or contact support.',
        needsHumanEscalation: true
      });
    }
  });

  // Get conversation history
  app.get('/api/ai-agent/conversations/:conversationId', (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const conversation = conversations.get(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  // Get user's conversation list
  app.get('/api/ai-agent/conversations', (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userConversations = Array.from(conversations.values())
        .filter(conv => conv.userId === userId)
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
        .slice(0, 20); // Last 20 conversations

      res.json(userConversations);
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Trigger onboarding flow
  app.post('/api/ai-agent/onboarding/:step', async (req: Request, res: Response) => {
    try {
      const { step } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const onboardingResponse = await generateOnboardingResponse(step, { userId, userRole });

      res.json(onboardingResponse);
    } catch (error) {
      console.error('Onboarding flow error:', error);
      res.status(500).json({ message: 'Failed to generate onboarding guidance' });
    }
  });

  // Log support issue for review
  app.post('/api/ai-agent/log-issue', async (req: Request, res: Response) => {
    try {
      const { issue, conversationId, category } = req.body;
      const userId = req.user?.id;

      // Log to monitoring system (in production, this would go to your monitoring/alerting system)
      console.log('AI Agent Issue Logged:', {
        userId,
        conversationId,
        category,
        issue,
        timestamp: new Date().toISOString()
      });

      // In production: send to Slack, create Jira ticket, etc.

      res.json({ 
        message: 'Issue logged successfully. Our team will review and improve the AI agent.',
        ticketId: `SCOUT-${Date.now()}`
      });
    } catch (error) {
      console.error('Error logging issue:', error);
      res.status(500).json({ message: 'Failed to log issue' });
    }
  });
}

// Helper functions
async function checkIfNeedsDatabase(message: string): Promise<{
  needed: boolean;
  queryType?: 'player' | 'match' | 'stats' | 'club';
  parameters?: any;
}> {
  const lowerMessage = message.toLowerCase();
  
  // Player queries
  if (lowerMessage.includes('player') || lowerMessage.includes('show me') || 
      lowerMessage.includes('felix') || lowerMessage.includes('stats') ||
      lowerMessage.includes('matches') || lowerMessage.includes('goals')) {
    
    // Extract player name if mentioned
    const playerMatch = message.match(/(\b[A-Z][a-z]+ [A-Z][a-z]+\b)/);
    
    return {
      needed: true,
      queryType: 'player',
      parameters: {
        playerName: playerMatch ? playerMatch[1] : null,
        query: message
      }
    };
  }

  // Match queries
  if (lowerMessage.includes('match') || lowerMessage.includes('game') || 
      lowerMessage.includes('vs') || lowerMessage.includes('against')) {
    return {
      needed: true,
      queryType: 'match',
      parameters: { query: message }
    };
  }

  return { needed: false };
}

async function handleDatabaseQuery(queryType: string, parameters: any): Promise<any> {
  try {
    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import('./storage.js');

    switch (queryType) {
      case 'player':
        if (parameters.playerName) {
          // Search for specific player
          const players = await storage.getPlayers({});
          const foundPlayer = players.find(p => 
            p.name.toLowerCase().includes(parameters.playerName.toLowerCase())
          );
          
          if (foundPlayer) {
            return {
              type: 'player_profile',
              data: foundPlayer,
              message: `Found player: ${foundPlayer.name}`
            };
          }
        }
        
        // Return recent players or search results
        const recentPlayers = await storage.getPlayers({ limit: 5 });
        return {
          type: 'player_list',
          data: recentPlayers,
          message: 'Here are some recent players in our database'
        };

      case 'match':
        // Get recent matches (mock for now - would integrate with actual match data)
        return {
          type: 'match_list',
          data: [
            { id: 1, homeTeam: 'Ghana', awayTeam: 'Nigeria', date: '2024-01-15', score: '2-1' },
            { id: 2, homeTeam: 'Senegal', awayTeam: 'Morocco', date: '2024-01-10', score: '1-0' }
          ],
          message: 'Here are recent matches from our database'
        };

      default:
        return null;
    }
  } catch (error) {
    console.error('Database query error:', error);
    return {
      type: 'error',
      message: 'I had trouble accessing the database. Please try again.'
    };
  }
}

async function generateAIResponse(
  conversation: ConversationHistory, 
  context: any, 
  dbResults: any
): Promise<AgentResponse> {
  try {
    // Build context for AI
    const messages = [
      { role: 'system' as const, content: AGENT_SYSTEM_PROMPT },
      ...conversation.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Add database results if available
    if (dbResults) {
      messages.push({
        role: 'system' as const,
        content: `Database query results: ${JSON.stringify(dbResults, null, 2)}`
      });
    }

    // Add context information
    if (context) {
      messages.push({
        role: 'system' as const,
        content: `Current context: User is on page "${context.page || 'unknown'}", role: "${context.userRole || 'unknown'}"`
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiMessage = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    // Determine suggested actions based on content
    const suggestedActions = generateSuggestedActions(aiMessage, context, dbResults);
    
    // Check if escalation is needed
    const needsEscalation = checkForEscalation(aiMessage, conversation);

    return {
      message: aiMessage,
      suggestedActions,
      needsHumanEscalation: needsEscalation,
      conversationId: conversation.id
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      message: 'I\'m experiencing technical difficulties with my AI capabilities. Let me connect you with a human agent who can help.',
      needsHumanEscalation: true,
      conversationId: conversation.id
    };
  }
}

function generateSuggestedActions(aiMessage: string, context: any, dbResults: any): Array<{label: string; action: string; data?: any}> {
  const actions = [];

  // Player-related actions
  if (dbResults?.type === 'player_profile') {
    actions.push(
      { label: 'View Full Profile', action: 'navigate', data: { path: `/players/${dbResults.data.id}` } },
      { label: 'Generate AI Report', action: 'generate_report', data: { playerId: dbResults.data.id } },
      { label: 'Add to Comparison', action: 'add_comparison', data: { playerId: dbResults.data.id } }
    );
  }

  // Onboarding actions
  if (aiMessage.toLowerCase().includes('welcome') || aiMessage.toLowerCase().includes('getting started')) {
    actions.push(
      { label: 'Take Platform Tour', action: 'start_tour', data: { role: context?.userRole } },
      { label: 'Upload First Video', action: 'navigate', data: { path: '/video-analysis' } },
      { label: 'Browse Players', action: 'navigate', data: { path: '/player-database' } }
    );
  }

  // Support actions
  if (aiMessage.toLowerCase().includes('help') || aiMessage.toLowerCase().includes('support')) {
    actions.push(
      { label: 'Contact Support', action: 'escalate', data: { type: 'human_support' } },
      { label: 'View Documentation', action: 'navigate', data: { path: '/help' } }
    );
  }

  return actions;
}

function checkForEscalation(aiMessage: string, conversation: ConversationHistory): boolean {
  const escalationKeywords = [
    'billing', 'payment', 'refund', 'cancel subscription',
    'technical error', 'bug', 'not working', 'broken',
    'contact admin', 'human agent', 'speak to someone'
  ];

  const messageContent = aiMessage.toLowerCase();
  const hasEscalationKeyword = escalationKeywords.some(keyword => messageContent.includes(keyword));
  
  // Escalate if conversation is too long without resolution
  const isLongConversation = conversation.messages.length > 20;
  
  return hasEscalationKeyword || isLongConversation;
}

async function generateOnboardingResponse(step: string, userContext: any): Promise<AgentResponse> {
  const onboardingSteps = {
    welcome: {
      message: `Welcome to Platinum Scout! I'm Scout AI, your personal assistant. I'll help you discover global football talent and maximize your scouting potential. What would you like to explore first?`,
      suggestedActions: [
        { label: 'Search Players', action: 'navigate', data: { path: '/player-database' } },
        { label: 'Upload Video', action: 'navigate', data: { path: '/video-analysis' } },
        { label: 'View Dashboard', action: 'navigate', data: { path: '/dashboard' } }
      ]
    },
    database: {
      message: `Our player database contains 50,000+ profiles from underrepresented regions worldwide. You can search by position, nationality, age, or performance metrics. Try searching for a specific position like "midfielder" or nationality like "Ghana".`,
      suggestedActions: [
        { label: 'Search Midfielders', action: 'search', data: { position: 'Central Midfielder' } },
        { label: 'Browse African Players', action: 'search', data: { region: 'Africa' } },
        { label: 'Advanced Filters', action: 'navigate', data: { path: '/player-database?advanced=true' } }
      ]
    },
    analytics: {
      message: `Our AI analytics provide deep insights into player performance, market value predictions, and tactical fit analysis. Upload a video or select a player to see our AI in action.`,
      suggestedActions: [
        { label: 'Try Player Comparison', action: 'navigate', data: { path: '/comparison' } },
        { label: 'Generate AI Report', action: 'navigate', data: { path: '/ai-reports' } },
        { label: 'Upload Video', action: 'navigate', data: { path: '/video-analysis' } }
      ]
    }
  };

  const stepData = onboardingSteps[step as keyof typeof onboardingSteps] || onboardingSteps.welcome;

  return {
    message: stepData.message,
    suggestedActions: stepData.suggestedActions,
    conversationId: `onboarding_${step}_${Date.now()}`
  };
}

async function logConversationMetrics(conversation: ConversationHistory, userMessage: string, aiResponse: AgentResponse) {
  // Log metrics for improving AI agent
  const metrics = {
    conversationId: conversation.id,
    messageCount: conversation.messages.length,
    userMessage: userMessage.substring(0, 100), // First 100 chars for privacy
    responseLength: aiResponse.message.length,
    hadSuggestedActions: (aiResponse.suggestedActions?.length || 0) > 0,
    needsEscalation: aiResponse.needsHumanEscalation,
    timestamp: new Date().toISOString()
  };

  // In production: send to analytics service
  console.log('AI Agent Metrics:', metrics);
}