import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Activity, 
  BarChart3, 
  Zap, 
  Star,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Award,
  Clock
} from 'lucide-react';

interface PlayerInsight {
  playerId: number;
  playerName: string;
  position: string;
  overallRating: number;
  technicalScore: number;
  physicalScore: number;
  mentalScore: number;
  totalEvents: number;
  successfulEvents: number;
  keyStrengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

interface MatchInsight {
  totalEvents: number;
  mostFrequentEvent: string;
  successRate: number;
  tacticalAnalysis: string[];
  keyMoments: Array<{
    timestamp: number;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  teamPerformance: {
    possession: number;
    passingAccuracy: number;
    defensiveActions: number;
    attackingThird: number;
  };
}

interface AIInsightsPanelProps {
  matchId?: number;
  videoId?: number;
  playerInsights: PlayerInsight[];
  matchInsights: MatchInsight;
  isLoading?: boolean;
  onRegenerateInsights?: () => void;
}

export function AIInsightsPanel({
  matchId,
  videoId,
  playerInsights = [],
  matchInsights,
  isLoading = false,
  onRegenerateInsights
}: AIInsightsPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInsight | null>(null);
  const [insightType, setInsightType] = useState<'overview' | 'players' | 'tactical'>('overview');

  useEffect(() => {
    if (playerInsights.length > 0 && !selectedPlayer) {
      setSelectedPlayer(playerInsights[0]);
    }
  }, [playerInsights, selectedPlayer]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            Generating AI Insights...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={66} className="w-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyzing video events, player movements, and tactical patterns...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              AI-Powered Analytics Insights
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateInsights}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Regenerate
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {matchInsights?.totalEvents || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {matchInsights?.successRate || 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {playerInsights.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Players Analyzed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Tabs */}
      <Tabs value={insightType} onValueChange={(value) => setInsightType(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="tactical" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tactical
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Key Match Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchInsights?.tacticalAnalysis?.map((insight, index) => (
                  <Alert key={index}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{insight}</AlertDescription>
                  </Alert>
                )) || (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No tactical insights available yet. Upload video and add event tags to generate AI analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          {matchInsights?.teamPerformance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Team Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Possession</span>
                      <span className="text-sm text-gray-600">{matchInsights.teamPerformance.possession}%</span>
                    </div>
                    <Progress value={matchInsights.teamPerformance.possession} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Passing Accuracy</span>
                      <span className="text-sm text-gray-600">{matchInsights.teamPerformance.passingAccuracy}%</span>
                    </div>
                    <Progress value={matchInsights.teamPerformance.passingAccuracy} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Defensive Actions</span>
                      <span className="text-sm text-gray-600">{matchInsights.teamPerformance.defensiveActions}</span>
                    </div>
                    <Progress value={Math.min(matchInsights.teamPerformance.defensiveActions * 2, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Attacking Third Entries</span>
                      <span className="text-sm text-gray-600">{matchInsights.teamPerformance.attackingThird}</span>
                    </div>
                    <Progress value={Math.min(matchInsights.teamPerformance.attackingThird * 3, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Player Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playerInsights
                    .sort((a, b) => b.overallRating - a.overallRating)
                    .map((player, index) => (
                      <div
                        key={player.playerId}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPlayer?.playerId === player.playerId
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <span className="font-medium">{player.playerName}</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {player.position} • {player.totalEvents} events
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getPerformanceColor(player.overallRating)}`}>
                              {player.overallRating}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((player.successfulEvents / player.totalEvents) * 100)}% success
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Player Details */}
            {selectedPlayer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    {selectedPlayer.playerName} Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Scores */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedPlayer.technicalScore)}`}>
                        {selectedPlayer.technicalScore}
                      </div>
                      <div className="text-xs text-gray-600">Technical</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedPlayer.physicalScore)}`}>
                        {selectedPlayer.physicalScore}
                      </div>
                      <div className="text-xs text-gray-600">Physical</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedPlayer.mentalScore)}`}>
                        {selectedPlayer.mentalScore}
                      </div>
                      <div className="text-xs text-gray-600">Mental</div>
                    </div>
                  </div>

                  {/* Overall Rating */}
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedPlayer.overallRating}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {getPerformanceBadge(selectedPlayer.overallRating)}
                    </Badge>
                  </div>

                  {/* Key Strengths */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Key Strengths
                    </h4>
                    <div className="space-y-1">
                      {selectedPlayer.keyStrengths.map((strength, index) => (
                        <div key={index} className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">
                          {strength}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-1">
                      {selectedPlayer.areasForImprovement.map((area, index) => (
                        <div key={index} className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                      AI Recommendations
                    </h4>
                    <div className="space-y-1">
                      {selectedPlayer.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tactical Tab */}
        <TabsContent value="tactical" className="space-y-4">
          {/* Key Moments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                Key Tactical Moments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchInsights?.keyMoments?.map((moment, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Badge 
                      variant={moment.impact === 'high' ? 'destructive' : moment.impact === 'medium' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {Math.floor(moment.timestamp / 60)}:{Math.floor(moment.timestamp % 60).toString().padStart(2, '0')}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{moment.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {moment.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                )) || (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No key moments identified yet. Add more event tags to improve tactical analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}