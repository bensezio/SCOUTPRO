// Video URL utilities for handling different video platforms

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'unsupported';
  originalUrl: string;
  embedUrl?: string;
  directUrl?: string;
  videoId?: string;
  platform?: string;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract Vimeo video ID from Vimeo URLs
 */
export function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Analyze video URL and return information about how to handle it
 */
export function analyzeVideoUrl(url: string): VideoInfo {
  if (!url) {
    return {
      type: 'unsupported',
      originalUrl: url,
    };
  }

  // YouTube URLs
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      type: 'youtube',
      originalUrl: url,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      videoId: youtubeId,
      platform: 'YouTube',
    };
  }

  // Vimeo URLs
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      type: 'vimeo',
      originalUrl: url,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      videoId: vimeoId,
      platform: 'Vimeo',
    };
  }

  // Direct video URLs (assume they can be played directly)
  if (url.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv)(\?.*)?$/i)) {
    return {
      type: 'direct',
      originalUrl: url,
      directUrl: url,
      platform: 'Direct',
    };
  }

  // Unsupported format
  return {
    type: 'unsupported',
    originalUrl: url,
  };
}

/**
 * Get the best playback URL for the video player
 */
export function getPlaybackUrl(videoInfo: VideoInfo): string | null {
  switch (videoInfo.type) {
    case 'direct':
      return videoInfo.directUrl || videoInfo.originalUrl;
    case 'youtube':
    case 'vimeo':
      // For embedded videos, return null as they need iframe embedding
      return null;
    default:
      return null;
  }
}

/**
 * Check if URL requires iframe embedding
 */
export function requiresEmbedding(videoInfo: VideoInfo): boolean {
  return videoInfo.type === 'youtube' || videoInfo.type === 'vimeo';
}