import type { Express, Request, Response } from "express";
import { z } from "zod";
import { translationService, SUPPORTED_LANGUAGES, type SupportedLanguage } from "./translation-service";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes";

// Validation schemas
const translateTextSchema = z.object({
  text: z.string().min(1, "Text is required"),
  targetLanguage: z.string().refine(
    (lang) => lang in SUPPORTED_LANGUAGES,
    "Unsupported target language"
  ),
  sourceLanguage: z.string().optional(),
  context: z.enum(['player_bio', 'scouting_report', 'club_description', 'general']).optional()
});

const batchTranslateSchema = z.object({
  texts: z.array(z.string().min(1)).min(1, "At least one text is required").max(10, "Maximum 10 texts per batch"),
  targetLanguage: z.string().refine(
    (lang) => lang in SUPPORTED_LANGUAGES,
    "Unsupported target language"
  ),
  context: z.enum(['player_bio', 'scouting_report', 'club_description', 'general']).optional()
});

const detectLanguageSchema = z.object({
  text: z.string().min(1, "Text is required")
});

export function registerTranslationRoutes(app: Express) {
  
  // Get supported languages - public endpoint for dropdown population
  app.get('/api/translation/languages', async (req: Request, res: Response) => {
    try {
      res.json({
        languages: SUPPORTED_LANGUAGES,
        count: Object.keys(SUPPORTED_LANGUAGES).length
      });
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      res.status(500).json({ error: 'Failed to fetch supported languages' });
    }
  });

  // Translate single text
  app.post('/api/translation/translate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Log request details for debugging
      console.log('Translation request received:', {
        userId: req.user?.id,
        bodyKeys: Object.keys(req.body),
        targetLanguage: req.body.targetLanguage,
        textLength: req.body.text?.length || 0
      });

      // Validate input
      const validation = translateTextSchema.safeParse(req.body);
      if (!validation.success) {
        console.warn('Translation validation failed:', validation.error.errors);
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
          received: req.body
        });
      }

      const { text, targetLanguage, sourceLanguage, context } = validation.data;

      // Additional validation checks
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Text cannot be empty',
          message: 'Please provide valid text to translate'
        });
      }

      if (!targetLanguage || !Object.keys(SUPPORTED_LANGUAGES).includes(targetLanguage)) {
        return res.status(400).json({
          error: 'Invalid target language',
          message: `Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
          received: targetLanguage
        });
      }

      console.log('Attempting translation:', {
        textLength: text.length,
        targetLanguage,
        context: context || 'general',
        userId: req.user?.id
      });

      const result = await translationService.translateText({
        text,
        targetLanguage: targetLanguage as SupportedLanguage,
        sourceLanguage,
        context
      });

      console.log('Translation successful:', {
        confidence: result.confidence,
        originalLength: result.originalText.length,
        translatedLength: result.translatedText.length,
        userId: req.user?.id
      });

      res.json({
        success: true,
        translation: result,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Translation route error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestBody: req.body
      });
      
      // Never throw 500 for expected errors
      if (error.message && error.message.includes('Unsupported target language')) {
        return res.status(400).json({
          error: 'Unsupported language',
          message: error.message
        });
      }

      // For all other errors, provide graceful fallback
      res.status(200).json({
        success: false,
        error: 'Translation service temporarily unavailable',
        message: 'Please try again later or contact support if the issue persists',
        fallback: {
          originalText: req.body.text || '',
          translatedText: req.body.text || '',
          confidence: 0.0,
          note: 'Original text returned due to service issue'
        }
      });
    }
  });

  // Batch translate multiple texts
  app.post('/api/translation/batch', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = batchTranslateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const { texts, targetLanguage, context } = validation.data;

      const results = await translationService.batchTranslate(
        texts,
        targetLanguage as SupportedLanguage,
        context
      );

      res.json({
        success: true,
        translations: results,
        count: results.length,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Batch translation error:', error);
      res.status(500).json({
        error: 'Batch translation failed',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Detect language
  app.post('/api/translation/detect', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = detectLanguageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const { text } = validation.data;
      const result = await translationService.detectLanguage(text);

      res.json({
        success: true,
        detection: result,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Language detection error:', error);
      res.status(500).json({
        error: 'Language detection failed',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Translate player bio specifically
  app.post('/api/translation/player-bio/:playerId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { playerId } = req.params;
      const validation = z.object({
        targetLanguage: z.string().refine(
          (lang) => lang in SUPPORTED_LANGUAGES,
          "Unsupported target language"
        )
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      // This would typically fetch player data from database
      // For now, we'll return a structured response that the frontend can use
      const { targetLanguage } = validation.data;

      res.json({
        success: true,
        playerId: parseInt(playerId),
        targetLanguage,
        message: 'Use the general translate endpoint with context="player_bio" for player bio translation',
        endpoint: '/api/translation/translate'
      });

    } catch (error: any) {
      console.error('Player bio translation error:', error);
      res.status(500).json({
        error: 'Player bio translation failed',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Translation usage statistics (for credit tracking)
  app.get('/api/translation/usage', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // This would typically fetch from database
      // Mock data for now
      const usage = {
        userId: req.user?.id,
        translationsToday: 12,
        translationsThisMonth: 156,
        creditsUsed: 78,
        creditsRemaining: 422,
        mostUsedLanguages: [
          { language: 'French', count: 45 },
          { language: 'Portuguese', count: 32 },
          { language: 'Spanish', count: 28 }
        ],
        recentTranslations: [
          { 
            timestamp: new Date().toISOString(),
            sourceLanguage: 'English',
            targetLanguage: 'French',
            context: 'player_bio',
            characterCount: 245
          }
        ]
      };

      res.json({
        success: true,
        usage,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Translation usage error:', error);
      res.status(500).json({
        error: 'Failed to fetch translation usage',
        message: error?.message || 'Unknown error'
      });
    }
  });
}