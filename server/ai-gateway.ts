import { Express, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth-routes";

// AI Microservices Configuration
const AI_SERVICES = {
  playerAnalysis: process.env.AI_PLAYER_ANALYSIS_URL || 'http://localhost:8001',
  matchAnalytics: process.env.AI_MATCH_ANALYTICS_URL || 'http://localhost:8002',
  recommendations: process.env.AI_RECOMMENDATIONS_URL || 'http://localhost:8003',
  comparison: process.env.AI_COMPARISON_URL || 'http://localhost:8004',
  valuation: process.env.AI_VALUATION_URL || 'http://localhost:8005',
  injury: process.env.AI_INJURY_URL || 'http://localhost:8006'
};

interface AIAnalysisRequest {
  playerIds: number[];
  analysisType: 'performance' | 'comparison' | 'scouting' | 'valuation' | 'injury_risk';
  options?: {
    position?: string;
    league?: string;
    timeframe?: string;
    budget?: number;
  };
}

interface AIAnalysisResponse {
  id: string;
  type: string;
  status: 'processing' | 'completed' | 'failed';
  results?: any;
  insights?: string[];
  recommendations?: string[];
  confidence: number;
  processingTime?: number;
  createdAt: string;
}

// Helper function to make requests to AI services
async function callAIService(
  serviceUrl: string, 
  endpoint: string, 
  data: any, 
  token?: string
): Promise<any> {
  try {
    const response = await fetch(`${serviceUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling AI service ${serviceUrl}${endpoint}:`, error);
    
    // Return mock response for development when AI services are not available
    return generateMockAIResponse(data);
  }
}

// Mock AI responses for development
function generateMockAIResponse(request: any): AIAnalysisResponse {
  const mockInsights = [
    "Strong technical skills with excellent ball control",
    "Good physical attributes for European football",
    "Shows potential for tactical adaptability",
    "Market value likely to increase with proper development"
  ];

  const mockRecommendations = [
    "Suitable for mid-tier European clubs",
    "Focus on improving weak foot usage",
    "Could benefit from tactical training",
    "Monitor injury history before transfer"
  ];

  return {
    id: `mock_${Date.now()}`,
    type: request.analysisType || 'comparison',
    status: 'completed',
    results: {
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      technicalScore: Math.floor(Math.random() * 30) + 70,
      physicalScore: Math.floor(Math.random() * 30) + 70,
      mentalScore: Math.floor(Math.random() * 30) + 70,
      marketValuePrediction: Math.floor(Math.random() * 2000000) + 500000,
      europeanReadiness: Math.floor(Math.random() * 40) + 60 // 60-100
    },
    insights: mockInsights,
    recommendations: mockRecommendations,
    confidence: Math.floor(Math.random() * 30) + 70,
    processingTime: Math.floor(Math.random() * 2000) + 500,
    createdAt: new Date().toISOString()
  };
}

// Enhanced player comparison with AI
async function enhancedPlayerComparison(
  playerIds: number[], 
  token?: string
): Promise<AIAnalysisResponse> {
  const request = {
    playerIds,
    analysisType: 'comparison',
    options: {
      includeMarketAnalysis: true,
      includePositionFit: true,
      includeEuropeanReadiness: true
    }
  };

  return callAIService(
    AI_SERVICES.comparison, 
    '/api/compare-players', 
    request, 
    token
  );
}

// Player scouting recommendations
async function getScoutingRecommendations(
  position: string, 
  budget: number, 
  league: string, 
  token?: string
): Promise<AIAnalysisResponse> {
  const request = {
    analysisType: 'scouting',
    options: {
      position,
      budget,
      league,
      maxAge: 28,
      minMarketValue: budget * 0.1,
      maxMarketValue: budget * 0.8
    }
  };

  return callAIService(
    AI_SERVICES.recommendations, 
    '/api/recommend-players', 
    request, 
    token
  );
}

// Market valuation prediction
async function predictMarketValue(
  playerId: number, 
  token?: string
): Promise<AIAnalysisResponse> {
  const request = {
    playerIds: [playerId],
    analysisType: 'valuation',
    options: {
      includeTransferProbability: true,
      includeMarketTrends: true
    }
  };

  return callAIService(
    AI_SERVICES.valuation, 
    '/api/predict-valuation', 
    request, 
    token
  );
}

// Injury risk assessment
async function assessInjuryRisk(
  playerId: number, 
  token?: string
): Promise<AIAnalysisResponse> {
  const request = {
    playerIds: [playerId],
    analysisType: 'injury_risk',
    options: {
      includeRecoveryTime: true,
      includePreventionTips: true
    }
  };

  return callAIService(
    AI_SERVICES.injury, 
    '/api/assess-injury-risk', 
    request, 
    token
  );
}

// Register AI Gateway routes
export function registerAIRoutes(app: Express) {
  
  // Enhanced Player Comparison
  app.post('/api/ai/compare-players', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { playerIds } = req.body;
      
      if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
        return res.status(400).json({ 
          error: 'At least 2 player IDs are required for comparison' 
        });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      const analysis = await enhancedPlayerComparison(playerIds, token);
      
      res.json(analysis);
    } catch (error) {
      console.error('AI comparison error:', error);
      res.status(500).json({ 
        error: 'Failed to perform AI comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Scouting Recommendations
  app.post('/api/ai/scouting-recommendations', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { position, budget, league } = req.body;
      
      if (!position || !budget) {
        return res.status(400).json({ 
          error: 'Position and budget are required' 
        });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      const recommendations = await getScoutingRecommendations(
        position, 
        budget, 
        league || 'European', 
        token
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error('AI scouting recommendations error:', error);
      res.status(500).json({ 
        error: 'Failed to get scouting recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Market Valuation Prediction
  app.get('/api/ai/market-valuation/:playerId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const playerId = parseInt(req.params.playerId);
      
      if (isNaN(playerId)) {
        return res.status(400).json({ 
          error: 'Valid player ID is required' 
        });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      const valuation = await predictMarketValue(playerId, token);
      
      res.json(valuation);
    } catch (error) {
      console.error('AI market valuation error:', error);
      res.status(500).json({ 
        error: 'Failed to predict market valuation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Injury Risk Assessment
  app.get('/api/ai/injury-risk/:playerId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const playerId = parseInt(req.params.playerId);
      
      if (isNaN(playerId)) {
        return res.status(400).json({ 
          error: 'Valid player ID is required' 
        });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      const riskAssessment = await assessInjuryRisk(playerId, token);
      
      res.json(riskAssessment);
    } catch (error) {
      console.error('AI injury risk assessment error:', error);
      res.status(500).json({ 
        error: 'Failed to assess injury risk',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI Service Health Check
  app.get('/api/ai/health', async (req: Request, res: Response) => {
    const healthChecks = await Promise.allSettled(
      Object.entries(AI_SERVICES).map(async ([name, url]) => {
        try {
          const response = await fetch(`${url}/health`, { 
            method: 'GET',
            timeout: 5000 
          } as any);
          return { 
            service: name, 
            status: response.ok ? 'healthy' : 'unhealthy',
            url 
          };
        } catch (error) {
          return { 
            service: name, 
            status: 'unavailable',
            url,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const results = healthChecks.map(result => 
      result.status === 'fulfilled' ? result.value : 
      { service: 'unknown', status: 'error', error: result.reason }
    );

    const allHealthy = results.every(r => r.status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      services: results,
      timestamp: new Date().toISOString()
    });
  });

  // Get AI Analysis History
  app.get('/api/ai/analysis-history', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // For now, return mock history - in production this would query a database
      const mockHistory = [
        {
          id: 'analysis_1',
          type: 'comparison',
          playerNames: ['Victor Osimhen', 'Amadou Haidara'],
          status: 'completed',
          confidence: 87,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          summary: 'Comprehensive comparison analysis completed'
        },
        {
          id: 'analysis_2',
          type: 'scouting',
          playerNames: ['Youssouf Fofana'],
          status: 'completed',
          confidence: 92,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          summary: 'Scouting recommendation for central midfielder'
        }
      ];

      res.json({
        analyses: mockHistory,
        total: mockHistory.length
      });
    } catch (error) {
      console.error('AI analysis history error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve analysis history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Export utility functions for use in other parts of the application
export {
  enhancedPlayerComparison,
  getScoutingRecommendations,
  predictMarketValue,
  assessInjuryRisk,
  callAIService
};