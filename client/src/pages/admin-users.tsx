import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldCheck,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  SendHorizontal,
  FileText,
  MessageCircle
} from "lucide-react";

interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: number;
  isActive: boolean;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedBy?: number;
  emailVerified: boolean;
  lastLogin?: string;
  loginAttempts?: number;
  lockedUntil?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  recentLogins: number;
  unverifiedEmails: number;
  pendingVerifications: number;
}

export default function AdminUsers() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailType, setEmailType] = useState("general");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authentication and admin check
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin panel.",
        variant: "destructive",
      });
      window.location.href = "/login";
      return;
    }

    if (user && !['admin', 'super_admin'].includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [authLoading, isAuthenticated, user, toast]);

  // Fetch user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!(isAuthenticated && user?.role && ['admin', 'super_admin'].includes(user.role)),
    staleTime: 60000, // 1 minute
  });

  // Fetch users with filters
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery<{ users: User[], total: number }>({
    queryKey: ['/api/admin/users', searchQuery, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const url = `/api/admin/users${params.toString() ? `?${params}` : ''}`;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      
      if (!response.ok) {
        throw new Error(`${response.status}: Failed to load users`);
      }
      
      return response.json();
    },
    enabled: !!(isAuthenticated && user?.role && ['admin', 'super_admin'].includes(user.role)),
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/suspend`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "User Suspended",
        description: "User has been suspended successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsSuspendDialogOpen(false);
      setSuspendReason("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Suspension Failed",
        description: error.message || "Failed to suspend user.",
        variant: "destructive",
      });
    },
  });

  // Unsuspend user mutation
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('POST', `/api/admin/users/${userId}/unsuspend`);
    },
    onSuccess: () => {
      toast({
        title: "User Unsuspended",
        description: "User has been unsuspended successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Unsuspension Failed",
        description: error.message || "Failed to unsuspend user.",
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}`, { role });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, verificationNotes }: { userId: number; verificationNotes: string }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/verify`, { verificationNotes });
    },
    onSuccess: () => {
      toast({
        title: "User Verified",
        description: "User has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsVerifyDialogOpen(false);
      setSelectedUser(null);
      setVerificationNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify user.",
        variant: "destructive",
      });
    },
  });

  // Unverify user mutation
  const unverifyUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/unverify`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "User Unverified",
        description: "User verification has been revoked.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Unverification Failed",
        description: error.message || "Failed to unverify user.",
        variant: "destructive",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ userId, type, subject, content }: { 
      userId: number; 
      type: string; 
      subject: string; 
      content: string 
    }) => {
      return apiRequest('POST', `/api/admin/emails/send`, { userId, type, subject, content });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully.",
      });
      setIsEmailDialogOpen(false);
      setSelectedUser(null);
      setEmailSubject("");
      setEmailContent("");
      setEmailType("general");
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email.",
        variant: "destructive",
      });
    },
  });

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !user || !['admin', 'super_admin'].includes(user.role)) {
    return null;
  }

  const handleSuspendUser = (user: User) => {
    setSelectedUser(user);
    setIsSuspendDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      case 'scout': return 'default';
      case 'agent': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (user: User) => {
    if (user.isSuspended) return 'destructive';
    if (!user.isActive) return 'secondary';
    if (!user.emailVerified) return 'outline';
    return 'default';
  };

  const getStatusText = (user: User) => {
    if (user.isSuspended) return 'Suspended';
    if (!user.isActive) return 'Inactive';
    if (!user.emailVerified) return 'Unverified';
    return 'Active';
  };

  // Handler functions
  const handleVerifyUser = (user: User) => {
    setSelectedUser(user);
    setIsVerifyDialogOpen(true);
  };

  const handleSendEmail = (user: User) => {
    setSelectedUser(user);
    setEmailSubject(`Important message from PlatinumEdge Analytics`);
    setEmailContent(`Dear ${user.firstName || user.displayName},\n\n`);
    setIsEmailDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage registered users, permissions, and access controls
        </p>
      </div>

      {/* Verification Status Alert */}
      {userStats && userStats.pendingVerifications > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800 dark:text-orange-200">
                  Pending User Verifications
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {userStats.pendingVerifications} users are waiting for admin verification.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStatusFilter('unverified')}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Review Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userStats?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userStats?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserX className="h-4 w-4 mr-2 text-red-600" />
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userStats?.suspendedUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userStats?.adminUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 text-purple-600" />
              Recent Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userStats?.recentLogins || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Unverified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userStats?.unverifiedEmails || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>
                {usersData?.total || 0} users registered in the system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter" className="w-32">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="scout">Scout</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="club_director">Club Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : usersError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                Error Loading Users
              </h3>
              <p className="text-red-500 mb-4">
                {usersError.message || 'Failed to load user data'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
              >
                Try Again
              </Button>
            </div>
          ) : usersData?.users && usersData.users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users?.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.email}
                          {!user.emailVerified && (
                            <AlertTriangle className="h-4 w-4 ml-2 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user)}>
                          {getStatusText(user)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Verification Actions */}
                          {user.isVerified ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unverifyUserMutation.mutate({ 
                                userId: user.id, 
                                reason: "Verification revoked by admin" 
                              })}
                              disabled={unverifyUserMutation.isPending}
                              title="Revoke Verification"
                            >
                              <XCircle className="h-4 w-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyUser(user)}
                              title="Verify User"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          {/* Email Action */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(user)}
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                          </Button>

                          {/* Suspend/Unsuspend Actions */}
                          {user.isSuspended ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unsuspendUserMutation.mutate(user.id)}
                              disabled={unsuspendUserMutation.isPending}
                              title="Unsuspend User"
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(user)}
                              disabled={user.role === 'super_admin'}
                              title="Suspend User"
                            >
                              <UserX className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                No Users Found
              </h3>
              <p className="text-gray-500">
                No users match your current search and filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and permissions for {selectedUser?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select 
                value={selectedUser?.role || ''} 
                onValueChange={(value) => setSelectedUser(prev => prev ? {...prev, role: value} : null)}
              >
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scout">Scout</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="club_director">Club Director</SelectItem>
                  {user?.role === 'super_admin' && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUser && updateRoleMutation.mutate({ 
                userId: selectedUser.id, 
                role: selectedUser.role 
              })}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedUser?.displayName}? 
              This will prevent them from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason for Suspension</Label>
              <Input
                id="suspend-reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedUser && suspendUserMutation.mutate({ 
                userId: selectedUser.id, 
                reason: suspendReason 
              })}
              disabled={suspendUserMutation.isPending || !suspendReason.trim()}
            >
              {suspendUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify User Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify User</DialogTitle>
            <DialogDescription>
              Verify {selectedUser?.displayName} to grant them access to verified user features.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-notes">Verification Notes</Label>
              <Input
                id="verification-notes"
                placeholder="Enter verification notes (optional)..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUser && verifyUserMutation.mutate({ 
                userId: selectedUser.id, 
                verificationNotes 
              })}
              disabled={verifyUserMutation.isPending}
            >
              {verifyUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedUser?.displayName} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-type">Email Type</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger id="email-type">
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="suspension">Suspension Notice</SelectItem>
                  <SelectItem value="promotion">Promotion/Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Enter email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email-content">Message</Label>
              <textarea
                id="email-content"
                placeholder="Enter your message..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUser && sendEmailMutation.mutate({ 
                userId: selectedUser.id, 
                type: emailType,
                subject: emailSubject,
                content: emailContent
              })}
              disabled={sendEmailMutation.isPending || !emailSubject.trim() || !emailContent.trim()}
            >
              {sendEmailMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <SendHorizontal className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}