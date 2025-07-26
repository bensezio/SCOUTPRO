import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FeatureGate } from "@/components/feature-gate";
import { FEATURES } from "@/../../shared/subscription-tiers";
import { EnhancedDataVisualizations } from "@/components/enhanced-data-visualizations";
import { PlayerDropdown } from "@/components/player-dropdown";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Brain, 
  FileText, 
  Download, 
  Loader2, 
  Zap, 
  Target, 
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Star,
  Eye,
  Trash2,
  RefreshCw,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle
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

const reportTypes = [
  {
    value: 'player_analysis',
    label: 'Player Analysis',
    description: 'Comprehensive analysis of playing style, strengths, and weaknesses',
    icon: Users
  },
  {
    value: 'market_comparison',
    label: 'Market Comparison', 
    description: 'Compare market value and performance against similar players',
    icon: TrendingUp
  },
  {
    value: 'scouting_summary',
    label: 'Scouting Summary',
    description: 'Professional scouting report for club directors',
    icon: Target
  },
  {
    value: 'tactical_fit',
    label: 'Tactical Fit',
    description: 'Analysis of how player fits different tactical systems',
    icon: BarChart3
  },
  {
    value: 'development_path',
    label: 'Development Path',
    description: 'Career progression and development recommendations',
    icon: TrendingUp
  }
];

export default function AIReports() {
  const [selectedReport, setSelectedReport] = useState<AIReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [reportForm, setReportForm] = useState({
    playerName: '',
    playerId: '',
    reportType: '',
    context: '',
    specificQuestions: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent AI reports
  const { data: recentReports = [], isLoading } = useQuery<AIReportData[]>({
    queryKey: ['/api/ai-reports/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai-reports/recent');
      return response.json();
    },
  });

  // Generate AI Report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest('POST', '/api/ai-reports/generate', reportData);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "AI Report Generated",
        description: `Successfully generated ${data.reportType?.replace('_', ' ')} for ${data.playerName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-reports/recent'] });
      setSelectedReport(data);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('AI Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI report. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Delete Report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await apiRequest('DELETE', `/api/ai-reports/${reportId}`);
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "AI report has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-reports/recent'] });
      setSelectedReport(null);
    },
  });

  const handleGenerateReport = async () => {
    if (!reportForm.playerName || !reportForm.reportType) {
      toast({
        title: "Missing Information",
        description: "Please provide player name and report type",
        variant: "destructive",
      });
      return;
    }

    console.log('Generating report for:', reportForm.playerName, reportForm.reportType);
    setIsGenerating(true);
    
    const requestData = {
      playerName: reportForm.playerName,
      playerId: reportForm.playerId ? parseInt(reportForm.playerId) : undefined,
      reportType: reportForm.reportType,
      context: reportForm.context || undefined,
      specificQuestions: reportForm.specificQuestions ? 
        reportForm.specificQuestions.split(',').map(q => q.trim()).filter(q => q) : 
        undefined,
    };

    console.log('Request data:', requestData);
    generateReportMutation.mutate(requestData);
  };

  const handleViewReport = (report: AIReportData) => {
    setSelectedReport(report);
    setActiveTab('generate'); // Switch to generate tab to show the report
  };

  const createTempReportElement = async (report: AIReportData): Promise<HTMLElement | null> => {
    try {
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.id = 'temp-report-content';
      tempContainer.className = 'bg-white p-6 rounded-lg';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px';
      
      // Safe DOM creation helper function
      const createElementWithClass = (tag: string, className: string, textContent?: string) => {
        const element = document.createElement(tag);
        element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
      };

      // Header section
      const headerDiv = createElementWithClass('div', 'border-b pb-4 mb-6');
      
      const title = createElementWithClass('h2', 'text-2xl font-bold text-gray-900');
      const playerName = report.playerName || 'Unknown Player';
      const reportType = report.reportType ? report.reportType.replace('_', ' ').toUpperCase() : 'AI REPORT';
      title.textContent = `${playerName} - ${reportType}`;
      
      const metaDiv = createElementWithClass('div', 'flex items-center gap-4 mt-2');
      const confidenceSpan = createElementWithClass('span', 'px-2 py-1 bg-gray-100 rounded text-sm', `Confidence: ${report.confidenceScore || 0}%`);
      const timeSpan = createElementWithClass('span', 'px-2 py-1 bg-gray-100 rounded text-sm', `${report.processingTime || 0}ms`);
      
      metaDiv.appendChild(confidenceSpan);
      metaDiv.appendChild(timeSpan);
      headerDiv.appendChild(title);
      headerDiv.appendChild(metaDiv);
      tempContainer.appendChild(headerDiv);

      // AI Insights section
      const insightsDiv = createElementWithClass('div', 'mb-6');
      const insightsTitle = createElementWithClass('h3', 'text-lg font-semibold mb-3', 'AI Insights');
      const insightsContent = createElementWithClass('div', 'text-gray-700');
      
      // Handle newlines in insights safely
      const insights = report.aiInsights || 'No insights available';
      const insightLines = insights.split('\n');
      insightLines.forEach((line, index) => {
        if (index > 0) insightsContent.appendChild(document.createElement('br'));
        insightsContent.appendChild(document.createTextNode(line));
      });
      
      insightsDiv.appendChild(insightsTitle);
      insightsDiv.appendChild(insightsContent);
      tempContainer.appendChild(insightsDiv);

      // Key Findings section
      const findingsDiv = createElementWithClass('div', 'mb-6');
      const findingsTitle = createElementWithClass('h3', 'text-lg font-semibold mb-3', 'Key Findings');
      const findingsList = createElementWithClass('ul', 'space-y-2');
      
      if (report.keyFindings && report.keyFindings.length > 0) {
        report.keyFindings.forEach(finding => {
          const li = createElementWithClass('li', '', `• ${finding}`);
          findingsList.appendChild(li);
        });
      } else {
        const li = createElementWithClass('li', '', 'No key findings available');
        findingsList.appendChild(li);
      }
      
      findingsDiv.appendChild(findingsTitle);
      findingsDiv.appendChild(findingsList);
      tempContainer.appendChild(findingsDiv);

      // Recommendations section
      const recDiv = createElementWithClass('div', 'mb-6');
      const recTitle = createElementWithClass('h3', 'text-lg font-semibold mb-3', 'Recommendations');
      const recList = createElementWithClass('ul', 'space-y-2');
      
      if (report.recommendations && report.recommendations.length > 0) {
        report.recommendations.forEach(rec => {
          const li = createElementWithClass('li', '', `• ${rec}`);
          recList.appendChild(li);
        });
      } else {
        const li = createElementWithClass('li', '', 'No recommendations available');
        recList.appendChild(li);
      }
      
      recDiv.appendChild(recTitle);
      recDiv.appendChild(recList);
      tempContainer.appendChild(recDiv);

      // Data Sources section
      const sourcesDiv = createElementWithClass('div', 'border-t pt-4');
      const sourcesTitle = createElementWithClass('h4', 'font-medium mb-2', 'Data Sources Used:');
      const sourcesContainer = createElementWithClass('div', 'flex flex-wrap gap-2');
      
      if (report.dataSourcesUsed && report.dataSourcesUsed.length > 0) {
        report.dataSourcesUsed.forEach(source => {
          const span = createElementWithClass('span', 'px-2 py-1 bg-gray-100 rounded text-sm', source);
          sourcesContainer.appendChild(span);
        });
      } else {
        const span = createElementWithClass('span', 'px-2 py-1 bg-gray-100 rounded text-sm', 'No data sources specified');
        sourcesContainer.appendChild(span);
      }
      
      sourcesDiv.appendChild(sourcesTitle);
      sourcesDiv.appendChild(sourcesContainer);
      tempContainer.appendChild(sourcesDiv);
      
      // Add to document temporarily
      document.body.appendChild(tempContainer);
      
      return tempContainer;
    } catch (error) {
      console.error('Error creating temp report element:', error);
      return null;
    }
  };

  const exportToPDF = async (report: AIReportData) => {
    try {
      // Ensure report is selected and visible
      if (!selectedReport || selectedReport.id !== report.id) {
        setSelectedReport(report);
        setActiveTab('generate');
        // Wait a moment for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      let reportElement = document.getElementById('ai-report-content');
      if (!reportElement) {
        // Try to create a temporary element with the report content
        reportElement = await createTempReportElement(report);
        if (!reportElement) {
          toast({
            title: "Export Error",
            description: "Unable to generate PDF. Please try viewing the report first.",
            variant: "destructive",
          });
          return;
        }
      }

      // Create canvas from the report content
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Clean up temporary element if it was created
      if (reportElement.id === 'temp-report-content') {
        document.body.removeChild(reportElement);
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 44, 52);
      pdf.text('PlatinumEdge AI Analysis Report', 20, 20);
      
      // Add metadata with safe handling
      pdf.setFontSize(12);
      pdf.text(`Player: ${report.playerName || 'Unknown Player'}`, 20, 35);
      pdf.text(`Report Type: ${report.reportType ? report.reportType.replace('_', ' ').toUpperCase() : 'AI REPORT'}`, 20, 45);
      pdf.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, 20, 55);
      pdf.text(`Confidence Score: ${report.confidenceScore || 0}%`, 120, 55);
      
      // Add report content image
      if (pdfHeight > pdf.internal.pageSize.getHeight() - 70) {
        // If content is too tall, add on new page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 10, 65, pdfWidth - 20, pdfHeight);
      }
      
      // Save PDF with safe string handling
      const safePlayerName = report.playerName ? report.playerName.replace(/\s+/g, '_') : 'Unknown_Player';
      const safeReportType = report.reportType ? report.reportType : 'AI_Report';
      const fileName = `PlatinumEdge_AI_Report_${safePlayerName}_${safeReportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Exported Successfully",
        description: `Report saved as ${fileName}`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      
      // Clean up temporary element if it exists
      const tempElement = document.getElementById('temp-report-content');
      if (tempElement) {
        document.body.removeChild(tempElement);
      }
      
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = (reportId: string) => {
    // Validate reportId exists
    if (!reportId || reportId === 'undefined') {
      toast({
        title: "Share Error",
        description: "Unable to generate share link. Please try generating a new report.",
        variant: "destructive",
      });
      return;
    }
    
    const shareUrl = `${window.location.origin}/ai-reports/${reportId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
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
                AI Reports
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Generate intelligent player analysis powered by advanced AI
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Generate AI Report
                  </CardTitle>
                  <CardDescription>
                    Create intelligent player analysis for scouting decisions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="playerName">Player Name</Label>
                    <PlayerDropdown
                      value={reportForm.playerId}
                      onValueChange={(playerId, playerName) => setReportForm({ ...reportForm, playerId, playerName })}
                      placeholder="Select a player..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select 
                      value={reportForm.reportType} 
                      onValueChange={(value) => setReportForm({ ...reportForm, reportType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              <div>
                                <div>{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="context">Context (Optional)</Label>
                    <Textarea
                      id="context"
                      value={reportForm.context}
                      onChange={(e) => setReportForm({ ...reportForm, context: e.target.value })}
                      placeholder="Additional context for analysis (e.g., target league, tactical requirements)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="questions">Specific Questions (Optional)</Label>
                    <Textarea
                      id="questions"
                      value={reportForm.specificQuestions}
                      onChange={(e) => setReportForm({ ...reportForm, specificQuestions: e.target.value })}
                      placeholder="Comma-separated specific questions to address"
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerateReport} 
                    disabled={isGenerating || generateReportMutation.isPending}
                    className="w-full"
                  >
                    {(isGenerating || generateReportMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Generate AI Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Report Types Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Analysis Types</CardTitle>
                  <CardDescription>
                    Choose the type of AI analysis that best fits your scouting needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div key={type.value} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Icon className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{type.label}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generated Report Display */}
            {selectedReport && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        AI Analysis: {selectedReport.playerName}
                      </CardTitle>
                      <CardDescription>
                        {selectedReport.reportType ? selectedReport.reportType.replace('_', ' ').toUpperCase() : 'AI REPORT'} • 
                        Generated {new Date(selectedReport.generatedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyShareLink(selectedReport.id)}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportToPDF(selectedReport)}>
                        <Download className="h-4 w-4 mr-1" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div id="ai-report-content" className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                    {/* Report Header */}
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedReport.playerName} - {selectedReport.reportType ? selectedReport.reportType.replace('_', ' ').toUpperCase() : 'AI REPORT'}
                      </h2>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                          Confidence: {selectedReport.confidenceScore}%
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedReport.processingTime}ms
                        </Badge>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-600" />
                        AI Insights
                      </h3>
                      <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                        {selectedReport.aiInsights ? selectedReport.aiInsights.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3">{paragraph}</p>
                        )) : (
                          <p className="text-gray-500 italic">No insights available</p>
                        )}
                      </div>
                    </div>

                    {/* Key Findings */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {selectedReport.keyFindings ? selectedReport.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{finding}</span>
                          </li>
                        )) : (
                          <li className="text-gray-500 italic">No key findings available</li>
                        )}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {selectedReport.recommendations ? selectedReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                          </li>
                        )) : (
                          <li className="text-gray-500 italic">No recommendations available</li>
                        )}
                      </ul>
                    </div>

                    {/* Data Sources */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Data Sources Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.dataSourcesUsed ? selectedReport.dataSourcesUsed.map((source, index) => (
                          <Badge key={index} variant="secondary">
                            {source}
                          </Badge>
                        )) : (
                          <Badge variant="secondary">No data sources specified</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent AI Reports
                </CardTitle>
                <CardDescription>
                  View and manage your previously generated AI analysis reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading reports...</span>
                  </div>
                ) : recentReports.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      No Reports Generated Yet
                    </h3>
                    <p className="text-gray-500">
                      Generate your first AI report to get started with intelligent player analysis
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {recentReports.map((report: AIReportData) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{report.playerName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {report.reportType ? report.reportType.replace('_', ' ').toUpperCase() : 'AI REPORT'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => exportToPDF(report)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyShareLink(report.id)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteReportMutation.mutate(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Confidence: {report.confidenceScore}%</span>
                          <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                          <span>{report.processingTime}ms processing</span>
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
    </div>
  );
}