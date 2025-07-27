import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Video,
  Square,
  RotateCcw,
  Download,
  Upload,
  X,
  Check,
  Smartphone,
  Image as ImageIcon,
  FileVideo,
  Zap,
} from 'lucide-react';

interface CameraCaptureProps {
  mode: 'photo' | 'video';
  onCapture: (file: File, metadata: MediaMetadata) => void;
  onClose: () => void;
  playerId?: number;
  playerName?: string;
}

interface MediaMetadata {
  type: 'photo' | 'video';
  timestamp: string;
  location?: { latitude: number; longitude: number };
  deviceInfo: string;
  playerId?: number;
  playerName?: string;
  duration?: number;
  size: number;
}

export default function CameraCapture({ 
  mode, 
  onCapture, 
  onClose, 
  playerId, 
  playerName 
}: CameraCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();

  // Initialize camera
  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, [facing]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const initializeCamera = async () => {
    try {
      // Check if device supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: 'Camera not supported',
          description: 'Your device does not support camera access.',
          variant: 'destructive',
        });
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: mode === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Setup media recorder for video mode
      if (mode === 'video') {
        setupMediaRecorder(stream);
      }

    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraPermission('denied');
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to use this feature.',
        variant: 'destructive',
      });
    }
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `player-video-${Date.now()}.webm`, {
          type: 'video/webm',
        });
        
        setCapturedMedia(file);
        setPreviewUrl(URL.createObjectURL(blob));
        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('MediaRecorder setup failed:', error);
      toast({
        title: 'Recording setup failed',
        description: 'Video recording is not supported on this device.',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `player-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          
          setCapturedMedia(file);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startRecording = () => {
    if (!mediaRecorderRef.current) return;

    chunksRef.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setHasStarted(true);
    setRecordingTime(0);
    
    toast({
      title: 'Recording started',
      description: 'Video recording is now active',
    });
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    toast({
      title: 'Recording stopped',
      description: 'Processing video...',
    });
  };

  const handleCapture = () => {
    if (mode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const switchCamera = () => {
    setFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const saveMedia = async () => {
    if (!capturedMedia) return;

    // Get device info
    const deviceInfo = `${navigator.userAgent} - ${window.screen.width}x${window.screen.height}`;
    
    // Get location if available
    let location: { latitude: number; longitude: number } | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error) {
        console.log('Location access denied or failed');
      }
    }

    const metadata: MediaMetadata = {
      type: mode,
      timestamp: new Date().toISOString(),
      location,
      deviceInfo,
      playerId,
      playerName,
      duration: mode === 'video' ? recordingTime : undefined,
      size: capturedMedia.size,
    };

    onCapture(capturedMedia, metadata);
    
    toast({
      title: 'Media saved',
      description: `${mode === 'photo' ? 'Photo' : 'Video'} has been saved successfully`,
    });
  };

  const retake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedMedia(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    setHasStarted(false);
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (cameraPermission === 'denied') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Access Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Camera access is required to capture {mode === 'photo' ? 'photos' : 'videos'} of players.
              Please enable camera permissions in your browser settings.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">How to enable camera access:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Click the camera icon in your browser's address bar</li>
              <li>• Select "Always allow" for this site</li>
              <li>• Refresh the page and try again</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={initializeCamera} className="flex-1">
              Try Again
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="text-white">
              <h3 className="font-medium">
                {mode === 'photo' ? 'Photo Capture' : 'Video Recording'}
              </h3>
              {playerName && (
                <p className="text-sm text-white/80">Player: {playerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {mode === 'photo' ? <ImageIcon className="h-3 w-3 mr-1" /> : <FileVideo className="h-3 w-3 mr-1" />}
              {mode.toUpperCase()}
            </Badge>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                REC {formatTime(recordingTime)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Camera View or Preview */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {!capturedMedia ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {mode === 'photo' ? (
              <img
                src={previewUrl || ''}
                alt="Captured photo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={previewUrl || ''}
                controls
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        {!capturedMedia ? (
          <div className="flex items-center justify-center gap-6">
            {/* Switch Camera */}
            <Button
              variant="ghost"
              size="lg"
              onClick={switchCamera}
              className="text-white hover:bg-white/20 touch-target"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>

            {/* Capture Button */}
            <Button
              size="lg"
              onClick={handleCapture}
              disabled={cameraPermission !== 'granted'}
              className={`w-20 h-20 rounded-full touch-target ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {mode === 'photo' ? (
                <Camera className={`h-8 w-8 ${isRecording ? 'text-white' : 'text-black'}`} />
              ) : isRecording ? (
                <Square className="h-8 w-8 text-white" />
              ) : (
                <Video className="h-8 w-8 text-black" />
              )}
            </Button>

            {/* Flash/Settings */}
            <Button
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 touch-target"
            >
              <Zap className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={retake}
              className="flex items-center gap-2 bg-white/20 border-white/30 text-white hover:bg-white/30 touch-target"
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
            
            <Button
              onClick={saveMedia}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white touch-target"
            >
              <Check className="h-4 w-4" />
              Save {mode === 'photo' ? 'Photo' : 'Video'}
            </Button>
          </div>
        )}

        {/* Recording Info */}
        {mode === 'video' && !capturedMedia && (
          <div className="text-center mt-4">
            <p className="text-white/80 text-sm">
              {!hasStarted 
                ? 'Tap the record button to start filming'
                : isRecording 
                  ? 'Recording... Tap square to stop'
                  : 'Tap record to continue or retake'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}