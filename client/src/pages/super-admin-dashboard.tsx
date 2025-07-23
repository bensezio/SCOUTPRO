import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FOOTBALL_POSITIONS } from "@shared/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Play, 
  Settings, 
  Shield, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  Clock,
  Crown,
  Eye,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Wrench
} from "lucide-react";

// Utility function to safely format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

interface SuperAdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalPlayers: number;
  pendingReports: number;
  maintenanceMode: any;
  recentActivity: any[];
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null);

  // Overview data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/super-admin/overview'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/super-admin/overview');
      return await response.json();
    }
  });

  // Users management
  const [userFilters, setUserFilters] = useState({ page: '1', search: '', role: 'all', status: 'all' });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/super-admin/users', userFilters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/users?${new URLSearchParams(userFilters).toString()}`);
      return await response.json();
    }
  });

  // Players management
  const [playerFilters, setPlayerFilters] = useState({ page: '1', search: '', position: 'all', status: 'all' });
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/super-admin/players', playerFilters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/players?${new URLSearchParams(playerFilters).toString()}`);
      return await response.json();
    }
  });

  // Platform settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/super-admin/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/super-admin/settings');
      return await response.json();
    }
  });

  // Reported content
  const [reportFilters, setReportFilters] = useState({ page: '1', status: 'all', priority: 'all' });
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/super-admin/reported-content', reportFilters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/reported-content?${new URLSearchParams(reportFilters).toString()}`);
      return await response.json();
    }
  });

  // Analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/super-admin/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/super-admin/analytics');
      return await response.json();
    }
  });

  // Maintenance mode
  const { data: maintenanceMode } = useQuery({
    queryKey: ['/api/super-admin/maintenance'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/super-admin/maintenance');
      return await response.json();
    }
  });

  // Audit logs
  const [auditFilters, setAuditFilters] = useState({ page: '1', action: '', severity: '' });
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/super-admin/audit-logs', auditFilters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/audit-logs?${new URLSearchParams(auditFilters).toString()}`);
      return await response.json();
    }
  });

  // Mutations
  const subscriptionOverrideMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      apiRequest('POST', `/api/super-admin/users/${userId}/subscription-override`, data),
    onSuccess: () => {
      toast({ title: "Subscription override applied successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setConfirmationDialog(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      apiRequest('DELETE', `/api/super-admin/users/${userId}`, data),
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setConfirmationDialog(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deletePlayerMutation = useMutation({
    mutationFn: ({ playerId, data }: { playerId: number; data: any }) =>
      apiRequest('DELETE', `/api/super-admin/players/${playerId}`, data),
    onSuccess: () => {
      toast({ title: "Player deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/players'] });
      setConfirmationDialog(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const reviewReportMutation = useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: any }) =>
      apiRequest('POST', `/api/super-admin/reported-content/${reportId}/review`, data),
    onSuccess: () => {
      toast({ title: "Report reviewed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/reported-content'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const maintenanceModeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/super-admin/maintenance', data),
    onSuccess: () => {
      toast({ title: "Maintenance mode updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/maintenance'] });
      setConfirmationDialog(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleSubscriptionOverride = (user: any) => {
    setConfirmationDialog({
      type: 'subscription',
      user,
      title: 'Override User Subscription',
      description: 'This will override the user\'s current subscription settings.'
    });
  };

  const handleDeleteUser = (user: any) => {
    setConfirmationDialog({
      type: 'deleteUser',
      user,
      title: 'Delete User Account',
      description: 'This action cannot be undone. The user will lose access to their account.'
    });
  };

  const handleDeletePlayer = (player: any) => {
    setConfirmationDialog({
      type: 'deletePlayer',
      player,
      title: 'Delete Player Profile',
      description: 'This will remove the player from the database permanently.'
    });
  };

  const handleMaintenanceMode = (enabled: boolean) => {
    setConfirmationDialog({
      type: 'maintenance',
      enabled,
      title: enabled ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode',
      description: enabled 
        ? 'This will make the platform unavailable to regular users.' 
        : 'This will restore normal platform access.'
    });
  };

  if (overviewLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Complete platform management and control</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overview?.activeUsers || 0} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalPlayers || 0}</div>
              <p className="text-xs text-muted-foreground">In database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.pendingReports || 0}</div>
              <p className="text-xs text-muted-foreground">Require review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Mode</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview?.maintenanceMode?.isEnabled ? 'ACTIVE' : 'OFF'}
              </div>
              <p className="text-xs text-muted-foreground">Platform status</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, subscriptions, and access controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* User Filters */}
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search users..."
                    value={userFilters.search}
                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value, page: '1' })}
                    className="max-w-sm"
                  />
                  <Select
                    value={userFilters.role}
                    onValueChange={(value) => setUserFilters({ ...userFilters, role: value, page: '1' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="scout">Scout</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={userFilters.status}
                    onValueChange={(value) => setUserFilters({ ...userFilters, status: value, page: '1' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users List */}
                {usersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usersData?.users?.map((user: any) => (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-semibold">{user.displayName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {user.email} • {user.username}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={user.role === 'super_admin' ? 'destructive' : 'secondary'}>
                                  {user.role}
                                </Badge>
                                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {user.subscriptionOverride && (
                                  <Badge variant="outline">Override</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubscriptionOverride(user)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Override
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Management */}
          <TabsContent value="players" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Management</CardTitle>
                <CardDescription>
                  Manage player profiles and database content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Player Filters */}
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search players..."
                    value={playerFilters.search}
                    onChange={(e) => setPlayerFilters({ ...playerFilters, search: e.target.value, page: '1' })}
                    className="max-w-sm"
                  />
                  <Select
                    value={playerFilters.position}
                    onValueChange={(value) => setPlayerFilters({ ...playerFilters, position: value, page: '1' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {FOOTBALL_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Players List */}
                {playersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {playersData?.players?.map((player: any) => (
                      <div key={player.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-semibold">{player.fullName || player.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {player.position} • {player.nationality} • Age {player.age}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge>{player.position}</Badge>
                                <Badge variant="outline">{player.currentClub}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePlayer(player)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reported Content */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reported Content</CardTitle>
                <CardDescription>
                  Review and moderate reported content and user behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Report Filters */}
                <div className="flex gap-4 mb-6">
                  <Select
                    value={reportFilters.status}
                    onValueChange={(value) => setReportFilters({ ...reportFilters, status: value, page: 1 })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={reportFilters.priority}
                    onValueChange={(value) => setReportFilters({ ...reportFilters, priority: value, page: 1 })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reports List */}
                {reportsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportsData?.reports?.map((report: any) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={report.priority === 'critical' ? 'destructive' : 'secondary'}>
                                {report.priority}
                              </Badge>
                              <Badge variant="outline">{report.status}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {report.contentType} #{report.contentId}
                              </span>
                            </div>
                            <h4 className="font-semibold mb-1">{report.reason}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Reported {formatDate(report.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const status = 'resolved';
                                const actionTaken = 'reviewed_and_resolved';
                                const reviewNotes = 'Reviewed by super admin';
                                reviewReportMutation.mutate({
                                  reportId: report.id,
                                  data: { status, actionTaken, reviewNotes }
                                });
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const status = 'dismissed';
                                const actionTaken = 'dismissed';
                                const reviewNotes = 'Dismissed by super admin';
                                reviewReportMutation.mutate({
                                  reportId: report.id,
                                  data: { status, actionTaken, reviewNotes }
                                });
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>
                  Monitor platform usage and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics?.find((a: any) => a.metric === 'daily_active_users')?.value || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Registrations</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics?.find((a: any) => a.metric === 'new_registrations')?.value || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">This week</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subscription Conversions</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics?.find((a: any) => a.metric === 'subscription_conversions')?.value || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure global platform settings and maintenance mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Maintenance Mode Control */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Maintenance Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Enable to restrict platform access for maintenance
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={maintenanceMode?.isEnabled ? 'destructive' : 'default'}>
                          {maintenanceMode?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        <Button
                          variant={maintenanceMode?.isEnabled ? 'destructive' : 'default'}
                          onClick={() => handleMaintenanceMode(!maintenanceMode?.isEnabled)}
                        >
                          <Wrench className="h-4 w-4 mr-1" />
                          {maintenanceMode?.isEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Platform Settings List */}
                  {settingsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {settings?.map((setting: any) => (
                        <div key={setting.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{setting.key}</h4>
                              <p className="text-sm text-muted-foreground">{setting.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{setting.category}</Badge>
                                <Badge variant="secondary">{setting.dataType}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm">{setting.value}</div>
                              {setting.isEditable && (
                                <Button variant="outline" size="sm" className="mt-2">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Track all super admin actions and system changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs?.logs?.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={log.severity === 'critical' ? 'destructive' : 'secondary'}>
                                {log.severity}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {log.targetType && `${log.targetType} #${log.targetId}`}
                              </span>
                            </div>
                            <h4 className="font-semibold mb-1">{log.action}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{log.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(log.createdAt)} • {log.ipAddress}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        {confirmationDialog && (
          <Dialog open={!!confirmationDialog} onOpenChange={() => setConfirmationDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{confirmationDialog.title}</DialogTitle>
                <DialogDescription>{confirmationDialog.description}</DialogDescription>
              </DialogHeader>
              
              {confirmationDialog.type === 'subscription' && (
                <SubscriptionOverrideForm
                  user={confirmationDialog.user}
                  onSubmit={(data) => {
                    subscriptionOverrideMutation.mutate({
                      userId: confirmationDialog.user.id,
                      data
                    });
                  }}
                  onCancel={() => setConfirmationDialog(null)}
                />
              )}

              {confirmationDialog.type === 'deleteUser' && (
                <UserDeleteForm
                  user={confirmationDialog.user}
                  onSubmit={(data) => {
                    deleteUserMutation.mutate({
                      userId: confirmationDialog.user.id,
                      data
                    });
                  }}
                  onCancel={() => setConfirmationDialog(null)}
                />
              )}

              {confirmationDialog.type === 'deletePlayer' && (
                <PlayerDeleteForm
                  player={confirmationDialog.player}
                  onSubmit={(data) => {
                    deletePlayerMutation.mutate({
                      playerId: confirmationDialog.player.id,
                      data
                    });
                  }}
                  onCancel={() => setConfirmationDialog(null)}
                />
              )}

              {confirmationDialog.type === 'maintenance' && (
                <MaintenanceModeForm
                  enabled={confirmationDialog.enabled}
                  onSubmit={(data) => {
                    maintenanceModeMutation.mutate({
                      isEnabled: confirmationDialog.enabled,
                      ...data
                    });
                  }}
                  onCancel={() => setConfirmationDialog(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// Component forms for confirmation dialogs
function SubscriptionOverrideForm({ user, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    subscriptionTier: user.subscriptionTier || '',
    subscriptionStatus: user.subscriptionStatus || '',
    endDate: '',
    reason: ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tier">Subscription Tier</Label>
          <Select
            value={formData.subscriptionTier}
            onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="scoutpro">Scout Pro</SelectItem>
              <SelectItem value="agent_club">Agent Club</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.subscriptionStatus}
            onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="endDate">End Date (optional)</Label>
        <Input
          type="datetime-local"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Textarea
          placeholder="Explain why this override is necessary..."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSubmit(formData)}
          disabled={!formData.reason}
        >
          Apply Override
        </Button>
      </DialogFooter>
    </div>
  );
}

function UserDeleteForm({ user, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    reason: '',
    hardDelete: false
  });

  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h4 className="font-semibold text-destructive">Warning</h4>
        </div>
        <p className="text-sm mt-1">
          You are about to delete user: <strong>{user.displayName} ({user.email})</strong>
        </p>
      </div>
      <div>
        <Label htmlFor="reason">Reason for deletion *</Label>
        <Textarea
          placeholder="Explain why this user is being deleted..."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hardDelete"
          checked={formData.hardDelete}
          onChange={(e) => setFormData({ ...formData, hardDelete: e.target.checked })}
        />
        <Label htmlFor="hardDelete">Permanently delete (cannot be undone)</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={() => onSubmit(formData)}
          disabled={!formData.reason}
        >
          {formData.hardDelete ? 'Permanently Delete' : 'Deactivate'} User
        </Button>
      </DialogFooter>
    </div>
  );
}

function PlayerDeleteForm({ player, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    reason: '',
    hardDelete: false
  });

  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h4 className="font-semibold text-destructive">Warning</h4>
        </div>
        <p className="text-sm mt-1">
          You are about to delete player: <strong>{player.fullName || player.name}</strong>
        </p>
      </div>
      <div>
        <Label htmlFor="reason">Reason for deletion *</Label>
        <Textarea
          placeholder="Explain why this player is being deleted..."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hardDelete"
          checked={formData.hardDelete}
          onChange={(e) => setFormData({ ...formData, hardDelete: e.target.checked })}
        />
        <Label htmlFor="hardDelete">Permanently delete (cannot be undone)</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={() => onSubmit(formData)}
          disabled={!formData.reason}
        >
          {formData.hardDelete ? 'Permanently Delete' : 'Deactivate'} Player
        </Button>
      </DialogFooter>
    </div>
  );
}

function MaintenanceModeForm({ enabled, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    message: enabled ? 'Platform is temporarily unavailable for maintenance. Please check back later.' : '',
    endTime: '',
    allowedRoles: [] as string[],
    reason: ''
  });

  return (
    <div className="space-y-4">
      {enabled && (
        <>
          <div>
            <Label htmlFor="message">Maintenance Message</Label>
            <Textarea
              placeholder="Message to display to users..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endTime">Expected End Time (optional)</Label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </>
      )}
      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Textarea
          placeholder={enabled ? "Explain why maintenance mode is needed..." : "Explain why maintenance mode is being disabled..."}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          variant={enabled ? 'destructive' : 'default'}
          onClick={() => onSubmit(formData)}
          disabled={!formData.reason}
        >
          {enabled ? 'Enable' : 'Disable'} Maintenance Mode
        </Button>
      </DialogFooter>
    </div>
  );
}