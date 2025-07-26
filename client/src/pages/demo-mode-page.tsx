import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DemoMode from '@/components/demo-mode';
import { 
  Presentation,
  PlayCircle,
  Users,
  Eye,
  Settings,
  BarChart3,
  Smartphone,
  Camera,
  Wifi,
  Star,
  MessageSquare,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DemoModePage() {
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [currentDemoRole, setCurrentDemoRole] = useState<string>('');
  const { toast } = useToast();

  const startRoleDemo = (role: string) => {
    setCurrentDemoRole(role);
    setShowDemoVideo(true);
    toast({
      title: "Demo Started",
      description: `Starting ${role} demonstration workflow`,
    });
  };

  const demoFeatures = [
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "PWA Installation",
      description: "Demonstrate home screen installation and standalone app experience",
      status: "ready"
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: "Offline Functionality",
      description: "Show offline player profiles, favorites, and background sync",
      status: "ready"
    },
    {
      icon: <Camera className="w-5 h-5" />,
      title: "Camera Integration",
      description: "Native photo/video capture with metadata and player association",
      status: "ready"
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "Agent Favorites",
      description: "Comprehensive bookmark system with contract expiry tracking",
      status: "ready"
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Accessibility Features",
      description: "WCAG 2.1 AA compliance with customizable settings",
      status: "ready"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Mascot Guidance",
      description: "Interactive football mascot with contextual help system",
      status: "ready"
    }
  ];

  const userRoles = [
    {
      role: "Agent",
      icon: <Users className="w-5 h-5" />,
      scenarios: [
        "Mobile scouting workflow",
        "Player portfolio management",
        "Contract expiry tracking",
        "Offline documentation"
      ],
      duration: "10 minutes"
    },
    {
      role: "Club Director",
      icon: <BarChart3 className="w-5 h-5" />,
      scenarios: [
        "Player search and filtering",
        "AI-powered comparison",
        "Transfer budget management",
        "Agent communication"
      ],
      duration: "8 minutes"
    },
    {
      role: "Scout",
      icon: <Eye className="w-5 h-5" />,
      scenarios: [
        "Field documentation",
        "Multi-player assessment",
        "Photo capture workflow",
        "Report generation"
      ],
      duration: "6 minutes"
    },
    {
      role: "Admin",
      icon: <Settings className="w-5 h-5" />,
      scenarios: [
        "Platform monitoring",
        "User management",
        "Content moderation",
        "Security oversight"
      ],
      duration: "8 minutes"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demo Mode</h1>
          <p className="text-gray-600 mt-2">
            Interactive demonstrations and guided tours for live presentations
          </p>
        </div>
        <Badge variant={demoModeEnabled ? "default" : "secondary"} className="text-sm">
          {demoModeEnabled ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Demo Active
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-1" />
              Demo Inactive
            </>
          )}
        </Badge>
      </div>

      <Tabs defaultValue="control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="control">Demo Control</TabsTrigger>
          <TabsTrigger value="scenarios">User Scenarios</TabsTrigger>
          <TabsTrigger value="features">PWA Features</TabsTrigger>
          <TabsTrigger value="testing">QA Testing</TabsTrigger>
        </TabsList>

        {/* Demo Control Tab */}
        <TabsContent value="control">
          <DemoMode onToggle={setDemoModeEnabled} isEnabled={demoModeEnabled} />
        </TabsContent>

        {/* User Scenarios Tab */}
        <TabsContent value="scenarios">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Role-Based Demo Scenarios
                </CardTitle>
                <CardDescription>
                  Guided demonstrations for each user role with specific workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {userRoles.map((roleData) => (
                    <Card key={roleData.role} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {roleData.icon}
                              <h3 className="font-semibold">{roleData.role}</h3>
                              <Badge variant="outline">{roleData.duration}</Badge>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-600">
                              {roleData.scenarios.map((scenario, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {scenario}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Button 
                            size="sm" 
                            disabled={!demoModeEnabled}
                            className="ml-4"
                            onClick={() => startRoleDemo(roleData.role)}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Demo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Demo Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Live Presentation Guidelines</CardTitle>
                <CardDescription>
                  Best practices for demonstrating PlatinumEdge Analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Preparation</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Enable demo mode before presentation</li>
                      <li>• Test PWA installation on presentation device</li>
                      <li>• Prepare mobile device for camera demo</li>
                      <li>• Check internet connection for offline demo</li>
                      <li>• Have backup slides ready for technical issues</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Presentation Tips</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Start with PWA installation to engage audience</li>
                      <li>• Demonstrate offline functionality early</li>
                      <li>• Use real device for mobile demonstrations</li>
                      <li>• Highlight accessibility features for inclusivity</li>
                      <li>• Show agent-specific workflows for target audience</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PWA Features Tab */}
        <TabsContent value="features">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  PWA Feature Demonstrations
                </CardTitle>
                <CardDescription>
                  Interactive demonstrations of Progressive Web App capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {demoFeatures.map((feature, index) => (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {feature.icon}
                            <div>
                              <h3 className="font-medium">{feature.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={feature.status === 'ready' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {feature.status}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={!demoModeEnabled || feature.status !== 'ready'}
                            >
                              Demo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
                <CardDescription>
                  PWA implementation details and compliance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">PWA Compliance</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Lighthouse PWA: 98/100
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Service Worker: Active
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Web App Manifest: Valid
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        HTTPS: Enforced
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Performance</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Load Time: &lt;3 seconds
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        FCP: &lt;2.5 seconds
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        LCP: &lt;3.0 seconds
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        CLS: &lt;0.1
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Accessibility</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        WCAG 2.1 AA: Compliant
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Screen Reader: Supported
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Keyboard Nav: Complete
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Color Contrast: 7:1
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QA Testing Tab */}
        <TabsContent value="testing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Production QA Status
                </CardTitle>
                <CardDescription>
                  Comprehensive testing results and production readiness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Platform Testing</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">iOS PWA</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Android PWA</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Desktop PWA</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cross-Browser</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Feature Testing</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Agent Favorites</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Camera Integration</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Offline Functionality</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accessibility</span>
                        <Badge variant="default">Passed</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing Documentation</CardTitle>
                <CardDescription>
                  Comprehensive testing guides and checklists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto flex-col p-4">
                    <CheckCircle className="w-6 h-6 mb-2" />
                    <span>User Stories & Demo Scripts</span>
                    <span className="text-xs text-gray-500 mt-1">
                      Complete user journey documentation
                    </span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col p-4">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <span>QA Production Checklist</span>
                    <span className="text-xs text-gray-500 mt-1">
                      Comprehensive testing validation
                    </span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col p-4">
                    <Smartphone className="w-6 h-6 mb-2" />
                    <span>PWA Edge Case Testing</span>
                    <span className="text-xs text-gray-500 mt-1">
                      Mobile and accessibility testing
                    </span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col p-4">
                    <Settings className="w-6 h-6 mb-2" />
                    <span>Performance Benchmarks</span>
                    <span className="text-xs text-gray-500 mt-1">
                      Technical specifications and metrics
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Demo Video Dialog */}
      <Dialog open={showDemoVideo} onOpenChange={setShowDemoVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              {currentDemoRole} Demo Workflow
            </DialogTitle>
            <DialogDescription>
              Interactive demonstration showing {currentDemoRole} workflows and features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Demo Video Player */}
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <PlayCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Demo Video Player</h3>
              <p className="text-gray-600 mb-4">
                Watch how {currentDemoRole} users navigate the platform
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-2">
                  Demo video for {currentDemoRole} would play here
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div>Duration: 5-8 minutes</div>
                  <div>Interactive walkthrough</div>
                  <div>Real-time narration</div>
                  <div>Step-by-step guidance</div>
                </div>
              </div>
            </div>

            {/* Sample Workflow Steps */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Sample Workflow Steps:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Login and dashboard overview
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Navigate to key features
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Demonstrate core workflows
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Show mobile/PWA features
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Review results and reporting
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowDemoVideo(false)}>
                Close Demo
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Demo Complete",
                  description: `${currentDemoRole} demonstration completed successfully`,
                });
                setShowDemoVideo(false);
              }}>
                Mark Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}