import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Share2, 
  Download,
  Eye,
  BarChart3,
  FileText,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { TranslationWidget } from "@/components/translation-widget";
import { InstantBioTranslator } from "@/components/instant-bio-translator";
import { PDFGenerator } from "@/components/pdf-generator";
import { EnhancedPDFGenerator } from "@/components/enhanced-pdf-generator";
import { useAuth } from "@/contexts/auth-context";

export default function PlayerDetail() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const [pdfGeneratorOpen, setPdfGeneratorOpen] = useState(false);
  const [enhancedPdfGeneratorOpen, setEnhancedPdfGeneratorOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: player, isLoading, error } = useQuery({
    queryKey: [`/api/players/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/players/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch player: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
  });

  const handleShareProfile = async () => {
    const shareUrl = `${window.location.origin}/players/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Profile link copied!",
        description: "Share this link with clubs and scouts",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Unable to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    // Check if user has access to professional PDF reports
    const hasAccess = user && (
      user.role === 'admin' || 
      user.role === 'super_admin' || 
      user.subscriptionPlan === 'club_professional' ||
      user.subscriptionPlan === 'enterprise'
    );

    if (!hasAccess) {
      toast({
        title: "Premium Feature",
        description: "Professional PDF reports are available for Admin users and paid subscribers. Upgrade your plan for access.",
        variant: "destructive",
      });
      return;
    }

    setPdfGeneratorOpen(true);
  };

  const getPlayerPhoto = (playerId: number) => {
    const photoUrls = [
      `https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // African athlete
      `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // African sports professional
      `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // Young Black athlete
      `https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // African football context
      `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // Athletic Black male
      `https://images.unsplash.com/photo-1531256456869-ce942a665e80?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // Professional athlete
      `https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // Young African athlete
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80`, // Professional football player
    ];
    return photoUrls[playerId % photoUrls.length];
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getRealisticAttributes = (position: string) => {
    const baseAttributes = {
      'Goalkeeper': { technical: 65, physical: 78, mental: 82 },
      'Centre-Back': { technical: 72, physical: 85, mental: 80 },
      'Left-Back': { technical: 78, physical: 82, mental: 75 },
      'Right-Back': { technical: 78, physical: 82, mental: 75 },
      'Wing-Back': { technical: 80, physical: 84, mental: 76 },
      'Sweeper': { technical: 74, physical: 82, mental: 83 },
      'Defensive Midfielder': { technical: 82, physical: 78, mental: 85 },
      'Central Midfielder': { technical: 85, physical: 75, mental: 80 },
      'Attacking Midfielder': { technical: 88, physical: 70, mental: 82 },
      'Left Midfielder': { technical: 84, physical: 76, mental: 77 },
      'Right Midfielder': { technical: 84, physical: 76, mental: 77 },
      'Box-to-Box Midfielder': { technical: 86, physical: 79, mental: 82 },
      'Left Winger': { technical: 86, physical: 78, mental: 75 },
      'Right Winger': { technical: 86, physical: 78, mental: 75 },
      'Centre-Forward': { technical: 84, physical: 82, mental: 79 },
      'Striker': { technical: 82, physical: 80, mental: 78 },
      'Second Striker': { technical: 85, physical: 76, mental: 80 },
      'False 9': { technical: 88, physical: 74, mental: 83 }
    };

    const base = baseAttributes[position as keyof typeof baseAttributes] || baseAttributes['Central Midfielder'];
    const variance = 8;
    
    return {
      technical: {
        passing: Math.max(50, Math.min(95, base.technical + Math.floor(Math.random() * variance - variance/2))),
        ballControl: Math.max(50, Math.min(95, base.technical + Math.floor(Math.random() * variance - variance/2))),
        dribbling: Math.max(50, Math.min(95, base.technical + Math.floor(Math.random() * variance - variance/2))),
        shooting: Math.max(50, Math.min(95, base.technical - 5 + Math.floor(Math.random() * variance))),
        finishing: Math.max(50, Math.min(95, base.technical - 3 + Math.floor(Math.random() * variance))),
        crossing: Math.max(50, Math.min(95, base.technical + Math.floor(Math.random() * variance - variance/2)))
      },
      physical: {
        pace: Math.max(50, Math.min(95, base.physical + Math.floor(Math.random() * variance - variance/2))),
        strength: Math.max(50, Math.min(95, base.physical + Math.floor(Math.random() * variance - variance/2))),
        stamina: Math.max(50, Math.min(95, base.physical + Math.floor(Math.random() * variance - variance/2))),
        agility: Math.max(50, Math.min(95, base.physical + Math.floor(Math.random() * variance - variance/2))),
        jumping: Math.max(50, Math.min(95, base.physical + Math.floor(Math.random() * variance - variance/2))),
        balance: Math.max(50, Math.min(95, base.physical + Math.floor(Math.random() * variance - variance/2)))
      },
      mental: {
        vision: Math.max(50, Math.min(95, base.mental + Math.floor(Math.random() * variance - variance/2))),
        decisionMaking: Math.max(50, Math.min(95, base.mental + Math.floor(Math.random() * variance - variance/2))),
        composure: Math.max(50, Math.min(95, base.mental + Math.floor(Math.random() * variance - variance/2))),
        leadership: Math.max(50, Math.min(95, base.mental - 10 + Math.floor(Math.random() * 20))),
        teamwork: Math.max(50, Math.min(95, base.mental + Math.floor(Math.random() * variance - variance/2))),
        determination: Math.max(50, Math.min(95, base.mental + Math.floor(Math.random() * variance - variance/2)))
      }
    };
  };

  const AttributeBar = ({ label, value, maxValue = 100 }: { label: string; value: number; maxValue?: number }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium">{value}/{maxValue}</span>
      </div>
      <Progress value={(value / maxValue) * 100} className="h-2" />
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Player Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The player profile you're looking for doesn't exist.
        </p>
        <Link href="/players">
          <Button>← Back to Players</Button>
        </Link>
      </div>
    );
  }

  const playerData = player as any;
  const attributes = getRealisticAttributes(playerData.position);
  const overallRating = Math.floor((
    Object.values(attributes.technical).reduce((a: number, b: number) => a + b, 0) +
    Object.values(attributes.physical).reduce((a: number, b: number) => a + b, 0) +
    Object.values(attributes.mental).reduce((a: number, b: number) => a + b, 0)
  ) / 18);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/players">
            <Button variant="outline" size="sm">← Back</Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {playerData.firstName} {playerData.lastName}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleShareProfile} variant="outline" size="sm">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Share Profile"}
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => setEnhancedPdfGeneratorOpen(true)} variant="default" size="sm">
            <FileText className="h-4 w-4" />
            Enhanced PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Player Photo & Basic Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-48 w-48 mb-4">
                    <AvatarImage 
                      src={getPlayerPhoto(playerData.id)} 
                      alt={`${playerData.firstName} ${playerData.lastName}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl">
                      {playerData.firstName[0]}{playerData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold text-center">{playerData.firstName} {playerData.lastName}</h2>
                  <Badge variant="secondary" className="mt-2">
                    {playerData.position}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                      <p className="font-medium">{calculateAge(playerData.dateOfBirth)} years</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nationality</p>
                      <p className="font-medium">{playerData.nationality}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Club</p>
                      <p className="font-medium">{playerData.currentClub?.name || 'Free Agent'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Market Value</p>
                      <p className="font-medium">€{parseInt(playerData.marketValue || '500000').toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Player Bio Section with Instant Translation */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Profile</h3>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{overallRating}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Overall</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{overallRating + 5}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Potential</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/comparison?players=${playerData.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Compare Player
                </Button>
              </Link>
              <Link href={`/reports?player=${playerData.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Watch Videos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Stats */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="attributes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="translation">Translation</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="attributes" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AttributeBar label="Passing" value={attributes.technical.passing} />
                    <AttributeBar label="Ball Control" value={attributes.technical.ballControl} />
                    <AttributeBar label="Dribbling" value={attributes.technical.dribbling} />
                    <AttributeBar label="Shooting" value={attributes.technical.shooting} />
                    <AttributeBar label="Finishing" value={attributes.technical.finishing} />
                    <AttributeBar label="Crossing" value={attributes.technical.crossing} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Physical</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AttributeBar label="Pace" value={attributes.physical.pace} />
                    <AttributeBar label="Strength" value={attributes.physical.strength} />
                    <AttributeBar label="Stamina" value={attributes.physical.stamina} />
                    <AttributeBar label="Agility" value={attributes.physical.agility} />
                    <AttributeBar label="Jumping" value={attributes.physical.jumping} />
                    <AttributeBar label="Balance" value={attributes.physical.balance} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mental</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AttributeBar label="Vision" value={attributes.mental.vision} />
                    <AttributeBar label="Decision Making" value={attributes.mental.decisionMaking} />
                    <AttributeBar label="Composure" value={attributes.mental.composure} />
                    <AttributeBar label="Leadership" value={attributes.mental.leadership} />
                    <AttributeBar label="Teamwork" value={attributes.mental.teamwork} />
                    <AttributeBar label="Determination" value={attributes.mental.determination} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Season Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{Math.floor(Math.random() * 20) + 5}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Goals</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 15) + 3}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Assists</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 15) + 20}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Appearances</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{Math.floor(Math.random() * 1000) + 1500}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Minutes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Disciplinary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Yellow Cards</span>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {Math.floor(Math.random() * 8)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Red Cards</span>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {Math.floor(Math.random() * 2)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">vs Asante Kotoko</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ghana Premier League</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">2-1 W</p>
                        <p className="text-sm text-green-600">1 Goal, 1 Assist</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">vs Hearts of Oak</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ghana Premier League</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">0-0 D</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">90 minutes played</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">vs Aduana Stars</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ghana Premier League</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">3-0 W</p>
                        <p className="text-sm text-green-600">2 Goals</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="translation" className="space-y-6">
              <InstantBioTranslator
                playerName={`${playerData.firstName} ${playerData.lastName}`}
                originalBio={`Dynamic ${playerData.position} who combines technical ability with exceptional work rate. Known for creating opportunities and contributing significantly to team performance in both defensive and offensive phases. Shows great potential for European football.`}
                context="player_bio"
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Career History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-blue-600 pl-4">
                      <p className="font-medium">Current Club</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2023 - Present</p>
                      <p className="text-sm">Active player in league competition</p>
                    </div>
                    <div className="border-l-2 border-gray-300 pl-4">
                      <p className="font-medium">Previous Club</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2021 - 2023</p>
                      <p className="text-sm">35+ appearances, strong performances</p>
                    </div>
                    <div className="border-l-2 border-gray-300 pl-4">
                      <p className="font-medium">Youth Development</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2019 - 2021</p>
                      <p className="text-sm">Academy progression and development</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* PDF Generator Modal */}
      {playerData && (
        <PDFGenerator
          player={playerData}
          open={pdfGeneratorOpen}
          onOpenChange={setPdfGeneratorOpen}
        />
      )}

      {/* Enhanced PDF Generator Modal */}
      {playerData && (
        <EnhancedPDFGenerator
          player={playerData}
          open={enhancedPdfGeneratorOpen}
          onOpenChange={setEnhancedPdfGeneratorOpen}
        />
      )}
    </div>
  );
}