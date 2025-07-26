import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Presentation, 
  Users, 
  Database, 
  HelpCircle, 
  BarChart3, 
  Smartphone,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

interface DemoModeProps {
  onToggle: (enabled: boolean) => void;
  isEnabled: boolean;
}

export default function DemoMode({ onToggle, isEnabled }: DemoModeProps) {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoStats, setDemoStats] = useState({
    testPlayers: 50,
    testClubs: 20,
    testAgents: 15,
    testReports: 100
  });

  const demoScenarios = [
    {
      id: 'agent-mobile',
      title: 'Agent Mobile Workflow',
      description: 'PWA installation, offline scouting, camera integration',
      duration: '10 min',
      icon: <Smartphone className="w-4 h-4" />,
      features: ['PWA Install', 'Offline Mode', 'Camera', 'Favorites']
    },
    {
      id: 'club-recruitment',
      title: 'Club Recruitment',
      description: 'Player search, comparison, AI insights',
      duration: '8 min',
      icon: <Users className="w-4 h-4" />,
      features: ['Advanced Search', 'Player Comparison', 'AI Analysis']
    },
    {
      id: 'scout-documentation',
      title: 'Scout Field Work',
      description: 'Multi-player documentation, mobile optimization',
      duration: '6 min',
      icon: <Eye className="w-4 h-4" />,
      features: ['Mobile Documentation', 'Photo Capture', 'Offline Sync']
    },
    {
      id: 'accessibility-demo',
      title: 'Accessibility Features',
      description: 'WCAG 2.1 AA compliance demonstration',
      duration: '5 min',
      icon: <Settings className="w-4 h-4" />,
      features: ['Screen Reader', 'Keyboard Nav', 'High Contrast']
    },
    {
      id: 'admin-oversight',
      title: 'Admin Platform Management',
      description: 'User management, analytics, security monitoring',
      duration: '8 min',
      icon: <BarChart3 className="w-4 h-4" />,
      features: ['User Management', 'Analytics', 'Security']
    }
  ];

  useEffect(() => {
    if (isEnabled) {
      // Initialize demo mode data
      console.log('Demo Mode Activated - Loading test data...');
      loadDemoData();
    } else {
      // Cleanup demo mode
      console.log('Demo Mode Deactivated - Restoring production data...');
      setActiveDemo(null);
    }
  }, [isEnabled]);

  const loadDemoData = async () => {
    // Simulate loading demo data
    try {
      // In a real implementation, this would load test data
      console.log('Loading demo players, clubs, and agents...');
      
      // Update demo stats
      setDemoStats({
        testPlayers: 50,
        testClubs: 20,
        testAgents: 15,
        testReports: 100
      });
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  };

  const startDemo = (scenarioId: string) => {
    setActiveDemo(scenarioId);
    const scenario = demoScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      console.log(`Starting demo: ${scenario.title}`);
      // In a real implementation, this would trigger the guided tour
      showDemoNotification(scenario.title);
    }
  };

  const stopDemo = () => {
    setActiveDemo(null);
    console.log('Demo stopped');
  };

  const resetDemo = () => {
    setActiveDemo(null);
    loadDemoData();
    console.log('Demo reset - reloading test data');
  };

  const showDemoNotification = (title: string) => {
    // This would show a toast notification in a real implementation
    console.log(`Demo "${title}" started - Mascot guide activated`);
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="w-5 h-5" />
                Demo Mode
              </CardTitle>
              <CardDescription>
                Enable presentation mode with test data and guided tours
              </CardDescription>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              aria-label="Toggle demo mode"
            />
          </div>
        </CardHeader>
        
        {isEnabled && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Demo Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={resetDemo}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Demo
              </Button>
            </div>

            {/* Demo Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{demoStats.testPlayers}</div>
                <div className="text-sm text-gray-500">Test Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{demoStats.testClubs}</div>
                <div className="text-sm text-gray-500">Test Clubs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{demoStats.testAgents}</div>
                <div className="text-sm text-gray-500">Test Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{demoStats.testReports}</div>
                <div className="text-sm text-gray-500">Test Reports</div>
              </div>
            </div>

            <Separator />

            {/* Demo Scenarios */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Available Demo Scenarios</h3>
              <div className="grid gap-4">
                {demoScenarios.map((scenario) => (
                  <Card key={scenario.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {scenario.icon}
                            <h4 className="font-medium">{scenario.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {scenario.duration}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {scenario.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {scenario.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {activeDemo === scenario.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={stopDemo}
                              className="flex items-center gap-2"
                            >
                              <Pause className="w-4 h-4" />
                              Stop
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => startDemo(scenario.id)}
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Active Demo Info */}
            {activeDemo && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Demo In Progress</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    {demoScenarios.find(s => s.id === activeDemo)?.title} is currently running. 
                    The football mascot guide is providing interactive assistance.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>

      {/* Demo Mode Features */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Demo Mode Features
            </CardTitle>
            <CardDescription>
              Features automatically enabled in demo mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Test Data</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 50 realistic player profiles</li>
                  <li>• 20 football clubs and academies</li>
                  <li>• 15 agent profiles with portfolios</li>
                  <li>• 100 sample scouting reports</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Guided Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Interactive mascot guidance</li>
                  <li>• Step-by-step tutorials</li>
                  <li>• Feature highlighting</li>
                  <li>• Performance metrics display</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">PWA Demonstration</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Offline functionality simulation</li>
                  <li>• Camera integration demo</li>
                  <li>• Push notification examples</li>
                  <li>• Installation walkthrough</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Accessibility Demo</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Screen reader simulation</li>
                  <li>• Keyboard navigation guide</li>
                  <li>• High contrast mode</li>
                  <li>• Font scaling demonstration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}