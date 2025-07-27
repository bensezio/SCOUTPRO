import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize, 
  Download, 
  Plus, 
  Flag,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Target,
  Filter,
  Trophy,
  Zap,
  Brain,
  TrendingUp
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ProductionVideoPlayer } from './production-video-player';

interface SpotlightClip {
  id: number;
  videoId: number;
  eventType: string;
  eventTypeLabel: string;
  timestamp: number;
  endTimestamp?: number;
  duration: number;
  team: string;
  teamColor: string;
  playerId?: number;
  playerName: string;
  playerPosition?: string;
  playerJerseyNumber?: string;
  outcome: string;
  quality: number;
  confidence: number;
  confidenceScore: number;
  description?: string;
  isHighlight: boolean;
  startTime: number;
  endTime: number;
  previewThumbnail: string;
  source: string;
  tags: string[];
  fieldX: number;
  fieldY: number;
}

interface SpotlightPlayer {
  playerId: number;
  playerName: string;
  displayName: string;
  position?: string;
  jerseyNumber?: string;
  team: string;
  teamColor: string;
  eventCount: number;
  avgQuality: number;
  highlights: number;
  totalRating: number;
  performanceScore: number;
}

interface SpotlightStats {
  totalClips: number;
  avgQuality: number;
  totalDuration: number;
  highQualityClips: number;
  highlightPercentage: number;
  eventDistribution: Array<{
    eventType: string;
    count: number;
    displayName: string;
    avgQuality: number;
  }>;
  teamDistribution: Array<{
    team: string;
    count: number;
    displayName: string;
    avgQuality: number;
  }>;
  playerDistribution: Array<{
    playerId: number;
    playerName: string;
    count: number;
    avgQuality: number;
    performanceScore: number;
  }>;
}

interface ProductionSpotlightProps {
  videoId: number;
  videoUrl?: string;
  videoTitle?: string;
  matchId?: number;
  matchTitle?: string;
  onClipSelect: (clip: SpotlightClip) => void;
  onPlayerSelect?: (playerId: number) => void;
  className?: string;
}

export function ProductionSpotlight({
  videoId,
  videoUrl = '',
  videoTitle = 'Video Analysis',
  matchId,
  matchTitle = 'Match Analysis',
  onClipSelect,
  onPlayerSelect,
  className = ''
}: ProductionSpotlightProps) {
  const { toast } = useToast();
  
  // State management
  const [clips, setClips] = useState<SpotlightClip[]>([]);
  const [players, setPlayers] = useState<SpotlightPlayer[]>([]);
  const [stats, setStats] = useState<SpotlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<number>(0);
  const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'quality' | 'relevance'>('relevance');
  
  // UI state
  const [selectedClip, setSelectedClip] = useState<SpotlightClip | null>(null);
  const [activeTab, setActiveTab] = useState<'highlights' | 'players' | 'analytics'>('highlights');
  
  // Video player state
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [showVideoPlayer, setShowVideoPlayer] = useState(true);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate AI confidence and highlight scoring
  const calculateHighlightScore = (clip: SpotlightClip): number => {
    let score = clip.quality * 20; // Base score from quality rating (1-5 -> 20-100)
    
    // Event type importance weights
    const eventWeights: Record<string, number> = {
      'goal': 100,
      'save': 90,
      'shot': 80,
      'assist': 85,
      'tackle': 70,
      'pass': 60,
      'foul': 50,
      'corner': 65,
      'yellow_card': 40,
      'red_card': 95
    };
    
    const eventWeight = eventWeights[clip.eventType] || 60;
    score = (score + eventWeight) / 2;
    
    // Outcome bonus
    if (clip.outcome === 'successful') {
      score += 10;
    }
    
    // Source credibility
    if (clip.source === 'ai' && clip.confidence) {
      score = (score + clip.confidence) / 2;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  // Fetch spotlight data
  const fetchSpotlightData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch events/clips with robust error handling
      console.log(`🎬 Fetching events for video ${videoId}`);
      const eventsResponse = await fetch(`/api/video-analytics/videos/${videoId}/events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      
      if (!eventsResponse?.events) {
        console.log('⚠️ No events found, using empty array');
        setClips([]);
        setStats({
          totalClips: 0,
          avgQuality: 0,
          totalDuration: 0,
          highQualityClips: 0,
          highlightPercentage: 0,
          eventDistribution: [],
          teamDistribution: [],
          playerDistribution: []
        });
        return;
      }
      
      // Transform events to clips with highlight scoring
      const transformedClips: SpotlightClip[] = eventsResponse.events.map((event: any) => ({
        id: event.id,
        videoId: event.videoId,
        eventType: event.eventType,
        eventTypeLabel: event.eventTypeLabel,
        timestamp: parseFloat(event.timestampStart),
        endTimestamp: event.timestampEnd ? parseFloat(event.timestampEnd) : undefined,
        duration: event.duration || 5,
        team: event.team,
        teamColor: event.teamColor,
        playerId: event.playerId,
        playerName: event.playerName || 'Unknown Player',
        playerPosition: event.playerPosition,
        playerJerseyNumber: event.playerJerseyNumber,
        outcome: event.outcome,
        quality: event.qualityRating,
        confidence: event.confidence || 85,
        confidenceScore: event.confidence || 85,
        description: event.description,
        isHighlight: event.isHighlight || event.qualityRating >= 4,
        startTime: parseFloat(event.timestampStart),
        endTime: event.timestampEnd ? parseFloat(event.timestampEnd) : parseFloat(event.timestampStart) + 5,
        previewThumbnail: '',
        source: event.source || 'manual',
        tags: event.tags || [],
        fieldX: parseFloat(event.fieldX) || 50,
        fieldY: parseFloat(event.fieldY) || 50
      }));
      
      // Calculate highlight scores for each clip
      transformedClips.forEach(clip => {
        clip.confidenceScore = calculateHighlightScore(clip);
      });
      
      setClips(transformedClips);
      
      // Fetch players with performance data
      const playersResponse = await fetch(`/api/video-analytics/videos/${videoId}/players`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      if (playersResponse.players) {
        const enhancedPlayers: SpotlightPlayer[] = playersResponse.players.map((player: any) => ({
          playerId: player.playerId,
          playerName: player.playerName,
          displayName: player.displayName || player.playerName,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          team: player.team,
          teamColor: player.teamColor,
          eventCount: player.eventCount,
          avgQuality: player.avgQuality,
          highlights: transformedClips.filter(c => c.playerId === player.playerId && c.isHighlight).length,
          totalRating: player.avgQuality * player.eventCount,
          performanceScore: Math.round((player.avgQuality * 20) + (player.eventCount * 5))
        }));
        
        setPlayers(enhancedPlayers);
      }
      
      // Fetch comprehensive stats
      const statsResponse = await fetch(`/api/video-analytics/videos/${videoId}/spotlight/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      if (statsResponse) {
        setStats({
          ...statsResponse,
          highlightPercentage: Math.round((transformedClips.filter(c => c.isHighlight).length / transformedClips.length) * 100) || 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching spotlight data:', err);
      setError('Failed to load spotlight data. Please check your connection and try again.');
      toast({
        title: "Error Loading Spotlight",
        description: "Failed to load video highlights and player data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and video change
  useEffect(() => {
    if (videoId) {
      fetchSpotlightData();
    }
  }, [videoId]);

  // Filter and sort clips
  const filteredAndSortedClips = useMemo(() => {
    let filtered = clips;
    
    // Apply filters
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(clip => selectedEventTypes.includes(clip.eventType));
    }
    
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(clip => clip.team === selectedTeam);
    }
    
    if (selectedPlayer !== 'all') {
      filtered = filtered.filter(clip => clip.playerId?.toString() === selectedPlayer);
    }
    
    if (qualityFilter > 0) {
      filtered = filtered.filter(clip => clip.quality >= qualityFilter);
    }
    
    if (showHighlightsOnly) {
      filtered = filtered.filter(clip => clip.isHighlight);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return a.timestamp - b.timestamp;
        case 'quality':
          return b.quality - a.quality;
        case 'relevance':
        default:
          return b.confidenceScore - a.confidenceScore;
      }
    });
    
    return filtered;
  }, [clips, selectedEventTypes, selectedTeam, selectedPlayer, qualityFilter, showHighlightsOnly, sortBy]);

  // Get unique event types for filter
  const eventTypes = useMemo(() => {
    const types = [...new Set(clips.map(clip => clip.eventType))];
    return types.map(type => ({
      value: type,
      label: clips.find(c => c.eventType === type)?.eventTypeLabel || type
    }));
  }, [clips]);

  // Get unique teams for filter
  const teams = useMemo(() => {
    const teamSet = new Set(clips.map(clip => clip.team));
    return Array.from(teamSet).map(team => ({
      value: team,
      label: team === 'home' ? 'Team Blue' : 'Team White',
      color: team === 'home' ? '#3b82f6' : '#ef4444'
    }));
  }, [clips]);

  // Handle clip selection with player rating update and video seeking
  const handleClipSelect = (clip: SpotlightClip) => {
    setSelectedClip(clip);
    onClipSelect(clip);
    
    // Seek video to clip timestamp
    setCurrentVideoTime(clip.timestamp);
    
    // Update player performance data in background
    if (clip.playerId) {
      // This would trigger a player rating recalculation based on the selected clip
      console.log(`Updating performance metrics for player ${clip.playerId} based on ${clip.eventType} event`);
    }
    
    // Enhanced feedback with timing
    toast({
      title: "Highlight Selected",
      description: `${clip.eventTypeLabel} by ${clip.playerName} at ${formatTime(clip.timestamp)} - Quality: ${clip.quality}/5`,
      duration: 3000,
    });
  };

  // Handle player selection
  const handlePlayerSelect = (playerId: number) => {
    onPlayerSelect?.(playerId);
    
    // Filter clips to show only this player's events
    setSelectedPlayer(playerId.toString());
    setActiveTab('highlights');
  };

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading spotlight analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="font-medium mb-2">Spotlight Error</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchSpotlightData} variant="outline" size="sm">
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Video Spotlight
            </CardTitle>
            <CardDescription>
              AI-powered highlights and player performance analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {filteredAndSortedClips.filter(c => c.isHighlight).length} Highlights
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {clips.length} Events
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Integrated Video Player */}
        {showVideoPlayer && videoUrl && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Video Player</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideoPlayer(!showVideoPlayer)}
              >
                {showVideoPlayer ? 'Hide Player' : 'Show Player'}
              </Button>
            </div>
            <ProductionVideoPlayer
              videoUrl={videoUrl}
              events={clips.map(clip => ({
                id: clip.id,
                eventType: clip.eventType,
                eventTypeLabel: clip.eventTypeLabel,
                timestampStart: clip.timestamp,
                timestampEnd: clip.endTimestamp,
                playerName: clip.playerName,
                qualityRating: clip.quality,
                outcome: clip.outcome,
                description: clip.description,
                fieldX: clip.fieldX,
                fieldY: clip.fieldY,
                team: clip.team,
                teamColor: clip.teamColor,
                isHighlight: clip.isHighlight
              }))}
              onEventClick={(event) => {
                const matchingClip = clips.find(c => c.id === event.id);
                if (matchingClip) {
                  handleClipSelect(matchingClip);
                }
              }}
              onTimestampChange={(timestamp) => {
                setCurrentVideoTime(timestamp);
              }}
              seekToTime={currentVideoTime}
              className="w-full h-96"
            />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="highlights">Highlights</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="highlights" className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-1 block">Event Type</label>
                <Select value={selectedEventTypes[0] || 'all'} onValueChange={(value) => 
                  setSelectedEventTypes(value === 'all' ? [] : [value])
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.value} value={team.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          />
                          {team.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Quality</label>
                <Select value={qualityFilter.toString()} onValueChange={(value) => setQualityFilter(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Quality</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="timestamp">Time</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Highlights toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="highlights-only"
                  checked={showHighlightsOnly}
                  onCheckedChange={setShowHighlightsOnly}
                />
                <label htmlFor="highlights-only" className="text-sm font-medium">
                  Show highlights only
                </label>
              </div>
              <div className="text-sm text-gray-600">
                {filteredAndSortedClips.length} of {clips.length} events
              </div>
            </div>
            
            {/* Clips grid */}
            <ScrollArea className="h-96">
              <div className="grid gap-3">
                {filteredAndSortedClips.map(clip => (
                  <Card 
                    key={clip.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedClip?.id === clip.id && "ring-2 ring-blue-500",
                      clip.isHighlight && "border-yellow-400"
                    )}
                    onClick={() => handleClipSelect(clip)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: clip.teamColor }}
                              className="text-white"
                            >
                              {clip.eventTypeLabel}
                            </Badge>
                            {clip.isHighlight && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                                <Star className="h-3 w-3 mr-1" />
                                Highlight
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {formatTime(clip.timestamp)}
                            </Badge>
                          </div>
                          
                          <div className="mb-2">
                            <p className="font-medium text-sm">{clip.playerName}</p>
                            {clip.description && (
                              <p className="text-xs text-gray-600 mt-1">{clip.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Quality: {clip.quality}/5
                            </div>
                            <div className="flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              AI Score: {Math.round(clip.confidenceScore)}%
                            </div>
                            {clip.source === 'ai' && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                AI Generated
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClipSelect(clip);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredAndSortedClips.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No clips match your current filters</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        setSelectedEventTypes([]);
                        setSelectedTeam('all');
                        setSelectedPlayer('all');
                        setQualityFilter(0);
                        setShowHighlightsOnly(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="players" className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Player performance rankings based on event quality and frequency
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {players
                  .sort((a, b) => b.performanceScore - a.performanceScore)
                  .map((player, index) => (
                  <Card 
                    key={player.playerId}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handlePlayerSelect(player.playerId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold text-gray-400">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{player.displayName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge 
                                variant="outline" 
                                style={{ borderColor: player.teamColor }}
                              >
                                {player.team === 'home' ? 'Team Blue' : 'Team White'}
                              </Badge>
                              {player.position && <span>{player.position}</span>}
                              {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{player.performanceScore}</span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>{player.eventCount} events</div>
                            <div>{player.highlights} highlights</div>
                            <div>Avg: {player.avgQuality.toFixed(1)}/5</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Performance</span>
                          <span>{player.performanceScore}/100</span>
                        </div>
                        <Progress value={player.performanceScore} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalClips}</div>
                    <div className="text-sm text-gray-600">Total Events</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.highQualityClips}</div>
                    <div className="text-sm text-gray-600">Highlights</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{(stats.avgQuality || 0).toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avg Quality</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.highlightPercentage || 0}%</div>
                    <div className="text-sm text-gray-600">Highlight Rate</div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Event distribution */}
            {stats?.eventDistribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.eventDistribution.map(event => (
                      <div key={event.eventType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{event.displayName}</div>
                          <Badge variant="outline">{event.count}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Avg: {(event.avgQuality || 0).toFixed(1)}
                          </span>
                          <Progress 
                            value={stats.totalClips ? (event.count / stats.totalClips) * 100 : 0} 
                            className="w-16 h-2" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}