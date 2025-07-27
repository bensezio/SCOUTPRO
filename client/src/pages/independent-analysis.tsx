import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileVideo, Image, CreditCard, Eye, Share2, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FOOTBALL_POSITIONS, WORLD_COUNTRIES } from "@shared/constants";

const independentPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  preferredFoot: z.enum(["Left", "Right", "Both"]).optional(),
  height: z.number().min(140).max(220).optional(),
  weight: z.number().min(40).max(150).optional(),
  currentClub: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  agentContact: z.string().optional(),
});

type IndependentPlayer = z.infer<typeof independentPlayerSchema>;

interface AnalysisEligibility {
  canAnalyze: boolean;
  costType: 'free_trial' | 'credits' | 'subscription' | 'one_time_payment';
  creditsRequired: number;
  message?: string;
}

export default function IndependentAnalysis() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ videos: File[], photo: File | null }>({ videos: [], photo: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<IndependentPlayer>({
    resolver: zodResolver(independentPlayerSchema),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      nationality: "",
      position: "",
      preferredFoot: "Right",
      height: undefined,
      weight: undefined,
      currentClub: "",
      description: "",
      email: "",
      phone: "",
      agentContact: ""
    }
  });

  // Fetch user's independent players
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/independent-analysis/my-players'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/independent-analysis/my-players');
      return response.json();
    }
  });

  // Check analysis eligibility
  const { data: eligibility } = useQuery<AnalysisEligibility>({
    queryKey: ['/api/independent-analysis/check-eligibility'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/independent-analysis/check-eligibility');
      return response.json();
    }
  });

  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: async (data: { playerData: IndependentPlayer, files: { videos: File[], photo: File | null } }) => {
      const formData = new FormData();
      formData.append('playerData', JSON.stringify(data.playerData));
      
      data.files.videos.forEach(video => {
        formData.append('videos', video);
      });
      
      if (data.files.photo) {
        formData.append('photo', data.files.photo);
      }

      const response = await fetch('/api/independent-analysis/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Started",
        description: "Your player analysis has been submitted and will be processed shortly.",
      });
      setIsUploadOpen(false);
      form.reset();
      setSelectedFiles({ videos: [], photo: null });
      queryClient.invalidateQueries({ queryKey: ['/api/independent-analysis/my-players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/independent-analysis/check-eligibility'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileSelection = (files: FileList | null, type: 'videos' | 'photo') => {
    if (!files) return;

    if (type === 'videos') {
      const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
      if (videoFiles.length > 5) {
        toast({
          title: "Too Many Videos",
          description: "You can upload a maximum of 5 videos.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(prev => ({ ...prev, videos: videoFiles }));
    } else {
      const imageFile = Array.from(files)[0];
      if (imageFile && imageFile.type.startsWith('image/')) {
        setSelectedFiles(prev => ({ ...prev, photo: imageFile }));
      }
    }
  };

  const onSubmit = (data: IndependentPlayer) => {
    if (!eligibility?.canAnalyze) {
      toast({
        title: "Cannot Create Analysis",
        description: eligibility?.message || "You don't have enough credits or subscription access.",
        variant: "destructive",
      });
      return;
    }

    createAnalysisMutation.mutate({ playerData: data, files: selectedFiles });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      processing: { variant: "default" as const, label: "Processing" },
      completed: { variant: "default" as const, label: "Completed" },
      failed: { variant: "destructive" as const, label: "Failed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEligibilityInfo = () => {
    if (!eligibility) return null;

    if (eligibility.canAnalyze) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700">
                {eligibility.costType === 'free_trial' && "Free analysis available!"}
                {eligibility.costType === 'subscription' && "Included in your subscription"}
                {eligibility.costType === 'credits' && `Will use ${eligibility.creditsRequired} credit(s)`}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{eligibility.message}</span>
            </div>
            <Button className="mt-3" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Purchase Credits
            </Button>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Independent Player Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Upload and analyze players not yet in our main database. Perfect for agents, scouts, and players themselves.
        </p>
      </div>

      {getEligibilityInfo()}

      <div className="grid gap-6 mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Player Analyses</h2>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Independent Player Analysis</DialogTitle>
                <DialogDescription>
                  Upload player information and videos for AI-powered analysis.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Player Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FOOTBALL_POSITIONS.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WORLD_COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredFoot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Foot</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Left">Left</SelectItem>
                              <SelectItem value="Right">Right</SelectItem>
                              <SelectItem value="Both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="180" 
                              value={field.value || ""} 
                              onChange={e => field.onChange(parseInt(e.target.value) || undefined)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="75" 
                              value={field.value || ""} 
                              onChange={e => field.onChange(parseInt(e.target.value) || undefined)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="currentClub"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Club</FormLabel>
                        <FormControl>
                          <Input placeholder="Club name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the player's strengths, style, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Media Files</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Videos (Max 5 files)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleFileSelection(e.target.files, 'videos')}
                          className="hidden"
                          id="video-upload"
                        />
                        <label htmlFor="video-upload" className="cursor-pointer">
                          <div className="text-center">
                            <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload videos
                            </p>
                          </div>
                        </label>
                        {selectedFiles.videos.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Selected videos:</p>
                            <ul className="mt-2 space-y-1">
                              {selectedFiles.videos.map((file, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Player Photo (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelection(e.target.files, 'photo')}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <div className="text-center">
                            <Image className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload photo
                            </p>
                          </div>
                        </label>
                        {selectedFiles.photo && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Selected photo:</p>
                            <p className="text-sm text-gray-600">
                              {selectedFiles.photo.name} ({(selectedFiles.photo.size / 1024 / 1024).toFixed(1)} MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createAnalysisMutation.isPending || !eligibility?.canAnalyze || !form.formState.isValid}
                    >
                      {createAnalysisMutation.isPending ? "Creating..." : "Create Analysis"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {playersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : playersData?.players?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playersData.players.map((player: any) => (
              <Card key={player.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{player.name}</CardTitle>
                      <CardDescription>
                        {player.position} • {player.nationality || 'Unknown'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(player.analysisStatus)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {player.analysisStatus === 'processing' && (
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Analysis Progress</span>
                          <span>Processing...</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {player.analysisStatus === 'completed' && (
                        <>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="mr-1 h-3 w-3" />
                            PDF
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="mr-1 h-3 w-3" />
                            Share
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(player.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
              <p className="text-gray-600 mb-4">
                Upload your first player for AI-powered analysis
              </p>
              <Button onClick={() => setIsUploadOpen(true)}>
                Create Your First Analysis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}