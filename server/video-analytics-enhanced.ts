import { Express, Request, Response } from 'express';
import { db } from './db';
import { authenticateToken, AuthenticatedRequest } from './auth-routes';
import { requireFeature, FEATURES } from './feature-gate-middleware';
import { players, users, matchAnalysis, analysisVideos, videoPlayerAnalysis, videoEventTags } from '@shared/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { VIDEO_EVENT_TYPES, getEventTypesForPosition, getEventTypeLabel } from '@shared/video-analytics-constants';

// Enhanced Video Analytics Routes with AI-Powered Insights
export function registerEnhancedVideoAnalyticsRoutes(app: Express) {
  
  // Get all match analyses with enhanced data
  app.get('/api/video-analytics/matches', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const matches = await db
        .select({
          id: matchAnalysis.id,
          matchDate: matchAnalysis.matchDate,
          competition: matchAnalysis.competition,
          venue: matchAnalysis.venue,
          homeTeamName: matchAnalysis.homeTeamName,
          awayTeamName: matchAnalysis.awayTeamName,
          homeScore: matchAnalysis.homeScore,
          awayScore: matchAnalysis.awayScore,
          matchStatus: matchAnalysis.matchStatus,
          analysisType: matchAnalysis.analysisType,
          focusAreas: matchAnalysis.focusAreas,
          createdAt: matchAnalysis.createdAt,
          // Count of associated videos
          videoCount: sql<number>`(SELECT COUNT(*) FROM ${analysisVideos} WHERE match_analysis_id = ${matchAnalysis.id})`
        })
        .from(matchAnalysis)
        .where(eq(matchAnalysis.createdBy, req.user!.id))
        .orderBy(desc(matchAnalysis.createdAt));

      res.json({ matches });
    } catch (error) {
      console.error('Error fetching matches:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  // Get enhanced analytics statistics
  app.get('/api/video-analytics/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get comprehensive statistics
      const totalMatches = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(matchAnalysis)
        .where(eq(matchAnalysis.createdBy, req.user!.id));

      const totalVideos = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(analysisVideos)
        .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
        .where(eq(matchAnalysis.createdBy, req.user!.id));

      const totalTags = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(videoEventTags)
        .innerJoin(analysisVideos, eq(videoEventTags.videoId, analysisVideos.id))
        .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
        .where(eq(matchAnalysis.createdBy, req.user!.id));

      const totalPlayers = await db
        .select({ count: sql<number>`COUNT(DISTINCT player_id)` })
        .from(videoPlayerAnalysis)
        .innerJoin(analysisVideos, eq(videoPlayerAnalysis.videoId, analysisVideos.id))
        .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
        .where(eq(matchAnalysis.createdBy, req.user!.id));

      // Get event type distribution
      const eventDistribution = await db
        .select({
          eventType: videoEventTags.eventType,
          count: sql<number>`COUNT(*)`
        })
        .from(videoEventTags)
        .innerJoin(analysisVideos, eq(videoEventTags.videoId, analysisVideos.id))
        .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
        .where(eq(matchAnalysis.createdBy, req.user!.id))
        .groupBy(videoEventTags.eventType)
        .orderBy(sql`COUNT(*) DESC`);

      // Get recent activity
      const recentActivity = await db
        .select({
          id: videoEventTags.id,
          eventType: videoEventTags.eventType,
          createdAt: videoEventTags.createdAt,
          matchName: sql<string>`${matchAnalysis.homeTeamName} || ' vs ' || ${matchAnalysis.awayTeamName}`,
          videoType: analysisVideos.videoType
        })
        .from(videoEventTags)
        .innerJoin(analysisVideos, eq(videoEventTags.videoId, analysisVideos.id))
        .innerJoin(matchAnalysis, eq(analysisVideos.matchAnalysisId, matchAnalysis.id))
        .where(eq(matchAnalysis.createdBy, req.user!.id))
        .orderBy(desc(videoEventTags.createdAt))
        .limit(10);

      const stats = {
        totalMatches: totalMatches[0]?.count || 0,
        totalVideos: totalVideos[0]?.count || 0,
        totalTags: totalTags[0]?.count || 0,
        totalPlayers: totalPlayers[0]?.count || 0,
        eventDistribution,
        recentActivity: recentActivity.map(activity => ({
          ...activity,
          eventTypeLabel: getEventTypeLabel(activity.eventType)
        }))
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Get videos for a specific match with enhanced metadata
  app.get('/api/video-analytics/matches/:matchId/videos', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const matchId = parseInt(req.params.matchId);
      
      const videos = await db
        .select({
          id: analysisVideos.id,
          filename: analysisVideos.filename,
          originalName: analysisVideos.originalName,
          duration: analysisVideos.duration,
          resolution: analysisVideos.resolution,
          format: analysisVideos.format,
          filePath: analysisVideos.filePath,
          thumbnailPath: analysisVideos.thumbnailPath,
          videoType: analysisVideos.videoType,
          processingStatus: analysisVideos.processingStatus,
          processingProgress: analysisVideos.processingProgress,
          createdAt: analysisVideos.createdAt,
          // Count of tags for this video
          tagCount: sql<number>`(SELECT COUNT(*) FROM ${videoEventTags} WHERE video_id = ${analysisVideos.id})`,
          // Count of unique players in this video
          playerCount: sql<number>`(SELECT COUNT(DISTINCT player_id) FROM ${videoPlayerAnalysis} WHERE video_id = ${analysisVideos.id})`
        })
        .from(analysisVideos)
        .where(eq(analysisVideos.matchAnalysisId, matchId))
        .orderBy(desc(analysisVideos.createdAt));

      res.json({ videos });
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Get events for a specific video (required for Spotlight feature)
  app.get('/api/video-analytics/videos/:id/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      
      // Get events from database
      const events = await db
        .select({
          id: videoEventTags.id,
          videoId: videoEventTags.videoId,
          playerId: videoEventTags.playerId,
          playerName: videoEventTags.playerName,
          teamName: videoEventTags.teamName,
          eventType: videoEventTags.eventType,
          eventSubtype: videoEventTags.eventSubtype,
          timestamp: videoEventTags.timestampStart,
          timestampEnd: videoEventTags.timestampEnd,
          minute: videoEventTags.minute,
          fieldX: videoEventTags.fieldX,
          fieldY: videoEventTags.fieldY,
          outcome: videoEventTags.outcome,
          qualityRating: videoEventTags.qualityRating,
          confidenceScore: videoEventTags.confidenceScore,
          eventNotes: videoEventTags.eventNotes,
          source: videoEventTags.source,
          createdAt: videoEventTags.createdAt
        })
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId))
        .orderBy(videoEventTags.timestampStart);

      // Transform events for Spotlight component
      const spotlightClips = events.map(event => ({
        id: event.id,
        videoId: event.videoId,
        eventType: event.eventType,
        eventDisplayName: event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1),
        timestamp: event.timestamp || 0,
        endTimestamp: event.timestampEnd,
        duration: event.timestampEnd ? (event.timestampEnd - (event.timestamp || 0)) : 10,
        team: event.teamName || 'Unknown',
        teamColor: event.teamName?.includes('Home') ? '#3b82f6' : '#ef4444',
        playerId: event.playerId,
        playerName: event.playerName || 'Unknown Player',
        playerPosition: 'MF',
        playerJerseyNumber: '10',
        outcome: event.outcome || 'successful',
        quality: event.qualityRating || 3,
        confidence: (event.confidenceScore || 80) / 100,
        confidenceScore: event.confidenceScore || 80,
        description: event.eventNotes,
        isHighlight: event.qualityRating >= 4,
        startTime: event.timestamp || 0,
        endTime: event.timestampEnd || ((event.timestamp || 0) + 10),
        previewThumbnail: '/placeholder-thumbnail.jpg'
      }));

      res.json({
        events: spotlightClips,
        stats: {
          totalEvents: events.length,
          highlightCount: events.filter(e => (e.qualityRating || 0) >= 4).length,
          avgQuality: events.length > 0 ? events.reduce((sum, e) => sum + (e.qualityRating || 0), 0) / events.length : 0,
          eventTypes: [...new Set(events.map(e => e.eventType))]
        }
      });
    } catch (error) {
      console.error('Error fetching video events:', error);
      res.status(500).json({ error: 'Failed to fetch video events' });
    }
  });

  // Get enhanced event tags with AI insights
  app.get('/api/video-analytics/videos/:videoId/tags', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId);
      
      const tags = await db
        .select({
          id: videoEventTags.id,
          eventType: videoEventTags.eventType,
          eventSubtype: videoEventTags.eventSubtype,
          timestampStart: videoEventTags.timestampStart,
          timestampEnd: videoEventTags.timestampEnd,
          fieldX: videoEventTags.fieldX,
          fieldY: videoEventTags.fieldY,
          qualityRating: videoEventTags.qualityRating,
          outcome: videoEventTags.outcome,
          description: videoEventTags.description,
          tags: videoEventTags.tags,
          createdAt: videoEventTags.createdAt,
          // Player information
          playerId: videoEventTags.playerId,
          playerName: sql<string>`COALESCE(${players.firstName} || ' ' || ${players.lastName}, 'Unknown Player')`,
          playerPosition: players.position,
          // Tagger information
          taggerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`
        })
        .from(videoEventTags)
        .leftJoin(players, eq(videoEventTags.playerId, players.id))
        .leftJoin(users, eq(videoEventTags.taggedBy, users.id))
        .where(eq(videoEventTags.videoId, videoId))
        .orderBy(asc(videoEventTags.timestampStart));

      // Add event type labels and position-specific insights
      const enhancedTags = tags.map(tag => ({
        ...tag,
        eventTypeLabel: getEventTypeLabel(tag.eventType),
        isPositionRelevant: tag.playerPosition ? 
          getEventTypesForPosition(tag.playerPosition).includes(tag.eventType) : false
      }));

      res.json({ tags: enhancedTags });
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Create enhanced event tag with AI validation
  app.post('/api/video-analytics/videos/:videoId/tags', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const {
        playerId,
        eventType,
        eventSubtype,
        timestampStart,
        timestampEnd,
        fieldX,
        fieldY,
        qualityRating,
        outcome,
        description,
        tags
      } = req.body;

      // Validate player exists if playerId is provided
      if (playerId) {
        const player = await db
          .select()
          .from(players)
          .where(eq(players.id, playerId))
          .limit(1);

        if (player.length === 0) {
          return res.status(404).json({ error: 'Player not found' });
        }
      }

      // Create the event tag
      const newTag = await db
        .insert(videoEventTags)
        .values({
          videoId,
          playerId: playerId || null,
          taggedBy: req.user!.id,
          eventType,
          eventSubtype,
          timestampStart,
          timestampEnd,
          fieldX,
          fieldY,
          qualityRating,
          outcome,
          description,
          tags: tags ? JSON.stringify(tags) : null
        })
        .returning();

      res.json({ 
        success: true, 
        tag: newTag[0],
        eventTypeLabel: getEventTypeLabel(eventType)
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      res.status(500).json({ error: 'Failed to create tag' });
    }
  });

  // Get player performance analysis for a video
  app.get('/api/video-analytics/videos/:videoId/player-analysis', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId);
      
      const analysis = await db
        .select({
          id: videoPlayerAnalysis.id,
          playerId: videoPlayerAnalysis.playerId,
          playerName: videoPlayerAnalysis.playerName,
          position: videoPlayerAnalysis.position,
          minutesPlayed: videoPlayerAnalysis.minutesPlayed,
          totalEvents: videoPlayerAnalysis.totalEvents,
          successfulEvents: videoPlayerAnalysis.successfulEvents,
          unsuccessfulEvents: videoPlayerAnalysis.unsuccessfulEvents,
          positionMetrics: videoPlayerAnalysis.positionMetrics,
          heatMapData: videoPlayerAnalysis.heatMapData,
          touchPositions: videoPlayerAnalysis.touchPositions,
          overallRating: videoPlayerAnalysis.overallRating,
          technicalScore: videoPlayerAnalysis.technicalScore,
          physicalScore: videoPlayerAnalysis.physicalScore,
          mentalScore: videoPlayerAnalysis.mentalScore,
          keyPasses: videoPlayerAnalysis.keyPasses,
          duelsWon: videoPlayerAnalysis.duelsWon,
          duelsLost: videoPlayerAnalysis.duelsLost,
          createdAt: videoPlayerAnalysis.createdAt,
          // Additional player information
          playerPosition: players.position,
          playerAge: players.age,
          playerNationality: players.nationality
        })
        .from(videoPlayerAnalysis)
        .leftJoin(players, eq(videoPlayerAnalysis.playerId, players.id))
        .where(eq(videoPlayerAnalysis.videoId, videoId))
        .orderBy(desc(videoPlayerAnalysis.overallRating));

      res.json({ analysis });
    } catch (error) {
      console.error('Error fetching player analysis:', error);
      res.status(500).json({ error: 'Failed to fetch player analysis' });
    }
  });

  // Generate AI-powered highlights
  app.post('/api/video-analytics/videos/:videoId/generate-highlights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const { highlightTypes, playerId, duration } = req.body;
      
      // Get video information
      const video = await db
        .select()
        .from(analysisVideos)
        .where(eq(analysisVideos.id, videoId))
        .limit(1);

      if (video.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Get relevant event tags for highlights
      let tagQuery = db
        .select()
        .from(videoEventTags)
        .where(eq(videoEventTags.videoId, videoId));

      if (playerId) {
        tagQuery = tagQuery.where(eq(videoEventTags.playerId, playerId));
      }

      if (highlightTypes && highlightTypes.length > 0) {
        tagQuery = tagQuery.where(sql`${videoEventTags.eventType} = ANY(${highlightTypes})`);
      }

      const relevantTags = await tagQuery
        .orderBy(desc(videoEventTags.qualityRating), asc(videoEventTags.timestampStart));

      // Generate highlight clips (this would integrate with FFmpeg in production)
      const highlights = relevantTags.map(tag => ({
        id: tag.id,
        startTime: tag.timestampStart,
        endTime: tag.timestampEnd || (parseFloat(tag.timestampStart.toString()) + 10),
        eventType: tag.eventType,
        eventTypeLabel: getEventTypeLabel(tag.eventType),
        qualityRating: tag.qualityRating,
        outcome: tag.outcome,
        description: tag.description
      }));

      res.json({ 
        success: true, 
        highlights,
        videoInfo: video[0],
        totalHighlights: highlights.length,
        estimatedDuration: highlights.reduce((acc, h) => acc + (h.endTime - h.startTime), 0)
      });
    } catch (error) {
      console.error('Error generating highlights:', error);
      res.status(500).json({ error: 'Failed to generate highlights' });
    }
  });

  // Get comprehensive match report
  app.get('/api/video-analytics/matches/:matchId/report', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const matchId = parseInt(req.params.matchId);
      
      // Get match details
      const match = await db
        .select()
        .from(matchAnalysis)
        .where(eq(matchAnalysis.id, matchId))
        .limit(1);

      if (match.length === 0) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Get all videos for this match
      const videos = await db
        .select()
        .from(analysisVideos)
        .where(eq(analysisVideos.matchAnalysisId, matchId));

      // Get all tags for all videos
      const allTags = await db
        .select({
          tag: videoEventTags,
          playerName: sql<string>`COALESCE(${players.firstName} || ' ' || ${players.lastName}, 'Unknown Player')`,
          playerPosition: players.position
        })
        .from(videoEventTags)
        .innerJoin(analysisVideos, eq(videoEventTags.videoId, analysisVideos.id))
        .leftJoin(players, eq(videoEventTags.playerId, players.id))
        .where(eq(analysisVideos.matchAnalysisId, matchId));

      // Generate comprehensive statistics
      const eventStats = allTags.reduce((acc, { tag }) => {
        acc[tag.eventType] = (acc[tag.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const playerStats = allTags.reduce((acc, { tag, playerName, playerPosition }) => {
        if (!acc[playerName]) {
          acc[playerName] = {
            totalEvents: 0,
            successfulEvents: 0,
            position: playerPosition,
            eventBreakdown: {}
          };
        }
        acc[playerName].totalEvents++;
        if (tag.outcome === 'successful') {
          acc[playerName].successfulEvents++;
        }
        acc[playerName].eventBreakdown[tag.eventType] = 
          (acc[playerName].eventBreakdown[tag.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, any>);

      const report = {
        match: match[0],
        videos: videos.length,
        totalTags: allTags.length,
        eventStats,
        playerStats,
        keyInsights: [
          `Total of ${allTags.length} events analyzed across ${videos.length} videos`,
          `Most frequent event: ${Object.entries(eventStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}`,
          `${Object.keys(playerStats).length} players analyzed`
        ]
      };

      res.json({ report });
    } catch (error) {
      console.error('Error generating match report:', error);
      res.status(500).json({ error: 'Failed to generate match report' });
    }
  });

  // Get position-specific event configuration
  app.get('/api/video-analytics/position-events/:position', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const position = req.params.position;
      const relevantEvents = getEventTypesForPosition(position);
      
      const eventConfig = relevantEvents.map(eventType => ({
        value: eventType,
        label: getEventTypeLabel(eventType),
        category: getCategoryForEventType(eventType)
      }));

      res.json({ 
        position, 
        events: eventConfig,
        totalEvents: eventConfig.length
      });
    } catch (error) {
      console.error('Error fetching position events:', error);
      res.status(500).json({ error: 'Failed to fetch position events' });
    }
  });
}

// Helper function to categorize event types
function getCategoryForEventType(eventType: string): string {
  const categories: Record<string, string> = {
    [VIDEO_EVENT_TYPES.PASS]: 'Technical',
    [VIDEO_EVENT_TYPES.SHOT]: 'Technical',
    [VIDEO_EVENT_TYPES.CROSS]: 'Technical',
    [VIDEO_EVENT_TYPES.DRIBBLE]: 'Technical',
    [VIDEO_EVENT_TYPES.HEADER]: 'Physical',
    [VIDEO_EVENT_TYPES.TACKLE]: 'Defensive',
    [VIDEO_EVENT_TYPES.INTERCEPTION]: 'Defensive',
    [VIDEO_EVENT_TYPES.CLEARANCE]: 'Defensive',
    [VIDEO_EVENT_TYPES.SAVE]: 'Defensive',
    [VIDEO_EVENT_TYPES.DUEL]: 'Physical',
    [VIDEO_EVENT_TYPES.OFFBALL_RUN]: 'Tactical',
    [VIDEO_EVENT_TYPES.PRESSING]: 'Tactical',
    [VIDEO_EVENT_TYPES.POSITIONING]: 'Tactical'
  };
  
  return categories[eventType] || 'Other';
}