import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Edit, 
  Upload, 
  Link2, 
  Calendar, 
  Trophy, 
  MapPin, 
  Target,
  Play,
  FileVideo,
  Settings,
  X
} from 'lucide-react';

interface EditMatchModalProps {
  match: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORTED_EVENTS = [
  'Goals', 'Assists', 'Key Passes', 'Tackles', 'Saves', 
  'Cards', 'Fouls', 'Shots', 'Crosses', 'Interceptions'
];

export function EditMatchModal({ match, open, onOpenChange }: EditMatchModalProps) {
  const [formData, setFormData] = useState({
    homeTeamName: '',
    awayTeamName: '',
    competition: '',
    venue: '',
    matchDate: '',
    homeScore: '',
    awayScore: '',
    description: '',
    trackedEvents: [] as string[]
  });

  const [videoSection, setVideoSection] = useState({
    replaceVideo: false,
    videoType: 'file' as 'file' | 'url',
    videoFile: null as File | null,
    videoUrl: '',
    videoTitle: '',
    videoDescription: ''
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when match changes
  useEffect(() => {
    if (match) {
      setFormData({
        homeTeamName: match.homeTeamName || '',
        awayTeamName: match.awayTeamName || '',
        competition: match.competition || '',
        venue: match.venue || '',
        matchDate: match.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
        homeScore: match.homeScore?.toString() || '',
        awayScore: match.awayScore?.toString() || '',
        description: match.description || '',
        trackedEvents: match.trackedEvents || []
      });
    }
  }, [match]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/video-analytics/matches/${match.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches'] });
      toast({
        title: "Match updated",
        description: "The match details have been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update match",
        variant: "destructive",
      });
    },
  });

  const uploadVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      try {
        const response = await apiRequest('POST', `/api/video-analytics/matches/${match.id}/videos`, formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Video uploaded",
        description: "The new video has been uploaded successfully.",
      });
      // Reset video section
      setVideoSection({
        replaceVideo: false,
        videoType: 'file',
        videoFile: null,
        videoUrl: '',
        videoTitle: '',
        videoDescription: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.homeTeamName || !formData.awayTeamName) {
      toast({
        title: "Validation Error",
        description: "Home and Away team names are required.",
        variant: "destructive",
      });
      return;
    }

    // Prepare update data
    const updateData = {
      ...formData,
      homeScore: formData.homeScore ? parseInt(formData.homeScore) : null,
      awayScore: formData.awayScore ? parseInt(formData.awayScore) : null,
      matchDate: formData.matchDate ? new Date(formData.matchDate).toISOString() : null,
      trackedEvents: formData.trackedEvents
    };

    // Update match first
    updateMutation.mutate(updateData);

    // Handle video replacement if requested
    if (videoSection.replaceVideo) {
      const videoFormData = new FormData();
      
      if (videoSection.videoType === 'file' && videoSection.videoFile) {
        videoFormData.append('video', videoSection.videoFile);
      } else if (videoSection.videoType === 'url' && videoSection.videoUrl) {
        videoFormData.append('videoUrl', videoSection.videoUrl);
      }
      
      videoFormData.append('title', videoSection.videoTitle || `${formData.homeTeamName} vs ${formData.awayTeamName}`);
      videoFormData.append('description', videoSection.videoDescription || 'Updated match video');
      videoFormData.append('videoType', 'full_match');
      
      if (videoSection.videoFile || videoSection.videoUrl) {
        uploadVideoMutation.mutate(videoFormData);
      }
    }
  };

  const handleEventToggle = (event: string) => {
    setFormData(prev => ({
      ...prev,
      trackedEvents: prev.trackedEvents.includes(event)
        ? prev.trackedEvents.filter(e => e !== event)
        : [...prev.trackedEvents, event]
    }));
  };

  const handleVideoFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, AVI, MOV, WMV, FLV, WebM)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 500MB. Please compress your video or use a smaller file.",
        variant: "destructive"
      });
      return;
    }

    setVideoSection(prev => ({
      ...prev,
      videoFile: file,
      videoTitle: file.name.replace(/\.[^/.]+$/, "")
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Match Analysis
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Match Details
              </CardTitle>
              <CardDescription>
                Update the basic match information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeTeam">Home Team *</Label>
                <Input
                  id="homeTeam"
                  value={formData.homeTeamName}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeTeamName: e.target.value }))}
                  placeholder="Enter home team name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="awayTeam">Away Team *</Label>
                <Input
                  id="awayTeam"
                  value={formData.awayTeamName}
                  onChange={(e) => setFormData(prev => ({ ...prev, awayTeamName: e.target.value }))}
                  placeholder="Enter away team name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition">Competition</Label>
                <Input
                  id="competition"
                  value={formData.competition}
                  onChange={(e) => setFormData(prev => ({ ...prev, competition: e.target.value }))}
                  placeholder="e.g., Premier League, Champions League"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g., Wembley Stadium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchDate">Match Date</Label>
                <Input
                  id="matchDate"
                  type="date"
                  value={formData.matchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Final Score</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.homeScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeScore: e.target.value }))}
                    placeholder="Home"
                    min="0"
                    className="w-20"
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    value={formData.awayScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, awayScore: e.target.value }))}
                    placeholder="Away"
                    min="0"
                    className="w-20"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add any additional notes about this match..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tracked Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Tracked Events
              </CardTitle>
              <CardDescription>
                Select which events should be tracked during analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {SUPPORTED_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={formData.trackedEvents.includes(event)}
                      onCheckedChange={() => handleEventToggle(event)}
                    />
                    <Label
                      htmlFor={event}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Video Replacement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-4 w-4" />
                Video Replacement
              </CardTitle>
              <CardDescription>
                Optionally replace the match video with a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replaceVideo"
                  checked={videoSection.replaceVideo}
                  onCheckedChange={(checked) => setVideoSection(prev => ({ ...prev, replaceVideo: !!checked }))}
                />
                <Label htmlFor="replaceVideo" className="text-sm font-medium">
                  Replace existing video
                </Label>
              </div>

              {videoSection.replaceVideo && (
                <div className="space-y-4 p-4 border rounded-lg">
                  {/* Video Type Selection */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={videoSection.videoType === 'file' ? 'default' : 'outline'}
                      onClick={() => setVideoSection(prev => ({ ...prev, videoType: 'file' }))}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant={videoSection.videoType === 'url' ? 'default' : 'outline'}
                      onClick={() => setVideoSection(prev => ({ ...prev, videoType: 'url' }))}
                      className="flex-1"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Video URL
                    </Button>
                  </div>

                  {/* File Upload */}
                  {videoSection.videoType === 'file' && (
                    <div className="space-y-2">
                      <Label htmlFor="videoFile">Select Video File</Label>
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={(e) => e.target.files?.[0] && handleVideoFileSelect(e.target.files[0])}
                      />
                      {videoSection.videoFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {videoSection.videoFile.name} ({(videoSection.videoFile.size / 1024 / 1024).toFixed(1)}MB)
                        </p>
                      )}
                    </div>
                  )}

                  {/* URL Input */}
                  {videoSection.videoType === 'url' && (
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">Video URL</Label>
                      <Input
                        id="videoUrl"
                        value={videoSection.videoUrl}
                        onChange={(e) => setVideoSection(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      />
                    </div>
                  )}

                  {/* Video Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoTitle">Video Title</Label>
                      <Input
                        id="videoTitle"
                        value={videoSection.videoTitle}
                        onChange={(e) => setVideoSection(prev => ({ ...prev, videoTitle: e.target.value }))}
                        placeholder="Enter video title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoDescription">Video Description</Label>
                      <Input
                        id="videoDescription"
                        value={videoSection.videoDescription}
                        onChange={(e) => setVideoSection(prev => ({ ...prev, videoDescription: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || uploadVideoMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Match'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}