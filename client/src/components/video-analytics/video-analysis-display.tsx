import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  Video, 
  Eye, 
  TrendingUp, 
  Clock, 
  Target,
  Brain,
  AlertCircle,
  CheckCircle2,
  Settings,
  Play
} from 'lucide-react';

interface VideoAnalysisDisplayProps {
  videoId: number;
}

export function VideoAnalysisDisplay({ videoId }: VideoAnalysisDisplayProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/video-analytics/videos', videoId, 'analysis'],
    refetchInterval: (data) => {
      // Poll every 2 seconds if still processing
      return (data as any)?.status === 'processing' ? 2000 : false;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 animate-spin" />
          <span>Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading analysis</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analysis data available</p>
      </div>
    );
  }

  const { video, analysisResults, eventTags, playerAnalysis, status, progress } = (data as any) || {};

  // Show processing status
  if (status === 'processing') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium">Processing Video Analysis</p>
            <p className="text-sm text-gray-600">AI is analyzing your video...</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-3 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <div>
          <p className="font-medium">Analysis Failed</p>
          <p className="text-sm">There was an error processing your video</p>
        </div>
      </div>
    );
  }

  if (!analysisResults) {
    return (
      <div className="text-center py-8">
        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Analysis completed but no results available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <div>
          <p className="font-medium text-green-800">Analysis Complete</p>
          <p className="text-sm text-green-600">
            {video.title} • {analysisResults.statistics?.processingDuration || 'Processing time unavailable'}
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-blue-800">Events</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {analysisResults.events?.length || 0}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-green-600" />
            <h4 className="font-medium text-green-800">Highlights</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {analysisResults.highlights?.length || 0}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium text-purple-800">Confidence</h4>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {analysisResults.statistics?.averageConfidence || 0}%
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <h4 className="font-medium text-orange-800">Duration</h4>
          </div>
          <p className="text-lg font-bold text-orange-600">
            {Math.floor(video.duration / 60) || 90}min
          </p>
        </div>
      </div>

      {/* Events Timeline */}
      {analysisResults.events && analysisResults.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Detected Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResults.events.map((event: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {Math.floor(event.timestamp / 60)}:{String(event.timestamp % 60).padStart(2, '0')}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {event.confidence}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{event.description}</p>
                    {event.playerName && (
                      <p className="text-xs text-gray-500 mt-1">Player: {event.playerName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {analysisResults.insights && analysisResults.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResults.insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                  <p className="text-sm text-purple-800">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Analysis */}
      {analysisResults.playerAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Player Analysis: {analysisResults.playerAnalysis.playerName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">Performance Score</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {analysisResults.playerAnalysis.performanceScore}/100
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600">Position</p>
                  <p className="font-medium text-green-800">
                    {analysisResults.playerAnalysis.position}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-600">Events Involved</p>
                  <p className="text-xl font-bold text-purple-800">
                    {analysisResults.playerAnalysis.eventsInvolved}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Key Strengths</h4>
                  <ul className="space-y-1">
                    {analysisResults.playerAnalysis.keyStrengths.map((strength: string, index: number) => (
                      <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-1">
                    {analysisResults.playerAnalysis.areasForImprovement.map((area: string, index: number) => (
                      <li key={index} className="text-sm text-orange-700 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Highlights */}
      {analysisResults.highlights && analysisResults.highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Generated Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResults.highlights.map((highlight: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">{highlight.title}</h4>
                    <Badge variant="secondary" className="ml-auto">
                      {highlight.confidence}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {Math.floor(highlight.startTime / 60)}:{String(highlight.startTime % 60).padStart(2, '0')} - 
                    {Math.floor(highlight.endTime / 60)}:{String(highlight.endTime % 60).padStart(2, '0')}
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {highlight.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}