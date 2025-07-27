import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Bot,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Globe,
  TrendingUp,
  Users,
  Video,
  Zap,
  Settings,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Target,
  BarChart3,
  Mail,
  Database,
  Workflow
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'lead_capture' | 'data_sync' | 'reporting' | 'video_analysis' | 'scouting';
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
  metrics: {
    tasksAutomated: number;
    timeSaved: number; // in minutes
    costSaved: number; // in dollars
  };
}

interface AutomationStats {
  totalTimeSaved: number;
  totalCostSaved: number;
  activeRules: number;
  tasksAutomated: number;
}

export default function AutomationDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch automation rules and stats
  const { data: automationRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/automation/rules'],
    queryFn: () => apiRequest<AutomationRule[]>('/api/automation/rules')
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/automation/stats'],
    queryFn: () => apiRequest<AutomationStats>('/api/automation/stats')
  });

  // Toggle automation rule
  const toggleRuleMutation = useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      apiRequest(`/api/automation/rules/${ruleId}/toggle`, {
        method: 'POST',
        body: { enabled }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/stats'] });
      toast({
        title: "Automation Updated",
        description: "Rule status has been updated successfully.",
      });
    }
  });

  const filteredRules = selectedCategory === 'all' 
    ? automationRules 
    : automationRules.filter(rule => rule.category === selectedCategory);

  const categoryIcons = {
    lead_capture: Mail,
    data_sync: Database,
    reporting: FileText,
    video_analysis: Video,
    scouting: Target
  };

  const categoryColors = {
    lead_capture: 'bg-blue-500',
    data_sync: 'bg-green-500',
    reporting: 'bg-purple-500',
    video_analysis: 'bg-orange-500',
    scouting: 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Process Automation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Eliminate manual tasks and reduce operational costs through intelligent automation
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Settings className="w-4 h-4 mr-2" />
          Configure New Rule
        </Button>
      </div>

      {/* ROI Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved This Month</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTimeSaved || 0} hrs</div>
            <p className="text-xs text-green-600">
              +24% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Saved</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalCostSaved || 0}</div>
            <p className="text-xs text-green-600">
              ROI: 340%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Bot className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRules || 0}</div>
            <p className="text-xs text-blue-600">
              {automationRules.filter(r => r.enabled).length} running now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Automated</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasksAutomated || 0}</div>
            <p className="text-xs text-green-600">
              +89% efficiency gain
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Impact Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Business Impact Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Lead Conversion Rate</span>
                <span className="text-sm text-green-600">+47%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Manual Data Entry Reduction</span>
                <span className="text-sm text-green-600">-85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Report Generation Speed</span>
                <span className="text-sm text-green-600">+300%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">System Integration Score</span>
                <span className="text-sm text-green-600">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="category-filter">Filter by Category:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="lead_capture">Lead Capture</SelectItem>
            <SelectItem value="data_sync">Data Synchronization</SelectItem>
            <SelectItem value="reporting">Automated Reporting</SelectItem>
            <SelectItem value="video_analysis">Video Analysis</SelectItem>
            <SelectItem value="scouting">Intelligent Scouting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Automation Rules */}
      <div className="grid gap-4">
        {filteredRules.map((rule) => {
          const CategoryIcon = categoryIcons[rule.category];
          const categoryColor = categoryColors[rule.category];
          
          return (
            <Card key={rule.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center`}>
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={rule.status === 'active' ? 'default' : rule.status === 'error' ? 'destructive' : 'secondary'}>
                      {rule.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {rule.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
                    </Badge>
                    
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => 
                        toggleRuleMutation.mutate({ ruleId: rule.id, enabled })
                      }
                      disabled={toggleRuleMutation.isPending}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{rule.metrics.tasksAutomated}</div>
                    <div className="text-xs text-gray-600">Tasks Automated</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{rule.metrics.timeSaved}m</div>
                    <div className="text-xs text-gray-600">Time Saved</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">${rule.metrics.costSaved}</div>
                    <div className="text-xs text-gray-600">Cost Reduced</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">{rule.frequency}</div>
                    <div className="text-xs text-gray-600">Frequency</div>
                  </div>
                </div>
                
                {rule.lastRun && (
                  <Separator className="my-4" />
                )}
                
                {rule.lastRun && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Last run: {new Date(rule.lastRun).toLocaleString()}</span>
                    {rule.nextRun && (
                      <span>Next run: {new Date(rule.nextRun).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Business Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Optimization Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600 mb-2">Lead Generation Enhancement</h4>
              <p className="text-sm text-gray-600 mb-3">
                Implement automated lead scoring and follow-up sequences to increase conversion by 45%.
              </p>
              <Button size="sm" variant="outline">Configure Now</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600 mb-2">Data Integration Hub</h4>
              <p className="text-sm text-gray-600 mb-3">
                Connect all your tools through a central automation hub to eliminate duplicate work.
              </p>
              <Button size="sm" variant="outline">Set Up Integration</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600 mb-2">Intelligent Reporting</h4>
              <p className="text-sm text-gray-600 mb-3">
                Auto-generate executive reports and insights, saving 12+ hours per week.
              </p>
              <Button size="sm" variant="outline">Enable Reporting</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-orange-600 mb-2">Scalable Video Processing</h4>
              <p className="text-sm text-gray-600 mb-3">
                Automatically analyze and tag video content as it's uploaded, reducing manual effort by 90%.
              </p>
              <Button size="sm" variant="outline">Activate Processing</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}