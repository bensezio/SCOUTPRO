import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap,
  Trophy,
  Star,
  ArrowRight,
  Brain,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface PlayerAttribute {
  name: string;
  value: number;
  weight: number;
  category: 'technical' | 'physical' | 'mental';
}

interface ComparisonPlayer {
  id: number;
  name: string;
  position: string;
  nationality: string;
  age: number;
  marketValue: number;
  attributes: PlayerAttribute[];
  overallRating: number;
  potentialRating: number;
}

interface AIRecommendation {
  type: 'transfer' | 'development' | 'tactical' | 'comparison';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

interface ComparisonWeights {
  technical: number;
  physical: number;
  mental: number;
  age: number;
  experience: number;
  potential: number;
}

export const EnhancedPlayerComparison: React.FC = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<ComparisonPlayer[]>([]);
  const [comparisonWeights, setComparisonWeights] = useState<ComparisonWeights>({
    technical: 30,
    physical: 25,
    mental: 25,
    age: 10,
    experience: 5,
    potential: 5
  });
  const [analysisMode, setAnalysisMode] = useState<string>('comprehensive');
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available players for comparison
  const { data: playersResponse, isLoading: playersLoading, error: playersError } = useQuery({
    queryKey: ['/api/players'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/players');
      return response.json();
    }
  });

  // Debug logging and safe extraction of players array
  useEffect(() => {
    console.log('🔍 DEBUG - Players Response:', playersResponse);
    console.log('🔍 DEBUG - Players Response Type:', typeof playersResponse);
    console.log('🔍 DEBUG - Players Loading:', playersLoading);
    console.log('🔍 DEBUG - Players Error:', playersError);
  }, [playersResponse, playersLoading, playersError]);

  // Safely extract players array from response
  const availablePlayers = React.useMemo(() => {
    if (!playersResponse) {
      console.log('🔍 DEBUG - No players response, returning empty array');
      return [];
    }
    
    // Handle different response formats
    let players = [];
    if (Array.isArray(playersResponse)) {
      players = playersResponse;
    } else if (playersResponse.players && Array.isArray(playersResponse.players)) {
      players = playersResponse.players;
    } else if (playersResponse.data && Array.isArray(playersResponse.data)) {
      players = playersResponse.data;
    } else {
      console.warn('🚨 DEBUG - Unexpected players response format:', playersResponse);
      return [];
    }
    
    console.log('🔍 DEBUG - Extracted players array:', players.length, 'players');
    return players;
  }, [playersResponse]);

  // Enhanced AI comparison mutation
  const enhancedComparisonMutation = useMutation({
    mutationFn: async (data: { players: ComparisonPlayer[], weights: ComparisonWeights, mode: string }) => {
      const response = await apiRequest('POST', '/api/ai/enhanced-comparison', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.recommendations) {
        setAiRecommendations(data.recommendations);
      }
      toast({
        title: "AI Analysis Complete",
        description: "Enhanced comparison analysis completed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to perform enhanced AI comparison.",
        variant: "destructive"
      });
    }
  });

  // Add player to comparison
  const addPlayerToComparison = (playerId: number) => {
    console.log('🔍 DEBUG - addPlayerToComparison called with playerId:', playerId);
    console.log('🔍 DEBUG - availablePlayers in addPlayerToComparison:', availablePlayers);
    console.log('🔍 DEBUG - availablePlayers is array:', Array.isArray(availablePlayers));
    
    if (selectedPlayers.length >= 4) {
      toast({
        title: "Maximum Players Reached",
        description: "You can compare up to 4 players at once.",
        variant: "destructive"
      });
      return;
    }

    // Ensure availablePlayers is an array before using find
    if (!Array.isArray(availablePlayers)) {
      console.warn('🚨 DEBUG - availablePlayers is not an array in addPlayerToComparison');
      toast({
        title: "Error",
        description: "Player data not loaded properly.",
        variant: "destructive"
      });
      return;
    }

    const player = availablePlayers.find((p: any) => p.id === playerId);
    console.log('🔍 DEBUG - Found player:', player);
    
    if (!player) {
      console.warn('🚨 DEBUG - Player not found with id:', playerId);
      return;
    }

    // Transform player data to comparison format
    const comparisonPlayer: ComparisonPlayer = {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      position: player.position,
      nationality: player.nationality,
      age: player.age,
      marketValue: player.marketValue || 0,
      overallRating: player.overallRating || 0,
      potentialRating: player.potentialRating || 0,
      attributes: [
        { name: 'pace', value: player.pace || 70, weight: 1, category: 'physical' },
        { name: 'shooting', value: player.shooting || 70, weight: 1, category: 'technical' },
        { name: 'passing', value: player.passing || 70, weight: 1, category: 'technical' },
        { name: 'dribbling', value: player.dribbling || 70, weight: 1, category: 'technical' },
        { name: 'defending', value: player.defending || 70, weight: 1, category: 'mental' },
        { name: 'physicality', value: player.physicality || 70, weight: 1, category: 'physical' },
        { name: 'mental_attributes', value: player.mentalAttributes || 70, weight: 1, category: 'mental' },
        { name: 'technical_skills', value: player.technicalSkills || 70, weight: 1, category: 'technical' }
      ]
    };

    setSelectedPlayers(prev => [...prev, comparisonPlayer]);
  };

  // Remove player from comparison
  const removePlayerFromComparison = (playerId: number) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  // Calculate weighted score for a player with safe division
  const getWeightedScore = (player: ComparisonPlayer) => {
    const techAttrs = player.attributes?.filter(attr => attr.category === 'technical') || [];
    const physAttrs = player.attributes?.filter(attr => attr.category === 'physical') || [];
    const mentAttrs = player.attributes?.filter(attr => attr.category === 'mental') || [];
    
    const techScore = techAttrs.length > 0 
      ? techAttrs.reduce((sum, attr) => sum + (attr.value || 0), 0) / techAttrs.length
      : 0;
    
    const physScore = physAttrs.length > 0
      ? physAttrs.reduce((sum, attr) => sum + (attr.value || 0), 0) / physAttrs.length
      : 0;
    
    const mentScore = mentAttrs.length > 0
      ? mentAttrs.reduce((sum, attr) => sum + (attr.value || 0), 0) / mentAttrs.length
      : 0;

    const safeAge = player.age || 25;
    const safePotential = player.potentialRating || 70;

    const score = (
      (techScore * comparisonWeights.technical / 100) +
      (physScore * comparisonWeights.physical / 100) +
      (mentScore * comparisonWeights.mental / 100) +
      ((30 - safeAge) * comparisonWeights.age / 100 * 3) +
      (safePotential * comparisonWeights.potential / 100)
    );

    return isNaN(score) ? 0 : score;
  };

  // Run enhanced AI comparison
  const runEnhancedComparison = () => {
    if (selectedPlayers.length < 2) {
      toast({
        title: "Insufficient Players",
        description: "Select at least 2 players for comparison.",
        variant: "destructive"
      });
      return;
    }

    enhancedComparisonMutation.mutate({
      players: selectedPlayers,
      weights: comparisonWeights,
      mode: analysisMode
    });
  };

  // Weight adjustment handlers
  const updateWeight = (weightKey: keyof ComparisonWeights, value: number) => {
    setComparisonWeights(prev => ({
      ...prev,
      [weightKey]: value
    }));
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get recommendation icon
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'transfer': return <TrendingUp className="w-4 h-4" />;
      case 'development': return <Target className="w-4 h-4" />;
      case 'tactical': return <BarChart3 className="w-4 h-4" />;
      case 'comparison': return <Users className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  // Render player card
  const renderPlayerCard = (player: ComparisonPlayer, index: number) => (
    <Card key={player.id} className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{player.name}</CardTitle>
            <p className="text-sm text-gray-600">{player.position} • {player.nationality}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removePlayerFromComparison(player.id)}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>Age: {player.age}</span>
          <span>Overall: {player.overallRating}</span>
          <span>Potential: {player.potentialRating}</span>
        </div>
        <div className="text-lg font-semibold text-green-600">
          €{((player.marketValue || 0) / 1000000).toFixed(1)}M
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Weighted Score</span>
            <Badge variant="outline" className="text-sm">
              {getWeightedScore(player).toFixed(1)}
            </Badge>
          </div>
          
          {/* Attribute breakdown */}
          <div className="space-y-2">
            {['technical', 'physical', 'mental'].map(category => {
              const categoryAttrs = player.attributes?.filter(attr => attr.category === category) || [];
              const avgValue = categoryAttrs.length > 0 
                ? categoryAttrs.reduce((sum, attr) => sum + (attr.value || 0), 0) / categoryAttrs.length
                : 0;
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-xs capitalize font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={avgValue} className="w-16 h-2" />
                    <span className="text-xs w-8">{isNaN(avgValue) ? 0 : Math.round(avgValue)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top attributes */}
          <div className="mt-3">
            <p className="text-xs font-medium mb-2">Top Attributes</p>
            <div className="flex flex-wrap gap-1">
              {player.attributes
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map(attr => (
                  <Badge key={attr.name} variant="secondary" className="text-xs">
                    {attr.name}: {attr.value}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while players are being fetched
  if (playersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enhanced Player Comparison</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">AI-Powered</Badge>
            <Badge variant="outline">ML Analytics</Badge>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">Loading player data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if there was an error loading players
  if (playersError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enhanced Player Comparison</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">AI-Powered</Badge>
            <Badge variant="outline">ML Analytics</Badge>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="text-lg">Failed to load player data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced Player Comparison</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">AI-Powered</Badge>
          <Badge variant="outline">ML Analytics</Badge>
        </div>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
          <TabsTrigger value="weights">Analysis Weights</TabsTrigger>
          <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          {/* Player Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Player Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Select onValueChange={(value) => addPlayerToComparison(parseInt(value))}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Add player to comparison..." />
                  </SelectTrigger>
                  <SelectContent>
                    {playersLoading ? (
                      <SelectItem value="loading" disabled>Loading players...</SelectItem>
                    ) : playersError ? (
                      <SelectItem value="error" disabled>Error loading players</SelectItem>
                    ) : availablePlayers.length === 0 ? (
                      <SelectItem value="empty" disabled>No players available</SelectItem>
                    ) : (
                      availablePlayers
                        .filter((p: any) => !selectedPlayers.some(sp => sp.id === p.id))
                        .map((player: any) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName} - {player.position}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                
                <Select value={analysisMode} onValueChange={setAnalysisMode}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    <SelectItem value="transfer">Transfer Focus</SelectItem>
                    <SelectItem value="development">Development Focus</SelectItem>
                    <SelectItem value="tactical">Tactical Analysis</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={runEnhancedComparison}
                  disabled={selectedPlayers.length < 2 || enhancedComparisonMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {enhancedComparisonMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  AI Analysis
                </Button>
              </div>

              <p className="text-sm text-gray-600">
                Selected: {selectedPlayers.length}/4 players
              </p>
            </CardContent>
          </Card>

          {/* Player Comparison Grid */}
          {selectedPlayers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedPlayers.map((player, index) => renderPlayerCard(player, index))}
            </div>
          )}

          {/* Comparison Summary */}
          {selectedPlayers.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Comparison Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(selectedPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / selectedPlayers.length)}
                    </p>
                    <p className="text-sm text-gray-600">Avg Age</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      €{(selectedPlayers.reduce((sum, p) => sum + (p.marketValue || 0), 0) / selectedPlayers.length / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-gray-600">Avg Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(selectedPlayers.reduce((sum, p) => sum + (p.overallRating || 0), 0) / selectedPlayers.length)}
                    </p>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {Array.from(new Set(selectedPlayers.map(p => p.position))).length}
                    </p>
                    <p className="text-sm text-gray-600">Positions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Analysis Weight Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Adjust the importance of different factors in the comparison analysis.
                Total weight distribution: {Object.values(comparisonWeights).reduce((a, b) => a + b, 0)}%
              </p>

              {Object.entries(comparisonWeights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize font-medium">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <span className="text-sm font-semibold">{value}%</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(newValue) => updateWeight(key as keyof ComparisonWeights, newValue[0])}
                    max={50}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    {key === 'technical' && 'Shooting, passing, dribbling, technical skills'}
                    {key === 'physical' && 'Pace, physicality, stamina, strength'}
                    {key === 'mental' && 'Mental attributes, defending, decision making'}
                    {key === 'age' && 'Age factor (younger players score higher)'}
                    {key === 'experience' && 'Career experience and achievements'}
                    {key === 'potential' && 'Future development potential'}
                  </p>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setComparisonWeights({
                    technical: 30, physical: 25, mental: 25, age: 10, experience: 5, potential: 5
                  })}
                >
                  Reset Default
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setComparisonWeights({
                    technical: 35, physical: 30, mental: 20, age: 5, experience: 5, potential: 5
                  })}
                >
                  Performance Focus
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setComparisonWeights({
                    technical: 20, physical: 15, mental: 20, age: 20, experience: 10, potential: 15
                  })}
                >
                  Potential Focus
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Driven Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No AI Analysis Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Run an enhanced comparison to get AI-powered insights and recommendations.
                  </p>
                  <Button 
                    onClick={runEnhancedComparison}
                    disabled={selectedPlayers.length < 2}
                    className="flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Generate AI Insights
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiRecommendations.map((recommendation, index) => (
                    <Card key={index} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRecommendationIcon(recommendation.type)}
                            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(recommendation.priority)}
                            >
                              {recommendation.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary">
                              {Math.round(recommendation.confidence)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{recommendation.description}</p>
                        
                        {recommendation.actionItems.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Action Items:
                            </h4>
                            <ul className="space-y-1">
                              {recommendation.actionItems.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start gap-2 text-sm">
                                  <ArrowRight className="w-3 h-3 mt-1 text-gray-400 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ML Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                ML Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {enhancedComparisonMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm">Running enhanced ML analysis...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Enhanced ML service ready</span>
                  </>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium">Market Value Prediction</p>
                  <Badge variant="outline" className="text-xs mt-1">Active</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Player Similarity</p>
                  <Badge variant="outline" className="text-xs mt-1">Active</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Performance Analysis</p>
                  <Badge variant="outline" className="text-xs mt-1">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedPlayerComparison;