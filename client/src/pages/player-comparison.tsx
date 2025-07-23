import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  X, 
  Search,
  BarChart3,
  User,
  Trophy,
  Target,
  Brain,
  TrendingUp,
  TrendingDown,
  Star,
  Zap
} from "lucide-react";

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  secondaryPosition?: string;
  dateOfBirth: string;
  nationality: string;
  currentClub?: string;
  marketValue?: number;
  height?: number;
  weight?: number;
  preferredFoot: string;
  isActive: boolean;
}

export default function PlayerComparison() {
  const { isAuthenticated, user } = useAuth();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null);

  // Fetch all players from database
  const { data: playersData, isLoading } = useQuery({
    queryKey: ["/api/players"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/players?limit=100');
      return response.json();
    },
    enabled: isAuthenticated && !!user,
    retry: 2,
  });

  const availablePlayers: Player[] = playersData?.players || [];

  // Helper functions
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPlayerFullName = (player: Player) => {
    return `${player.firstName} ${player.lastName}`;
  };

  const formatMarketValue = (value?: number) => {
    if (!value) return "N/A";
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  // AI Comparison Functions  
  const calculatePositionCompatibility = (players: Player[]) => {
    const positions = players.map(p => p.position);
    const positionSet = new Set(positions);
    const uniquePositions: string[] = [];
    positionSet.forEach(pos => uniquePositions.push(pos));
    
    // Position similarity scoring
    const positionGroups = {
      'GK': ['GK'],
      'Defense': ['CB', 'LB', 'RB', 'LWB', 'RWB'],
      'Midfield': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
      'Attack': ['LW', 'RW', 'CF', 'ST']
    };
    
    const compatibility = uniquePositions.length === 1 ? 100 : 
                         uniquePositions.length === 2 ? 75 : 50;
    
    return { compatibility, positions: uniquePositions };
  };

  const calculatePhysicalFitness = (player: Player) => {
    const age = calculateAge(player.dateOfBirth);
    const height = player.height || 175;
    const weight = player.weight || 70;
    
    // BMI calculation
    const bmi = weight / ((height / 100) ** 2);
    const idealBMI = player.position === 'GK' ? [22, 25] : 
                     ['CB', 'CDM'].includes(player.position) ? [23, 26] : [20, 24];
    
    const bmiScore = (bmi >= idealBMI[0] && bmi <= idealBMI[1]) ? 90 : 
                     (Math.abs(bmi - ((idealBMI[0] + idealBMI[1]) / 2)) < 2) ? 70 : 50;
    
    const ageScore = age <= 22 ? 100 : age <= 25 ? 90 : age <= 28 ? 80 : 60;
    
    return {
      overall: Math.round((bmiScore + ageScore) / 2),
      bmi: Math.round(bmi * 10) / 10,
      ageScore,
      bmiScore
    };
  };

  const calculateEuropeanLeagueReadiness = (player: Player) => {
    const age = calculateAge(player.dateOfBirth);
    const marketValue = player.marketValue || 0;
    
    // Scoring factors for European readiness
    const ageReadiness = age >= 18 && age <= 26 ? 100 : age < 18 ? 60 : 80;
    const valueReadiness = marketValue >= 1000000 ? 100 : 
                          marketValue >= 500000 ? 80 : 
                          marketValue >= 100000 ? 60 : 40;
    
    const physicalReadiness = calculatePhysicalFitness(player).overall;
    
    const overall = Math.round((ageReadiness + valueReadiness + physicalReadiness) / 3);
    
    return {
      overall,
      factors: {
        age: ageReadiness,
        marketValue: valueReadiness,
        physical: physicalReadiness
      },
      recommendation: overall >= 80 ? 'Ready for top European leagues' :
                     overall >= 60 ? 'Suitable for mid-tier European clubs' :
                     'Needs development before European move'
    };
  };

  const generateAIInsights = (players: Player[]) => {
    if (players.length < 2) return null;
    
    const compatibility = calculatePositionCompatibility(players);
    const readinessScores = players.map(p => ({
      player: p,
      readiness: calculateEuropeanLeagueReadiness(p),
      fitness: calculatePhysicalFitness(p)
    }));
    
    const bestCandidate = readinessScores.reduce((best, current) => 
      current.readiness.overall > best.readiness.overall ? current : best
    );
    
    const averageAge = players.reduce((sum, p) => sum + calculateAge(p.dateOfBirth), 0) / players.length;
    
    return {
      compatibility,
      readinessScores,
      bestCandidate,
      insights: {
        averageAge: Math.round(averageAge * 10) / 10,
        mostReadyPlayer: getPlayerFullName(bestCandidate.player),
        positionDiversity: compatibility.positions.length > 1 ? 'High' : 'Low',
        overallRecommendation: bestCandidate.readiness.recommendation
      }
    };
  };

  // Filter available players based on search term
  const filteredPlayers = availablePlayers.filter(player =>
    getPlayerFullName(player).toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.currentClub && player.currentClub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addPlayerToComparison = (player: Player) => {
    if (selectedPlayers.length < 4 && !selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const removePlayerFromComparison = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const clearComparison = () => {
    setSelectedPlayers([]);
    setAiAnalysisResults(null);
  };

  const runAIAnalysis = async () => {
    if (selectedPlayers.length < 2) return;
    
    setAiAnalysisLoading(true);
    try {
      const response = await fetch('/api/ai/compare-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          playerIds: selectedPlayers.map(p => p.id)
        })
      });
      
      if (response.ok) {
        const results = await response.json();
        setAiAnalysisResults(results);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Player Comparison
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Loading players...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Player Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare up to 4 players side by side
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{selectedPlayers.length}/4 Selected</span>
          </Badge>
          {selectedPlayers.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearComparison}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Player Selection */}
      <Card className="animate-slide-in-right" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Select Players</span>
          </CardTitle>
          <CardDescription>
            Search and add players to compare their profiles ({availablePlayers.length} players available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search players by name, position, club, or nationality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Available Players Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
              {filteredPlayers.slice(0, 12).map((player) => (
                <div
                  key={player.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedPlayers.find(p => p.id === player.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => addPlayerToComparison(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {getPlayerFullName(player)}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {player.position}
                        </Badge>
                        <span>{player.nationality}</span>
                        <span>Age {calculateAge(player.dateOfBirth)}</span>
                      </div>
                      {player.currentClub && (
                        <p className="text-xs text-gray-600 mt-1">{player.currentClub}</p>
                      )}
                    </div>
                    <div className="ml-2">
                      {selectedPlayers.find(p => p.id === player.id) ? (
                        <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No players found matching your search</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedPlayers.length > 1 && (
        <Card className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Player Comparison</span>
              </CardTitle>
              <Button 
                onClick={runAIAnalysis} 
                disabled={aiAnalysisLoading || selectedPlayers.length < 2}
                className="flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>{aiAnalysisLoading ? 'Analyzing...' : 'AI Analysis'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Player Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {selectedPlayers.map((player) => (
                  <Card key={player.id} className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      onClick={() => removePlayerFromComparison(player.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {getPlayerFullName(player)}
                            </h3>
                            <p className="text-xs text-gray-500">{player.position}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Age:</span>
                            <span>{calculateAge(player.dateOfBirth)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Nationality:</span>
                            <span>{player.nationality}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Club:</span>
                            <span className="truncate">{player.currentClub || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Market Value:</span>
                            <span>{formatMarketValue(player.marketValue)}</span>
                          </div>
                          {player.height && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Height:</span>
                              <span>{player.height}cm</span>
                            </div>
                          )}
                          {player.weight && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Weight:</span>
                              <span>{player.weight}kg</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Preferred Foot:</span>
                            <span className="capitalize">{player.preferredFoot}</span>
                          </div>
                          {player.secondaryPosition && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Secondary Pos:</span>
                              <span>{player.secondaryPosition}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* AI Analysis Section */}
              {(() => {
                const aiInsights = generateAIInsights(selectedPlayers);
                return aiInsights && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-4 flex items-center space-x-2 text-blue-900 dark:text-blue-100">
                      <Brain className="h-5 w-5" />
                      <span>AI Analysis & European League Readiness</span>
                    </h4>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Best Candidate */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">Top European Prospect</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {aiInsights.insights.mostReadyPlayer}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {aiInsights.bestCandidate.readiness.recommendation}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Overall Readiness:</span>
                            <span className="font-semibold">{aiInsights.bestCandidate.readiness.overall}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                aiInsights.bestCandidate.readiness.overall >= 80 ? 'bg-green-500' :
                                aiInsights.bestCandidate.readiness.overall >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${aiInsights.bestCandidate.readiness.overall}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Position Compatibility */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Position Analysis</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Compatibility Score:</span>
                            <span className="font-semibold">{aiInsights.compatibility.compatibility}%</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {aiInsights.compatibility.positions.map(pos => (
                              <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {aiInsights.insights.positionDiversity === 'High' 
                              ? 'Diverse positions - good for tactical flexibility'
                              : 'Similar positions - ideal for direct comparison'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Individual Readiness Scores */}
                    <div className="mt-6">
                      <h5 className="font-medium mb-3 flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Individual European League Readiness</span>
                      </h5>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {aiInsights.readinessScores.map(({ player, readiness, fitness }) => (
                          <div key={player.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <p className="font-medium text-sm truncate">{getPlayerFullName(player)}</p>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Overall:</span>
                                <span className="font-semibold">{readiness.overall}%</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Age Factor:</span>
                                  <span>{readiness.factors.age}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Market Value:</span>
                                  <span>{readiness.factors.marketValue}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Physical:</span>
                                  <span>{readiness.factors.physical}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span>AI Recommendations for European Clubs</span>
                      </h5>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <p>• <strong>Best Overall Prospect:</strong> {aiInsights.insights.mostReadyPlayer} - {aiInsights.bestCandidate.readiness.recommendation}</p>
                        <p>• <strong>Average Age:</strong> {aiInsights.insights.averageAge} years - {aiInsights.insights.averageAge <= 24 ? 'Great age profile for development' : 'Experienced group ready for immediate impact'}</p>
                        <p>• <strong>Position Diversity:</strong> {aiInsights.insights.positionDiversity} - {aiInsights.insights.positionDiversity === 'High' ? 'Offers tactical flexibility for different formations' : 'Perfect for clubs seeking specific position reinforcement'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Comparison Stats */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Quick Comparison</span>
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Average Age</p>
                    <p className="text-lg font-semibold">
                      {(selectedPlayers.reduce((sum, p) => sum + calculateAge(p.dateOfBirth), 0) / selectedPlayers.length).toFixed(1)} years
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Positions</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(selectedPlayers.map(p => p.position))).map(pos => (
                        <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Countries</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(selectedPlayers.map(p => p.nationality))).map(country => (
                        <Badge key={country} variant="outline" className="text-xs">{country}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedPlayers.length === 0 && (
        <Card className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Start Your Player Comparison
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select at least 2 players from the search above to begin comparing their profiles
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>Compare up to 4 players</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>Side-by-side comparison</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPlayers.length === 1 && (
        <Card className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="py-8">
            <div className="text-center">
              <Plus className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Add Another Player
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have selected {getPlayerFullName(selectedPlayers[0])}. Add at least one more player to start comparing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}