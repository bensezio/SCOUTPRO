import type { Express, Request, Response } from "express";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes";
import axios from 'axios';

interface EnhancedComparisonRequest {
  players: Array<{
    id: number;
    name: string;
    position: string;
    nationality: string;
    age: number;
    marketValue: number;
    attributes: Array<{
      name: string;
      value: number;
      weight: number;
      category: 'technical' | 'physical' | 'mental';
    }>;
    overallRating: number;
    potentialRating: number;
  }>;
  weights: {
    technical: number;
    physical: number;
    mental: number;
    age: number;
    experience: number;
    potential: number;
  };
  mode: string;
}

interface AIRecommendation {
  type: 'transfer' | 'development' | 'tactical' | 'comparison';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

// Enhanced ML Service URL - Docker-aware connectivity
const ML_SERVICE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://enhanced-ml-service:5002'
  : 'http://localhost:5002';

// Simplified ML calculations directly in Node.js
function calculateSimilarityScore(player1: any, player2: any): number {
  const attributes = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physicality'];
  let totalDiff = 0;
  let validAttributes = 0;
  
  for (const attr of attributes) {
    if (player1[attr] !== undefined && player2[attr] !== undefined) {
      totalDiff += Math.abs(player1[attr] - player2[attr]);
      validAttributes++;
    }
  }
  
  if (validAttributes === 0) return 0;
  const avgDiff = totalDiff / validAttributes;
  return Math.max(0, 100 - avgDiff); // Convert to similarity percentage
}

function predictMarketValue(player: any): number {
  const baseValue = 1000000; // 1M base
  const ageMultiplier = player.age ? Math.max(0.3, 1 - (Math.abs(player.age - 25) * 0.05)) : 1;
  const overallMultiplier = player.overallRating ? (player.overallRating / 100) * 2 : 1;
  const potentialMultiplier = player.potentialRating ? (player.potentialRating / 100) * 1.5 : 1;
  
  return Math.round(baseValue * ageMultiplier * overallMultiplier * potentialMultiplier);
}

function calculateTacticalFit(player: any, formation: string = "4-3-3"): number {
  const position = player.position || 'Central Midfielder';
  const formationWeights: { [key: string]: { [key: string]: number } } = {
    '4-3-3': {
      'Goalkeeper': 0.9,
      'Centre-Back': 0.8, 'Left-Back': 0.7, 'Right-Back': 0.7,
      'Central Midfielder': 0.9, 'Defensive Midfielder': 0.8,
      'Left Winger': 0.8, 'Right Winger': 0.8, 'Centre-Forward': 0.9
    },
    '4-4-2': {
      'Goalkeeper': 0.9,
      'Centre-Back': 0.8, 'Left-Back': 0.7, 'Right-Back': 0.7,
      'Central Midfielder': 0.7, 'Left Midfielder': 0.8, 'Right Midfielder': 0.8,
      'Centre-Forward': 0.9, 'Second Striker': 0.8
    }
  };
  
  const baseScore = formationWeights[formation]?.[position] || 0.6;
  const overallBonus = player.overallRating ? (player.overallRating / 100) * 0.3 : 0;
  
  return Math.min(100, (baseScore + overallBonus) * 100);
}

function assessInjuryRisk(player: any): number {
  const ageRisk = player.age ? Math.max(0, (player.age - 30) * 2) : 10;
  const physicalityBonus = player.physicality ? (100 - player.physicality) * 0.3 : 20;
  const baseRisk = 15; // Base injury risk percentage
  
  return Math.min(100, Math.max(0, baseRisk + ageRisk + physicalityBonus));
}

async function callEnhancedMLService(endpoint: string, data: any, retries = 3): Promise<any> {
  // Simplified ML service that runs locally in Node.js
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] Enhanced ML Service (Local) - Processing ${endpoint}`);
    
    switch (endpoint) {
      case '/api/ml/market-value':
        return {
          predicted_market_value: predictMarketValue(data),
          confidence: 0.75,
          factors: {
            age_factor: data.age && data.age >= 22 && data.age <= 28 ? "optimal" : "suboptimal",
            overall_rating: data.overallRating || 70,
            position_impact: data.position || "Unknown"
          }
        };
      
      case '/api/ml/similarity':
        // This would require access to all players - simplified for now
        return {
          similar_players: [
            {
              id: 1,
              name: "Similar Player 1",
              position: data.position || "Central Midfielder",
              age: (data.age || 25) + Math.floor(Math.random() * 4) - 2,
              nationality: data.nationality || "Unknown",
              overall_rating: (data.overallRating || 70) + Math.floor(Math.random() * 10) - 5,
              similarity_score: 85 + Math.random() * 10,
              market_value: predictMarketValue(data) * (0.8 + Math.random() * 0.4)
            }
          ]
        };
      
      case '/api/ml/tactical-fit':
        return {
          tactical_fit_score: calculateTacticalFit(data, data.formation),
          formation: data.formation || "4-3-3",
          strengths: ["Positioning", "Team play", "Tactical awareness"],
          recommendations: ["Suitable for possession-based play", "Good fit for modern tactics"]
        };
      
      case '/api/ml/injury-risk':
        return {
          injury_risk_percentage: assessInjuryRisk(data),
          risk_factors: ["Age", "Physical demands", "Playing style"],
          recommendations: ["Regular fitness monitoring", "Load management needed"]
        };
      
      default:
        return {
          success: false,
          error: 'Endpoint not supported',
          fallback: true
        };
    }
    
  } catch (error: any) {
    console.error(`[${timestamp}] Enhanced ML Service (Local) Error:`, error.message);
    return {
      success: false,
      error: 'Enhanced ML service temporarily unavailable',
      fallback: true,
      timestamp: timestamp
    };
  }
}

function generateEnhancedAIRecommendations(players: any[], weights: any): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  
  if (players.length < 2) return recommendations;

  // Sort players by weighted score
  const playerScores = players.map(player => {
    const techScore = player.attributes
      .filter((attr: any) => attr.category === 'technical')
      .reduce((sum: number, attr: any) => sum + attr.value, 0) / 4;
    
    const physScore = player.attributes
      .filter((attr: any) => attr.category === 'physical')
      .reduce((sum: number, attr: any) => sum + attr.value, 0) / 4;
    
    const mentScore = player.attributes
      .filter((attr: any) => attr.category === 'mental')
      .reduce((sum: number, attr: any) => sum + attr.value, 0) / 4;

    const weightedScore = (
      (techScore * weights.technical / 100) +
      (physScore * weights.physical / 100) +
      (mentScore * weights.mental / 100) +
      ((30 - player.age) * weights.age / 100 * 3) +
      (player.potentialRating * weights.potential / 100)
    );

    return { ...player, weightedScore };
  }).sort((a, b) => b.weightedScore - a.weightedScore);

  const topPlayer = playerScores[0];
  const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
  const avgMarketValue = players.reduce((sum, p) => sum + p.marketValue, 0) / players.length;

  // Transfer Recommendation
  recommendations.push({
    type: 'transfer',
    title: 'Top Transfer Target Identified',
    description: `${topPlayer.name} emerges as the strongest candidate based on your weighted criteria. With a composite score of ${topPlayer.weightedScore.toFixed(1)}, they offer the best balance of technical ability, physical attributes, and potential for your specific requirements.`,
    confidence: 88,
    priority: 'high',
    actionItems: [
      `Initiate detailed scouting assessment for ${topPlayer.name}`,
      `Verify market availability and transfer feasibility`,
      `Conduct background checks and injury history review`,
      `Schedule live match observation sessions`
    ]
  });

  // Development Recommendation
  if (avgAge < 24) {
    const youngPlayers = players.filter(p => p.age < 23);
    if (youngPlayers.length > 0) {
      recommendations.push({
        type: 'development',
        title: 'Youth Development Opportunity',
        description: `Your comparison includes ${youngPlayers.length} young talents with significant development potential. These players could benefit from targeted development programs to reach their potential ratings.`,
        confidence: 75,
        priority: 'medium',
        actionItems: [
          'Design position-specific training programs',
          'Implement performance tracking metrics',
          'Consider loan opportunities for game time',
          'Assign experienced mentors for guidance'
        ]
      });
    }
  }

  // Market Value Analysis
  if (avgMarketValue > 1000000) {
    const bestValue = players.reduce((best, current) => 
      (current.weightedScore / (current.marketValue / 1000000)) > 
      (best.weightedScore / (best.marketValue / 1000000)) ? current : best
    );
    
    recommendations.push({
      type: 'comparison',
      title: 'Best Value-for-Money Analysis',
      description: `${bestValue.name} offers exceptional value considering their performance metrics relative to market valuation. Their cost-effectiveness ratio suggests strong ROI potential for acquisition.`,
      confidence: 82,
      priority: 'medium',
      actionItems: [
        'Negotiate market value based on comprehensive analysis',
        'Compare with similar profile players in target leagues',
        'Factor in contract length and additional costs',
        'Assess resale value potential'
      ]
    });
  }

  // Tactical Fit Recommendation
  const positions = [...new Set(players.map(p => p.position))];
  if (positions.length > 1) {
    recommendations.push({
      type: 'tactical',
      title: 'Multi-Position Tactical Flexibility',
      description: `Your comparison spans ${positions.length} different positions: ${positions.join(', ')}. This diversity offers tactical flexibility and squad depth options for various formations and game situations.`,
      confidence: 70,
      priority: 'low',
      actionItems: [
        'Evaluate formation compatibility for each player',
        'Assess adaptability to multiple tactical roles',
        'Consider squad balance and positional coverage',
        'Plan rotation strategies for optimal utilization'
      ]
    });
  }

  return recommendations;
}

export function registerEnhancedAIRoutes(app: Express) {
  
  // Market Value Prediction
  app.post('/api/enhanced-ai/market-value', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await callEnhancedMLService('/api/ml/market-value', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Market value prediction failed', details: error.message });
    }
  });

  // Player Similarity Analysis
  app.post('/api/enhanced-ai/similarity', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await callEnhancedMLService('/api/ml/similarity', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Similarity analysis failed', details: error.message });
    }
  });

  // Tactical Fit Analysis
  app.post('/api/enhanced-ai/tactical-fit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await callEnhancedMLService('/api/ml/tactical-fit', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Tactical fit analysis failed', details: error.message });
    }
  });

  // Injury Risk Assessment
  app.post('/api/enhanced-ai/injury-risk', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await callEnhancedMLService('/api/ml/injury-risk', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Injury risk assessment failed', details: error.message });
    }
  });

  // Enhanced Player Comparison with AI Analysis
  app.post('/api/ai/enhanced-comparison', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Enhanced AI Comparison Request:`, {
      userId: req.user?.id,
      playersCount: req.body.players?.length,
      mode: req.body.mode
    });

    try {
      const { players, weights, mode }: EnhancedComparisonRequest = req.body;

      if (!players || players.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 players required for comparison analysis'
        });
      }

      // Prepare data for ML service
      const mlData = {
        players: players.map(player => ({
          id: player.id,
          name: player.name,
          position: player.position,
          age: player.age,
          attributes: player.attributes.reduce((acc, attr) => {
            acc[attr.name.toLowerCase().replace(/\s+/g, '_')] = attr.value;
            return acc;
          }, {} as Record<string, number>),
          overall_rating: player.overallRating,
          potential_rating: player.potentialRating,
          market_value: player.marketValue
        })),
        analysis_weights: weights,
        analysis_mode: mode
      };

      // Call Enhanced ML Service for advanced analysis
      const mlResult = await callEnhancedMLService('/analyze/enhanced-comparison', mlData);
      
      // Generate AI recommendations (fallback or enhanced)
      let recommendations: AIRecommendation[];
      
      if (mlResult.success && !mlResult.fallback) {
        // Use ML-generated recommendations if available
        recommendations = mlResult.recommendations || generateEnhancedAIRecommendations(players, weights);
        console.log(`[${timestamp}] Using ML-generated recommendations`);
      } else {
        // Use fallback recommendations
        recommendations = generateEnhancedAIRecommendations(players, weights);
        console.log(`[${timestamp}] Using fallback AI recommendations`);
      }

      // Calculate additional metrics
      const comparisonMetrics = {
        averageAge: players.reduce((sum, p) => sum + p.age, 0) / players.length,
        averageOverall: players.reduce((sum, p) => sum + p.overallRating, 0) / players.length,
        averagePotential: players.reduce((sum, p) => sum + p.potentialRating, 0) / players.length,
        totalMarketValue: players.reduce((sum, p) => sum + p.marketValue, 0),
        positionDiversity: [...new Set(players.map(p => p.position))].length,
        nationalityDiversity: [...new Set(players.map(p => p.nationality))].length
      };

      res.json({
        success: true,
        recommendations,
        metrics: comparisonMetrics,
        mlAnalysis: mlResult.success && !mlResult.fallback ? mlResult.analysis : null,
        analysisMode: mode,
        timestamp: timestamp,
        mlServiceAvailable: mlResult.success && !mlResult.fallback
      });

    } catch (error: any) {
      console.error(`[${timestamp}] Enhanced AI Comparison Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Enhanced comparison analysis failed',
        details: error.message,
        timestamp: timestamp
      });
    }
  });

  // Market Value Prediction with Enhanced ML
  app.post('/api/ai/predict-market-value', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    try {
      const { playerAttributes, position, age, nationality } = req.body;

      // Call Enhanced ML Service
      const mlResult = await callEnhancedMLService('/analyze/market-value', {
        attributes: playerAttributes,
        position,
        age,
        nationality
      });

      if (mlResult.success && !mlResult.fallback) {
        res.json({
          success: true,
          prediction: mlResult.analysis,
          confidence: mlResult.analysis.confidence || 0.85,
          timestamp: timestamp,
          source: 'enhanced_ml_service'
        });
      } else {
        // Fallback market value estimation
        const baseValue = Object.values(playerAttributes).reduce((sum: number, val: any) => sum + val, 0) / Object.keys(playerAttributes).length;
        const ageMultiplier = age < 23 ? 1.2 : age < 28 ? 1.0 : 0.8;
        const estimatedValue = Math.round(baseValue * 10000 * ageMultiplier);

        res.json({
          success: true,
          prediction: {
            predicted_value: estimatedValue,
            confidence: 0.70,
            factors: {
              base_rating: baseValue,
              age_factor: ageMultiplier,
              position_factor: 1.0
            }
          },
          timestamp: timestamp,
          source: 'fallback_estimation'
        });
      }

    } catch (error: any) {
      console.error(`[${timestamp}] Market Value Prediction Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Market value prediction failed',
        timestamp: timestamp
      });
    }
  });

  // Player Similarity Analysis
  app.post('/api/ai/find-similar-players', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    try {
      const { playerAttributes, position, topK = 5 } = req.body;

      // Call Enhanced ML Service
      const mlResult = await callEnhancedMLService('/analyze/similarity', {
        attributes: playerAttributes,
        position,
        top_k: topK
      });

      if (mlResult.success && !mlResult.fallback) {
        res.json({
          success: true,
          similarPlayers: mlResult.analysis.similar_players || [],
          algorithm: mlResult.analysis.algorithm || 'cosine_similarity',
          timestamp: timestamp,
          source: 'enhanced_ml_service'
        });
      } else {
        // Return empty results with message
        res.json({
          success: true,
          similarPlayers: [],
          message: 'Player similarity analysis temporarily unavailable',
          timestamp: timestamp,
          source: 'unavailable'
        });
      }

    } catch (error: any) {
      console.error(`[${timestamp}] Similarity Analysis Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Similarity analysis failed',
        timestamp: timestamp
      });
    }
  });

  // Enhanced ML Service Health Check
  app.get('/api/ai/enhanced-ml-health', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const healthResult = await callEnhancedMLService('/health', {});
      
      res.json({
        success: true,
        mlServiceStatus: healthResult.success ? 'healthy' : 'unhealthy',
        mlServiceData: healthResult,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      res.json({
        success: false,
        mlServiceStatus: 'unavailable',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Retrain ML Models (Admin only)
  app.post('/api/ai/retrain-models', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    // Check if user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required for model retraining'
      });
    }

    try {
      console.log(`[${timestamp}] Model retraining initiated by admin: ${req.user.email}`);
      
      const retrainResult = await callEnhancedMLService('/retrain', {
        initiated_by: req.user.email,
        timestamp: timestamp
      });

      res.json({
        success: true,
        retraining: retrainResult,
        timestamp: timestamp,
        initiatedBy: req.user.email
      });

    } catch (error: any) {
      console.error(`[${timestamp}] Model Retraining Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Model retraining failed',
        details: error.message,
        timestamp: timestamp
      });
    }
  });

  // Player Potential Analysis
  app.post('/api/ai/analyze-potential', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    try {
      const { playerAttributes } = req.body;

      if (!playerAttributes) {
        return res.status(400).json({
          success: false,
          error: 'Player attributes are required'
        });
      }

      const result = await callEnhancedMLService('/analyze/potential', {
        player_attributes: playerAttributes
      });

      res.json({
        success: true,
        potentialAnalysis: result,
        timestamp: timestamp,
        source: 'enhanced_ml_service'
      });

    } catch (error: any) {
      console.error(`[${timestamp}] Potential Analysis Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Potential analysis failed',
        timestamp: timestamp
      });
    }
  });

  // Tactical Fit Analysis
  app.post('/api/ai/analyze-tactical-fit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    try {
      const { playerAttributes, formation = '4-3-3' } = req.body;

      if (!playerAttributes) {
        return res.status(400).json({
          success: false,
          error: 'Player attributes are required'
        });
      }

      const result = await callEnhancedMLService('/analyze/tactical-fit', {
        player_attributes: playerAttributes,
        formation: formation
      });

      res.json({
        success: true,
        tacticalAnalysis: result,
        timestamp: timestamp,
        source: 'enhanced_ml_service'
      });

    } catch (error: any) {
      console.error(`[${timestamp}] Tactical Fit Analysis Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Tactical fit analysis failed',
        timestamp: timestamp
      });
    }
  });

  // Injury Risk Analysis
  app.post('/api/ai/analyze-injury-risk', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    try {
      const { playerAttributes } = req.body;

      if (!playerAttributes) {
        return res.status(400).json({
          success: false,
          error: 'Player attributes are required'
        });
      }

      const result = await callEnhancedMLService('/analyze/injury-risk', {
        player_attributes: playerAttributes
      });

      res.json({
        success: true,
        injuryAnalysis: result,
        timestamp: timestamp,
        source: 'enhanced_ml_service'
      });

    } catch (error: any) {
      console.error(`[${timestamp}] Injury Risk Analysis Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Injury risk analysis failed',
        timestamp: timestamp
      });
    }
  });

  // Advanced Visualizations
  app.post('/api/ai/generate-visualizations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = new Date().toISOString();
    
    try {
      const { playerData } = req.body;

      if (!playerData) {
        return res.status(400).json({
          success: false,
          error: 'Player data is required'
        });
      }

      const result = await callEnhancedMLService('/visualizations/advanced', {
        player_data: playerData
      });

      res.json({
        success: true,
        visualizations: result,
        timestamp: timestamp,
        source: 'enhanced_ml_service'
      });

    } catch (error: any) {
      console.error(`[${timestamp}] Visualization Generation Error:`, error);
      res.status(500).json({
        success: false,
        error: 'Visualization generation failed',
        timestamp: timestamp
      });
    }
  });
}