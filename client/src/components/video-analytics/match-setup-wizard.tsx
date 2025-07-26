import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Users, MapPin, Thermometer, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { MATCH_FORMATIONS, ANALYSIS_TYPES } from "@shared/video-analytics-constants";
import { FOOTBALL_POSITIONS } from "@shared/constants";

interface MatchSetupWizardProps {
  open: boolean;
  onClose: () => void;
  onMatchCreated: (match: any) => void;
}

interface TeamSheet {
  startingXI: Array<{
    name: string;
    position: string;
    number: number;
  }>;
  substitutes: Array<{
    name: string;
    position: string;
    number: number;
  }>;
  formation: string;
  captain: string;
}

export function MatchSetupWizard({ open, onClose, onMatchCreated }: MatchSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [matchData, setMatchData] = useState({
    homeTeamName: "",
    awayTeamName: "",
    competition: "",
    venue: "",
    matchDate: new Date(),
    weather: "",
    temperature: "",
    attendance: "",
    analysisType: "full_match",
    focusAreas: [] as string[]
  });

  // Default formation positions for 4-4-2
  const defaultFormationPositions = [
    "Goalkeeper", // 1
    "Right-Back", // 2
    "Centre-Back", // 3
    "Centre-Back", // 4
    "Left-Back", // 5
    "Right Midfielder", // 6
    "Central Midfielder", // 7
    "Central Midfielder", // 8
    "Left Midfielder", // 9
    "Striker", // 10
    "Striker" // 11
  ];

  const [homeTeamSheet, setHomeTeamSheet] = useState<TeamSheet>({
    startingXI: Array(11).fill(null).map((_, i) => ({ 
      name: "", 
      position: defaultFormationPositions[i] || FOOTBALL_POSITIONS[0], 
      number: i + 1 
    })),
    substitutes: Array(7).fill(null).map((_, i) => ({ 
      name: "", 
      position: FOOTBALL_POSITIONS[0], 
      number: i + 12 
    })),
    formation: "4-4-2",
    captain: ""
  });

  const [awayTeamSheet, setAwayTeamSheet] = useState<TeamSheet>({
    startingXI: Array(11).fill(null).map((_, i) => ({ 
      name: "", 
      position: defaultFormationPositions[i] || FOOTBALL_POSITIONS[0], 
      number: i + 1 
    })),
    substitutes: Array(7).fill(null).map((_, i) => ({ 
      name: "", 
      position: FOOTBALL_POSITIONS[0], 
      number: i + 12 
    })),
    formation: "4-4-2", 
    captain: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/video-analytics/matches', data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Create team sheets
      try {
        await apiRequest('POST', `/api/video-analytics/matches/${data.match.id}/team-sheets`, {
          homeTeam: { ...homeTeamSheet, formation: homeTeamSheet.formation },
          awayTeam: { ...awayTeamSheet, formation: awayTeamSheet.formation }
        });

        queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches'] });
        toast({ title: "Match analysis created successfully!" });
        onMatchCreated(data.match);
      } catch (error) {
        toast({ 
          title: "Error creating team sheets", 
          description: "Match created but team sheets failed",
          variant: "destructive" 
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: "Error creating match", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create match
      createMatchMutation.mutate({
        ...matchData,
        matchDate: matchData.matchDate.toISOString(),
        temperature: matchData.temperature ? parseInt(matchData.temperature) : null,
        attendance: matchData.attendance ? parseInt(matchData.attendance) : null
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updatePlayer = (team: 'home' | 'away', type: 'startingXI' | 'substitutes', index: number, field: string, value: string) => {
    const teamSheet = team === 'home' ? homeTeamSheet : awayTeamSheet;
    const setTeamSheet = team === 'home' ? setHomeTeamSheet : setAwayTeamSheet;
    
    const newSheet = { ...teamSheet };
    newSheet[type][index] = { ...newSheet[type][index], [field]: value };
    setTeamSheet(newSheet);
  };

  const focusAreaOptions = [
    "Passing accuracy", "Defensive actions", "Attacking plays", "Set pieces",
    "Player movement", "Pressing intensity", "Counter attacks", "Ball possession"
  ];

  const toggleFocusArea = (area: string) => {
    setMatchData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area) 
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Match Analysis</DialogTitle>
          <DialogDescription>
            Set up your match context and team information for comprehensive video analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={cn(
                    "w-16 h-1 mx-2",
                    step < currentStep ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="font-semibold">
              {currentStep === 1 && "Match Information"}
              {currentStep === 2 && "Team Sheets"}
              {currentStep === 3 && "Analysis Settings"}
            </h3>
          </div>

          {/* Step 1: Match Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeTeam">Home Team</Label>
                  <Input
                    id="homeTeam"
                    value={matchData.homeTeamName}
                    onChange={(e) => setMatchData(prev => ({ ...prev, homeTeamName: e.target.value }))}
                    placeholder="Enter home team name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awayTeam">Away Team</Label>
                  <Input
                    id="awayTeam"
                    value={matchData.awayTeamName}
                    onChange={(e) => setMatchData(prev => ({ ...prev, awayTeamName: e.target.value }))}
                    placeholder="Enter away team name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="competition">Competition</Label>
                  <Input
                    id="competition"
                    value={matchData.competition}
                    onChange={(e) => setMatchData(prev => ({ ...prev, competition: e.target.value }))}
                    placeholder="Premier League, Champions League, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={matchData.venue}
                    onChange={(e) => setMatchData(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="Stadium name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Match Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !matchData.matchDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {matchData.matchDate ? format(matchData.matchDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={matchData.matchDate}
                      onSelect={(date) => date && setMatchData(prev => ({ ...prev, matchDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weather">Weather</Label>
                  <Select value={matchData.weather} onValueChange={(value) => setMatchData(prev => ({ ...prev, weather: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">Sunny</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                      <SelectItem value="windy">Windy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={matchData.temperature || ''}
                    onChange={(e) => setMatchData(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance">Attendance</Label>
                  <Input
                    id="attendance"
                    type="number"
                    value={matchData.attendance || ''}
                    onChange={(e) => setMatchData(prev => ({ ...prev, attendance: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Team Sheets */}
          {currentStep === 2 && (
            <Tabs defaultValue="home" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="home" className="gap-2">
                  <Users className="h-4 w-4" />
                  {matchData.homeTeamName || "Home Team"}
                </TabsTrigger>
                <TabsTrigger value="away" className="gap-2">
                  <Users className="h-4 w-4" />
                  {matchData.awayTeamName || "Away Team"}
                </TabsTrigger>
              </TabsList>

              {['home', 'away'].map((team) => (
                <TabsContent key={team} value={team} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Formation</Label>
                    <Select 
                      value={team === 'home' ? homeTeamSheet.formation : awayTeamSheet.formation}
                      onValueChange={(value) => {
                        if (team === 'home') {
                          setHomeTeamSheet(prev => ({ ...prev, formation: value }));
                        } else {
                          setAwayTeamSheet(prev => ({ ...prev, formation: value }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATCH_FORMATIONS.map((formation) => (
                          <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Starting XI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(team === 'home' ? homeTeamSheet : awayTeamSheet).startingXI.map((player, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-bold">
                              {player.number}
                            </div>
                            <Input
                              placeholder="Player name"
                              value={player.name}
                              onChange={(e) => updatePlayer(team as 'home' | 'away', 'startingXI', index, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Select 
                              value={player.position} 
                              onValueChange={(value) => updatePlayer(team as 'home' | 'away', 'startingXI', index, 'position', value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Position" />
                              </SelectTrigger>
                              <SelectContent>
                                {FOOTBALL_POSITIONS.map((position) => (
                                  <SelectItem key={position} value={position}>{position}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Substitutes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(team === 'home' ? homeTeamSheet : awayTeamSheet).substitutes.map((player, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-muted text-muted-foreground rounded flex items-center justify-center text-sm font-bold">
                              {player.number}
                            </div>
                            <Input
                              placeholder="Player name"
                              value={player.name}
                              onChange={(e) => updatePlayer(team as 'home' | 'away', 'substitutes', index, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Select 
                              value={player.position} 
                              onValueChange={(value) => updatePlayer(team as 'home' | 'away', 'substitutes', index, 'position', value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Position" />
                              </SelectTrigger>
                              <SelectContent>
                                {FOOTBALL_POSITIONS.map((position) => (
                                  <SelectItem key={position} value={position}>{position}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Step 3: Analysis Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Analysis Type</Label>
                <Select 
                  value={matchData.analysisType}
                  onValueChange={(value) => setMatchData(prev => ({ ...prev, analysisType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_match">Full Match Analysis</SelectItem>
                    <SelectItem value="highlights">Highlights Analysis</SelectItem>
                    <SelectItem value="opposition_focus">Opposition Focus</SelectItem>
                    <SelectItem value="player_focus">Player Focus</SelectItem>
                    <SelectItem value="tactical_analysis">Tactical Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Focus Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {focusAreaOptions.map((area) => (
                    <Badge
                      key={area}
                      variant={matchData.focusAreas.includes(area) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFocusArea(area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Match:</span>
                    <span className="font-medium">{matchData.homeTeamName} vs {matchData.awayTeamName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(matchData.matchDate, "PPP")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Competition:</span>
                    <span className="font-medium">{matchData.competition}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Analysis Type:</span>
                    <span className="font-medium">{matchData.analysisType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Focus Areas:</span>
                    <span className="font-medium">{matchData.focusAreas.length} selected</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!matchData.homeTeamName || !matchData.awayTeamName || !matchData.competition)) ||
                createMatchMutation.isPending
              }
            >
              {createMatchMutation.isPending 
                ? "Creating..." 
                : currentStep === 3 
                  ? "Create Analysis" 
                  : "Next"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}