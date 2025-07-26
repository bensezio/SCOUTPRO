import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FOOTBALL_POSITIONS } from "@shared/constants";
import { 
  Activity,
  Search,
  BarChart,
  Radar,
  TrendingUp,
  Users,
  Target,
  Brain,
  Zap,
  Trophy,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  GitCompare
} from "lucide-react";

interface Player {
  Name: string;
  Position: string;
  Age: number;
  League: string;
  Player_Rating: number;
}

interface PlayerAnalysis {
  player_name: string;
  basic_info: {
    age: number;
    height: number;
    weight: number;
    position: string;
    league: string;
  };
  performance_metrics: {
    goals: number;
    assists: number;
    passes: number;
    shots: number;
  };
  physical_attributes: {
    speed: number;
    endurance: number;
    power: number;
  };
  ratings: {
    overall_rating: number;
    technical_score: number;
    physical_score: number;
    attacking_score: number;
  };
  market_analysis: {
    current_value: number;
    predicted_value: number;
    value_trend: string;
  };
  position_analysis: {
    key_strengths: string[];
    areas_for_improvement: string[];
    position_rank: number;
  };
  peer_comparison: {
    [key: string]: {
      player_value: number;
      position_average: number;
      percentile: number;
    };
  };
  recommendations: string[];
  visualizations: {
    radar_chart: string;
  };
}

interface PlayerComparison {
  players: string[];
  comparison_table: {
    data: any[];
    attributes: string[];
  };
  statistical_analysis: {
    [key: string]: {
      mean: number;
      std: number;
      min: number;
      max: number;
      best_player: string;
    };
  };
  visualizations: {
    comparison_radar: string;
  };
  insights: string[];
}

export function PlayerAnalysisInterface() {
  const [activeTab, setActiveTab] = useState("individual");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  
  const { toast } = useToast();

  // Fetch available players through the main API
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/player-analysis/players'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/player-analysis/players');
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Individual player analysis mutation
  const playerAnalysisMutation = useMutation({
    mutationFn: async (playerName: string) => {
      const response = await apiRequest('POST', '/api/player-analysis/analyze', { player_name: playerName });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to analyze player";
      const isServiceUnavailable = errorMessage.includes('503') || errorMessage.includes('unavailable');
      
      toast({
        title: isServiceUnavailable ? "Analysis Service Unavailable" : "Analysis Failed",
        description: isServiceUnavailable 
          ? "The ML analysis service is temporarily unavailable. Player data is validated against live database. Please try again later."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Player comparison mutation
  const comparisonMutation = useMutation({
    mutationFn: async (playerNames: string[]) => {
      const response = await apiRequest('POST', '/api/player-analysis/compare', { player_names: playerNames });
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Comparison Failed",
        description: error.message || "Failed to compare players",
        variant: "destructive",
      });
    },
  });

  const players = playersData?.players || [];
  
  // Debug logging for filter operations
  console.log('🔍 Filter Debug:', {
    totalPlayers: players.length,
    searchTerm,
    selectedPosition,
    availablePositions: Array.from(new Set(players.map((p: Player) => p.Position))),
    rawPlayers: players.slice(0, 3) // Show first 3 players for debugging
  });
  
  const filteredPlayers = players.filter((player: Player) => {
    const matchesSearch = searchTerm === "" || player.Name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === "all" || player.Position.toLowerCase().includes(selectedPosition.toLowerCase());
    
    // Debug individual player filtering
    const matches = matchesSearch && matchesPosition;
    if (!matches) {
      console.log('❌ Player filtered out:', {
        name: player.Name,
        position: player.Position,
        searchTerm,
        selectedPosition,
        matchesSearch,
        matchesPosition
      });
    }
    
    return matches;
  });
  
  console.log('✅ Filtered Results:', {
    filteredCount: filteredPlayers.length,
    filteredPlayers: filteredPlayers.map((p: Player) => ({ name: p.Name, position: p.Position }))
  });

  const handlePlayerAnalysis = () => {
    if (!selectedPlayer) {
      toast({
        title: "No Player Selected",
        description: "Please select a player to analyze",
        variant: "destructive",
      });
      return;
    }
    playerAnalysisMutation.mutate(selectedPlayer);
  };

  const handlePlayerComparison = () => {
    if (selectedPlayers.length < 2) {
      toast({
        title: "Insufficient Players",
        description: "Please select at least 2 players to compare",
        variant: "destructive",
      });
      return;
    }
    comparisonMutation.mutate(selectedPlayers);
  };

  const togglePlayerSelection = (playerName: string) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerName));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, playerName]);
    } else {
      toast({
        title: "Maximum Players",
        description: "You can compare up to 4 players at once",
        variant: "destructive",
      });
    }
  };

  const renderPlayerAnalysis = (analysis: PlayerAnalysis) => (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {analysis.player_name} - Player Profile
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of player performance and attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Age:</span>
                  <span>{analysis.basic_info.age}</span>
                </div>
                <div className="flex justify-between">
                  <span>Height:</span>
                  <span>{analysis.basic_info.height} cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight:</span>
                  <span>{analysis.basic_info.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Position:</span>
                  <Badge variant="secondary">{analysis.basic_info.position}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>League:</span>
                  <span>{analysis.basic_info.league}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Goals:</span>
                  <span className="font-medium">{analysis.performance_metrics.goals}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assists:</span>
                  <span className="font-medium">{analysis.performance_metrics.assists}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passes:</span>
                  <span className="font-medium">{analysis.performance_metrics.passes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shots:</span>
                  <span className="font-medium">{analysis.performance_metrics.shots}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Physical Attributes</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Speed</span>
                    <span>{analysis.physical_attributes.speed}/100</span>
                  </div>
                  <Progress value={analysis.physical_attributes.speed} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Endurance</span>
                    <span>{analysis.physical_attributes.endurance}/100</span>
                  </div>
                  <Progress value={analysis.physical_attributes.endurance} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Power</span>
                    <span>{analysis.physical_attributes.power}/100</span>
                  </div>
                  <Progress value={analysis.physical_attributes.power} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings and Market Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Performance Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Overall Rating</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {analysis.ratings.overall_rating}
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technical Score</span>
                    <span>{analysis.ratings.technical_score}</span>
                  </div>
                  <Progress value={(analysis.ratings.technical_score / 50) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Physical Score</span>
                    <span>{analysis.ratings.physical_score}</span>
                  </div>
                  <Progress value={analysis.ratings.physical_score} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attacking Score</span>
                    <span>{analysis.ratings.attacking_score}</span>
                  </div>
                  <Progress value={(analysis.ratings.attacking_score / 50) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Current Value</span>
                <span className="font-semibold">€{analysis.market_analysis.current_value}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Predicted Value</span>
                <span className="font-semibold">€{analysis.market_analysis.predicted_value}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Value Trend</span>
                <Badge 
                  variant={analysis.market_analysis.value_trend === 'rising' ? 'default' : 
                          analysis.market_analysis.value_trend === 'declining' ? 'destructive' : 'secondary'}
                >
                  {analysis.market_analysis.value_trend}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Rank: #{analysis.position_analysis.position_rank} in {analysis.basic_info.position}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.position_analysis.key_strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Development Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              {analysis.position_analysis.areas_for_improvement.map((area, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{area}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <h5 className="font-medium mb-2">Recommendations:</h5>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      {analysis.visualizations.radar_chart && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              Attribute Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img 
                src={analysis.visualizations.radar_chart} 
                alt="Player Attributes Radar Chart"
                className="max-w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPlayerComparison = (comparison: PlayerComparison) => (
    <div className="space-y-6">
      {/* Comparison Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Player Comparison - {comparison.players.join(" vs ")}
          </CardTitle>
          <CardDescription>
            Statistical analysis and performance comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Insights */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Key Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comparison.insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium">
                    Attribute
                  </th>
                  {comparison.players.map((player) => (
                    <th key={player} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-medium">
                      {player}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.comparison_table.attributes.slice(4).map((attr) => (
                  <tr key={attr}>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">
                      {attr}
                    </td>
                    {comparison.comparison_table.data.map((player, index) => (
                      <td key={index} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                        {typeof player[attr] === 'number' ? player[attr].toFixed(2) : player[attr]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Visualization */}
      {comparison.visualizations.comparison_radar && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Visual Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img 
                src={comparison.visualizations.comparison_radar} 
                alt="Player Comparison Radar Chart"
                className="max-w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Player Analysis
          </CardTitle>
          <CardDescription>
            Machine learning-powered player analysis and comparison system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-6 mt-6">
              {/* Player Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search Players</Label>
                  <Input
                    id="search"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Filter by Position</Label>
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {FOOTBALL_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position.toLowerCase()}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="player">Select Player</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPlayers.map((player: Player) => (
                        <SelectItem key={player.Name} value={player.Name}>
                          {player.Name} ({player.Position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handlePlayerAnalysis}
                disabled={!selectedPlayer || playerAnalysisMutation.isPending}
                className="w-full md:w-auto"
              >
                {playerAnalysisMutation.isPending ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Player...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Player
                  </>
                )}
              </Button>

              {/* Analysis Results */}
              {playerAnalysisMutation.data?.success && (
                <div className="mt-6">
                  {renderPlayerAnalysis(playerAnalysisMutation.data.analysis)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6 mt-6">
              {/* Player Selection for Comparison */}
              <div>
                <Label>Select Players to Compare (2-4 players)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {filteredPlayers.map((player: Player) => (
                    <div key={player.Name} className="flex items-center space-x-2">
                      <Checkbox
                        id={player.Name}
                        checked={selectedPlayers.includes(player.Name)}
                        onCheckedChange={() => togglePlayerSelection(player.Name)}
                        disabled={!selectedPlayers.includes(player.Name) && selectedPlayers.length >= 4}
                      />
                      <Label 
                        htmlFor={player.Name} 
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {player.Name} ({player.Position})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
                </Badge>
                <Button 
                  onClick={handlePlayerComparison}
                  disabled={selectedPlayers.length < 2 || comparisonMutation.isPending}
                >
                  {comparisonMutation.isPending ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Comparing Players...
                    </>
                  ) : (
                    <>
                      <GitCompare className="h-4 w-4 mr-2" />
                      Compare Players
                    </>
                  )}
                </Button>
              </div>

              {/* Comparison Results */}
              {comparisonMutation.data?.success && (
                <div className="mt-6">
                  {renderPlayerComparison(comparisonMutation.data.comparison)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Player Analysis Service</span>
            </div>
            <Badge variant="outline">
              {playersData ? `${playersData.total} players available` : 'Loading...'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}