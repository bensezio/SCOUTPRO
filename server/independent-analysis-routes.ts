import type { Express, Request, Response } from "express";
import { eq, desc, and, or, like, count } from "drizzle-orm";
import { db } from "./db";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes";
import { 
  independentPlayers, 
  independentAnalysisSessions,
  creditPurchases,
  promotionRequests,
  users,
  type InsertIndependentPlayer,
  type InsertIndependentAnalysisSession,
  type InsertCreditPurchase,
  type InsertPromotionRequest
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/independent-players';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'videos') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for videos'), false);
      }
    } else if (file.fieldname === 'photo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for photos'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

// Validation schemas
const independentPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  preferredFoot: z.enum(["Left", "Right", "Both"]).optional(),
  height: z.number().min(140).max(220).optional(),
  weight: z.number().min(40).max(150).optional(),
  currentClub: z.string().optional(),
  previousClubs: z.array(z.string()).optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  agentContact: z.string().optional(),
});

// Helper function to check user credits and subscription
async function checkUserCredits(userId: number): Promise<{
  canAnalyze: boolean;
  costType: 'free_trial' | 'credits' | 'subscription' | 'one_time_payment';
  creditsRequired: number;
  message?: string;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { canAnalyze: false, costType: 'one_time_payment', creditsRequired: 1, message: 'User not found' };
  }

  // Check if user has used their free analysis
  if (!user.freeAnalysisUsed) {
    return { canAnalyze: true, costType: 'free_trial', creditsRequired: 0 };
  }

  // Check subscription status
  if (user.subscriptionStatus === 'active' && 
      ['academy_pro', 'club_professional', 'enterprise'].includes(user.subscriptionTier)) {
    return { canAnalyze: true, costType: 'subscription', creditsRequired: 0 };
  }

  // Check available credits
  const creditsRequired = 1;
  if (user.creditsRemaining >= creditsRequired) {
    return { canAnalyze: true, costType: 'credits', creditsRequired };
  }

  return { 
    canAnalyze: false, 
    costType: 'one_time_payment', 
    creditsRequired, 
    message: 'Insufficient credits. Please purchase credits or upgrade your subscription.' 
  };
}

// Helper function to deduct credits
async function deductCredits(userId: number, creditsUsed: number, costType: string) {
  if (costType === 'free_trial') {
    await db.update(users)
      .set({ 
        freeAnalysisUsed: true,
        totalIndependentAnalyses: db.select().from(users).where(eq(users.id, userId))[0]?.totalIndependentAnalyses || 0 + 1
      })
      .where(eq(users.id, userId));
  } else if (costType === 'credits') {
    await db.update(users)
      .set({ 
        creditsRemaining: db.select().from(users).where(eq(users.id, userId))[0]?.creditsRemaining || 0 - creditsUsed,
        totalCreditsUsed: db.select().from(users).where(eq(users.id, userId))[0]?.totalCreditsUsed || 0 + creditsUsed,
        totalIndependentAnalyses: db.select().from(users).where(eq(users.id, userId))[0]?.totalIndependentAnalyses || 0 + 1
      })
      .where(eq(users.id, userId));
  } else if (costType === 'subscription') {
    await db.update(users)
      .set({ 
        totalIndependentAnalyses: db.select().from(users).where(eq(users.id, userId))[0]?.totalIndependentAnalyses || 0 + 1
      })
      .where(eq(users.id, userId));
  }
}

export function registerIndependentAnalysisRoutes(app: Express) {
  // Get user's independent players
  app.get('/api/independent-analysis/my-players', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, status, position } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = db.select().from(independentPlayers).where(eq(independentPlayers.userId, req.user!.id));
      
      // Apply filters
      const conditions = [eq(independentPlayers.userId, req.user!.id)];
      if (status && status !== 'all') {
        conditions.push(eq(independentPlayers.analysisStatus, status as string));
      }
      if (position && position !== 'all') {
        conditions.push(eq(independentPlayers.position, position as string));
      }

      if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }

      const [players, totalCount] = await Promise.all([
        query.limit(parseInt(limit as string)).offset(offset).orderBy(desc(independentPlayers.createdAt)),
        db.select({ count: count() }).from(independentPlayers).where(and(...conditions))
      ]);

      res.json({
        players,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching independent players:', error);
      res.status(500).json({ message: 'Failed to fetch players' });
    }
  });

  // Check analysis eligibility
  app.get('/api/independent-analysis/check-eligibility', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eligibility = await checkUserCredits(req.user!.id);
      res.json(eligibility);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      res.status(500).json({ message: 'Failed to check eligibility' });
    }
  });

  // Create independent player analysis
  app.post('/api/independent-analysis/create', 
    authenticateToken, 
    upload.fields([{ name: 'videos', maxCount: 5 }, { name: 'photo', maxCount: 1 }]),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const files = req.files as { videos?: Express.Multer.File[], photo?: Express.Multer.File[] };
        const playerData = independentPlayerSchema.parse(JSON.parse(req.body.playerData));

        // Check if user can create analysis
        const eligibility = await checkUserCredits(req.user!.id);
        if (!eligibility.canAnalyze) {
          return res.status(402).json({ 
            message: eligibility.message,
            requiresPayment: true,
            costType: eligibility.costType,
            creditsRequired: eligibility.creditsRequired
          });
        }

        // Process uploaded files
        const videoFiles = files.videos?.map(file => `/uploads/independent-players/${file.filename}`) || [];
        const photoUrl = files.photo?.[0] ? `/uploads/independent-players/${files.photo[0].filename}` : null;

        // Create independent player record
        const newPlayer: InsertIndependentPlayer = {
          userId: req.user!.id,
          name: playerData.name,
          dateOfBirth: playerData.dateOfBirth ? new Date(playerData.dateOfBirth) : null,
          nationality: playerData.nationality,
          position: playerData.position,
          preferredFoot: playerData.preferredFoot,
          height: playerData.height,
          weight: playerData.weight,
          currentClub: playerData.currentClub,
          previousClubs: playerData.previousClubs ? JSON.stringify(playerData.previousClubs) : null,
          description: playerData.description,
          email: playerData.email,
          phone: playerData.phone,
          agentContact: playerData.agentContact,
          videoFiles: JSON.stringify(videoFiles),
          photoUrl,
          analysisStatus: 'pending',
          paymentStatus: eligibility.costType === 'free_trial' ? 'free_analysis' : 
                        eligibility.costType === 'subscription' ? 'subscription_included' : 'paid',
          creditsUsed: eligibility.creditsRequired,
          paymentMethod: eligibility.costType
        };

        const [createdPlayer] = await db.insert(independentPlayers).values(newPlayer).returning();

        // Deduct credits if applicable
        await deductCredits(req.user!.id, eligibility.creditsRequired, eligibility.costType);

        // Create analysis session record
        const sessionData: InsertIndependentAnalysisSession = {
          userId: req.user!.id,
          independentPlayerId: createdPlayer.id,
          sessionType: 'initial_analysis',
          analysisType: 'performance',
          costType: eligibility.costType,
          creditsCharged: eligibility.creditsRequired,
          amountCharged: eligibility.costType === 'one_time_payment' ? 10.00 : 0.00
        };

        await db.insert(independentAnalysisSessions).values(sessionData);

        // Trigger AI analysis (async)
        setTimeout(async () => {
          try {
            // Call your Python AI service here
            const analysisResults = await triggerAIAnalysis(createdPlayer);
            
            // Update player with results
            await db.update(independentPlayers)
              .set({
                analysisStatus: 'completed',
                analysisResults: analysisResults,
                analysisCompletedAt: new Date()
              })
              .where(eq(independentPlayers.id, createdPlayer.id));
          } catch (error) {
            console.error('AI Analysis failed:', error);
            await db.update(independentPlayers)
              .set({ analysisStatus: 'failed' })
              .where(eq(independentPlayers.id, createdPlayer.id));
          }
        }, 1000);

        res.status(201).json({
          message: 'Independent player analysis created successfully',
          player: createdPlayer,
          eligibility
        });
      } catch (error) {
        console.error('Error creating independent analysis:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Invalid player data', errors: error.errors });
        }
        res.status(500).json({ message: 'Failed to create independent analysis' });
      }
    }
  );

  // Get analysis results
  app.get('/api/independent-analysis/:id/results', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const [player] = await db.select()
        .from(independentPlayers)
        .where(and(
          eq(independentPlayers.id, parseInt(id)),
          eq(independentPlayers.userId, req.user!.id)
        ));

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      // Mark as viewed
      await db.update(independentAnalysisSessions)
        .set({ viewed: true })
        .where(eq(independentAnalysisSessions.independentPlayerId, player.id));

      res.json({
        player,
        results: player.analysisResults,
        status: player.analysisStatus
      });
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      res.status(500).json({ message: 'Failed to fetch analysis results' });
    }
  });

  // Purchase credits
  app.post('/api/independent-analysis/purchase-credits', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { creditsAmount, promoCode } = req.body;
      
      if (!creditsAmount || creditsAmount < 1) {
        return res.status(400).json({ message: 'Invalid credits amount' });
      }

      const pricePerCredit = 5.00; // £5 per credit
      let totalAmount = creditsAmount * pricePerCredit;
      let bonusCredits = 0;
      let discountAmount = 0;

      // Apply bulk discounts
      if (creditsAmount >= 10) {
        bonusCredits = Math.floor(creditsAmount * 0.2); // 20% bonus
      } else if (creditsAmount >= 5) {
        bonusCredits = Math.floor(creditsAmount * 0.1); // 10% bonus
      }

      // Apply promo code discounts
      if (promoCode) {
        if (promoCode === 'FIRST10') {
          discountAmount = totalAmount * 0.1; // 10% off first purchase
        } else if (promoCode === 'BULK20') {
          discountAmount = totalAmount * 0.2; // 20% off bulk purchases
        }
      }

      totalAmount -= discountAmount;

      // In a real implementation, you would integrate with Stripe here
      // For now, we'll simulate a successful payment

      const purchaseData: InsertCreditPurchase = {
        userId: req.user!.id,
        creditsAmount,
        pricePerCredit,
        totalAmount,
        currency: 'GBP',
        paymentProvider: 'stripe',
        paymentStatus: 'completed',
        bonusCredits,
        promotionCode: promoCode,
        discountAmount,
        completedAt: new Date()
      };

      const [purchase] = await db.insert(creditPurchases).values(purchaseData).returning();

      // Update user's credit balance
      const totalCreditsToAdd = creditsAmount + bonusCredits;
      await db.update(users)
        .set({
          creditsRemaining: db.select().from(users).where(eq(users.id, req.user!.id))[0]?.creditsRemaining || 0 + totalCreditsToAdd
        })
        .where(eq(users.id, req.user!.id));

      res.json({
        message: 'Credits purchased successfully',
        purchase,
        creditsAdded: totalCreditsToAdd,
        bonusCredits
      });
    } catch (error) {
      console.error('Error purchasing credits:', error);
      res.status(500).json({ message: 'Failed to purchase credits' });
    }
  });

  // Request promotion to main database
  app.post('/api/independent-analysis/:id/request-promotion', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, additionalInfo, suggestedClub, suggestedLeague } = req.body;

      const [player] = await db.select()
        .from(independentPlayers)
        .where(and(
          eq(independentPlayers.id, parseInt(id)),
          eq(independentPlayers.userId, req.user!.id)
        ));

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      if (player.analysisStatus !== 'completed') {
        return res.status(400).json({ message: 'Analysis must be completed before requesting promotion' });
      }

      const requestData: InsertPromotionRequest = {
        userId: req.user!.id,
        independentPlayerId: player.id,
        requestReason: reason,
        additionalInfo,
        suggestedClub,
        suggestedLeague
      };

      const [request] = await db.insert(promotionRequests).values(requestData).returning();

      // Update player status
      await db.update(independentPlayers)
        .set({ 
          adminReviewStatus: 'pending',
          reviewSubmittedAt: new Date()
        })
        .where(eq(independentPlayers.id, player.id));

      res.json({
        message: 'Promotion request submitted successfully',
        request
      });
    } catch (error) {
      console.error('Error requesting promotion:', error);
      res.status(500).json({ message: 'Failed to request promotion' });
    }
  });

  // Get user's credit history
  app.get('/api/independent-analysis/credit-history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [purchases, totalCount] = await Promise.all([
        db.select()
          .from(creditPurchases)
          .where(eq(creditPurchases.userId, req.user!.id))
          .limit(parseInt(limit as string))
          .offset(offset)
          .orderBy(desc(creditPurchases.createdAt)),
        db.select({ count: count() })
          .from(creditPurchases)
          .where(eq(creditPurchases.userId, req.user!.id))
      ]);

      res.json({
        purchases,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching credit history:', error);
      res.status(500).json({ message: 'Failed to fetch credit history' });
    }
  });
}

// Helper function to trigger AI analysis
async function triggerAIAnalysis(player: any) {
  // This would call your Python ML service
  // For now, return mock analysis results
  return {
    overallRating: Math.floor(Math.random() * 40) + 60, // 60-100
    technical: {
      passing: Math.floor(Math.random() * 30) + 70,
      shooting: Math.floor(Math.random() * 30) + 70,
      dribbling: Math.floor(Math.random() * 30) + 70,
      crossing: Math.floor(Math.random() * 30) + 70,
      finishing: Math.floor(Math.random() * 30) + 70
    },
    physical: {
      pace: Math.floor(Math.random() * 30) + 70,
      strength: Math.floor(Math.random() * 30) + 70,
      stamina: Math.floor(Math.random() * 30) + 70,
      agility: Math.floor(Math.random() * 30) + 70
    },
    mental: {
      positioning: Math.floor(Math.random() * 30) + 70,
      vision: Math.floor(Math.random() * 30) + 70,
      decision_making: Math.floor(Math.random() * 30) + 70,
      concentration: Math.floor(Math.random() * 30) + 70
    },
    marketValue: `£${(Math.random() * 500000 + 50000).toLocaleString()}`,
    recommendations: [
      "Strong technical abilities suitable for professional football",
      "Good physical attributes for the position",
      "Recommended for trial at Championship level clubs"
    ],
    confidence: Math.random() * 0.3 + 0.7 // 70-100%
  };
}