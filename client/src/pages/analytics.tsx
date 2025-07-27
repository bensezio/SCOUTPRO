import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { EnhancedDataVisualizations } from "@/components/enhanced-data-visualizations";
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Globe, 
  Trophy, 
  Users, 
  Zap,
  Shield,
  Brain,
  Camera,
  Database,
  Rocket,
  Crown,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

// Competitive platform data
const competitorData = [
  {
    name: "FBref",
    coverage: "40+ countries",
    africaSupport: "Limited",
    dataPoints: "3,000+ per match",
    pricing: "Freemium",
    strengths: ["European leagues", "Historical data", "StatsBomb integration"],
    weaknesses: ["Minimal African coverage", "No AI analysis", "Limited video integration"],
    marketFocus: "European Football",
    rating: 8.2
  },
  {
    name: "Transfermarkt",
    coverage: "Global",
    africaSupport: "Basic",
    dataPoints: "Market focused",
    pricing: "Free/Premium",
    strengths: ["Market values", "Transfer history", "Global coverage"],
    weaknesses: ["Limited performance data", "No tactical analysis", "Outdated African data"],
    marketFocus: "Transfer Market",
    rating: 7.8
  },
  {
    name: "Wyscout",
    coverage: "500+ competitions",
    africaSupport: "Premium only",
    dataPoints: "Advanced",
    pricing: "Enterprise",
    strengths: ["Video analysis", "Professional tools", "Tactical data"],
    weaknesses: ["Very expensive", "Limited African free content", "Complex interface"],
    marketFocus: "Professional Clubs",
    rating: 8.9
  },
  {
    name: "StatsBomb",
    coverage: "170+ competitions",
    africaSupport: "Minimal",
    dataPoints: "Ultra-detailed",
    pricing: "Enterprise",
    strengths: ["Event data quality", "R/Python support", "Advanced metrics"],
    weaknesses: ["No African leagues", "Research focused", "Not scout-friendly"],
    marketFocus: "Analytics Research",
    rating: 9.1
  }
];

const scoutProAdvantages = [
  {
    feature: "African Football Specialization",
    description: "Deep coverage of African leagues, academies, and talent pipelines",
    competitive: "Unmatched",
    impact: "High",
    icon: Globe
  },
  {
    feature: "AI-Powered Analysis",
    description: "Real-time AI insights using Perplexity API for contextual player analysis",
    competitive: "Unique",
    impact: "High",
    icon: Brain
  },
  {
    feature: "Role-Based Dashboards",
    description: "Customized interfaces for scouts, agents, coaches, and club directors",
    competitive: "Superior",
    impact: "Medium",
    icon: Users
  },
  {
    feature: "Affordable Pricing",
    description: "Accessible to smaller clubs and individual scouts with African focus",
    competitive: "Major Advantage",
    impact: "High",
    icon: Target
  },
  {
    feature: "Video Integration",
    description: "Seamless video analysis linked to player profiles and scouting reports",
    competitive: "Competitive",
    impact: "Medium",
    icon: Camera
  },
  {
    feature: "Development Pathways",
    description: "AI-suggested career progression and development recommendations",
    competitive: "Unique",
    impact: "High",
    icon: Rocket
  }
];

const marketGaps = [
  {
    gap: "African Youth Academies",
    opportunity: "Track and analyze youth academy players across African countries",
    market: "€50M+ annually",
    timeline: "6 months"
  },
  {
    gap: "Women's African Football",
    opportunity: "First comprehensive women's football database for African leagues",
    market: "€20M+ annually",
    timeline: "12 months"
  },
  {
    gap: "Semi-Professional Leagues",
    opportunity: "Coverage of second and third-tier African competitions",
    market: "€30M+ annually",
    timeline: "18 months"
  },
  {
    gap: "Real-Time African Matches",
    opportunity: "Live data feeds and analysis for African league matches",
    market: "€40M+ annually",
    timeline: "9 months"
  }
];

export default function Analytics() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch platform statistics
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const stats = dashboardStats || {
    totalPlayers: 0,
    totalClubs: 0,
    totalReports: 0,
    totalUsers: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-600 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ScoutPro Analytics
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Competitive analysis and market positioning for African football scouting
              </p>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Platform Overview</TabsTrigger>
            <TabsTrigger value="visualizations">Data & Analytics</TabsTrigger>
            <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
            <TabsTrigger value="advantages">Our Advantages</TabsTrigger>
            <TabsTrigger value="opportunities">Market Gaps</TabsTrigger>
          </TabsList>

          <TabsContent value="visualizations" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    AI-Powered Reports
                  </CardTitle>
                  <CardDescription>
                    Comprehensive AI analysis and reporting tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Generate AI-powered reports including player analysis, market comparisons, and scouting summaries.
                  </p>
                  <Button 
                    onClick={() => window.open('/ai-reports', '_blank')}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Open AI Reports
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Player Comparison Tool
                  </CardTitle>
                  <CardDescription>
                    AI-powered player comparison and analysis system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Compare players side-by-side with ML insights, performance metrics, and tactical analysis.
                  </p>
                  <Button 
                    onClick={() => window.open('/comparison', '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Open Player Comparison
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <EnhancedDataVisualizations showTableau={true} />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Platform Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">African Players</p>
                      <p className="text-3xl font-bold">{stats.totalPlayers}</p>
                      <p className="text-sm text-blue-200">+12% this month</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Organizations</p>
                      <p className="text-3xl font-bold">{stats.totalClubs}</p>
                      <p className="text-sm text-green-200">Clubs & Academies</p>
                    </div>
                    <Trophy className="h-12 w-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">AI Reports</p>
                      <p className="text-3xl font-bold">47</p>
                      <p className="text-sm text-purple-200">Generated today</p>
                    </div>
                    <Brain className="h-12 w-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Active Users</p>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-orange-200">Scouts & Agents</p>
                    </div>
                    <Shield className="h-12 w-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  ScoutPro Market Position
                </CardTitle>
                <CardDescription>
                  How we position against major football analytics platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                      <Crown className="h-8 w-8 text-blue-600 mx-auto" />
                    </div>
                    <h3 className="font-semibold mb-2">African Football Leader</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      First comprehensive platform specializing in African football talent and analytics
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-3">
                      <Zap className="h-8 w-8 text-green-600 mx-auto" />
                    </div>
                    <h3 className="font-semibold mb-2">AI-First Approach</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Integrated AI analysis for player insights, market comparisons, and development paths
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-3">
                      <Target className="h-8 w-8 text-purple-600 mx-auto" />
                    </div>
                    <h3 className="font-semibold mb-2">Affordable Excellence</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Professional-grade analytics at prices accessible to African football ecosystem
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {competitorData.map((competitor, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{competitor.name}</CardTitle>
                        <CardDescription>{competitor.marketFocus}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{competitor.rating}/10</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coverage</p>
                        <p className="text-sm">{competitor.coverage}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Africa Support</p>
                        <Badge variant={competitor.africaSupport === 'Limited' ? 'destructive' : 
                                      competitor.africaSupport === 'Basic' ? 'secondary' : 'default'}>
                          {competitor.africaSupport}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Quality</p>
                        <p className="text-sm">{competitor.dataPoints}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pricing</p>
                        <p className="text-sm">{competitor.pricing}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {competitor.strengths.map((strength, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Weaknesses</h4>
                        <ul className="space-y-1">
                          {competitor.weaknesses.map((weakness, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advantages" className="space-y-6 mt-6">
            <div className="grid gap-4">
              {scoutProAdvantages.map((advantage, index) => {
                const Icon = advantage.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{advantage.feature}</h3>
                            <div className="flex gap-2">
                              <Badge variant={advantage.competitive === 'Unique' ? 'default' : 
                                            advantage.competitive === 'Superior' ? 'secondary' : 'outline'}>
                                {advantage.competitive}
                              </Badge>
                              <Badge variant={advantage.impact === 'High' ? 'default' : 'secondary'}>
                                {advantage.impact} Impact
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">{advantage.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Untapped Market Opportunities
                </CardTitle>
                <CardDescription>
                  Major gaps in the African football analytics market we can capture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {marketGaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{gap.gap}</h3>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{gap.timeline}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{gap.opportunity}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Market Size: {gap.market}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Explore Opportunity
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Implementation Roadmap */}
            <Card>
              <CardHeader>
                <CardTitle>Implementation Roadmap</CardTitle>
                <CardDescription>
                  Strategic development plan to capture market opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Q1 2025: African Youth Academy Integration</span>
                        <Badge>In Progress</Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Q2 2025: Live Match Data Feeds</span>
                        <Badge variant="outline">Planned</Badge>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Q3 2025: Women's Football Database</span>
                        <Badge variant="outline">Research</Badge>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Q4 2025: Semi-Professional Leagues</span>
                        <Badge variant="outline">Concept</Badge>
                      </div>
                      <Progress value={5} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="python-guide" className="space-y-6 mt-6">
            {/* Python Integration Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Python Integration for Data Analytics & ML
                </CardTitle>
                <CardDescription>
                  Best practices for integrating Python-based analytics into ScoutPro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Architecture Options */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Integration Architecture Options</h3>
                    
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Rocket className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">1. Microservices Approach (Recommended)</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Deploy Python analytics as separate services using FastAPI or Flask
                        </p>
                        <ul className="text-xs space-y-1 text-gray-500">
                          <li>• FastAPI service for ML predictions</li>
                          <li>• Redis for caching results</li>
                          <li>• Docker containers for deployment</li>
                          <li>• RESTful API integration</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-green-500" />
                          <span className="font-medium">2. Background Jobs</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Run Python scripts as background jobs triggered by Node.js
                        </p>
                        <ul className="text-xs space-y-1 text-gray-500">
                          <li>• Node.js child_process spawn</li>
                          <li>• Job queues (Bull/Redis)</li>
                          <li>• Scheduled analysis runs</li>
                          <li>• File-based data exchange</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">3. Embedded Python</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Use PyNode or similar to run Python directly in Node.js
                        </p>
                        <ul className="text-xs space-y-1 text-gray-500">
                          <li>• node-python-bridge</li>
                          <li>• Direct function calls</li>
                          <li>• Shared memory space</li>
                          <li>• Simpler deployment</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Technology Stack */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Recommended Python Stack</h3>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">Core ML Libraries</h4>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>scikit-learn</strong>: Player performance prediction</li>
                          <li>• <strong>pandas</strong>: Data manipulation and analysis</li>
                          <li>• <strong>numpy</strong>: Numerical computations</li>
                          <li>• <strong>matplotlib/seaborn</strong>: Data visualization</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">Advanced Analytics</h4>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>TensorFlow/PyTorch</strong>: Deep learning models</li>
                          <li>• <strong>XGBoost</strong>: Performance predictions</li>
                          <li>• <strong>plotly</strong>: Interactive visualizations</li>
                          <li>• <strong>statsmodels</strong>: Statistical analysis</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">API & Deployment</h4>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>FastAPI</strong>: High-performance API</li>
                          <li>• <strong>uvicorn</strong>: ASGI server</li>
                          <li>• <strong>celery</strong>: Distributed task queue</li>
                          <li>• <strong>docker</strong>: Containerization</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Implementation Steps */}
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Implementation Roadmap</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <span className="font-medium">Setup Analytics Service</span>
                      </div>
                      <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Create FastAPI application</li>
                        <li>• Setup ML model endpoints</li>
                        <li>• Implement data validation</li>
                        <li>• Add authentication</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <span className="font-medium">Integrate with ScoutPro</span>
                      </div>
                      <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Add API client in Node.js</li>
                        <li>• Create analytics routes</li>
                        <li>• Implement error handling</li>
                        <li>• Add result caching</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <span className="font-medium">Deploy & Monitor</span>
                      </div>
                      <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Docker containerization</li>
                        <li>• Cloud deployment</li>
                        <li>• Performance monitoring</li>
                        <li>• Model versioning</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}