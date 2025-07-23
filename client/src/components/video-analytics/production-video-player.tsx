import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  Clock,
  Target,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeVideoUrl, getPlaybackUrl, requiresEmbedding, type VideoInfo } from '@/lib/video-utils';

interface VideoEvent {
  id: number;
  eventType: string;
  eventTypeLabel: string;
  timestampStart: number;
  timestampEnd?: number;
  playerName: string;
  qualityRating: number;
  outcome: string;
  description?: string;
  fieldX?: number;
  fieldY?: number;
  team: string;
  teamColor: string;
  isHighlight: boolean;
}

interface ProductionVideoPlayerProps {
  videoUrl?: string;
  events: VideoEvent[];
  onEventClick?: (event: VideoEvent) => void;
  onTimestampChange?: (timestamp: number) => void;
  className?: string;
  autoPlay?: boolean;
}

export function ProductionVideoPlayer({
  videoUrl = '',
  events = [],
  onEventClick,
  onTimestampChange,
  className = '',
  autoPlay = false
}: ProductionVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Production-grade state management
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isTransitioningRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingOperationRef = useRef(false);
  
  // Video URL analysis
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({ type: 'unsupported', originalUrl: '' });
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  // Analyze video URL when it changes
  useEffect(() => {
    if (videoUrl) {
      const info = analyzeVideoUrl(videoUrl);
      setVideoInfo(info);
      setPlaybackUrl(getPlaybackUrl(info));
      
      if (info.type === 'unsupported') {
        setError('Unsupported video format. Please use direct video files (MP4, WebM) or provide a direct video URL.');
      } else if (requiresEmbedding(info)) {
        setError(`${info.platform} videos cannot be played directly. Please use a direct video file or convert to a supported format.`);
      } else {
        setError(null);
      }
    } else {
      setVideoInfo({ type: 'unsupported', originalUrl: '' });
      setPlaybackUrl(null);
    }
  }, [videoUrl]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe video operations with comprehensive error handling
  const safeVideoOperation = useCallback(async (operation: () => Promise<void> | void, operationName: string) => {
    const video = videoRef.current;
    if (!video || !video.isConnected || isTransitioningRef.current) {
      console.warn(`${operationName} skipped: video not ready`);
      return false;
    }

    try {
      isTransitioningRef.current = true;
      await operation();
      return true;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'AbortError') {
          console.log(`${operationName} safely interrupted`);
        } else {
          console.warn(`${operationName} failed:`, error.message);
        }
      } else {
        console.error(`${operationName} unexpected error:`, error);
        setError(`Video ${operationName.toLowerCase()} failed`);
      }
      return false;
    } finally {
      isTransitioningRef.current = false;
    }
  }, []);

  // Production-grade play/pause with race condition prevention
  const togglePlayPause = useCallback(async () => {
    await safeVideoOperation(async () => {
      const video = videoRef.current!;
      
      if (isPlaying) {
        // Cancel any pending play promise before pausing
        if (playPromiseRef.current) {
          try {
            await playPromiseRef.current;
          } catch (e) {
            // Ignore cancelled play promises
          }
          playPromiseRef.current = null;
        }
        video.pause();
        setIsPlaying(false);
      } else {
        // Start play operation
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          playPromiseRef.current = video.play();
          await playPromiseRef.current;
          setIsPlaying(true);
          playPromiseRef.current = null;
        } else {
          setError('Video not ready for playback');
        }
      }
    }, 'PlayPause');
  }, [isPlaying, safeVideoOperation]);

  // Safe seek operation
  const seekToTime = useCallback(async (time: number) => {
    await safeVideoOperation(async () => {
      const video = videoRef.current!;
      
      // Wait for any pending operations
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch (e) {
          // Ignore errors
        }
        playPromiseRef.current = null;
      }
      
      video.currentTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(video.currentTime);
      onTimestampChange?.(video.currentTime);
    }, 'Seek');
  }, [duration, onTimestampChange, safeVideoOperation]);

  // Skip functions
  const skipBackward = useCallback(() => seekToTime(currentTime - 10), [currentTime, seekToTime]);
  const skipForward = useCallback(() => seekToTime(currentTime + 10), [currentTime, seekToTime]);

  // Volume control
  const toggleMute = useCallback(async () => {
    await safeVideoOperation(() => {
      const video = videoRef.current!;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }, 'Mute');
  }, [safeVideoOperation]);

  const setVideoVolume = useCallback(async (newVolume: number) => {
    await safeVideoOperation(() => {
      const video = videoRef.current!;
      video.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        video.muted = true;
        setIsMuted(true);
      } else if (video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    }, 'VolumeChange');
  }, [safeVideoOperation]);

  // Playback speed control
  const setSpeed = useCallback(async (speed: number) => {
    await safeVideoOperation(() => {
      const video = videoRef.current!;
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
    }, 'SpeedChange');
  }, [safeVideoOperation]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isTransitioningRef.current) {
        setCurrentTime(video.currentTime);
        onTimestampChange?.(video.currentTime);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      setError(null);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      playPromiseRef.current = null;
      isTransitioningRef.current = false;
      
      // Set loading timeout
      loadingTimeoutRef.current = setTimeout(() => {
        setError('Video loading timeout');
        setIsLoading(false);
      }, 30000); // 30 second timeout
    };

    const handlePlay = () => {
      if (!isTransitioningRef.current) {
        setIsPlaying(true);
      }
    };

    const handlePause = () => {
      if (!isTransitioningRef.current) {
        setIsPlaying(false);
      }
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      let errorMessage = 'Video playback error';
      
      if (target.error) {
        switch (target.error.code) {
          case 1:
            errorMessage = 'Video loading was aborted';
            break;
          case 2:
            errorMessage = 'Network error occurred';
            break;
          case 3:
            errorMessage = 'Video format not supported';
            break;
          case 4:
            errorMessage = 'Video source not found';
            break;
          default:
            errorMessage = 'Unknown video error';
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    // Add all event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [onTimestampChange]);

  // Handle video URL changes safely
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cancel all pending operations
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {});
      playPromiseRef.current = null;
    }
    
    isTransitioningRef.current = false;
    pendingOperationRef.current = false;
    
    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    
    // Only clear error if we have a valid playback URL
    if (playbackUrl) {
      setError(null);
    }
    
    // Pause safely before URL change
    if (video.isConnected && !video.paused) {
      try {
        video.pause();
      } catch (e) {
        console.warn('Failed to pause during URL change:', e);
      }
    }
  }, [videoUrl, playbackUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts in form inputs
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, skipBackward, skipForward, toggleMute, toggleFullscreen]);

  // Get events at current time
  const currentEvents = events.filter(event => {
    const start = parseFloat(event.timestampStart.toString());
    const end = event.timestampEnd ? parseFloat(event.timestampEnd.toString()) : start + 5;
    return currentTime >= start && currentTime <= end;
  });

  return (
    <Card ref={containerRef} className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Video Element */}
        <div className="relative bg-black">
          {playbackUrl ? (
            <video
              ref={videoRef}
              src={playbackUrl}
              className="w-full h-auto max-h-[600px] object-contain"
              preload="metadata"
              crossOrigin="anonymous"
              playsInline
            />
          ) : videoInfo.type === 'youtube' || videoInfo.type === 'vimeo' ? (
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-900">
              <div className="text-center text-white p-6">
                <div className="text-yellow-400 mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">{videoInfo.platform} Video Detected</h3>
                <p className="text-gray-300 mb-4">
                  {videoInfo.platform} videos cannot be played directly in the video player.
                </p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(videoInfo.originalUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in {videoInfo.platform}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-900">
              <div className="text-center text-white p-6">
                <div className="text-gray-400 mb-4">📹</div>
                <h3 className="text-lg font-semibold mb-2">No Video Available</h3>
                <p className="text-gray-300">Upload a video to start analysis</p>
              </div>
            </div>
          )}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}
          
          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              <div className="text-white text-center p-4">
                <div className="text-red-400 mb-2">⚠️</div>
                <p className="font-medium mb-2">Video Error</p>
                <p className="text-sm text-gray-300">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setError(null);
                    const video = videoRef.current;
                    if (video) {
                      video.load();
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          {/* Event Overlays */}
          {currentEvents.map(event => (
            <div
              key={event.id}
              className="absolute top-4 right-4 bg-black/75 text-white p-2 rounded-lg cursor-pointer hover:bg-black/90 transition-colors"
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" style={{ backgroundColor: event.teamColor }}>
                  {event.eventTypeLabel}
                </Badge>
                <span className="text-sm">{event.playerName}</span>
              </div>
              {event.description && (
                <p className="text-xs text-gray-300 mt-1">{event.description}</p>
              )}
            </div>
          ))}
        </div>
        
        {/* Timeline with Events */}
        <div className="relative bg-gray-100 dark:bg-gray-800 h-16 flex items-center">
          {/* Event markers */}
          {events.map(event => {
            const position = duration > 0 ? (parseFloat(event.timestampStart.toString()) / duration) * 100 : 0;
            return (
              <div
                key={event.id}
                className="absolute top-1 h-14 w-1 cursor-pointer hover:w-2 transition-all z-10"
                style={{ 
                  left: `${position}%`,
                  backgroundColor: event.teamColor
                }}
                onClick={() => seekToTime(parseFloat(event.timestampStart.toString()))}
                title={`${event.eventTypeLabel} - ${event.playerName} at ${formatTime(parseFloat(event.timestampStart.toString()))}`}
              />
            );
          })}
          
          {/* Progress bar */}
          <div className="absolute inset-x-0 top-8 mx-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              className="cursor-pointer"
              onValueChange={([value]) => seekToTime(value)}
            />
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-white dark:bg-gray-900 p-4 border-t">
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipBackward}
                disabled={isLoading}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                disabled={isLoading || !!error}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
                disabled={isLoading}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  disabled={isLoading}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => setVideoVolume(value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Center time display */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            
            {/* Right controls */}
            <div className="flex items-center gap-2">
              <select
                className="text-sm bg-transparent border rounded px-2 py-1"
                value={playbackSpeed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                disabled={isLoading}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                disabled={isLoading}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}