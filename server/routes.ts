import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  insertUserSchema, insertOrganizationSchema, insertPlayerSchema,
  insertPlayerStatsSchema, insertPlayerVideoSchema, insertMatchPerformanceSchema,
  insertScoutingReportSchema, PlayerSearchFilters
} from "@shared/schema";
import { storage } from "./storage.js";
import { registerAuthRoutes } from "./auth-routes.js";
import { registerAdminRoutes } from "./admin-routes.js";
import { registerSuperAdminRoutes } from "./super-admin-routes.js";
import { registerAIReportsRoutes } from "./ai-reports.js";
import { registerPlayerImportRoutes } from "./player-import.js";
import { registerAIRoutes } from "./ai-gateway.js";
import { registerSubscriptionRoutes } from "./subscription-routes.js";
import { registerTranslationRoutes } from "./translation-routes.js";
import { registerVideoAnalyticsRoutes } from "./video-analytics-routes.js";
import { registerEnhancedVideoAnalyticsRoutes } from "./video-analytics-enhanced.js";
import { registerVideoRoutes } from "./video-routes.js";
import taggingRoutes from "./tagging-routes.js";
import { registerPlayerAnalysisRoutes } from "./player-analysis-routes.js";
import { registerIndependentAnalysisRoutes } from "./independent-analysis-routes.js";
import { registerEnhancedAIRoutes } from "./enhanced-ai-routes.js";
import { registerAnalyticsRoutes } from "./analytics-routes.js";
import { routingAdapter } from "./routing-adapter.js";
import { authenticateToken } from "./auth-routes.js";
import { requireFeature } from "./feature-gate-middleware.js";
import type { AuthenticatedRequest } from "@shared/types.js";
import type { Response } from "express";

// Contact form validation schema
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  organization: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  inquiryType: z.string().min(1, "Inquiry type is required"),
  website: z.string().optional(), // Honeypot field
});

// Future-proof routing configuration
function setupRoutingAdapter() {
  // Register core API routes with the adapter
  routingAdapter.registerRoute({
    path: '/api/health',
    method: 'GET',
    handler: (req, res) => {
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    },
    cache: 30, // 30 second cache
    rateLimit: 60 // 60 requests per minute
  });

  // Register microservices for future expansion
  if (process.env.AI_SERVICE_URL) {
    routingAdapter.registerMicroservice({
      name: 'ai',
      baseUrl: process.env.AI_SERVICE_URL,
      timeout: 30000,
      retries: 3,
      healthEndpoint: '/health'
    });
  }

  // Register serverless functions if available
  if (process.env.SERVERLESS_FUNCTIONS_URL) {
    routingAdapter.registerMicroservice({
      name: 'functions',
      baseUrl: process.env.SERVERLESS_FUNCTIONS_URL,
      timeout: 15000,
      retries: 2,
      healthEndpoint: '/ping'
    });
  }
}

export function registerRoutes(app: Express): Server {
  // For now, keep the existing working system and add future-proof layer
  // Add basic health check endpoint first (before other routes)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Add routing configuration endpoint for debugging
  app.get("/api/routing/config", (req, res) => {
    res.json(routingAdapter.getConfiguration());
  });

  // Add microservices health check endpoint
  app.get("/api/health/microservices", async (req, res) => {
    const health = await routingAdapter.checkMicroservicesHealth();
    res.json({
      status: "ok",
      microservices: health,
      timestamp: new Date().toISOString()
    });
  });

  // Register authentication and admin routes
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerSuperAdminRoutes(app);
  registerAIReportsRoutes(app);
  registerPlayerImportRoutes(app);
  registerAIRoutes(app);
  registerPlayerAnalysisRoutes(app);
  registerSubscriptionRoutes(app);
  registerTranslationRoutes(app);
  registerVideoAnalyticsRoutes(app);
  registerEnhancedVideoAnalyticsRoutes(app);
  registerVideoRoutes(app);
  registerIndependentAnalysisRoutes(app);
  registerEnhancedAIRoutes(app);
  registerAnalyticsRoutes(app);
  
  // Register tagging routes
  app.use("/api/tagging", taggingRoutes);

  // Handle placeholder images with fallbacks
  app.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    const color = req.query.color || '90A4AE';
    const text = req.query.text || `${width}×${height}`;
    
    // Generate SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#${color}" opacity="0.1"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#${color}" text-anchor="middle" dy=".3em">${text}</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate request data
      const validatedData = contactFormSchema.parse(req.body);
      
      // Check honeypot field for bot protection
      if (validatedData.website) {
        return res.status(400).json({ message: "Spam detected" });
      }

      // Log contact submission for admin review
      console.log(`Contact form submission: ${validatedData.email} - ${validatedData.subject}`);
      
      // Send email notification to Platinum Scout team
      try {
        const { sendContactFormEmail } = await import('./email-service.js');
        await sendContactFormEmail({
          customerName: `${validatedData.firstName} ${validatedData.lastName}`,
          customerEmail: validatedData.email,
          organization: validatedData.organization,
          phone: validatedData.phone,
          inquiryType: validatedData.inquiryType,
          subject: validatedData.subject,
          message: validatedData.message
        });
        
        console.log(`Contact form email sent successfully to info@platinumscout.ai`);
      } catch (emailError) {
        console.error('Failed to send contact form email:', emailError);
        // Don't fail the request if email fails
      }
      
      res.json({ 
        message: "Thank you for your inquiry! We'll get back to you within 24 hours.",
        success: true 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });





  // Organization routes
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      res.status(201).json(organization);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/organizations/:id", async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const updates = req.body;
      const organization = await storage.updateOrganization(organizationId, updates);
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/organizations/:id", async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      await storage.deleteOrganization(organizationId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Player routes - More specific routes first!
  


  // Dedicated search endpoint for player database
  app.get("/api/players/search", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { 
        q, position, nationality, ageMin, ageMax, marketValueMin, marketValueMax, 
        clubId, hasVideos, isActive, ageRange, limit = "50", offset = "0" 
      } = req.query;

      // Build filters object
      const filters: PlayerSearchFilters = {};
      
      if (position && position !== "all") {
        filters.position = position as string;
      }
      
      if (nationality && nationality !== "all") {
        filters.nationality = nationality as string;
      }
      
      // Handle age range filter
      if (ageRange && ageRange !== "all") {
        const range = ageRange as string;
        if (range === "16-20") {
          filters.ageMin = 16;
          filters.ageMax = 20;
        } else if (range === "21-25") {
          filters.ageMin = 21;
          filters.ageMax = 25;
        } else if (range === "26-30") {
          filters.ageMin = 26;
          filters.ageMax = 30;
        } else if (range === "31-35") {
          filters.ageMin = 31;
          filters.ageMax = 35;
        } else if (range === "36+") {
          filters.ageMin = 36;
        }
      }
      
      if (ageMin) filters.ageMin = parseInt(ageMin as string);
      if (ageMax) filters.ageMax = parseInt(ageMax as string);
      if (marketValueMin) filters.marketValueMin = parseFloat(marketValueMin as string);
      if (marketValueMax) filters.marketValueMax = parseFloat(marketValueMax as string);
      if (clubId) filters.clubId = parseInt(clubId as string);
      if (hasVideos) filters.hasVideos = hasVideos === "true";
      
      // Handle isActive filter
      if (isActive && isActive !== "all") {
        filters.isActive = isActive === "true";
      }

      // Add pagination to filters
      filters.limit = parseInt(limit as string);
      filters.offset = parseInt(offset as string);

      // Use unified search/filter method that handles both search and filters
      let result;
      
      if (q && typeof q === 'string' && q.trim()) {
        // If there's a search query, use searchPlayers with additional filters
        result = await storage.searchPlayersWithFilters(q, filters);
      } else {
        // No search query, just use regular filtering - call searchPlayersWithFilters with empty query
        result = await storage.searchPlayersWithFilters('', filters);
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Player search error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // General players endpoint (after specific routes) - NO SEARCH HANDLING HERE
  app.get("/api/players", async (req, res) => {
    try {
      const { 
        position, nationality, ageMin, ageMax, marketValueMin, marketValueMax, 
        clubId, hasVideos, limit = "20", offset = "0" 
      } = req.query;

      // Build filters object - no search handling in this endpoint
      const filters: PlayerSearchFilters = {};
      if (position) filters.position = position as string;
      if (nationality) filters.nationality = nationality as string;
      if (ageMin) filters.ageMin = parseInt(ageMin as string);
      if (ageMax) filters.ageMax = parseInt(ageMax as string);
      if (marketValueMin) filters.marketValueMin = parseFloat(marketValueMin as string);
      if (marketValueMax) filters.marketValueMax = parseFloat(marketValueMax as string);
      if (clubId) filters.clubId = parseInt(clubId as string);
      if (hasVideos) filters.hasVideos = hasVideos === "true";

      const players = await storage.getPlayers(
        filters, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json({ players, total: players.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const player = await storage.getPlayer(id);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Handle validation errors
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationErrors,
          details: validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
        });
      }
      
      // Handle database constraint errors
      if (error.code === '23505') {
        return res.status(409).json({ 
          message: "A player with this name already exists in the database" 
        });
      }
      
      console.error('Player creation error:', error);
      res.status(400).json({ 
        message: error.message || "Failed to create player. Please check your data and try again." 
      });
    }
  });

  app.put("/api/players/:id", authenticateToken, requireFeature('editPlayers'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }

      const updates = req.body;
      const player = await storage.updatePlayer(id, updates);
      res.json(player);
    } catch (error: any) {
      console.error('Update player error:', error);
      res.status(400).json({ message: error.message || 'Failed to update player' });
    }
  });

  app.delete("/api/players/:id", authenticateToken, requireFeature('deletePlayers'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }

      // Check if player exists
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      await storage.deletePlayer(id);
      
      // Log admin action for audit trail
      if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
        await storage.logAdminAction({
          adminId: req.user.id,
          targetUserId: null,
          action: 'delete_player',
          details: { 
            deletedPlayer: { 
              id: player.id, 
              name: `${player.firstName} ${player.lastName}`,
              position: player.position,
              nationality: player.nationality
            } 
          },
          ipAddress: req.ip,
        });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Delete player error:', error);
      res.status(400).json({ message: error.message || 'Failed to delete player' });
    }
  });

  // Player stats routes
  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const { season } = req.query;
      const stats = await storage.getPlayerStats(playerId, season as string);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const statsData = insertPlayerStatsSchema.parse({ ...req.body, playerId });
      const stats = await storage.createPlayerStats(statsData);
      res.status(201).json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Video routes
  app.get("/api/players/:id/videos", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const videos = await storage.getPlayerVideos(playerId);
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/players/:id/videos", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const videoData = insertPlayerVideoSchema.parse({ ...req.body, playerId });
      const video = await storage.createPlayerVideo(videoData);
      res.status(201).json(video);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlayerVideo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Match performance routes
  app.get("/api/players/:id/performances", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const { limit = "10" } = req.query;
      const performances = await storage.getMatchPerformances(playerId, parseInt(limit as string));
      res.json(performances);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/players/:id/performances", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const performanceData = insertMatchPerformanceSchema.parse({ ...req.body, playerId });
      const performance = await storage.createMatchPerformance(performanceData);
      res.status(201).json(performance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Scouting report routes
  app.get("/api/scouting-reports", async (req, res) => {
    try {
      const { playerId, scoutId } = req.query;
      const reports = await storage.getScoutingReports(
        playerId ? parseInt(playerId as string) : undefined,
        scoutId ? parseInt(scoutId as string) : undefined
      );
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/players/:id/reports", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const reports = await storage.getScoutingReports(playerId);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/players/:id/reports", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const reportData = insertScoutingReportSchema.parse({ ...req.body, playerId });
      const report = await storage.createScoutingReport(reportData);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/scouting-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const report = await storage.updateScoutingReport(id, updates);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/scouting-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScoutingReport(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard analytics route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      const organizations = await storage.getOrganizations();
      const reports = await storage.getScoutingReports();
      
      const stats = {
        totalPlayers: players.length,
        totalClubs: organizations.filter(org => org.type === 'club').length,
        totalReports: reports.length,
        recentPlayers: players.slice(0, 5),
        topNationalities: getTopNationalities(players),
        positionDistribution: getPositionDistribution(players),
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
function getTopNationalities(players: any[]) {
  const nationalityCount = players.reduce((acc, player) => {
    acc[player.nationality] = (acc[player.nationality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(nationalityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nationality, count]) => ({ nationality, count }));
}

function getPositionDistribution(players: any[]) {
  const positionCount = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(positionCount)
    .map(([position, count]) => ({ position, count }));
}

