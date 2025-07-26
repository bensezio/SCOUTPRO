import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Video, 
  Scissors, 
  Clock, 
  Target, 
  Eye,
  RefreshCw,
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface VideoEvent {
  id: string;
  timestamp: number;
  duration: number;
  eventType: 'goal' | 'assist' | 'tackle' | 'pass' | 'shot' | 'save' | 'foul' | 'card';
  description: string;
  confidence: number;
  playerIds: number[];
}

interface HighlightRequest {
  videoId: number;
  eventTypes: string[];
  minConfidence: number;
  maxDuration: number;
  playerIds?: number[];
  customEvents?: VideoEvent[];
}

interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoId: number;
  outputUrl?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  processingTime?: number;
}

export const VideoHighlightGenerator: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [highlightConfig, setHighlightConfig] = useState<HighlightRequest>({
    videoId: 0,
    eventTypes: ['goal', 'assist'],
    minConfidence: 0.8,
    maxDuration: 300, // 5 minutes
    playerIds: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available videos with error handling
  const { data: videos, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/videos');
        return response;
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        toast({
          title: "Connection Error",
          description: "Unable to load videos. Please check your connection.",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch video events for selected video with error handling
  const { data: videoEvents, error: eventsError } = useQuery({
    queryKey: ['/api/videos', selectedVideo, 'events'],
    queryFn: async () => {
      if (!selectedVideo) return null;
      try {
        const response = await apiRequest('GET', `/api/videos/${selectedVideo}/events`);
        return response;
      } catch (error) {
        console.error('Failed to fetch video events:', error);
        return null; // Return null instead of throwing for non-critical data
      }
    },
    enabled: !!selectedVideo,
    retry: 1,
  });

  // Fetch processing jobs with error handling
  const { data: processingJobs, refetch: refetchJobs, error: jobsError } = useQuery({
    queryKey: ['/api/video-processing/jobs'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/video-processing/jobs');
        return response;
      } catch (error) {
        console.error('Failed to fetch processing jobs:', error);
        return { jobs: [] }; // Return empty array as fallback
      }
    },
    retry: 1,
    retryDelay: 2000,
  });

  // Video upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress (in real implementation, use XMLHttpRequest with progress events)
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(uploadInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      try {
        const response = await apiRequest('POST', '/api/videos/upload', formData);
        clearInterval(uploadInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
        return response;
      } catch (error) {
        clearInterval(uploadInterval);
        setIsUploading(false);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: "Upload Successful",
        description: "Video uploaded and processing started.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Highlight generation mutation
  const generateHighlightsMutation = useMutation({
    mutationFn: async (config: HighlightRequest) => {
      return apiRequest('POST', '/api/video-processing/generate-highlights', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-processing/jobs'] });
      toast({
        title: "Highlight Generation Started",
        description: "Processing your video highlights. This may take a few minutes.",
      });
      setActiveTab('processing');
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to start highlight generation.",
        variant: "destructive"
      });
    }
  });

  // Event detection mutation
  const detectEventsMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest('POST', `/api/videos/${videoId}/detect-events`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', selectedVideo, 'events'] });
      toast({
        title: "Event Detection Started",
        description: "AI is analyzing the video for key events.",
      });
    }
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 2GB.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('videoType', 'match');
    formData.append('description', `Uploaded video: ${file.name}`);

    uploadMutation.mutate(formData);
  };

  // Generate highlights
  const generateHighlights = () => {
    if (!selectedVideo) {
      toast({
        title: "No Video Selected",
        description: "Please select a video first.",
        variant: "destructive"
      });
      return;
    }

    const config: HighlightRequest = {
      ...highlightConfig,
      videoId: selectedVideo
    };

    generateHighlightsMutation.mutate(config);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Video Highlight Generator</h2>
        <Badge variant="outline" className="text-sm">
          FFmpeg Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="events">Event Detection</TabsTrigger>
          <TabsTrigger value="highlights">Generate Highlights</TabsTrigger>
          <TabsTrigger value="processing">Processing Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Video Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileVideo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Upload Match Video</p>
                <p className="text-sm text-gray-600 mb-4">
                  Supports MP4, AVI, MOV files up to 2GB
                </p>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="max-w-sm mx-auto"
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Processing Features</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Automatic event detection
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Player tracking & identification
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Highlight generation
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Multiple format export
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Supported Events</Label>
                  <div className="space-y-1 mt-2">
                    {['Goals', 'Assists', 'Key Passes', 'Tackles', 'Saves', 'Cards', 'Fouls', 'Shots'].map(event => (
                      <Badge key={event} variant="outline" className="text-xs mr-1 mb-1">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {videos?.videos && videos.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.videos.slice(0, 6).map((video: any) => (
                    <div
                      key={video.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedVideo === video.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVideo(video.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4" />
                        <span className="font-medium text-sm">{video.originalName}</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Duration: {formatDuration(video.duration)}</div>
                        <div>Size: {(video.fileSize / (1024 * 1024)).toFixed(1)} MB</div>
                        <div>Status: {video.analysisStatus}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Event Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedVideo ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select a Video</h3>
                  <p className="text-gray-600">Choose a video from the upload tab to analyze events</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">AI Event Detection</h3>
                      <p className="text-sm text-gray-600">
                        Automatically detect key moments in the video
                      </p>
                    </div>
                    <Button
                      onClick={() => detectEventsMutation.mutate(selectedVideo)}
                      disabled={detectEventsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {detectEventsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Target className="w-4 h-4" />
                      )}
                      Detect Events
                    </Button>
                  </div>

                  {videoEvents && videoEvents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Detected Events</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {videoEvents.map((event: VideoEvent) => (
                          <div key={event.id} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {event.eventType}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {formatDuration(event.timestamp)}
                                </span>
                              </div>
                              <Badge 
                                variant={event.confidence > 0.8 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {Math.round(event.confidence * 100)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Highlight Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Event Types</Label>
                    <Select 
                      value={highlightConfig.eventTypes.join(',')} 
                      onValueChange={(value) => setHighlightConfig({
                        ...highlightConfig,
                        eventTypes: value.split(',')
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select events to include" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goal,assist">Goals & Assists</SelectItem>
                        <SelectItem value="goal,assist,shot">Goals, Assists & Shots</SelectItem>
                        <SelectItem value="goal,assist,tackle,save">All Key Events</SelectItem>
                        <SelectItem value="goal,assist,shot,tackle,save,card">All Events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Minimum Confidence</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">Low</span>
                      <Input
                        type="range"
                        min="0.5"
                        max="0.95"
                        step="0.05"
                        value={highlightConfig.minConfidence}
                        onChange={(e) => setHighlightConfig({
                          ...highlightConfig,
                          minConfidence: parseFloat(e.target.value)
                        })}
                        className="flex-1"
                      />
                      <span className="text-sm">High</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Current: {Math.round(highlightConfig.minConfidence * 100)}%
                    </p>
                  </div>

                  <div>
                    <Label>Max Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="60"
                      max="600"
                      value={highlightConfig.maxDuration}
                      onChange={(e) => setHighlightConfig({
                        ...highlightConfig,
                        maxDuration: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Output Settings</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        1080p HD Quality
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        MP4 Format
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Smooth Transitions
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Event Timestamps
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={generateHighlights}
                    disabled={!selectedVideo || generateHighlightsMutation.isPending}
                    className="w-full flex items-center gap-2"
                  >
                    {generateHighlightsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Scissors className="w-4 h-4" />
                    )}
                    Generate Highlights
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Processing Queue
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchJobs()}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!processingJobs?.jobs || processingJobs.jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Processing Jobs</h3>
                  <p className="text-gray-600">Upload and process videos to see jobs here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(processingJobs?.jobs || []).map((job: ProcessingJob) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                          <span className="font-medium">Job #{job.id.slice(0, 8)}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {job.status}
                          </Badge>
                        </div>
                        {job.outputUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={job.outputUrl} download>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>

                      {job.status === 'processing' && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Processing...</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="w-full" />
                        </div>
                      )}

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Started: {new Date(job.startedAt).toLocaleString()}</div>
                        {job.completedAt && (
                          <div>Completed: {new Date(job.completedAt).toLocaleString()}</div>
                        )}
                        {job.processingTime && (
                          <div>Processing Time: {job.processingTime}s</div>
                        )}
                        {job.errorMessage && (
                          <div className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {job.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoHighlightGenerator;