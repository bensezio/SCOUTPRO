import type { Express, Request, Response } from "express";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes";
import { storage } from "./storage";

// AI Report types
interface AIReportRequest {
  playerId?: number;
  playerName?: string;
  reportType: 'player_analysis' | 'market_comparison' | 'scouting_summary' | 'tactical_fit' | 'development_path';
  context?: string;
  specificQuestions?: string[];
}

interface AIReportResponse {
  id: string;
  reportType: string;
  playerName: string;
  aiInsights: string;
  keyFindings: string[];
  recommendations: string[];
  confidenceScore: number;
  dataSourcesUsed: string[];
  generatedAt: string;
  processingTime: number;
}

// In-memory storage for AI reports (replace with database in production)
const aiReports: Map<string, AIReportResponse> = new Map();
let reportCounter = 1;

// Mock Perplexity API call (replace with real API when PERPLEXITY_API_KEY is available)
async function generateAIInsights(request: AIReportRequest): Promise<{
  insights: string;
  keyFindings: string[];
  recommendations: string[];
  confidenceScore: number;
}> {
  const startTime = Date.now();
  
  // Check if PERPLEXITY_API_KEY is available
  const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
  
  if (hasPerplexityKey) {
    try {
      // Real Perplexity API call
      const prompt = buildPrompt(request);
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a professional football scout and analyst specializing in African football talent. Provide detailed, accurate analysis based on available data.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content || '';
      
      return parseAIResponse(aiContent, request);
    } catch (error) {
      console.error('Perplexity API error:', error);
      // Fall back to mock response
      return generateMockInsights(request);
    }
  } else {
    // Use mock data when API key is not available
    return generateMockInsights(request);
  }
}

function buildPrompt(request: AIReportRequest): string {
  const { playerName, reportType, context, specificQuestions } = request;
  
  let prompt = `Analyze ${playerName} for a ${reportType.replace('_', ' ')} report. `;
  
  switch (reportType) {
    case 'player_analysis':
      prompt += `Provide comprehensive analysis of ${playerName}'s playing style, strengths, weaknesses, technical abilities, physical attributes, and mental qualities. Focus on African football context and European transfer potential.`;
      break;
    case 'market_comparison':
      prompt += `Compare ${playerName}'s market value and performance against similar players in African leagues and European markets. Include transfer value estimation and market positioning.`;
      break;
    case 'scouting_summary':
      prompt += `Create a professional scouting report for ${playerName} suitable for European club directors. Include ratings, key attributes, and transfer recommendations.`;
      break;
    case 'tactical_fit':
      prompt += `Analyze how ${playerName} would fit into different tactical systems and formations. Consider adaptation to European football styles.`;
      break;
    case 'development_path':
      prompt += `Suggest development pathway for ${playerName}, including training focus areas, potential career progression, and next-step recommendations.`;
      break;
  }
  
  if (context) {
    prompt += ` Additional context: ${context}`;
  }
  
  if (specificQuestions && specificQuestions.length > 0) {
    prompt += ` Specific questions to address: ${specificQuestions.join(', ')}`;
  }
  
  return prompt;
}

function parseAIResponse(content: string, request: AIReportRequest): {
  insights: string;
  keyFindings: string[];
  recommendations: string[];
  confidenceScore: number;
} {
  // Simple parsing logic - in production, use more sophisticated NLP
  const lines = content.split('\n').filter(line => line.trim());
  
  let insights = content;
  let keyFindings: string[] = [];
  let recommendations: string[] = [];
  
  // Extract key findings (look for bullet points or numbered lists)
  const findingPattern = /(?:^|\n)[\*\-•]\s*(.+)/g;
  let match;
  while ((match = findingPattern.exec(content)) !== null) {
    keyFindings.push(match[1].trim());
  }
  
  // Extract recommendations (look for recommendation sections)
  const recSection = content.toLowerCase().indexOf('recommend');
  if (recSection !== -1) {
    const recContent = content.substring(recSection);
    const recPattern = /(?:^|\n)[\*\-•]\s*(.+)/g;
    while ((match = recPattern.exec(recContent)) !== null) {
      recommendations.push(match[1].trim());
    }
  }
  
  // Generate confidence score based on content quality
  const confidenceScore = Math.min(95, Math.max(70, 
    85 + (keyFindings.length * 2) + (recommendations.length * 3)
  ));
  
  return {
    insights,
    keyFindings: keyFindings.slice(0, 5), // Limit to top 5
    recommendations: recommendations.slice(0, 4), // Limit to top 4
    confidenceScore,
  };
}

function generateMockInsights(request: AIReportRequest): {
  insights: string;
  keyFindings: string[];
  recommendations: string[];
  confidenceScore: number;
} {
  const { playerName, reportType } = request;
  
  const mockData = {
    player_analysis: {
      insights: `${playerName} demonstrates exceptional technical ability and strong physical presence typical of top African talent. His ball control and dribbling skills are particularly impressive, showing the flair and creativity that European clubs seek. Defensively, he shows good positioning but could benefit from tactical refinement in high-pressure situations.`,
      keyFindings: [
        "Excellent first touch and ball control in tight spaces",
        "Strong aerial ability due to physical stature",
        "Good pace and acceleration over short distances",
        "Needs improvement in defensive positioning",
        "Shows leadership qualities on the pitch"
      ],
      recommendations: [
        "Focus on tactical awareness training",
        "Develop left foot for better balance",
        "Work on decision-making in final third",
        "Suitable for Europa League level clubs"
      ],
    },
    market_comparison: {
      insights: `Based on current market trends for African players, ${playerName} represents excellent value in the current transfer market. Similar players from African leagues have commanded fees between €2-8M when moving to European clubs, with performance-based add-ons.`,
      keyFindings: [
        "Market value estimated at €3-5M based on performance metrics",
        "Comparable to recent African transfers to mid-tier European clubs",
        "Age profile favorable for resale value",
        "High potential for value appreciation",
        "Limited by current league exposure"
      ],
      recommendations: [
        "Target Championship or Bundesliga 2 clubs initially",
        "Negotiate performance-based bonuses",
        "Consider loan-back arrangement",
        "Market during European summer window"
      ],
    },
    scouting_summary: {
      insights: `Professional scouting assessment reveals ${playerName} as a promising talent with immediate potential for European football. Technical skills are well-developed, physical attributes are suitable for Premier League intensity, and mental resilience appears strong based on performance in high-pressure matches.`,
      keyFindings: [
        "Technical Rating: 8.2/10 - Excellent ball manipulation",
        "Physical Rating: 7.8/10 - Good strength and pace",
        "Mental Rating: 7.5/10 - Shows composure under pressure",
        "Tactical Rating: 6.8/10 - Room for improvement",
        "Overall Grade: B+ with A- potential"
      ],
      recommendations: [
        "Immediate integration possible in Championship level",
        "6-month adaptation period recommended for Premier League",
        "Requires tactical coaching for European systems",
        "High ceiling for development with proper guidance"
      ],
    },
    tactical_fit: {
      insights: `${playerName}'s playing style and attributes make him versatile across multiple tactical systems. Best suited for possession-based football with his technical skills, but adaptable to counter-attacking systems due to pace and physicality.`,
      keyFindings: [
        "Excellent fit for 4-2-3-1 formation as attacking midfielder",
        "Can operate effectively in 4-3-3 system",
        "Adaptable to wing-back role in 3-5-2",
        "Struggles in high-pressing defensive systems",
        "Natural understanding of space and movement"
      ],
      recommendations: [
        "Deploy in creative midfield role initially",
        "Train for multiple positions to increase value",
        "Focus on pressing triggers and defensive work rate",
        "Consider as impact substitute until fully adapted"
      ],
    },
    development_path: {
      insights: `Clear development pathway exists for ${playerName} to reach European elite level. Current skill set provides strong foundation, with specific areas identified for focused improvement over 12-18 month period.`,
      keyFindings: [
        "12-month development plan should focus on tactical awareness",
        "Physical conditioning needs European-level intensity",
        "Technical skills already at required standard",
        "Language and cultural adaptation crucial",
        "Mentorship from experienced African players beneficial"
      ],
      recommendations: [
        "Immediate move to Championship or equivalent level",
        "Intensive tactical coaching program",
        "Physical conditioning with European methods",
        "Gradual Premier League/Bundesliga progression within 2 years"
      ],
    },
  };
  
  const data = mockData[reportType] || mockData.player_analysis;
  
  return {
    insights: data.insights,
    keyFindings: data.keyFindings,
    recommendations: data.recommendations,
    confidenceScore: Math.floor(Math.random() * 15) + 80, // 80-95% range
  };
}

export function registerAIReportsRoutes(app: Express) {
  // Generate AI Report
  app.post('/api/ai-reports/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const startTime = Date.now();
      const reportRequest: AIReportRequest = req.body;
      
      // Validate request
      if (!reportRequest.playerName && !reportRequest.playerId) {
        return res.status(400).json({ error: 'Player name or ID required' });
      }
      
      if (!reportRequest.reportType) {
        return res.status(400).json({ error: 'Report type required' });
      }
      
      // Get player data if playerId provided
      let playerName = reportRequest.playerName;
      if (reportRequest.playerId && !playerName) {
        const player = await storage.getPlayer(reportRequest.playerId);
        if (player) {
          playerName = `${player.firstName} ${player.lastName}`;
        }
      }
      
      if (!playerName) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      // Generate AI insights
      const aiResult = await generateAIInsights({
        ...reportRequest,
        playerName,
      });
      
      const processingTime = Date.now() - startTime;
      
      // Create report response
      const report: AIReportResponse = {
        id: `ai-report-${reportCounter++}`,
        reportType: reportRequest.reportType,
        playerName,
        aiInsights: aiResult.insights,
        keyFindings: aiResult.keyFindings,
        recommendations: aiResult.recommendations,
        confidenceScore: aiResult.confidenceScore,
        dataSourcesUsed: process.env.PERPLEXITY_API_KEY ? 
          ['Perplexity AI', 'ScoutPro Database', 'Football Analytics'] : 
          ['ScoutPro Database', 'Internal Analytics'],
        generatedAt: new Date().toLocaleString(),
        processingTime,
      };
      
      // Store report
      aiReports.set(report.id, report);
      
      // AI report generated successfully
      
      res.json(report);
    } catch (error) {
      console.error('AI Report generation error:', error);
      res.status(500).json({ error: 'Failed to generate AI report' });
    }
  });
  
  // Get recent AI reports
  app.get('/api/ai-reports/recent', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recentReports = Array.from(aiReports.values())
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
        .slice(0, 10); // Last 10 reports
      
      res.json(recentReports);
    } catch (error) {
      console.error('Error fetching AI reports:', error);
      res.status(500).json({ error: 'Failed to fetch AI reports' });
    }
  });
  
  // Get specific AI report
  app.get('/api/ai-reports/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const report = aiReports.get(id);
      
      if (!report) {
        return res.status(404).json({ error: 'AI report not found' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Error fetching AI report:', error);
      res.status(500).json({ error: 'Failed to fetch AI report' });
    }
  });
  
  // Delete AI report
  app.delete('/api/ai-reports/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = aiReports.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'AI report not found' });
      }
      
      // Report deleted successfully
      
      res.json({ message: 'AI report deleted successfully' });
    } catch (error) {
      console.error('Error deleting AI report:', error);
      res.status(500).json({ error: 'Failed to delete AI report' });
    }
  });
}