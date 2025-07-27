import type { Express } from "express";
import multer from "multer";
import path from "path";
import { authenticateToken, type AuthenticatedRequest } from "./auth-routes.js";
import { Response } from "express";
import { z } from "zod";

// Video upload storage configuration
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/quicktime'];
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    
    // Check both MIME type and file extension
    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidMime || hasValidExtension) {
      cb(null, true);
    } else {
      console.log(`File rejected - MIME: ${file.mimetype}, Filename: ${file.originalname}`);
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Video upload schema
const videoUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  playerId: z.number().optional(),
  matchId: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

interface VideoProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoId: string;
  type: 'highlight_generation' | 'ai_analysis' | 'event_detection';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

// In-memory storage for processing jobs (in production, use Redis or database)
const processingJobs = new Map<string, VideoProcessingJob>();

// Sample video data for testing
const sampleVideos = [
  {
    id: 1,
    title: "Mohammed Salah - Liverpool vs Arsenal",
    filename: "salah_highlights_2025.mp4",
    duration: 5400, // 90 minutes
    format: "video/mp4",
    uploadedAt: new Date("2025-01-07T10:00:00Z"),
    status: "completed",
    playerId: 1,
    playerName: "Mohammed Salah",
    thumbnailUrl: "/api/placeholder/300/200?color=1f2937&text=Salah+Video"
  },
  {
    id: 2,
    title: "Sadio Mané - Senegal vs Egypt",
    filename: "mane_analysis_2025.mp4", 
    duration: 3600, // 60 minutes
    format: "video/mp4",
    uploadedAt: new Date("2025-01-06T15:30:00Z"),
    status: "processing",
    playerId: 2,
    playerName: "Sadio Mané",
    thumbnailUrl: "/api/placeholder/300/200?color=1f2937&text=Mane+Video"
  },
  {
    id: 3,
    title: "Thomas Partey - Arsenal Training",
    filename: "partey_training_2025.mp4",
    duration: 2700, // 45 minutes  
    format: "video/mp4",
    uploadedAt: new Date("2025-01-05T09:15:00Z"),
    status: "completed",
    playerId: 3,
    playerName: "Thomas Partey",
    thumbnailUrl: "/api/placeholder/300/200?color=1f2937&text=Partey+Video"
  }
];

export function registerVideoRoutes(app: Express) {
  
  // Get all videos
  app.get('/api/videos', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, playerId, matchId, limit = 20, offset = 0 } = req.query;
      
      let filteredVideos = [...sampleVideos];
      
      // Apply filters
      if (status && status !== 'all') {
        filteredVideos = filteredVideos.filter(video => video.status === status);
      }
      
      if (playerId) {
        filteredVideos = filteredVideos.filter(video => video.playerId === parseInt(playerId as string));
      }
      
      // Pagination
      const startIndex = parseInt(offset as string);
      const limitNum = parseInt(limit as string);
      const paginatedVideos = filteredVideos.slice(startIndex, startIndex + limitNum);
      
      res.json({
        videos: paginatedVideos,
        total: filteredVideos.length,
        pagination: {
          limit: limitNum,
          offset: startIndex,
          hasMore: startIndex + limitNum < filteredVideos.length
        }
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Get specific video
  app.get('/api/videos/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = sampleVideos.find(v => v.id === videoId);
      
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      res.json({ video });
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  // Upload video
  app.post('/api/videos/upload', 
    authenticateToken, 
    upload.single('video'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No video file uploaded' });
        }

        // Validate additional data
        const uploadData = videoUploadSchema.parse({
          title: req.body.title,
          description: req.body.description,
          playerId: req.body.playerId ? parseInt(req.body.playerId) : undefined,
          matchId: req.body.matchId ? parseInt(req.body.matchId) : undefined,
          tags: req.body.tags ? JSON.parse(req.body.tags) : []
        });

        // Create video record
        const newVideo = {
          id: sampleVideos.length + 1,
          title: uploadData.title,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          duration: 0, // Will be determined during processing
          format: req.file.mimetype,
          uploadedAt: new Date(),
          uploadedBy: req.user!.id,
          status: 'processing' as const,
          playerId: uploadData.playerId,
          matchId: uploadData.matchId,
          description: uploadData.description,
          tags: uploadData.tags,
          filePath: req.file.path,
          thumbnailUrl: `/api/placeholder/300/200?color=1f2937&text=${encodeURIComponent(uploadData.title)}`
        };

        // Add to sample videos (in production, save to database)
        sampleVideos.push(newVideo as any);

        // Create processing job
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const processingJob: VideoProcessingJob = {
          id: jobId,
          status: 'pending',
          progress: 0,
          videoId: newVideo.id.toString(),
          type: 'ai_analysis',
          createdAt: new Date()
        };

        processingJobs.set(jobId, processingJob);

        // Simulate processing
        setTimeout(() => {
          const job = processingJobs.get(jobId);
          if (job) {
            job.status = 'processing';
            job.progress = 25;
            processingJobs.set(jobId, job);
          }
        }, 1000);

        setTimeout(() => {
          const job = processingJobs.get(jobId);
          if (job) {
            job.status = 'processing';
            job.progress = 75;
            processingJobs.set(jobId, job);
          }
        }, 3000);

        setTimeout(() => {
          const job = processingJobs.get(jobId);
          if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.completedAt = new Date();
            job.result = {
              highlights: 3,
              events: 15,
              aiInsights: 8
            };
            processingJobs.set(jobId, job);
            
            // Update video status
            const videoIndex = sampleVideos.findIndex(v => v.id === newVideo.id);
            if (videoIndex !== -1) {
              sampleVideos[videoIndex].status = 'completed';
            }
          }
        }, 5000);

        res.status(201).json({
          success: true,
          video: newVideo,
          jobId,
          message: 'Video uploaded successfully and processing started'
        });

      } catch (error) {
        console.error('Error uploading video:', error);
        if (error instanceof z.ZodError) {
          res.status(400).json({ error: 'Validation failed', details: error.errors });
        } else {
          res.status(500).json({ error: 'Failed to upload video' });
        }
      }
    }
  );

  // Delete video
  app.delete('/api/videos/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const videoIndex = sampleVideos.findIndex(v => v.id === videoId);
      
      if (videoIndex === -1) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      // Remove from sample videos (in production, delete from database and file system)
      sampleVideos.splice(videoIndex, 1);
      
      res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  });

  // Get processing jobs
  app.get('/api/video-processing/jobs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, videoId, type, limit = 20, offset = 0 } = req.query;
      
      let jobs = Array.from(processingJobs.values());
      
      // Apply filters
      if (status && status !== 'all') {
        jobs = jobs.filter(job => job.status === status);
      }
      
      if (videoId) {
        jobs = jobs.filter(job => job.videoId === videoId);
      }
      
      if (type) {
        jobs = jobs.filter(job => job.type === type);
      }
      
      // Sort by creation date (newest first)
      jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Pagination
      const startIndex = parseInt(offset as string);
      const limitNum = parseInt(limit as string);
      const paginatedJobs = jobs.slice(startIndex, startIndex + limitNum);
      
      res.json({
        jobs: paginatedJobs,
        total: jobs.length,
        pagination: {
          limit: limitNum,
          offset: startIndex,
          hasMore: startIndex + limitNum < jobs.length
        }
      });
    } catch (error) {
      console.error('Error fetching processing jobs:', error);
      res.status(500).json({ error: 'Failed to fetch processing jobs' });
    }
  });

  // Get specific processing job
  app.get('/api/video-processing/jobs/:jobId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = processingJobs.get(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Processing job not found' });
      }
      
      res.json({ job });
    } catch (error) {
      console.error('Error fetching processing job:', error);
      res.status(500).json({ error: 'Failed to fetch processing job' });
    }
  });

  // Create new processing job
  app.post('/api/video-processing/jobs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { videoId, type = 'ai_analysis' } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }
      
      // Check if video exists
      const video = sampleVideos.find(v => v.id === parseInt(videoId));
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const processingJob: VideoProcessingJob = {
        id: jobId,
        status: 'pending',
        progress: 0,
        videoId: videoId.toString(),
        type,
        createdAt: new Date()
      };
      
      processingJobs.set(jobId, processingJob);
      
      // Simulate processing
      setTimeout(() => {
        const job = processingJobs.get(jobId);
        if (job) {
          job.status = 'completed';
          job.progress = 100;
          job.completedAt = new Date();
          processingJobs.set(jobId, job);
        }
      }, 3000);
      
      res.status(201).json({ 
        success: true, 
        job: processingJob,
        message: 'Processing job created successfully' 
      });
    } catch (error) {
      console.error('Error creating processing job:', error);
      res.status(500).json({ error: 'Failed to create processing job' });
    }
  });

  // Cancel processing job
  app.delete('/api/video-processing/jobs/:jobId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = processingJobs.get(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Processing job not found' });
      }
      
      if (job.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel completed job' });
      }
      
      // Remove job
      processingJobs.delete(jobId);
      
      res.json({ success: true, message: 'Processing job cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling processing job:', error);
      res.status(500).json({ error: 'Failed to cancel processing job' });
    }
  });
}