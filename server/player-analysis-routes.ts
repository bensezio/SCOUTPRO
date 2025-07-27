import type { Express } from "express";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes";
import { db } from "./db";
import { players, player_stats, match_performances, scouting_reports, organizations } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { DataValidationService } from "./data-validation-service";

// Player Analysis API proxy routes
export function registerPlayerAnalysisRoutes(app: Express) {
  // Use Docker service name in containerized environment, localhost for development
  const PLAYER_ANALYSIS_SERVICE_URL = process.env.PLAYER_ANALYSIS_SERVICE_URL || 
    (process.env.NODE_ENV === 'production' ? 'http://player-analysis:5001' : 'http://localhost:5001');

  // Helper function to get player data from database
  const getPlayersFromDB = async () => {
    try {
      // Get players with their current club information and latest stats
      const playersWithStats = await db
        .select({
          id: players.id,
          name: sql`${players.firstName} || ' ' || ${players.lastName}`.as('name'),
          position: players.position,
          age: sql`EXTRACT(year FROM AGE(${players.dateOfBirth}))`.as('age'),
          nationality: players.nationality,
          club: organizations.name,
          marketValue: players.marketValue,
          height: players.height,
          weight: players.weight,
          preferredFoot: players.preferredFoot,
          // Latest stats from player_stats table
          goals: player_stats.goals,
          assists: player_stats.assists,
          matchesPlayed: player_stats.matchesPlayed,
          averageRating: player_stats.averageRating,
          passAccuracy: player_stats.passAccuracy,
          shotAccuracy: player_stats.shotAccuracy,
          tackles: player_stats.tackles,
          interceptions: player_stats.interceptions
        })
        .from(players)
        .leftJoin(organizations, eq(players.currentClubId, organizations.id))
        .leftJoin(player_stats, eq(players.id, player_stats.playerId))
        .where(eq(players.isActive, true))
        .orderBy(players.lastName, players.firstName);

      // Transform to format expected by ML service
      return playersWithStats.map(player => ({
        'Name': player.name,
        'Position': player.position,
        'Age': Number(player.age),
        'League': player.club || 'Unknown',
        'Player_Rating': Number(player.averageRating) || 0,
        'Goals': Number(player.goals) || 0,
        'Assists': Number(player.assists) || 0,
        'Matches_Played': Number(player.matchesPlayed) || 0,
        'Pass_Accuracy': Number(player.passAccuracy) || 0,
        'Shot_Accuracy': Number(player.shotAccuracy) || 0,
        'Tackles': Number(player.tackles) || 0,
        'Interceptions': Number(player.interceptions) || 0,
        'Market_Value': Number(player.marketValue) || 0,
        'Height': Number(player.height) || 0,
        'Weight': Number(player.weight) || 0,
        'Preferred_Foot': player.preferredFoot || 'Unknown',
        'Nationality': player.nationality,
        'id': player.id
      }));
    } catch (error) {
      console.error('Error fetching players from database:', error);
      throw error;
    }
  };

  // Environment check for strict production mode
  const isProduction = process.env.NODE_ENV === 'production';
  const ENABLE_MOCK_FALLBACK = process.env.ENABLE_MOCK_FALLBACK === 'true' && !isProduction;

  // Enhanced helper function to make requests to Python service with retry logic
  const makeServiceRequest = async (endpoint: string, options: any = {}, retries = 3) => {
    const url = `${PLAYER_ANALYSIS_SERVICE_URL}${endpoint}`;
    const timestamp = new Date().toISOString();
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[${timestamp}] Attempting to connect to Python service: ${url} (attempt ${attempt}/${retries})`);
        
        const response = await fetch(url, {
          ...options,
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Python service responded with ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`[${timestamp}] ✅ Python service request successful: ${endpoint}`);
        return data;
        
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        const errorMessage = error.message || 'Unknown error';
        
        console.error(`[${timestamp}] ❌ Python service request failed (attempt ${attempt}/${retries}): ${errorMessage}`);
        
        if (error.code === 'ECONNREFUSED') {
          console.error(`[${timestamp}] 🔌 Connection refused to ${url} - Python service may not be running`);
        } else if (error.name === 'TimeoutError') {
          console.error(`[${timestamp}] ⏰ Request timeout to ${url} - Python service may be overloaded`);
        }
        
        if (isLastAttempt) {
          console.error(`[${timestamp}] 💥 All retry attempts failed for ${endpoint}`);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[${timestamp}] ⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  };

  // Get all players
  app.get('/api/player-analysis/players', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Always try to get players from database first
      const dbPlayers = await getPlayersFromDB();
      
      if (dbPlayers.length > 0) {
        res.json({
          success: true,
          players: dbPlayers,
          total: dbPlayers.length,
          source: 'database'
        });
        return;
      }
      
      // If no players in database, try Python service
      const data = await makeServiceRequest('/api/player-analysis/players');
      res.json(data);
    } catch (error) {
      console.error('Player data retrieval failed:', error);
      res.status(503).json({
        error: 'Player data unavailable',
        message: 'Unable to fetch player data from database. Please contact system administrator.',
        timestamp: new Date().toISOString(),
        source: 'database_error'
      });
    }
  });

  // Analyze individual player
  app.post('/api/player-analysis/analyze', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { player_name } = req.body;
      
      if (!player_name) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required'
        });
      }
      
      // Validate player exists in database using validation service
      const validation = await DataValidationService.validatePlayer(player_name);
      
      if (!validation.isValid) {
        return res.status(404).json({
          success: false,
          error: 'Player not found in database',
          details: validation.errors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Get comprehensive player data for analysis
      const playerData = await DataValidationService.getPlayerAnalysisData(validation.playerId!);
      
      if (!playerData) {
        return res.status(404).json({
          success: false,
          error: 'Player data unavailable',
          timestamp: new Date().toISOString()
        });
      }
      
      // Try to get analysis from Python service with real player data
      const analysisRequest = {
        ...req.body,
        player_data: playerData // Include live player data
      };
      
      const data = await makeServiceRequest('/api/player-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
      });
      
      // Ensure response includes data source information
      if (data && typeof data === 'object') {
        data.data_source = 'live_database';
        data.player_validated = true;
        data.timestamp = new Date().toISOString();
      }
      
      res.json(data);
    } catch (error) {
      console.error('Player analysis failed:', error);
      res.status(503).json({
        error: 'Analysis service unavailable',
        message: 'Unable to perform player analysis. ML service is temporarily unavailable.',
        timestamp: new Date().toISOString(),
        source: 'service_error'
      });
    }
  });

  // Compare multiple players
  app.post('/api/player-analysis/compare', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { player_names } = req.body;
      
      if (!player_names || !Array.isArray(player_names) || player_names.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 valid player names required for comparison',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate all players exist in database using validation service
      const validation = await DataValidationService.validatePlayers(player_names);
      
      if (validation.invalidPlayers.length > 0) {
        return res.status(404).json({
          success: false,
          error: 'Some players not found in database',
          invalid_players: validation.invalidPlayers,
          valid_players: validation.validPlayers.map(p => p.name),
          details: validation.errors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Get comprehensive data for all valid players
      const playersData = await Promise.all(
        validation.validPlayers.map(async (player) => {
          const data = await DataValidationService.getPlayerAnalysisData(player.id);
          return data;
        })
      );
      
      // Filter out any null results
      const validPlayersData = playersData.filter(data => data !== null);
      
      if (validPlayersData.length < 2) {
        return res.status(404).json({
          success: false,
          error: 'Insufficient player data available for comparison',
          timestamp: new Date().toISOString()
        });
      }
      
      // Try to get comparison from Python service with real player data
      const comparisonRequest = {
        ...req.body,
        players_data: validPlayersData // Include live player data
      };
      
      const data = await makeServiceRequest('/api/player-analysis/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comparisonRequest),
      });
      
      // Ensure response includes data source information
      if (data && typeof data === 'object') {
        data.data_source = 'live_database';
        data.players_validated = true;
        data.timestamp = new Date().toISOString();
      }
      
      res.json(data);
    } catch (error) {
      console.error('Player comparison failed:', error);
      res.status(503).json({
        error: 'Comparison service unavailable',
        message: 'Unable to perform player comparison. ML service is temporarily unavailable.',
        timestamp: new Date().toISOString(),
        source: 'service_error'
      });
    }
  });

  // Get positions from database
  app.get('/api/player-analysis/positions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const positions = await db
        .select({ position: players.position })
        .from(players)
        .where(eq(players.isActive, true))
        .groupBy(players.position);
      
      res.json({
        success: true,
        positions: positions.map(p => p.position),
        source: 'database'
      });
    } catch (error) {
      // Return standard positions as fallback
      res.json({
        success: true,
        positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'],
        source: 'static'
      });
    }
  });

  // Health check endpoint with data integrity validation
  app.get('/api/player-analysis/health', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Check data integrity first
      const dataIntegrity = await DataValidationService.validateDataIntegrity();
      
      let pythonServiceStatus = 'unavailable';
      let pythonServiceError = null;
      
      // Try to reach Python service
      try {
        const data = await makeServiceRequest('/api/player-analysis/health');
        pythonServiceStatus = data?.status || 'available';
      } catch (error) {
        pythonServiceError = error instanceof Error ? error.message : 'Unknown error';
      }
      
      const healthStatus = {
        status: dataIntegrity.isHealthy && pythonServiceStatus !== 'unavailable' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: {
          status: dataIntegrity.isHealthy ? 'healthy' : 'issues_detected',
          issues: dataIntegrity.issues
        },
        python_service: {
          status: pythonServiceStatus,
          error: pythonServiceError
        },
        data_source: 'live_database',
        environment: process.env.NODE_ENV || 'development',
        mock_fallback_enabled: false, // Always false in production-ready version
        production_ready: dataIntegrity.isHealthy
      };
      
      // Return appropriate status code based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
      
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}