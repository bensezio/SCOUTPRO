import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Link, useLocation } from "wouter";
import { FeatureGate, FeatureRestriction } from "@/components/feature-gate";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FOOTBALL_POSITIONS, WORLD_COUNTRIES } from "@shared/constants";
import { getPositionAbbreviation, searchPositions, getAllPositions } from "@shared/position-mapping";
import { AccessibilityLoading, useReducedMotion } from "@/components/accessibility-loading";
import {
  Database,
  Upload,
  Download,
  Users,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Target,
  Globe,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface PlayerRecord {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  height?: number;
  weight?: number;
  currentClub?: string | { name: string; [key: string]: any };
  marketValue?: string;
  preferredFoot?: string;
  isActive: boolean;
  createdAt: string;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

interface ValidationResult {
  totalPlayers: number;
  validPlayers: number;
  invalidPlayers: number;
  errors: string[];
}

interface ImportHistoryData {
  totalPlayers: number;
  playersByNationality: Record<string, number>;
  playersByPosition: Record<string, number>;
  recentImports: Array<{
    id: number;
    name: string;
    nationality: string;
    position: string;
    createdAt: string;
  }>;
}

export default function PlayerDatabase() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasFeature } = usePermissions();
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("overview");
  const [importData, setImportData] = useState<any[]>([]);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    nationality: "all",
    position: "all",
    isActive: "all",
    ageRange: "all",
  });

  const queryClient = useQueryClient();

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Force refetch when search parameters change
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Triggering refetch due to parameter change");
      // Invalidate the cache to force fresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/players/search"],
      });
    }
  }, [debouncedSearchQuery, filters, isAuthenticated, user, queryClient]);
  
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerRecord | null>(
    null,
  );
  const [newPlayerData, setNewPlayerData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    position: "",
    secondaryPosition: "none",
    height: "",
    weight: "",
    preferredFoot: "right",
    marketValue: "",
    currentClub: "",
    isActive: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch players with unified search and filters
  const {
    data: playersData,
    isLoading: playersLoading,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: ["/api/players/search", debouncedSearchQuery, filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();

        // Always use search endpoint for unified functionality
        if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
          params.append("q", debouncedSearchQuery);
        }

        // Add filters to search parameters
        if (filters.nationality && filters.nationality !== "all")
          params.append("nationality", filters.nationality);
        if (filters.position && filters.position !== "all")
          params.append("position", filters.position);
        if (filters.isActive && filters.isActive !== "all")
          params.append("isActive", filters.isActive);

        // Handle age range filter
        if (filters.ageRange && filters.ageRange !== "all") {
          const ageRange = filters.ageRange;
          if (ageRange === "16-20") {
            params.append("ageMin", "16");
            params.append("ageMax", "20");
          } else if (ageRange === "21-25") {
            params.append("ageMin", "21");
            params.append("ageMax", "25");
          } else if (ageRange === "26-30") {
            params.append("ageMin", "26");
            params.append("ageMax", "30");
          } else if (ageRange === "31-35") {
            params.append("ageMin", "31");
            params.append("ageMax", "35");
          } else if (ageRange === "36+") {
            params.append("ageMin", "36");
          }
        }

        const url = `/api/players/search${params.toString() ? `?${params}` : ""}`;
        console.log("Player search URL:", url);
        console.log("Search query:", debouncedSearchQuery);
        console.log("Filters:", filters);
        const response = await apiRequest("GET", url);
        const data = await response.json();
        console.log("Player search response:", data);
        console.log("Players count:", data?.players?.length || 0);
        console.log("Total from API:", data?.total || 0);
        
        // Debug: Check response format
        if (!data || !Array.isArray(data.players)) {
          console.warn('Unexpected data format:', data);
          console.warn('Data type:', typeof data);
          console.warn('Data keys:', data ? Object.keys(data) : 'null');
        }
        
        return data;
      } catch (error: any) {
        console.error("Players fetch error:", error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!user, // Only run when authenticated
    retry: 2,
    staleTime: 0, // No caching to ensure fresh data
    cacheTime: 0, // No cache retention
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
  });

  // Fetch import history
  const { data: importHistory, isLoading: historyLoading } =
    useQuery<ImportHistoryData>({
      queryKey: ["/api/players/import/history"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/players/import/history");
        return response.json();
      },
      enabled: isAuthenticated && !!user,
      retry: 2,
    });

  // Add single player mutation
  const addPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      const response = await apiRequest("POST", "/api/players", playerData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Player Added",
        description: "Player has been successfully added to the database.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/search"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/players/import/history"],
      });
      setShowAddPlayerModal(false);
      setNewPlayerData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        nationality: "",
        position: "",
        secondaryPosition: "none",
        height: "",
        weight: "",
        preferredFoot: "right",
        marketValue: "",
        currentClub: "",
        isActive: true,
      });
    },
    onError: async (error: any) => {
      try {
        // Try to get more detailed error information
        const errorResponse = await error.response?.json().catch(() => null);
        
        let errorMessage = "Failed to add player. Please check the data and try again.";
        
        if (errorResponse?.message) {
          errorMessage = errorResponse.message;
        } else if (errorResponse?.details) {
          errorMessage = errorResponse.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Error Adding Player",
          description: errorMessage,
          variant: "destructive",
        });
      } catch (parseError) {
        // Fallback if error parsing fails
        toast({
          title: "Error Adding Player",
          description: "Failed to add player. Please check the data and try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Import mutation
  const importMutation = useMutation<ImportResult, Error, any>({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/players/import", {
        players: data,
      });
      return await response.json();
    },
    onSuccess: (result: ImportResult) => {
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successful} players. ${result.failed} failed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/search"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/players/import/history"],
      });
      setImportData([]);
      setValidationResult(null);
      setIsImporting(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description:
          "Failed to import players. Please check your data and try again.",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  // Validation mutation
  const validateMutation = useMutation<ValidationResult, Error, any>({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/players/validate", {
        players: data,
      });
      return await response.json();
    },
    onSuccess: (result: ValidationResult) => {
      setValidationResult(result);
      toast({
        title: "Validation Complete",
        description: `${result.validPlayers} valid, ${result.invalidPlayers} invalid players found`,
      });
    },
  });

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: async (data: { id: number; playerData: any }) => {
      const response = await apiRequest(
        "PUT",
        `/api/players/${data.id}`,
        data.playerData,
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Player Updated",
        description: "Player has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/search"] });
      setShowEditPlayerModal(false);
      setEditingPlayer(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update player. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await apiRequest("DELETE", `/api/players/${playerId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete player' }));
        throw new Error(errorData.message || 'Failed to delete player');
      }
      return response.status === 204 ? null : await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Player Deleted",
        description: "Player has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/search"] });
      setShowDeleteDialog(false);
      setPlayerToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Delete player error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete player. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Download CSV template
  const downloadCSVTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to download templates",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/players/template/csv", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "player_import_template.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Template Downloaded",
          description: "CSV template has been downloaded successfully",
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download CSV template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download Excel template
  const downloadExcelTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to download templates",
          variant: "destructive",
        });
        return;
      }

      // Show loading state
      toast({
        title: "Generating Template",
        description: "Please wait while we generate your Excel template...",
      });

      const response = await fetch("/api/players/template/excel", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to generate Excel template";
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // If it's not JSON, use the text as the error message
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Check if we got a valid response
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        throw new Error("Invalid file format received. Expected Excel file.");
      }

      const blob = await response.blob();
      
      // Validate that we got a non-empty blob
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty. Please try again.");
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "player_import_template.xlsx";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Template Downloaded",
        description: "Excel template with sample data has been downloaded successfully. The file includes player data and position guide sheets.",
      });
      
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download Excel template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced file upload handler for both CSV and Excel
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType = allowedTypes.includes(file.type) || 
                       ['csv', 'xlsx', 'xls'].includes(fileExtension || '');
    
    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/players/import/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successful} players. ${result.failed} failed. File type: ${result.fileType}`,
        variant: result.failed === 0 ? "default" : "destructive",
      });

      // Show detailed results
      if (result.errors && result.errors.length > 0) {
        console.log('Import errors:', result.errors);
      }

      // Refresh the player data
      await refetchPlayers();
      await importHistoryQuery.refetch();

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const validateData = () => {
    if (importData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    validateMutation.mutate(importData);
  };

  const proceedWithImport = () => {
    if (!validationResult || validationResult.validPlayers === 0) {
      toast({
        title: "No Valid Data",
        description:
          "Please validate your data first and ensure there are valid players",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    importMutation.mutate(importData);
  };

  const positions = [
    "GK",
    "CB",
    "LB",
    "RB",
    "CDM",
    "CM",
    "CAM",
    "LM",
    "RM",
    "LW",
    "RW",
    "CF",
    "ST",
  ];
  const nationalities = [
    "Ghana",
    "Nigeria",
    "Senegal",
    "Morocco",
    "Egypt",
    "South Africa",
    "Ivory Coast",
    "Mali",
    "Burkina Faso",
    "Tunisia",
  ];

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the Player Database.",
        variant: "destructive",
      });
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated, toast]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AccessibilityLoading size="lg" text="Loading player database..." reducedMotion={reducedMotion} />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Player Database
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Scalable player management with bulk import capabilities
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="import">Bulk Import</TabsTrigger>
            <TabsTrigger value="browse">Browse Players</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Players
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importHistory?.totalPlayers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered in database
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nationalities
                  </CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importHistory?.playersByNationality
                      ? Object.keys(importHistory.playersByNationality).length
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Countries represented
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Positions
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importHistory?.playersByPosition
                      ? Object.keys(importHistory.playersByPosition).length
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Playing positions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recent Imports
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importHistory?.recentImports?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last 10 additions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Imports */}
            {importHistory?.recentImports && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Player Additions</CardTitle>
                  <CardDescription>
                    Latest players added to the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importHistory.recentImports.map((player: any) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            {player.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {player.nationality}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {getPositionAbbreviation(player.position)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(player.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bulk Import Tab */}
          <TabsContent value="import" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <FeatureGate 
                feature="bulkOperations"
                fallback={
                  <Card className="opacity-60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Player Data (Upgrade Required)
                      </CardTitle>
                      <CardDescription>
                        Bulk import is available for Agent/Club tier and above. 
                        <Button variant="link" className="p-0 ml-1" onClick={() => window.location.href = '/pricing'}>
                          Upgrade now
                        </Button>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                }
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Player Data
                    </CardTitle>
                    <CardDescription>
                      Upload CSV or Excel file with player information for bulk import
                    </CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Drop your CSV or Excel file here or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Select CSV/Excel File'
                      )}
                    </Button>
                  </div>

                  {importData.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          File Loaded Successfully
                        </span>
                      </div>
                      <p className="text-green-700">
                        {importData.length} player records loaded from CSV
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <FeatureGate feature="bulkOperations">
                      <Button
                        onClick={validateData}
                        disabled={
                          importData.length === 0 || validateMutation.isPending
                        }
                      >
                        {validateMutation.isPending ? (
                          <>
                            <AccessibilityLoading size="sm" text="Validating..." reducedMotion={reducedMotion} />
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Validate Data
                          </>
                        )}
                      </Button>
                    </FeatureGate>

                    {validationResult && validationResult.validPlayers > 0 && (
                      <FeatureGate feature="bulkOperations">
                        <Button
                          onClick={proceedWithImport}
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <>
                              <AccessibilityLoading size="sm" text="Importing..." reducedMotion={reducedMotion} />
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Import Players
                            </>
                          )}
                        </Button>
                      </FeatureGate>
                    )}
                  </div>
                </CardContent>
              </Card>
              </FeatureGate>

              {/* Validation Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Validation Results
                  </CardTitle>
                  <CardDescription>
                    Data quality check and error reporting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {validationResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {validationResult.totalPlayers}
                          </div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {validationResult.validPlayers}
                          </div>
                          <div className="text-sm text-gray-600">Valid</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {validationResult.invalidPlayers}
                          </div>
                          <div className="text-sm text-gray-600">Invalid</div>
                        </div>
                      </div>

                      {validationResult.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-medium text-red-800 mb-2">
                            Validation Errors
                          </h4>
                          <div className="max-h-40 overflow-y-auto">
                            {validationResult.errors.map((error, index) => (
                              <p
                                key={index}
                                className="text-sm text-red-700 mb-1"
                              >
                                {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Upload and validate a CSV file to see results here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Browse Players Tab */}
          <TabsContent value="browse" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Player Database</CardTitle>
                    <CardDescription>
                      Search and filter through all registered players
                    </CardDescription>
                  </div>
                  <Dialog
                    open={showAddPlayerModal}
                    onOpenChange={setShowAddPlayerModal}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Player</DialogTitle>
                        <DialogDescription>
                          Add a single player to the database. All fields marked
                          with * are required.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* Basic Information */}
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={newPlayerData.firstName}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                firstName: e.target.value,
                              })
                            }
                            placeholder="Enter first name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={newPlayerData.lastName}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                lastName: e.target.value,
                              })
                            }
                            placeholder="Enter last name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={newPlayerData.dateOfBirth}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                dateOfBirth: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nationality">Nationality *</Label>
                          <Select
                            value={newPlayerData.nationality}
                            onValueChange={(value) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                nationality: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                              <SelectItem value="Nigeria">
                                🇳🇬 Nigeria
                              </SelectItem>
                              <SelectItem value="Senegal">
                                🇸🇳 Senegal
                              </SelectItem>
                              <SelectItem value="Morocco">
                                🇲🇦 Morocco
                              </SelectItem>
                              <SelectItem value="Egypt">🇪🇬 Egypt</SelectItem>
                              <SelectItem value="Ivory Coast">
                                🇨🇮 Ivory Coast
                              </SelectItem>
                              <SelectItem value="Cameroon">
                                🇨🇲 Cameroon
                              </SelectItem>
                              <SelectItem value="Mali">🇲🇱 Mali</SelectItem>
                              <SelectItem value="South Africa">
                                🇿🇦 South Africa
                              </SelectItem>
                              <SelectItem value="Tunisia">
                                🇹🇳 Tunisia
                              </SelectItem>
                              <SelectItem value="Algeria">
                                🇩🇿 Algeria
                              </SelectItem>
                              <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                              <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                              <SelectItem value="Zimbabwe">
                                🇿🇼 Zimbabwe
                              </SelectItem>
                              <SelectItem value="Zambia">🇿🇲 Zambia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Position Information */}
                        <div className="space-y-2">
                          <Label htmlFor="position">Position *</Label>
                          <Select
                            value={newPlayerData.position}
                            onValueChange={(value) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                position: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {FOOTBALL_POSITIONS.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="secondaryPosition">
                            Secondary Position
                          </Label>
                          <Select
                            value={newPlayerData.secondaryPosition}
                            onValueChange={(value) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                secondaryPosition: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select secondary position (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {FOOTBALL_POSITIONS.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Physical Information */}
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={newPlayerData.height}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                height: e.target.value,
                              })
                            }
                            placeholder="Enter height in cm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={newPlayerData.weight}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                weight: e.target.value,
                              })
                            }
                            placeholder="Enter weight in kg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferredFoot">Preferred Foot</Label>
                          <Select
                            value={newPlayerData.preferredFoot}
                            onValueChange={(value) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                preferredFoot: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="marketValue">Market Value (€M)</Label>
                          <Input
                            id="marketValue"
                            type="number"
                            step="0.1"
                            value={newPlayerData.marketValue}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                marketValue: e.target.value,
                              })
                            }
                            placeholder="Enter market value (€) with decimals if needed"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="currentClub">Current Club</Label>
                          <Input
                            id="currentClub"
                            value={newPlayerData.currentClub}
                            onChange={(e) =>
                              setNewPlayerData({
                                ...newPlayerData,
                                currentClub: e.target.value,
                              })
                            }
                            placeholder="Enter current club name"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddPlayerModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (
                              !newPlayerData.firstName ||
                              !newPlayerData.lastName ||
                              !newPlayerData.dateOfBirth ||
                              !newPlayerData.nationality ||
                              !newPlayerData.position
                            ) {
                              toast({
                                title: "Validation Error",
                                description:
                                  "Please fill in all required fields marked with *",
                                variant: "destructive",
                              });
                              return;
                            }

                            const playerToAdd = {
                              ...newPlayerData,
                              height: newPlayerData.height
                                ? parseInt(newPlayerData.height)
                                : null,
                              weight: newPlayerData.weight
                                ? parseInt(newPlayerData.weight)
                                : null,
                              marketValue: newPlayerData.marketValue
                                ? parseFloat(newPlayerData.marketValue)
                                : null,
                              secondaryPosition:
                                newPlayerData.secondaryPosition === "none"
                                  ? null
                                  : newPlayerData.secondaryPosition || null,
                              currentClub: newPlayerData.currentClub || null,
                            };

                            addPlayerMutation.mutate(playerToAdd);
                          }}
                          disabled={addPlayerMutation.isPending}
                        >
                          {addPlayerMutation.isPending ? (
                            <>
                              <AccessibilityLoading size="sm" text="Adding..." reducedMotion={reducedMotion} />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Player
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {/* Search and Quick Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, position (CDM, Striker), club, nationality..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      {searchQuery && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
                          title="Clear search"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          nationality: "all",
                          position: "all",
                          isActive: "all",
                          ageRange: "all",
                        });
                        setSearchQuery("");
                        toast({
                          title: "Filters Cleared",
                          description: "All filters have been reset",
                        });
                      }}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap gap-3">
                    <Select
                      value={filters.nationality}
                      onValueChange={(value) =>
                        setFilters({ ...filters, nationality: value })
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🌍 All Countries</SelectItem>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          🌍 African Countries (Primary Focus)
                        </div>
                        {["Nigeria", "Ghana", "Senegal", "Morocco", "Egypt", "Algeria", "Tunisia", "Cameroon", "Mali", "Burkina Faso", "Ivory Coast", "Kenya", "South Africa", "Ethiopia", "Tanzania", "Uganda", "Zambia", "Zimbabwe"].map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">
                          🌍 Other Countries
                        </div>
                        {WORLD_COUNTRIES.filter(country => !["Nigeria", "Ghana", "Senegal", "Morocco", "Egypt", "Algeria", "Tunisia", "Cameroon", "Mali", "Burkina Faso", "Ivory Coast", "Kenya", "South Africa", "Ethiopia", "Tanzania", "Uganda", "Zambia", "Zimbabwe"].includes(country)).map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.position}
                      onValueChange={(value) =>
                        setFilters({ ...filters, position: value })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          ⚽ Goalkeepers
                        </div>
                        <SelectItem value="GK">Goalkeeper (GK)</SelectItem>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">
                          🛡️ Defenders
                        </div>
                        <SelectItem value="CB">Centre-Back (CB)</SelectItem>
                        <SelectItem value="LB">Left-Back (LB)</SelectItem>
                        <SelectItem value="RB">Right-Back (RB)</SelectItem>
                        <SelectItem value="WB">Wing-Back (WB)</SelectItem>
                        <SelectItem value="Sweeper">Sweeper (SW)</SelectItem>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">
                          ⚙️ Midfielders
                        </div>
                        <SelectItem value="CDM">Defensive Midfielder (CDM)</SelectItem>
                        <SelectItem value="CM">Central Midfielder (CM)</SelectItem>
                        <SelectItem value="CAM">Attacking Midfielder (CAM)</SelectItem>
                        <SelectItem value="LM">Left Midfielder (LM)</SelectItem>
                        <SelectItem value="RM">Right Midfielder (RM)</SelectItem>
                        <SelectItem value="B2B">Box-to-Box Midfielder (B2B)</SelectItem>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">
                          ⚡ Forwards
                        </div>
                        <SelectItem value="LW">Left Winger (LW)</SelectItem>
                        <SelectItem value="RW">Right Winger (RW)</SelectItem>
                        <SelectItem value="CF">Centre-Forward (CF)</SelectItem>
                        <SelectItem value="ST">Striker (ST)</SelectItem>
                        <SelectItem value="SS">Second Striker (SS)</SelectItem>
                        <SelectItem value="F9">False 9 (F9)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.isActive}
                      onValueChange={(value) =>
                        setFilters({ ...filters, isActive: value })
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.ageRange}
                      onValueChange={(value) =>
                        setFilters({ ...filters, ageRange: value })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Age Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="16-20">16-20 (Youth)</SelectItem>
                        <SelectItem value="21-25">21-25 (Emerging)</SelectItem>
                        <SelectItem value="26-30">26-30 (Prime)</SelectItem>
                        <SelectItem value="31-35">31-35 (Veteran)</SelectItem>
                        <SelectItem value="36+">36+ (Experienced)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Results Count with Enhanced Display */}
                    {(playersData?.players ?? playersData) && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {(playersData?.players ?? playersData ?? []).length} player{(playersData?.players ?? playersData ?? []).length !== 1 ? "s" : ""} found
                        </span>
                        {(searchQuery || filters.nationality !== "all" || filters.position !== "all" || filters.isActive !== "all" || filters.ageRange !== "all") && (
                          <Badge variant="secondary" className="text-xs">
                            Filtered
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {playersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <AccessibilityLoading size="md" text="Loading players..." reducedMotion={reducedMotion} />
                    <span className="ml-2">Loading players...</span>
                  </div>
                ) : playersError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                      Error Loading Players
                    </h3>
                    <p className="text-red-500 mb-4">
                      {playersError.message || "Failed to load player data"}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["/api/players"],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/players/search"],
                        });
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (playersData?.players ?? playersData ?? []).length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Players Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No players match your current search criteria. Try adjusting your filters or search terms.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setFilters({
                          nationality: "all",
                          position: "all",
                          isActive: "all",
                          ageRange: "all",
                        });
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                ) : (playersData?.players ?? playersData ?? []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Nationality</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Club</TableHead>
                          <TableHead>Physical</TableHead>
                          <TableHead>Market Value</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(playersData?.players ?? playersData ?? []).map((player: PlayerRecord) => {
                          const age = player.dateOfBirth
                            ? Math.floor(
                                (new Date().getTime() -
                                  new Date(player.dateOfBirth).getTime()) /
                                  (1000 * 60 * 60 * 24 * 365.25),
                              )
                            : "N/A";

                          return (
                            <TableRow
                              key={player.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {player.firstName} {player.lastName}
                                  </span>
                                  {player.preferredFoot && (
                                    <span className="text-xs text-gray-500">
                                      {player.preferredFoot} footed
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {age}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {player.nationality}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={`
                                    ${player.position === "GK" ? "bg-yellow-100 text-yellow-800" : ""}
                                    ${["CB", "LB", "RB"].includes(player.position) ? "bg-red-100 text-red-800" : ""}
                                    ${["CDM", "CM", "CAM", "LM", "RM"].includes(player.position) ? "bg-green-100 text-green-800" : ""}
                                    ${["LW", "RW", "CF", "ST"].includes(player.position) ? "bg-purple-100 text-purple-800" : ""}
                                  `}
                                >
                                  {getPositionAbbreviation(player.position)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {typeof player.currentClub === "string"
                                      ? player.currentClub
                                      : (player.currentClub as any)?.name ||
                                        "Free Agent"}
                                  </span>
                                  {player.currentClub && (
                                    <span className="text-xs text-gray-500">
                                      Current Club
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {player.height && player.weight ? (
                                    <>
                                      <div>{player.height}cm</div>
                                      <div className="text-gray-500">
                                        {player.weight}kg
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-green-600">
                                    {player.marketValue || "N/A"}
                                  </span>
                                  {player.marketValue && (
                                    <span className="text-xs text-gray-500">
                                      Market Value
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    player.isActive ? "default" : "secondary"
                                  }
                                >
                                  {player.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Link href={`/players/${player.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="View Details"
                                      className="hover:bg-blue-50 dark:hover:bg-blue-950"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  {hasFeature('editPlayers') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Edit Player"
                                      onClick={() => {
                                        setEditingPlayer(player);
                                        setShowEditPlayerModal(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasFeature('deletePlayers') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Delete Player"
                                      onClick={() => {
                                        setPlayerToDelete(player);
                                        setShowDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      No Players Found
                    </h3>
                    <p className="text-gray-500">
                      Try adjusting your search criteria or import some players
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    CSV Template
                  </CardTitle>
                  <CardDescription>
                    Download CSV template with African player examples
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      CSV Format Features
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>
                        • Core player information (name, position, nationality)
                      </li>
                      <li>
                        • Physical attributes (height, weight, preferred foot)
                      </li>
                      <li>• Club and contract information</li>
                      <li>• Performance statistics for current season</li>
                      <li>• Contact details and agent information</li>
                    </ul>
                  </div>
                  <Button onClick={downloadCSVTemplate} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Excel Template
                  </CardTitle>
                  <CardDescription>
                    Comprehensive Excel template with validation rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      Excel Features
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Multiple worksheets (Players, Position Guide)</li>
                      <li>• Data validation and dropdown lists</li>
                      <li>• Pre-filled examples from African leagues</li>
                      <li>• Position codes reference sheet</li>
                      <li>• Formatting and validation rules</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full" onClick={downloadExcelTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sample Data Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Player Data</CardTitle>
                <CardDescription>
                  Preview of African players included in templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Market Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        Kwame Asante
                      </TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>
                        <Badge variant="outline">Ghana</Badge>
                      </TableCell>
                      <TableCell>CM</TableCell>
                      <TableCell>Hearts of Oak</TableCell>
                      <TableCell>€50,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fatima Kone</TableCell>
                      <TableCell>23</TableCell>
                      <TableCell>
                        <Badge variant="outline">Ivory Coast</Badge>
                      </TableCell>
                      <TableCell>LW</TableCell>
                      <TableCell>ASEC Mimosas</TableCell>
                      <TableCell>€35,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Amara Traore
                      </TableCell>
                      <TableCell>26</TableCell>
                      <TableCell>
                        <Badge variant="outline">Mali</Badge>
                      </TableCell>
                      <TableCell>CB</TableCell>
                      <TableCell>Stade Malien</TableCell>
                      <TableCell>€75,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Blessing Okoro
                      </TableCell>
                      <TableCell>24</TableCell>
                      <TableCell>
                        <Badge variant="outline">Nigeria</Badge>
                      </TableCell>
                      <TableCell>ST</TableCell>
                      <TableCell>Enyimba FC</TableCell>
                      <TableCell>€60,000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Player Dialog */}
        <Dialog
          open={showEditPlayerModal}
          onOpenChange={setShowEditPlayerModal}
        >
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>Update player information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editingPlayer?.firstName || ""}
                    onChange={(e) =>
                      setEditingPlayer((prev) =>
                        prev ? { ...prev, firstName: e.target.value } : null,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editingPlayer?.lastName || ""}
                    onChange={(e) =>
                      setEditingPlayer((prev) =>
                        prev ? { ...prev, lastName: e.target.value } : null,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-position">Position</Label>
                  <Select
                    value={editingPlayer?.position || ""}
                    onValueChange={(value) =>
                      setEditingPlayer((prev) =>
                        prev ? { ...prev, position: value } : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOOTBALL_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-nationality">Nationality</Label>
                  <Select
                    value={editingPlayer?.nationality || ""}
                    onValueChange={(value) =>
                      setEditingPlayer((prev) =>
                        prev ? { ...prev, nationality: value } : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORLD_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-height">Height (cm)</Label>
                  <Input
                    id="edit-height"
                    type="number"
                    value={editingPlayer?.height || ""}
                    onChange={(e) =>
                      setEditingPlayer((prev) =>
                        prev
                          ? { ...prev, height: parseInt(e.target.value) }
                          : null,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight">Weight (kg)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={editingPlayer?.weight || ""}
                    onChange={(e) =>
                      setEditingPlayer((prev) =>
                        prev
                          ? { ...prev, weight: parseInt(e.target.value) }
                          : null,
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-marketValue">Market Value (€)</Label>
                <Input
                  id="edit-marketValue"
                  value={editingPlayer?.marketValue || ""}
                  onChange={(e) =>
                    setEditingPlayer((prev) =>
                      prev ? { ...prev, marketValue: e.target.value } : null,
                    )
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditPlayerModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingPlayer) {
                    updatePlayerMutation.mutate({
                      id: editingPlayer.id,
                      playerData: {
                        firstName: editingPlayer.firstName,
                        lastName: editingPlayer.lastName,
                        position: editingPlayer.position,
                        nationality: editingPlayer.nationality,
                        height: editingPlayer.height,
                        weight: editingPlayer.weight,
                        marketValue: editingPlayer.marketValue,
                      },
                    });
                  }
                }}
                disabled={updatePlayerMutation.isPending}
              >
                {updatePlayerMutation.isPending
                  ? "Updating..."
                  : "Update Player"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Player Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Player</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {playerToDelete?.firstName}{" "}
                {playerToDelete?.lastName}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (playerToDelete) {
                    deletePlayerMutation.mutate(playerToDelete.id);
                  }
                }}
                disabled={deletePlayerMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletePlayerMutation.isPending
                  ? "Deleting..."
                  : "Delete Player"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
