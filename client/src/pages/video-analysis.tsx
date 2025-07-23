import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

import { VideoAnalysisDisplay } from '@/components/video-analytics/video-analysis-display';
import { EnhancedDataVisualizations } from '@/components/enhanced-data-visualizations';
import { MatchSetupWizard } from '@/components/video-analytics/match-setup-wizard';
import { VideoUploadDialog } from '@/components/video-analytics/video-upload-dialog';
import { VideoEventTagsList } from '@/components/video-analytics/video-event-tags-list';
import { EventTimeline } from '@/components/video-analytics/event-timeline';
import { PlayerHeatMap } from '@/components/video-analytics/player-heat-map';
import { AnalyticsStats } from '@/components/video-analytics/analytics-stats';
import { MatchCard } from '@/components/video-analytics/match-card';
import { TeamSheetManager } from '@/components/video-analytics/team-sheet-manager';
import { EditMatchModal } from '@/components/video-analytics/edit-match-modal';


import { 
  Video, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Download, 
  Upload, 
  Eye, 
  Calendar, 
  Target, 
  TrendingUp,
  Film,
  Zap,
  Brain,
  BarChart3,
  Clock,
  Settings,
  FileVideo,
  Scissors,
  Activity,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Users,
  MapPin,
  Filter,
  Save,
  Presentation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOOTBALL_EVENT_TYPES, VIDEO_EVENT_TYPES, getEventTypeLabel } from '@shared/video-analytics-constants';
import { ProductionVideoPlayer } from '@/components/video-analytics/production-video-player';
import { ProductionSpotlight } from '@/components/video-analytics/production-spotlight';
import { AIInsightsPanel } from '@/components/video-analytics/ai-insights-panel';

interface VideoAnalysisData {
  id: string;
  playerName: string;
  matchDate: string;
  duration: number;
  events: VideoEvent[];
  highlights: VideoHighlight[];
  stats: VideoStats;
  aiInsights: string[];
}

interface CurrentVideoEvent {
  timestamp: number;
  eventType: string;
  description?: string;
}

interface CurrentVideoEvent {
  timestamp: number;
  eventType: string;
  description?: string;
}

interface VideoEvent {
  timestamp: number;
  type: 'goal' | 'assist' | 'tackle' | 'pass' | 'shot' | 'save';
  description: string;
  confidence: number;
}

interface VideoHighlight {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  type: string;
  thumbnail: string;
  downloadUrl?: string;
}

interface VideoStats {
  totalEvents: number;
  goalsScored: number;
  assists: number;
  successfulTackles: number;
  passAccuracy: number;
  shotsOnTarget: number;
}

export default function VideoAnalysis() {
  // Main state
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedMode, setSelectedMode] = useState<'ai_analysis' | 'manual_tagging'>('ai_analysis');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  
  // AI Analysis state
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisData | null>(null);
  
  // Manual Tagging state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedEventType, setSelectedEventType] = useState<any>(null);
  const [fieldPosition, setFieldPosition] = useState<{ x: number; y: number } | null>(null);
  const [taggingMode, setTaggingMode] = useState(false);
  
  // Dialog states
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  
  // Video player integration state
  const [currentVideoEvent, setCurrentVideoEvent] = useState<CurrentVideoEvent | null>(null);
  const [videoPlayerRef, setVideoPlayerRef] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user to check admin status
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Check if user is admin
  const isAdmin = user && typeof user === 'object' && user !== null && 'role' in user ? 
    (user as any).role === 'admin' || (user as any).role === 'super_admin' : false;

  // Fetch available players
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/players'],
  });

  // Fetch user's match analyses
  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['/api/video-analytics/matches'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/video-analytics/matches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      return data.matches || [];
    }
  });

  // Fetch analytics statistics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/video-analytics/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/video-analytics/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.stats || {};
    }
  });

  // Fetch videos for selected match
  const { data: videos, isLoading: loadingVideos } = useQuery({
    queryKey: ['/api/video-analytics/matches', selectedMatch?.id, 'videos'],
    queryFn: async () => {
      if (!selectedMatch) return [];
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/video-analytics/matches/${selectedMatch.id}/videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      return data.videos || [];
    },
    enabled: !!selectedMatch
  });

  // Fetch event tags for selected video
  const { data: eventTags, isLoading: loadingTags } = useQuery({
    queryKey: ['/api/video-analytics/videos', selectedVideo?.id, 'tags'],
    queryFn: async () => {
      if (!selectedVideo) return [];
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/video-analytics/videos/${selectedVideo.id}/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      return data.tags || [];
    },
    enabled: !!selectedVideo
  });

  // Mock player insights for AI analysis
  const mockPlayerInsights = eventTags?.length > 0 ? [
    {
      playerId: 1,
      playerName: "Mohammed Salah",
      position: "Right Winger",
      overallRating: 87,
      technicalScore: 92,
      physicalScore: 85,
      mentalScore: 84,
      totalEvents: eventTags.length,
      successfulEvents: eventTags.filter((tag: any) => tag.outcome === 'successful').length,
      keyStrengths: [
        "Exceptional dribbling in tight spaces",
        "Clinical finishing from difficult angles",
        "Intelligent off-ball movement"
      ],
      areasForImprovement: [
        "Defensive tracking in transition",
        "Physical duels in aerial situations"
      ],
      recommendations: [
        "Focus on crossing accuracy from wide positions",
        "Improve link-up play with central midfielders"
      ]
    }
  ] : [];

  // Mock match insights based on actual data
  const mockMatchInsights = {
    totalEvents: eventTags?.length || 0,
    mostFrequentEvent: stats?.eventDistribution?.[0]?.eventType || 'pass',
    successRate: eventTags?.length > 0 ? Math.round((eventTags.filter((tag: any) => tag.outcome === 'successful').length / eventTags.length) * 100) : 0,
    tacticalAnalysis: eventTags?.length > 0 ? [
      "High pressing intensity in the final third created multiple turnovers",
      "Excellent ball retention through quick passing combinations",
      "Strong defensive shape maintained throughout the match"
    ] : [
      "Upload video and add event tags to generate AI tactical analysis"
    ],
    keyMoments: eventTags?.slice(0, 3).map((tag: any, index: number) => ({
      timestamp: tag.timestampStart,
      description: `${tag.eventTypeLabel} by ${tag.playerName} - ${tag.description || 'Key tactical moment'}`,
      impact: index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
    })) || [],
    teamPerformance: {
      possession: 65,
      passingAccuracy: 87,
      defensiveActions: 23,
      attackingThird: 15
    }
  };

  // Handler functions for enhanced functionality

  // Sample analysis data
  const sampleAnalysisData: VideoAnalysisData = {
    id: "analysis-1",
    playerName: "Mohammed Salah",
    matchDate: "2025-01-07",
    duration: 5400, // 90 minutes
    events: [
      { timestamp: 180, type: 'goal', description: 'Clinical finish from inside the box', confidence: 95 },
      { timestamp: 420, type: 'assist', description: 'Perfect through ball to striker', confidence: 88 },
      { timestamp: 1080, type: 'shot', description: 'Powerful shot saved by goalkeeper', confidence: 82 },
      { timestamp: 2100, type: 'pass', description: 'Key pass leading to chance', confidence: 90 },
      { timestamp: 3240, type: 'tackle', description: 'Defensive recovery in midfield', confidence: 75 }
    ],
    highlights: [
      {
        id: 'h1',
        title: 'Goal - 18th minute',
        startTime: 175,
        endTime: 185,
        type: 'goal',
        thumbnail: '/api/placeholder/300/200?color=1f2937&text=Goal+Highlight'
      },
      {
        id: 'h2', 
        title: 'Assist - 42nd minute',
        startTime: 415,
        endTime: 425,
        type: 'assist',
        thumbnail: '/api/placeholder/300/200?color=1f2937&text=Assist+Highlight'
      },
      {
        id: 'h3',
        title: 'Shot on Target - 18th minute',
        startTime: 1075,
        endTime: 1085,
        type: 'shot',
        thumbnail: '/api/placeholder/300/200?color=1f2937&text=Shot+Highlight'
      }
    ],
    stats: {
      totalEvents: 5,
      goalsScored: 1,
      assists: 1,
      successfulTackles: 1,
      passAccuracy: 87,
      shotsOnTarget: 3
    },
    aiInsights: [
      "Player demonstrated exceptional technical ability in the final third",
      "Strong positioning and movement created multiple scoring opportunities",
      "Defensive contributions were minimal but effective when engaged",
      "Passing accuracy was above average with several key passes created"
    ]
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered video analysis and manual event tagging system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSetupWizard(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Match
          </Button>
          <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Mode</CardTitle>
          <CardDescription>Choose between AI-powered analysis or manual event tagging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={cn("cursor-pointer transition-all", selectedMode === 'ai_analysis' ? "ring-2 ring-primary" : "")}
              onClick={() => setSelectedMode('ai_analysis')}
            >
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Automated highlight generation, event detection, and player insights
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className={cn("cursor-pointer transition-all", selectedMode === 'manual_tagging' ? "ring-2 ring-primary" : "")}
              onClick={() => setSelectedMode('manual_tagging')}
            >
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Manual Event Tagging</h3>
                <p className="text-sm text-muted-foreground">
                  Precision event tagging with comprehensive football analytics and real-time annotation
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            AI Upload
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-2">
            <Video className="h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="tagging" className="gap-2">
            <Target className="h-4 w-4" />
            Manual Event Tagging
          </TabsTrigger>
          <TabsTrigger value="spotlight" className="gap-2">
            <Film className="h-4 w-4" />
            Spotlight
          </TabsTrigger>
          <TabsTrigger value="visualizations" className="gap-2">
            <Brain className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AnalyticsStats stats={stats} />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Get started with video analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setShowSetupWizard(true)}
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <Calendar className="h-6 w-6" />
                  <span className="font-medium">Create Match</span>
                  <span className="text-xs opacity-75">Set up a new match for analysis</span>
                </Button>
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  variant="outline"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <Upload className="h-6 w-6" />
                  <span className="font-medium">Upload Video</span>
                  <span className="text-xs opacity-75">Add videos to existing matches</span>
                </Button>
                <Button 
                  onClick={() => setSelectedTab('matches')}
                  variant="outline"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <Video className="h-6 w-6" />
                  <span className="font-medium">View Matches</span>
                  <span className="text-xs opacity-75">Browse all match analyses</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMatches ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : matches?.length > 0 ? (
                  <div className="space-y-3">
                    {matches.slice(0, 5).map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{match.homeTeamName} vs {match.awayTeamName}</p>
                            <Badge variant={match.matchStatus === 'completed' ? 'default' : match.matchStatus === 'in_progress' ? 'secondary' : 'outline'}>
                              {match.matchStatus || 'pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{new Date(match.matchDate).toLocaleDateString()}</span>
                            {match.competition && <span>• {match.competition}</span>}
                            {match.venue && <span>• {match.venue}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedMatch(match);
                              setSelectedTab('matches');
                            }}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={async () => {
                              // Set the selected match
                              setSelectedMatch(match);
                              
                              // Fetch videos for this match
                              try {
                                const token = localStorage.getItem('token');
                                const response = await fetch(`/api/video-analytics/matches/${match.id}/videos`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                });
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  const matchVideos = data.videos || [];
                                  
                                  if (matchVideos.length > 0) {
                                    // Set the first video as selected
                                    setSelectedVideo(matchVideos[0]);
                                    // Navigate to analysis tab
                                    setSelectedTab('spotlight');
                                    toast({
                                      title: "Analysis Ready",
                                      description: `Loading analysis for ${match.homeTeamName} vs ${match.awayTeamName}`,
                                    });
                                  } else {
                                    // No videos found, redirect to upload
                                    setSelectedTab('upload');
                                    toast({
                                      title: "No Videos Found",
                                      description: "Upload a video for this match to start analysis",
                                    });
                                  }
                                } else {
                                  throw new Error('Failed to fetch videos');
                                }
                              } catch (error) {
                                console.error('Error fetching videos:', error);
                                toast({
                                  title: "Error",
                                  description: "Could not load match videos. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Analyze
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No matches yet. Create your first analysis.</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setShowSetupWizard(true);
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Match
                    </Button>
                  </div>
                )}
                {matches?.length > 0 && (
                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedTab('matches')}
                      className="w-full gap-2"
                    >
                      <Video className="h-4 w-4" />
                      View All Matches
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleAnalysisData.aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          {selectedMode === 'ai_analysis' ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Video Upload
                  </CardTitle>
                  <CardDescription>
                    Upload videos for AI analysis and event tagging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowUploadDialog(true)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Video
                  </Button>
                </CardContent>
              </Card>
              
              {/* Production Video Player Integration */}
              {selectedVideo && selectedMatch && (
                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Video Analysis Player
                      </CardTitle>
                      <CardDescription>
                        Production-grade video player with event timeline and analysis tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProductionVideoPlayer
                        videoUrl={selectedVideo.filePath || selectedVideo.streamingUrl || selectedVideo.videoUrl}
                        events={eventTags?.map((tag: any) => ({
                          id: tag.id,
                          eventType: tag.eventType,
                          eventTypeLabel: tag.eventTypeLabel || tag.eventType,
                          timestampStart: parseFloat(tag.timestampStart),
                          timestampEnd: tag.timestampEnd ? parseFloat(tag.timestampEnd) : undefined,
                          playerName: tag.playerName || 'Unknown Player',
                          qualityRating: tag.qualityRating || 3,
                          outcome: tag.outcome || 'neutral',
                          description: tag.description,
                          fieldX: tag.fieldX,
                          fieldY: tag.fieldY,
                          team: tag.team || 'home',
                          teamColor: tag.teamColor || '#3b82f6',
                          isHighlight: tag.qualityRating >= 4
                        })) || []}
                        onEventClick={(event) => {
                          toast({
                            title: "Event Selected",
                            description: `${event.eventTypeLabel} by ${event.playerName}`,
                          });
                          setCurrentVideoEvent({
                            timestamp: event.timestampStart,
                            eventType: event.eventType,
                            description: event.description
                          });
                        }}
                        onTimestampChange={(timestamp) => {
                          setCurrentTime(timestamp);
                        }}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Manual Event Tagging Setup
                  </CardTitle>
                  <CardDescription>
                    Upload videos and set up matches for precise manual event tagging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={() => setShowSetupWizard(true)} className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Create Match
                    </Button>
                    <Button onClick={() => setShowUploadDialog(true)} variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Video
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Start by creating a match setup or uploading video content for analysis
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-6">
          {loadingMatches ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : matches?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match: any) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  onClick={async () => {
                    setSelectedMatch(match);
                    // For manual tagging mode, we need to fetch videos for this match
                    if (selectedMode === 'manual_tagging') {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`/api/video-analytics/matches/${match.id}/videos`, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          if (data.videos && data.videos.length > 0) {
                            setSelectedVideo(data.videos[0]);
                            toast({
                              title: "Match Selected",
                              description: `Selected match "${match.homeTeamName} vs ${match.awayTeamName}" with ${data.videos.length} video(s)`,
                            });
                          } else {
                            toast({
                              title: "No Videos Found",
                              description: "This match has no videos uploaded yet. Please upload a video first.",
                              variant: "destructive",
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching match videos:', error);
                        toast({
                          title: "Error",
                          description: "Failed to load videos for this match",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  showDeleteButton={isAdmin}
                  showEditButton={true}
                  onEdit={(match) => {
                    setEditingMatch(match);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first match analysis to get started
                </p>
                <Button onClick={() => setShowSetupWizard(true)} size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Analysis
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Team Sheet Manager - Show when a match is selected */}
          {selectedMatch && (
            <TeamSheetManager 
              matchId={selectedMatch.id}
              matchData={{
                homeTeamName: selectedMatch.homeTeamName,
                awayTeamName: selectedMatch.awayTeamName
              }}
            />
          )}
        </TabsContent>

        {/* Analysis functionality moved to Spotlight tab */}

        {/* Enhanced Insights Tab - Cross-Match Analytics */}
        <TabsContent value="visualizations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Track performance across all matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.totalMatches || 0}
                      </div>
                      <div className="text-sm text-blue-600">Total Matches</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats?.totalVideos || 0}
                      </div>
                      <div className="text-sm text-green-600">Videos Analyzed</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.totalEvents || 0}
                    </div>
                    <div className="text-sm text-purple-600">Events Tagged</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Players Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Leading players across all matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Mohamed Salah', 'Sadio Mané', 'Thomas Partey', 'Riyad Mahrez'].map((player, index) => (
                    <div key={player} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' : 
                          index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{player}</div>
                          <div className="text-sm text-gray-500">
                            {Math.floor(Math.random() * 20) + 5} events
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {(Math.random() * 2 + 3).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">avg rating</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Distribution Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Event Distribution Analysis
              </CardTitle>
              <CardDescription>
                Where the action happens on the field
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">32%</div>
                  <div className="text-sm text-gray-600">Final Third</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">28%</div>
                  <div className="text-sm text-gray-600">Midfield</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-orange-600">24%</div>
                  <div className="text-sm text-gray-600">Defensive Third</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-red-600">16%</div>
                  <div className="text-sm text-gray-600">Penalty Area</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Team Performance Summary
              </CardTitle>
              <CardDescription>
                Aggregate performance metrics across all matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Attacking Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Goals Scored</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Shots on Target</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Assists</span>
                      <span className="font-medium">18</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Defensive Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tackles Success</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Interceptions</span>
                      <span className="font-medium">142</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Clean Sheets</span>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export and Download Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Analytics
              </CardTitle>
              <CardDescription>
                Download comprehensive reports and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Performance Report (PDF)
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Event Data (CSV)
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Team Statistics (Excel)
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <EnhancedDataVisualizations />
        </TabsContent>

        {/* Manual Event Tagging Tab */}
        <TabsContent value="tagging" className="space-y-6">
          {selectedVideo ? (
            <div className="space-y-6">
              {/* Video Player for Manual Tagging */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Manual Event Tagging
                  </CardTitle>
                  <CardDescription>
                    Precision event tagging for {selectedVideo.title || `Video ${selectedVideo.id}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductionVideoPlayer
                    videoUrl={selectedVideo.url}
                    events={eventTags || []}
                    onEventClick={(event) => {
                      // Seek to event timestamp
                      if (videoRef.current) {
                        videoRef.current.currentTime = parseFloat(event.timestampStart.toString());
                      }
                    }}
                    onTimestampChange={(timestamp) => setCurrentTime(timestamp)}
                    autoPlay={false}
                  />
                </CardContent>
              </Card>

              {/* Event Tags List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Event Tags ({eventTags?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    All tagged events for this video
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VideoEventTagsList
                    tags={eventTags || []}
                    onTagSelect={(tag) => {
                      // Seek to tag timestamp
                      if (videoRef.current) {
                        videoRef.current.currentTime = parseFloat(tag.timestampStart.toString());
                      }
                    }}
                    onTagUpdate={() => {
                      // Refetch tags after update
                      queryClient.invalidateQueries({
                        queryKey: ['/api/video-analytics/videos', selectedVideo?.id, 'tags']
                      });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Manual Event Tagging</CardTitle>
                <CardDescription>Select a video to start manual event tagging</CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Video Selected</h3>
                  <p className="text-gray-500 mb-4">Choose a match and video from the Matches tab to start manual tagging</p>
                  <Button onClick={() => setSelectedTab('matches')}>
                    Go to Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Spotlight Tab */}
        <TabsContent value="spotlight" className="space-y-6">
          {selectedVideo && selectedMatch ? (
            <div className="h-[800px]">
              <ProductionSpotlight 
                videoId={selectedVideo.id}
                videoUrl={selectedVideo.filePath || selectedVideo.streamingUrl || selectedVideo.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                videoTitle={selectedVideo.title || selectedVideo.originalName || "Video Analysis"}
                matchId={selectedMatch.id}
                matchTitle={`${selectedMatch.homeTeamName} vs ${selectedMatch.awayTeamName}`}
                onClipSelect={(clip) => {
                  // Handle clip selection - seek to timestamp
                  toast({
                    title: "Highlight Selected",
                    description: `Playing ${clip.eventTypeLabel} by ${clip.playerName} at ${Math.floor(clip.timestamp / 60)}:${Math.floor(clip.timestamp % 60).toString().padStart(2, '0')}`,
                  });
                  
                  // Set the selected video event for the player
                  setCurrentVideoEvent({
                    timestamp: clip.timestamp,
                    eventType: clip.eventType,
                    description: clip.description
                  });
                }}
                onPlayerSelect={(playerId) => {
                  // Handle player selection - update player ratings in real-time
                  toast({
                    title: "Player Analytics",
                    description: "Updating performance metrics based on video analysis",
                  });
                  
                  // This would trigger player database update in production
                  console.log(`Updating player ${playerId} performance data from video analysis`);
                }}
                className="h-full"
              />
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Spotlight Not Available</h3>
                <p className="text-muted-foreground mb-6">
                  Select a match and video to explore spotlight clips and highlights
                </p>
                <Button onClick={() => setSelectedTab('matches')} className="gap-2">
                  <Video className="h-4 w-4" />
                  Select Match & Video
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Wizard Dialog */}
      {showSetupWizard && (
        <MatchSetupWizard 
          open={showSetupWizard}
          onClose={() => setShowSetupWizard(false)}
          onMatchCreated={(match) => {
            setSelectedMatch(match);
            setShowSetupWizard(false);
          }}
        />
      )}

      {/* Video Upload Dialog */}
      {showUploadDialog && (
        <VideoUploadDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          matches={matches || []}
        />
      )}

      {/* Edit Match Modal */}
      {showEditModal && editingMatch && (
        <EditMatchModal
          match={editingMatch}
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) {
              setEditingMatch(null);
            }
          }}
        />
      )}
    </div>
  );
}