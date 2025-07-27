import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Users, Shield, Activity, Ban, Unlock, RefreshCw, Trash2, Edit, Eye, Settings, Database, Clock, CheckCircle2, XCircle, UserX, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import AdminHelpSystem from '@/components/admin-help-system';

interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: number;
  phone?: string;
  country?: string;
  isActive: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  loginAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  totalOrganizations: number;
  verifiedOrganizations: number;
  usersByRole: {
    scout: number;
    agent: number;
    coach: number;
    club_director: number;
    admin: number;
    super_admin: number;
  };
}

interface AuditLog {
  id: number;
  adminId: number;
  targetUserId?: number;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  adminUser?: {
    username: string;
    email: string;
  };
  targetUser?: {
    username: string;
    email: string;
  };
}

// Format audit log details for human-readable display
const formatLogDetails = (details: any): string => {
  try {
    // Handle null or undefined
    if (details === null || details === undefined) {
      return 'No details available';
    }
    
    let parsedDetails = details;
    
    // If it's a string, try to parse it as JSON
    if (typeof details === 'string') {
      // If it's already a readable string, return it
      if (!details.startsWith('{') && !details.startsWith('[')) {
        return details;
      }
      
      try {
        parsedDetails = JSON.parse(details);
      } catch {
        return details; // Return as-is if not valid JSON
      }
    }
    
    // Handle objects
    if (typeof parsedDetails === 'object' && parsedDetails !== null) {
      // Handle deleted user details
      if (parsedDetails.deletedUser) {
        const user = parsedDetails.deletedUser;
        return `Deleted user: ${user.username || user.email || user.displayName || 'Unknown'}`;
      }
      
      // Handle deleted player details (new format)
      if (parsedDetails.deletedPlayer) {
        const player = parsedDetails.deletedPlayer;
        return `Deleted player: ${player.name || `${player.firstName} ${player.lastName}`.trim() || 'Unknown'} (${player.position || 'Unknown position'}, ${player.nationality || 'Unknown nationality'})`;
      }
      
      // Handle player deletion details (legacy format)
      if (parsedDetails.playerId && parsedDetails.playerName) {
        return `Deleted player: ${parsedDetails.playerName} (ID: ${parsedDetails.playerId})`;
      }
      
      // Handle updated fields
      if (parsedDetails.updatedFields && Array.isArray(parsedDetails.updatedFields)) {
        return `Updated fields: ${parsedDetails.updatedFields.join(', ')}`;
      }
      
      // Handle new role
      if (parsedDetails.newRole) {
        return `New role: ${parsedDetails.newRole}`;
      }
      
      // Handle suspension reason
      if (parsedDetails.reason) {
        return `Reason: ${parsedDetails.reason}`;
      }
      
      // Handle verification notes
      if (parsedDetails.verificationNotes) {
        return `Notes: ${parsedDetails.verificationNotes}`;
      }
      
      // Handle email details
      if (parsedDetails.type && parsedDetails.subject) {
        return `Email type: ${parsedDetails.type}, Subject: ${parsedDetails.subject}`;
      }
      
      // Handle role changes
      if (parsedDetails.fromRole && parsedDetails.toRole) {
        return `Role changed from ${parsedDetails.fromRole} to ${parsedDetails.toRole}`;
      }
      
      // Handle arrays
      if (Array.isArray(parsedDetails)) {
        return parsedDetails.join(', ');
      }
      
      // Handle generic object formatting
      const entries = Object.entries(parsedDetails)
        .filter(([key, value]) => value !== null && value !== undefined && key !== '__proto__')
        .map(([key, value]) => {
          // Format the key to be more readable
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              return `${formattedKey}: ${value.join(', ')}`;
            } else {
              return `${formattedKey}: ${JSON.stringify(value)}`;
            }
          }
          
          return `${formattedKey}: ${value}`;
        });
      
      return entries.length > 0 ? entries.join(', ') : 'No specific details';
    }
    
    // For primitive types
    return String(parsedDetails);
  } catch (error) {
    console.error('Error formatting log details:', error, details);
    return typeof details === 'string' ? details : 'Error formatting details';
  }
};

export default function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [currentTab, setCurrentTab] = useState('users');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: () => apiRequest('GET', '/api/admin/stats').then(res => res.json()),
  });

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('GET', '/api/admin/users').then(res => res.json()),
  });

  // Fetch audit logs
  const { data: auditLogsData } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: () => apiRequest('GET', '/api/admin/audit-logs').then(res => res.json()),
  });

  const users = usersData?.users || [];
  const auditLogs = auditLogsData?.auditLogs || [];

  // User management mutations
  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number, reason: string }) =>
      apiRequest('POST', `/api/admin/users/${userId}/suspend`, { reason }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
      toast({
        title: "User Suspended",
        description: "User has been suspended successfully.",
      });
      setSuspendDialogOpen(false);
      setSuspensionReason('');
    },
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest('POST', `/api/admin/users/${userId}/unsuspend`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
      toast({
        title: "User Unsuspended",
        description: "User has been reactivated successfully.",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest('POST', `/api/admin/users/${userId}/reset-password`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
      toast({
        title: "Password Reset",
        description: "User password has been reset. They will receive an email with new login details.",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest('DELETE', `/api/admin/users/${userId}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
      toast({
        title: "User Deleted",
        description: "User account has been permanently deleted.",
        variant: "destructive",
      });
    },
  });

  const cleanupSessionsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/cleanup-sessions').then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Sessions Cleaned",
        description: `Removed ${data.cleanedCount} expired sessions.`,
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="flex items-center gap-1 cursor-help">
              <Ban className="h-3 w-3" />Suspended
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Account suspended on {user.suspendedAt ? formatDate(user.suspendedAt) : 'Unknown'}</p>
            {user.suspensionReason && <p>Reason: {user.suspensionReason}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }
    if (!user.isActive) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
              <UserX className="h-3 w-3" />Inactive
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Account created but not yet activated by user</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    if (!user.emailVerified) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1 cursor-help">
              <AlertTriangle className="h-3 w-3" />Unverified
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Email address not verified - user has limited access</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="default" className="flex items-center gap-1 cursor-help">
            <CheckCircle2 className="h-3 w-3" />Active
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Account is active and verified</p>
          <p>Last login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      super_admin: 'bg-purple-500 text-white',
      admin: 'bg-red-500 text-white', 
      scout: 'bg-blue-500 text-white',
      agent: 'bg-green-500 text-white',
      coach: 'bg-orange-500 text-white',
      club_director: 'bg-indigo-500 text-white',
    };
    
    const roleDescriptions = {
      super_admin: 'Full system access - can manage all users, settings, and platform configuration',
      admin: 'Administrative access - can manage users and most system settings',
      scout: 'Talent scout - can search and analyze players, create scouting reports',
      agent: 'Player agent - can manage player portfolios and facilitate transfers',
      coach: 'Coach/trainer - can track player development and training programs',
      club_director: 'Club director - can manage club operations and player recruitment',
    };
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${roleColors[role as keyof typeof roleColors] || 'bg-gray-500 text-white'} cursor-help`}>
            {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{roleDescriptions[role as keyof typeof roleDescriptions] || 'Unknown role'}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            System administration and user management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminHelpSystem currentTab={currentTab} />
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.suspendedUsers || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Account suspensions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Registered clubs/agencies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Admin Activity Logs
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.displayName || `${user.firstName} ${user.lastName}`}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {getUserStatusBadge(user)}
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit user profile and permissions</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {user.isSuspended ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => unsuspendUserMutation.mutate(user.id)}
                                      disabled={unsuspendUserMutation.isPending}
                                    >
                                      <Unlock className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Unsuspend user account and restore access</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setSuspendDialogOpen(true);
                                      }}
                                    >
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Suspend user account and revoke access</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resetPasswordMutation.mutate(user.id)}
                                    disabled={resetPasswordMutation.isPending}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset password and send new credentials via email</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {user?.role === 'super_admin' && user.id !== selectedUser?.id && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>⚠️ Permanently delete user account (cannot be undone)</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Admin Activity Logs
              </CardTitle>
              <CardDescription>
                Track all administrative actions and system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log: AuditLog) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.adminUser?.username || 'Unknown Admin'}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{log.adminUser?.email || 'No email'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.targetUser ? (
                            <div>
                              <div className="font-medium">{log.targetUser?.username || 'Unknown User'}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{log.targetUser?.email || 'No email'}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={formatLogDetails(log.details)}>
                            {formatLogDetails(log.details)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.timestamp ? formatDate(log.timestamp) : 'Invalid Date'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Management
                </CardTitle>
                <CardDescription>
                  Manage user sessions and cleanup expired data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Clean Expired Sessions</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remove inactive and expired user sessions from the database
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => cleanupSessionsMutation.mutate()}
                        disabled={cleanupSessionsMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${cleanupSessionsMutation.isPending ? 'animate-spin' : ''}`} />
                        {cleanupSessionsMutation.isPending ? 'Cleaning...' : 'Clean Sessions'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove expired user sessions and free up database space</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Database Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Statistics
                </CardTitle>
                <CardDescription>
                  System database health and statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{stats?.totalUsers || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{stats?.totalOrganizations || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Organizations</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Role Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Role Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                    <div key={role} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{String(count)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {role.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {selectedUser?.displayName || selectedUser?.email}? This will prevent them from accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && suspendUserMutation.mutate({ 
                userId: selectedUser.id, 
                reason: suspensionReason 
              })}
              disabled={!suspensionReason.trim() || suspendUserMutation.isPending}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}