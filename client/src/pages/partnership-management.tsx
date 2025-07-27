import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Mail,
  Phone,
  Globe,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";

interface BrandPartnership {
  id: number;
  brandName: string;
  partnershipType: 'affiliate' | 'sponsorship' | 'commission';
  commissionRate: number;
  isActive: boolean;
  contactEmail: string;
  contractStart: string;
  contractEnd: string;
  totalRevenue: number;
  createdAt: string;
}

interface PartnershipFormData {
  brandName: string;
  partnershipType: string;
  commissionRate: number;
  contactEmail: string;
  contractStart: string;
  contractEnd: string;
}

export default function PartnershipManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<BrandPartnership | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Admin access control
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can access partnership management.</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState<PartnershipFormData>({
    brandName: '',
    partnershipType: 'affiliate',
    commissionRate: 5,
    contactEmail: '',
    contractStart: '',
    contractEnd: ''
  });

  // Fetch partnerships
  const { data: partnerships, isLoading } = useQuery({
    queryKey: ['/api/partnerships'],
    retry: false
  });

  // Fetch partnership analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/partnerships/analytics'],
    retry: false
  });

  // Create/Update partnership mutation
  const partnershipMutation = useMutation({
    mutationFn: async (data: PartnershipFormData) => {
      const url = editingPartnership ? `/api/partnerships/${editingPartnership.id}` : '/api/partnerships';
      const method = editingPartnership ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships/analytics'] });
      setIsDialogOpen(false);
      setEditingPartnership(null);
      setFormData({
        brandName: '',
        partnershipType: 'affiliate',
        commissionRate: 5,
        contactEmail: '',
        contractStart: '',
        contractEnd: ''
      });
      toast({
        title: editingPartnership ? "Partnership Updated" : "Partnership Created",
        description: `${formData.brandName} partnership has been ${editingPartnership ? 'updated' : 'created'} successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save partnership",
        variant: "destructive"
      });
    }
  });

  // Delete partnership mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/partnerships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships'] });
      toast({
        title: "Partnership Deleted",
        description: "Partnership has been removed successfully."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    partnershipMutation.mutate(formData);
  };

  const handleEdit = (partnership: BrandPartnership) => {
    setEditingPartnership(partnership);
    setFormData({
      brandName: partnership.brandName,
      partnershipType: partnership.partnershipType,
      commissionRate: partnership.commissionRate,
      contactEmail: partnership.contactEmail,
      contractStart: partnership.contractStart,
      contractEnd: partnership.contractEnd
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this partnership?')) {
      deleteMutation.mutate(id);
    }
  };

  const getPartnershipTypeColor = (type: string) => {
    switch (type) {
      case 'affiliate': return 'bg-blue-100 text-blue-800';
      case 'sponsorship': return 'bg-green-100 text-green-800';
      case 'commission': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Partnership Management</h1>
          <p className="text-muted-foreground">Manage brand partnerships and revenue streams</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Partnership
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPartnership ? 'Edit Partnership' : 'Add New Partnership'}
              </DialogTitle>
              <DialogDescription>
                Create or modify brand partnership agreements
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                  placeholder="Nike, Adidas, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnershipType">Partnership Type</Label>
                <Select 
                  value={formData.partnershipType} 
                  onValueChange={(value) => setFormData({...formData, partnershipType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  placeholder="partnerships@brand.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStart">Contract Start</Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) => setFormData({...formData, contractStart: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractEnd">Contract End</Label>
                  <Input
                    id="contractEnd"
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData({...formData, contractEnd: e.target.value})}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={partnershipMutation.isPending}>
                  {partnershipMutation.isPending ? 'Saving...' : (editingPartnership ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partnerships</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerships?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {partnerships?.filter((p: BrandPartnership) => p.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.monthlyRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageCommission?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Commission rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Partnerships List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Partnerships</CardTitle>
          <CardDescription>Manage your brand partnerships and track performance</CardDescription>
        </CardHeader>
        <CardContent>
          {partnerships && partnerships.length > 0 ? (
            <div className="space-y-4">
              {partnerships.map((partnership: BrandPartnership) => (
                <div key={partnership.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{partnership.brandName}</h3>
                        <Badge className={getPartnershipTypeColor(partnership.partnershipType)}>
                          {partnership.partnershipType}
                        </Badge>
                        {partnership.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>{partnership.commissionRate}% commission</span>
                        <span>•</span>
                        <span>${partnership.totalRevenue.toLocaleString()} revenue</span>
                        <span>•</span>
                        <span>{partnership.contactEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(partnership)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(partnership.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No partnerships yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start building revenue streams with brand partnerships</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Add Your First Partnership
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}