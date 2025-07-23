import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle,
  Star,
  Clock,
  Share2,
  Copy,
  CheckCircle
} from "lucide-react";

interface AIReportData {
  id: string;
  reportType: string;
  playerName: string;
  aiInsights: string;
  keyFindings: string[];
  recommendations: string[];
  confidenceScore: number;
  dataSourcesUsed: string[];
  generatedAt: string;
  processingTime: number;
}

export default function SharedReport() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Extract report ID from URL path
  const reportId = location.split('/').pop();
  
  const { data: report, isLoading, error } = useQuery<AIReportData>({
    queryKey: ['/api/ai-reports', reportId],
    queryFn: async () => {
      if (!reportId || reportId === 'undefined') {
        throw new Error('Invalid report ID');
      }
      const response = await apiRequest("GET", `/api/ai-reports/${reportId}`);
      if (!response.ok) {
        throw new Error('Report not found');
      }
      return await response.json();
    },
    enabled: !!reportId && reportId !== 'undefined',
    retry: 1,
  });

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <h2 className="text-xl font-semibold mb-2">Loading AI Report</h2>
          <p className="text-gray-600 dark:text-gray-400">Fetching shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The shared AI report you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Shared AI Report
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Intelligent player analysis powered by PlatinumEdge Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <Card id="ai-report-content">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {report.playerName}
                </CardTitle>
                <CardDescription className="text-lg">
                  {report.reportType ? report.reportType.replace('_', ' ').toUpperCase() : 'AI ANALYSIS REPORT'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getConfidenceBadgeVariant(report.confidenceScore)}
                  className="text-sm"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {report.confidenceScore}% Confidence
                </Badge>
                <Button size="sm" variant="outline" onClick={copyShareLink}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Generated: {new Date(report.generatedAt).toLocaleDateString()}
              </div>
              <div>Processing: {report.processingTime}ms</div>
            </div>

            {/* AI Insights */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Analysis
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                  {report.aiInsights}
                </pre>
              </div>
            </div>

            {/* Key Findings */}
            {report.keyFindings && report.keyFindings.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Key Findings:</h4>
                <ul className="space-y-2">
                  {report.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recommendations:</h4>
                <ul className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Sources */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Data Sources Used:</h4>
              <div className="flex flex-wrap gap-2">
                {report.dataSourcesUsed && report.dataSourcesUsed.length > 0 ? (
                  report.dataSourcesUsed.map((source, index) => (
                    <Badge key={index} variant="secondary">
                      {source}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">AI Analysis Engine</Badge>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 text-center text-sm text-gray-500">
              <p>Generated by PlatinumEdge Analytics AI Engine</p>
              <p className="mt-1">Professional football scouting and analytics platform</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}