import express from "express";
import { authenticateToken } from "./auth-routes.js";
import { storage } from "./storage";
import { z } from "zod";
import { COMPREHENSIVE_EVENT_TYPES, EVENT_CATEGORIES } from "../shared/tagging-constants";

const router = express.Router();

// Validation schemas
const createTaggingEventSchema = z.object({
  matchId: z.number(),
  videoId: z.number(),
  playerId: z.number().optional(),
  playerName: z.string().min(1),
  teamId: z.number().optional(),
  teamName: z.string().min(1),
  timestampStart: z.number().min(0),
  timestampEnd: z.number().optional(),
  minute: z.number().min(0).max(120),
  fieldPositionX: z.number().min(0).max(100).optional(),
  fieldPositionY: z.number().min(0).max(100).optional(),
  eventCategory: z.string().min(1),
  eventType: z.string().min(1),
  eventSubType: z.string().optional(),
  isSuccessful: z.boolean(),
  qualityRating: z.number().min(1).max(5),
  confidenceScore: z.number().min(0).max(100).optional(),
  eventValue: z.record(z.any()).optional(),
  eventNotes: z.string().optional(),
  isKeyAction: z.boolean().optional(),
  isCrucialAction: z.boolean().optional(),
});

const updateTaggingEventSchema = createTaggingEventSchema.partial().omit({
  matchId: true,
  videoId: true,
});

// GET /api/tagging/events - Get all tagging events with filters
router.get("/events", authenticateToken, async (req, res) => {
  try {
    const { matchId, videoId, playerId, playerName, teamId, eventCategory, eventType, page = 1, limit = 50 } = req.query;
    
    let query = db.select().from(taggingEvents);
    
    // Apply filters
    const conditions: any[] = [];
    
    if (matchId) conditions.push(eq(taggingEvents.matchId, parseInt(matchId as string)));
    if (videoId) conditions.push(eq(taggingEvents.videoId, parseInt(videoId as string)));
    if (playerId) conditions.push(eq(taggingEvents.playerId, parseInt(playerId as string)));
    if (playerName) conditions.push(eq(taggingEvents.playerName, playerName as string));
    if (teamId) conditions.push(eq(taggingEvents.teamId, parseInt(teamId as string)));
    if (eventCategory) conditions.push(eq(taggingEvents.eventCategory, eventCategory as string));
    if (eventType) conditions.push(eq(taggingEvents.eventType, eventType as string));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const events = await query
      .orderBy(desc(taggingEvents.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);
    
    // Get total count for pagination
    let countQuery = db.select({ count: taggingEvents.id }).from(taggingEvents);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalCount = await countQuery;
    
    res.json({
      events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error("Error fetching tagging events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tagging/events - Create a new tagging event
router.post("/events", authenticateToken, async (req, res) => {
  try {
    const validatedData = createTaggingEventSchema.parse(req.body);
    
    // Use video event tags table instead of non-existent tagging_events
    const event = await storage.createVideoEventTag({
      videoId: validatedData.videoId || 10, // Use video ID from request or default
      playerId: validatedData.playerId,
      eventType: validatedData.eventType,
      timestampStart: validatedData.timestamp,
      timestampEnd: validatedData.timestamp + 5, // Default 5-second duration
      fieldX: validatedData.fieldX || 50,
      fieldY: validatedData.fieldY || 50,
      qualityRating: Math.ceil((validatedData.confidenceScore || 100) / 20), // Convert to 1-5 scale
      outcome: validatedData.isSuccessful ? 'successful' : 'unsuccessful',
      description: validatedData.notes || '',
      source: 'manual',
      tags: validatedData.tags || []
    });
    
    // Trigger metrics recalculation for the player
    await recalculatePlayerMetrics(validatedData.matchId, validatedData.playerId, validatedData.playerName);
    
    res.status(201).json({
      success: true,
      event: event[0],
      message: "Tagging event created successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      console.error("Error creating tagging event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// PUT /api/tagging/events/:id - Update a tagging event
router.put("/events/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const validatedData = updateTaggingEventSchema.parse(req.body);
    
    // Check if event exists and user has permission
    const existingEvent = await storage.db.select().from(taggingEvents).where(eq(taggingEvents.id, eventId)).limit(1);
    
    if (existingEvent.length === 0) {
      return res.status(404).json({ error: "Tagging event not found" });
    }
    
    // Only allow creator or admin to update
    if (existingEvent[0].createdBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    const updatedEvent = await storage.db
      .update(taggingEvents)
      .set({
        ...validatedData,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      })
      .where(eq(taggingEvents.id, eventId))
      .returning();
    
    // Trigger metrics recalculation
    await recalculatePlayerMetrics(existingEvent[0].matchId, existingEvent[0].playerId, existingEvent[0].playerName);
    
    res.json({
      success: true,
      event: updatedEvent[0],
      message: "Tagging event updated successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      console.error("Error updating tagging event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// DELETE /api/tagging/events/:id - Delete a tagging event
router.delete("/events/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    // Check if event exists and user has permission
    const existingEvent = await storage.db.select().from(taggingEvents).where(eq(taggingEvents.id, eventId)).limit(1);
    
    if (existingEvent.length === 0) {
      return res.status(404).json({ error: "Tagging event not found" });
    }
    
    // Only allow creator or admin to delete
    if (existingEvent[0].createdBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    await storage.db.delete(taggingEvents).where(eq(taggingEvents.id, eventId));
    
    // Trigger metrics recalculation
    await recalculatePlayerMetrics(existingEvent[0].matchId, existingEvent[0].playerId, existingEvent[0].playerName);
    
    res.json({
      success: true,
      message: "Tagging event deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting tagging event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tagging/events/match/:matchId - Get events for a specific match
router.get("/events/match/:matchId", authenticateToken, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    
    const events = await storage.db
      .select()
      .from(taggingEvents)
      .where(eq(taggingEvents.matchId, matchId))
      .orderBy(asc(taggingEvents.minute), asc(taggingEvents.timestampStart));
    
    // Group events by player for easier processing
    const eventsByPlayer = events.reduce((acc, event) => {
      const playerKey = event.playerId ? `${event.playerId}` : event.playerName;
      if (!acc[playerKey]) {
        acc[playerKey] = {
          playerId: event.playerId,
          playerName: event.playerName,
          teamName: event.teamName,
          events: []
        };
      }
      acc[playerKey].events.push(event);
      return acc;
    }, {} as Record<string, any>);
    
    res.json({
      events,
      eventsByPlayer,
      summary: {
        totalEvents: events.length,
        playerCount: Object.keys(eventsByPlayer).length,
        eventsByCategory: events.reduce((acc, event) => {
          acc[event.eventCategory] = (acc[event.eventCategory] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error("Error fetching match events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tagging/events/player/:playerId - Get events for a specific player
router.get("/events/player/:playerId", authenticateToken, async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);
    const { matchId } = req.query;
    
    let query = storage.db
      .select()
      .from(taggingEvents)
      .where(eq(taggingEvents.playerId, playerId));
    
    if (matchId) {
      query = query.where(and(eq(taggingEvents.playerId, playerId), eq(taggingEvents.matchId, parseInt(matchId as string))));
    }
    
    const events = await query.orderBy(desc(taggingEvents.createdAt));
    
    res.json({
      events,
      summary: {
        totalEvents: events.length,
        successfulEvents: events.filter(e => e.isSuccessful).length,
        averageQuality: events.reduce((sum, e) => sum + e.qualityRating, 0) / events.length || 0,
        eventsByCategory: events.reduce((acc, event) => {
          acc[event.eventCategory] = (acc[event.eventCategory] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error("Error fetching player events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tagging/metrics/player/:playerId - Get aggregated metrics for a player
router.get("/metrics/player/:playerId", authenticateToken, async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);
    const { matchId } = req.query;
    
    let query = storage.db
      .select()
      .from(playerPerformanceMetrics)
      .where(eq(playerPerformanceMetrics.playerId, playerId));
    
    if (matchId) {
      query = query.where(and(eq(playerPerformanceMetrics.playerId, playerId), eq(playerPerformanceMetrics.matchId, parseInt(matchId as string))));
    }
    
    const metrics = await query.orderBy(desc(playerPerformanceMetrics.createdAt));
    
    res.json({
      metrics: metrics.length > 0 ? metrics[0] : null,
      allMetrics: metrics,
      summary: {
        matchesAnalyzed: metrics.length,
        averageRating: metrics.reduce((sum, m) => sum + parseFloat(m.overallRating || "0"), 0) / metrics.length || 0,
        totalGameTime: metrics.reduce((sum, m) => sum + (m.gameTime || 0), 0)
      }
    });
  } catch (error) {
    console.error("Error fetching player metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tagging/event-types - Get all available event types
router.get("/event-types", authenticateToken, async (req, res) => {
  try {
    const { category, position } = req.query;
    
    let eventTypes = COMPREHENSIVE_EVENT_TYPES;
    
    if (category) {
      eventTypes = eventTypes.filter(type => type.category === category);
    }
    
    res.json({
      eventTypes,
      categories: Object.values(EVENT_CATEGORIES),
      summary: {
        totalTypes: eventTypes.length,
        typesByCategory: eventTypes.reduce((acc, type) => {
          acc[type.category] = (acc[type.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error("Error fetching event types:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tagging/batch-events - Create multiple events at once
router.post("/batch-events", authenticateToken, async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "Events array is required" });
    }
    
    // Validate all events
    const validatedEvents = events.map(event => createTaggingEventSchema.parse(event));
    
    // Insert all events
    const createdEvents = await storage.db.insert(taggingEvents).values(
      validatedEvents.map(event => ({
        ...event,
        userId: req.user.id,
        createdBy: req.user.id,
        confidenceScore: event.confidenceScore ?? 100,
        isKeyAction: event.isKeyAction ?? false,
        isCrucialAction: event.isCrucialAction ?? false,
      }))
    ).returning();
    
    // Trigger metrics recalculation for all affected players
    const affectedPlayers = [...new Set(validatedEvents.map(e => ({ matchId: e.matchId, playerId: e.playerId, playerName: e.playerName })))];
    await Promise.all(affectedPlayers.map(player => recalculatePlayerMetrics(player.matchId, player.playerId, player.playerName)));
    
    res.status(201).json({
      success: true,
      events: createdEvents,
      count: createdEvents.length,
      message: `${createdEvents.length} tagging events created successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.errors });
    } else {
      console.error("Error creating batch events:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Helper function to recalculate player metrics
async function recalculatePlayerMetrics(matchId: number, playerId: number | undefined, playerName: string) {
  try {
    // Get all events for this player in this match
    const events = await storage.db
      .select()
      .from(taggingEvents)
      .where(playerId ? 
        and(eq(taggingEvents.matchId, matchId), eq(taggingEvents.playerId, playerId)) :
        and(eq(taggingEvents.matchId, matchId), eq(taggingEvents.playerName, playerName))
      );
    
    if (events.length === 0) return;
    
    // Calculate metrics from events
    const metrics = calculateMetricsFromEvents(events);
    
    // Check if metrics already exist
    const existingMetrics = await storage.db
      .select()
      .from(playerPerformanceMetrics)
      .where(playerId ? 
        and(eq(playerPerformanceMetrics.matchId, matchId), eq(playerPerformanceMetrics.playerId, playerId)) :
        and(eq(playerPerformanceMetrics.matchId, matchId), eq(playerPerformanceMetrics.playerName, playerName))
      )
      .limit(1);
    
    if (existingMetrics.length > 0) {
      // Update existing metrics
      await storage.db
        .update(playerPerformanceMetrics)
        .set({
          ...metrics,
          updatedAt: new Date(),
        })
        .where(eq(playerPerformanceMetrics.id, existingMetrics[0].id));
    } else {
      // Create new metrics
      await storage.db.insert(playerPerformanceMetrics).values({
        matchId,
        playerId: playerId || 0,
        playerName,
        teamId: events[0].teamId,
        teamName: events[0].teamName,
        position: "Unknown", // This should be determined from player data
        gameTime: 90, // Default to full match, should be calculated
        ...metrics,
      });
    }
  } catch (error) {
    console.error("Error recalculating player metrics:", error);
  }
}

// Helper function to calculate metrics from events
function calculateMetricsFromEvents(events: any[]) {
  const metrics: any = {};
  
  // Count events by type
  events.forEach(event => {
    const eventType = event.eventType.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Map event types to metric fields
    const eventMappings: Record<string, string> = {
      'shortpasssimple': 'shortPassSimple',
      'shortpasskey': 'shortPassKey',
      'shortpassunsuccessful': 'shortPassUnsuccessful',
      'shortpassassist': 'shortPassAssist',
      'longpasssimple': 'longPassSimple',
      'longpasskey': 'longPassKey',
      'longpassunsuccessful': 'longPassUnsuccessful',
      'standingtacklesimple': 'standingTackleSimple',
      'standingtacklecrucial': 'standingTackleCrucial',
      'standingtackleunsuccessful': 'standingTackleUnsuccessful',
      'interceptionsimple': 'interceptionSimple',
      'interceptioncrucial': 'interceptionCrucial',
      'closeshotontarget': 'closeShotsOnTarget',
      'longshotontarget': 'longShotsOnTarget',
      'goalfromcloseshot': 'totalGoals',
      'goalfromlongshot': 'totalGoals',
      'goalfromheader': 'totalGoals',
      'groundduelwon': 'groundDuelsWon',
      'groundduellost': 'groundDuelsLost',
      'aerialduelwon': 'aerialDuelsWon',
      'aerialduellost': 'aerialDuelsLost',
    };
    
    const metricField = eventMappings[eventType];
    if (metricField) {
      metrics[metricField] = (metrics[metricField] || 0) + 1;
    }
  });
  
  // Calculate derived metrics
  const totalShots = (metrics.closeShotsOnTarget || 0) + (metrics.longShotsOnTarget || 0);
  const totalGoals = metrics.totalGoals || 0;
  const totalPasses = (metrics.shortPassSimple || 0) + (metrics.shortPassKey || 0) + (metrics.longPassSimple || 0) + (metrics.longPassKey || 0);
  const unsuccessfulPasses = (metrics.shortPassUnsuccessful || 0) + (metrics.longPassUnsuccessful || 0);
  
  if (totalShots > 0) {
    metrics.shotAccuracy = ((totalGoals / totalShots) * 100).toFixed(2);
  }
  
  if (totalPasses > 0) {
    metrics.shortPassAccuracy = (((totalPasses - unsuccessfulPasses) / totalPasses) * 100).toFixed(2);
  }
  
  // Calculate overall rating based on events
  const successfulEvents = events.filter(e => e.isSuccessful).length;
  const averageQuality = events.reduce((sum, e) => sum + e.qualityRating, 0) / events.length;
  metrics.overallRating = ((successfulEvents / events.length) * 5 + averageQuality * 0.5).toFixed(1);
  
  return metrics;
}

export default router;