import express from "express";
import { authenticateToken } from "./auth-routes.js";
import { storage } from "./storage";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const createTaggingEventSchema = z.object({
  videoId: z.number().default(10),
  playerId: z.number().optional(),
  eventType: z.string().min(1),
  timestamp: z.number().min(0),
  fieldX: z.number().min(0).max(100).optional(),
  fieldY: z.number().min(0).max(100).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  isSuccessful: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// GET /api/tagging/events - Get all tagging events
router.get("/events", authenticateToken, async (req, res) => {
  try {
    const { videoId = 10, limit = 50, page = 1 } = req.query;
    
    // Use existing video event tags
    const events = await storage.getVideoEventTags(
      parseInt(videoId as string), 
      parseInt(limit as string), 
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );
    
    res.json({
      events: events || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: events?.length || 0,
        totalPages: Math.ceil((events?.length || 0) / parseInt(limit as string))
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
      videoId: validatedData.videoId,
      playerId: validatedData.playerId,
      taggedBy: req.user.id, // Add required taggedBy field
      eventType: validatedData.eventType,
      timestampStart: validatedData.timestamp,
      timestampEnd: validatedData.timestamp + 5, // Default 5-second duration
      fieldX: validatedData.fieldX || 50,
      fieldY: validatedData.fieldY || 50,
      qualityRating: validatedData.qualityRating || 3,
      outcome: validatedData.isSuccessful ? 'successful' : 'unsuccessful',
      description: validatedData.notes || '',
      source: 'manual',
      tags: validatedData.tags || []
    });
    
    res.status(201).json({
      success: true,
      event,
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

// GET /api/tagging/event-types - Get available event types
router.get("/event-types", authenticateToken, async (req, res) => {
  try {
    const eventTypes = [
      { id: "goal", name: "Goal", category: "shooting" },
      { id: "pass", name: "Pass", category: "passing" },
      { id: "tackle", name: "Tackle", category: "defending" },
      { id: "shot", name: "Shot", category: "shooting" },
      { id: "save", name: "Save", category: "goalkeeping" },
      { id: "foul", name: "Foul", category: "defending" },
      { id: "corner", name: "Corner", category: "set_piece" },
      { id: "throw_in", name: "Throw In", category: "set_piece" },
      { id: "yellow_card", name: "Yellow Card", category: "discipline" },
      { id: "red_card", name: "Red Card", category: "discipline" }
    ];
    
    res.json({ eventTypes });
  } catch (error) {
    console.error("Error fetching event types:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;