import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Award,
  Languages,
  Briefcase,
  Heart,
  Camera,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Shield
} from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  profileImage?: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  expertise?: string;
  languages?: string;
  experience?: string;
  certifications?: string;
  socialLinks?: string;
  preferredContactMethod?: string;
  timezone?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  emailVerified?: boolean;
  createdAt: string;
}

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  

  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newExpertise, setNewExpertise] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading, error, isFetching, refetch } = useQuery<UserProfile>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    },
    enabled: isAuthenticated && !!user,
  });

  // Update profile when data loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        ...profile,
        expertise: profile.expertise || '[]',
        languages: profile.languages || '[]',
        certifications: profile.certifications || '[]',
        socialLinks: profile.socialLinks || '{}'
      });
    }
  }, [profile]);



  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return apiRequest('PUT', '/api/auth/profile', updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // Update profile with new photo
        await updateProfileMutation.mutateAsync({
          profileImage: base64String
        });
        
        setUploadingPhoto(false);
        toast({
          title: "Photo Updated",
          description: "Your profile photo has been updated successfully.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingPhoto(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      return apiRequest('POST', '/api/auth/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  // Email change mutation
  const changeEmailMutation = useMutation({
    mutationFn: async (data: typeof emailData) => {
      return apiRequest('POST', '/api/auth/change-email', data);
    },
    onSuccess: () => {
      toast({
        title: "Email Changed",
        description: "Your email has been updated. Please verify your new email address.",
      });
      setShowEmailDialog(false);
      setEmailData({ newEmail: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Email Change Failed",
        description: error.message || "Failed to change email.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for JSON arrays
  const parseJsonArray = (jsonString?: string): string[] => {
    try {
      return jsonString ? JSON.parse(jsonString) : [];
    } catch {
      return [];
    }
  };

  const parseJsonObject = (jsonString?: string): Record<string, string> => {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch {
      return {};
    }
  };

  const addToArray = (field: 'expertise' | 'languages' | 'certifications', value: string) => {
    if (!value.trim()) return;
    
    const currentArray = parseJsonArray(profileData[field]);
    if (!currentArray.includes(value.trim())) {
      const updatedArray = [...currentArray, value.trim()];
      setProfileData(prev => ({
        ...prev,
        [field]: JSON.stringify(updatedArray)
      }));
    }
    
    // Clear input
    if (field === 'expertise') setNewExpertise("");
    if (field === 'languages') setNewLanguage("");
    if (field === 'certifications') setNewCertification("");
  };

  const removeFromArray = (field: 'expertise' | 'languages' | 'certifications', value: string) => {
    const currentArray = parseJsonArray(profileData[field]);
    const updatedArray = currentArray.filter(item => item !== value);
    setProfileData(prev => ({
      ...prev,
      [field]: JSON.stringify(updatedArray)
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleCancel = () => {
    if (profile) {
      setProfileData({
        ...profile,
        expertise: profile.expertise || '[]',
        languages: profile.languages || '[]',
        certifications: profile.certifications || '[]',
        socialLinks: profile.socialLinks || '{}'
      });
    }
    setIsEditing(false);
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">Error loading profile: {error.message}</p>
          <button 
            onClick={() => refetch()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.isVerified && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your fundamental profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.profileImage} />
                  <AvatarFallback className="text-lg">
                    {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={!isEditing || uploadingPhoto}
                  />
                  <label htmlFor="photo-upload">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={!isEditing || uploadingPhoto}
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Camera className="h-4 w-4 mr-2" />
                        {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, GIF or PNG. Max size 5MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profileData.displayName || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed from this page
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={profileData.country || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profileData.city || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information Tab */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Professional Information
              </CardTitle>
              <CardDescription>
                Your football scouting experience and expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profileData.role?.replace('_', ' ').toUpperCase() || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="e.g., 5"
                    value={profileData.experience || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Expertise Areas */}
              <div>
                <Label className="flex items-center mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  Areas of Expertise
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {parseJsonArray(profileData.expertise).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      {isEditing && (
                        <button 
                          onClick={() => removeFromArray('expertise', skill)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add expertise (e.g., Youth Development, Striker Analysis)"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('expertise', newExpertise)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addToArray('expertise', newExpertise)}
                      disabled={!newExpertise.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Languages */}
              <div>
                <Label className="flex items-center mb-2">
                  <Languages className="h-4 w-4 mr-2" />
                  Languages Spoken
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {parseJsonArray(profileData.languages).map((language, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {language}
                      {isEditing && (
                        <button 
                          onClick={() => removeFromArray('languages', language)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add language (e.g., English, French, Spanish)"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('languages', newLanguage)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addToArray('languages', newLanguage)}
                      disabled={!newLanguage.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <Label className="flex items-center mb-2">
                  <Shield className="h-4 w-4 mr-2" />
                  Certifications & Licenses
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {parseJsonArray(profileData.certifications).map((cert, index) => (
                    <Badge key={index} variant="default" className="flex items-center gap-1">
                      {cert}
                      {isEditing && (
                        <button 
                          onClick={() => removeFromArray('certifications', cert)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add certification (e.g., UEFA B License, FIFA Agent License)"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('certifications', newCertification)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addToArray('certifications', newCertification)}
                      disabled={!newCertification.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Additional personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={profileData.gender || ''} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={profileData.nationality || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, nationality: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Timezone
                  </Label>
                  <Select 
                    value={profileData.timezone || ''} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                      <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                  <Select 
                    value={profileData.preferredContactMethod || 'email'} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, preferredContactMethod: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="preferredContactMethod">
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Account status and security information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium">Account Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Verified</span>
                      <Badge variant={profile?.emailVerified ? "default" : "destructive"}>
                        {profile?.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Account Verified</span>
                      <Badge variant={profile?.isVerified ? "default" : "secondary"}>
                        {profile?.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Member Since</span>
                      <span className="text-sm text-gray-600">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Security Actions</h3>
                  <div className="space-y-2">
                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Clock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and choose a new one.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => changePasswordMutation.mutate(passwordData)}
                              disabled={changePasswordMutation.isPending}
                            >
                              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Mail className="h-4 w-4 mr-2" />
                          Change Email
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Email Address</DialogTitle>
                          <DialogDescription>
                            Enter your new email address and current password to confirm.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newEmail">New Email Address</Label>
                            <Input
                              id="newEmail"
                              type="email"
                              value={emailData.newEmail}
                              onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="passwordConfirm">Current Password</Label>
                            <Input
                              id="passwordConfirm"
                              type="password"
                              value={emailData.password}
                              onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => changeEmailMutation.mutate(emailData)}
                              disabled={changeEmailMutation.isPending}
                            >
                              {changeEmailMutation.isPending ? 'Changing...' : 'Change Email'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Download My Data
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Verification Status */}
              {profile?.isVerified && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      Account Verified
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your account has been verified on {profile.verifiedAt ? new Date(profile.verifiedAt).toLocaleDateString() : 'N/A'}.
                    You have access to all verified user features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}