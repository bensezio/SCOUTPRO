import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileVideo, CheckCircle, Link, Youtube, Video } from "lucide-react";

interface VideoUploadDialogProps {
  open: boolean;
  onClose: () => void;
  matches: any[];
}

export function VideoUploadDialog({ open, onClose, matches }: VideoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [videoType, setVideoType] = useState<string>("full_match");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, matchId, videoType, url, title, description }: { 
      file?: File; 
      matchId: string; 
      videoType: string; 
      url?: string; 
      title?: string; 
      description?: string; 
    }) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Get authentication token
        const token = localStorage.getItem('token');
        xhr.open('POST', `/api/video-analytics/matches/${matchId}/videos`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (file) {
          // File upload with FormData
          const formData = new FormData();
          formData.append('video', file);
          formData.append('videoType', videoType);
          if (title) formData.append('title', title);
          if (description) formData.append('description', description);

          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              setUploadProgress(Math.round(progress));
            }
          });

          xhr.send(formData);
        } else if (url) {
          // URL upload with JSON
          xhr.setRequestHeader('Content-Type', 'application/json');
          
          const requestBody = {
            videoUrl: url,
            videoType,
            title: title || '',
            description: description || ''
          };

          // Simulate progress for URL processing
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 90) {
              clearInterval(progressInterval);
            }
          }, 200);

          xhr.send(JSON.stringify(requestBody));
        } else {
          reject(new Error('No file or URL provided'));
          return;
        }

        xhr.addEventListener('load', () => {
          if (xhr.status === 201) {
            setUploadProgress(100);
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
      });
    },
    onSuccess: () => {
      toast({ title: "Video uploaded successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
      setUploadProgress(0);
    }
  });

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedMatch("");
    setVideoType("full_match");
    setUploadProgress(0);
    setVideoUrl("");
    setVideoTitle("");
    setVideoDescription("");
    setUploadMethod('file');
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file (MP4, AVI, MOV, WMV, FLV, WebM)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a video file smaller than 2GB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const validateVideoUrl = (url: string) => {
    // YouTube URL patterns
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/;
    // VEO URL patterns
    const veoRegex = /^(https?:\/\/)?(app\.veo\.co|veo\.co)\//;
    // Generic video URL patterns
    const videoUrlRegex = /^https?:\/\/.+\.(mp4|avi|mov|wmv|flv|webm)$/i;
    
    return youtubeRegex.test(url) || veoRegex.test(url) || videoUrlRegex.test(url);
  };

  const handleSubmit = () => {
    if (!selectedMatch) {
      toast({
        title: "Missing information",
        description: "Please select a match",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'file') {
      if (!selectedFile) {
        toast({
          title: "Missing file",
          description: "Please select a video file",
          variant: "destructive"
        });
        return;
      }
      
      uploadMutation.mutate({ 
        file: selectedFile, 
        matchId: selectedMatch, 
        videoType,
        title: videoTitle,
        description: videoDescription
      });
    } else {
      if (!videoUrl || !videoTitle) {
        toast({
          title: "Missing information",
          description: "Please provide video URL and title",
          variant: "destructive"
        });
        return;
      }
      
      if (!validateVideoUrl(videoUrl)) {
        toast({
          title: "Invalid URL",
          description: "Please provide a valid YouTube, VEO, or direct video URL",
          variant: "destructive"
        });
        return;
      }
      
      uploadMutation.mutate({ 
        url: videoUrl,
        matchId: selectedMatch, 
        videoType,
        title: videoTitle,
        description: videoDescription
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Match Video</DialogTitle>
          <DialogDescription>
            Upload a video file to start tagging and analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Method Tabs */}
          <Tabs value={uploadMethod} onValueChange={(value: 'file' | 'link') => setUploadMethod(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Video URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary bg-primary/5' 
                    : selectedFile 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-muted-foreground/25'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                      size="sm"
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileVideo className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-lg font-medium">
                        Drop your video file here, or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports MP4, AVI, MOV, WMV, FLV, WebM (up to 2GB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Browse Files
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              {/* Video URL Input */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://app.veo.co/..."
                />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  Supports YouTube, VEO, and direct video URLs
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Match Selection */}
          <div className="space-y-2">
            <Label>Select Match</Label>
            <Select value={selectedMatch} onValueChange={setSelectedMatch}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a match for this video" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((match) => (
                  <SelectItem key={match.id} value={match.id.toString()}>
                    {match.homeTeamName} vs {match.awayTeamName} - {new Date(match.matchDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Type Selection */}
          <div className="space-y-2">
            <Label>Video Type</Label>
            <Select value={videoType} onValueChange={setVideoType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_match">Full Match</SelectItem>
                <SelectItem value="first_half">First Half</SelectItem>
                <SelectItem value="second_half">Second Half</SelectItem>
                <SelectItem value="highlights">Highlights</SelectItem>
                <SelectItem value="custom_clip">Custom Clip</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Enter video description"
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedMatch || uploadMutation.isPending || 
                (uploadMethod === 'file' && !selectedFile) || 
                (uploadMethod === 'link' && (!videoUrl || !videoTitle))}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploadMutation.isPending ? "Processing..." : "Upload Video"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}