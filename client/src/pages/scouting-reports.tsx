import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  Search,
  Filter,
  Eye,
  Download,
  Share,
  BarChart3,
  Shield,
  Zap,
  Heart,
  Brain,
  Plus,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Trash2
} from "lucide-react";

interface ScoutingReport {
  id: number;
  playerName: string;
  playerId: number;
  position: string;
  age: number;
  club: string;
  country: string;
  scoutName: string;
  scoutId: number;
  date: string;
  status: string;
  overallRating: number;
  potentialRating: number;
  marketValue: string;
  summary: string;
  technical: {
    passing: number;
    ballControl: number;
    dribbling: number;
    crossing: number;
    shooting: number;
    finishing: number;
    longShots: number;
    freeKicks: number;
  };
  physical: {
    pace: number;
    acceleration: number;
    strength: number;
    stamina: number;
    agility: number;
    jumping: number;
    balance: number;
    workRate: number;
  };
  mental: {
    vision: number;
    decisionMaking: number;
    composure: number;
    concentration: number;
    leadership: number;
    teamwork: number;
    workRate: number;
    determination: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  detailedAnalysis: string;
}

export default function ScoutingReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoutFilter, setScoutFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<ScoutingReport | null>(null);
  const [newReportDialog, setNewReportDialog] = useState(false);
  const [viewFullReport, setViewFullReport] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/scouting-reports"],
    queryFn: () => apiRequest('GET', '/api/scouting-reports').then(res => res.json()),
  });

  const { data: playersData } = useQuery({
    queryKey: ["/api/players"],
    queryFn: () => apiRequest('GET', '/api/players').then(res => res.json()),
  });

  const players = playersData?.players || [];

  // Enhanced scouting reports with rejected player sample
  const dummyReports: ScoutingReport[] = [
    {
      id: 1,
      playerName: "Kwame Asante",
      playerId: 101,
      position: "Central Midfielder",
      age: 19,
      club: "Asante Kotoko",
      country: "Ghana",
      scoutName: "Marco Verratti Jr.",
      scoutId: 1,
      date: "2025-06-20",
      status: "Recommended",
      overallRating: 82,
      potentialRating: 89,
      marketValue: "€2.5M",
      summary: "Exceptional box-to-box midfielder with outstanding technical ability and leadership qualities rare for his age.",
      
      technical: {
        passing: 85,
        ballControl: 88,
        dribbling: 78,
        crossing: 70,
        shooting: 74,
        finishing: 68,
        longShots: 79,
        freeKicks: 82
      },
      
      physical: {
        pace: 76,
        acceleration: 78,
        strength: 84,
        stamina: 90,
        agility: 75,
        jumping: 81,
        balance: 83,
        workRate: 95
      },
      
      mental: {
        vision: 87,
        decisionMaking: 84,
        composure: 89,
        concentration: 86,
        leadership: 91,
        teamwork: 93,
        workRate: 95,
        determination: 92
      },
      
      strengths: [
        "Exceptional passing range and accuracy",
        "Outstanding leadership and communication",
        "Excellent work rate and stamina",
        "Strong in aerial duels",
        "Adapts quickly to different tactical systems",
        "Composed under pressure"
      ],
      
      weaknesses: [
        "Needs improvement in finishing",
        "Occasional lapses in concentration",
        "Could work on weak foot usage"
      ],
      
      recommendation: "Immediate signing recommended. Player shows exceptional potential and could adapt quickly to European football.",
      detailedAnalysis: "Kwame demonstrates remarkable maturity for his age, consistently making intelligent decisions in possession. His passing accuracy of 87% in domestic league matches, combined with his ability to break lines with through balls, makes him an ideal candidate for top-level European football. Physical attributes are well-suited for the Premier League intensity, and his leadership qualities suggest captaincy potential."
    },
    {
      id: 2,
      playerName: "Amara Diallo",
      playerId: 102,
      position: "Right Winger",
      age: 17,
      club: "AS Vita",
      country: "Mali",
      scoutName: "Sarah Chen",
      scoutId: 2,
      date: "2025-06-18",
      status: "Monitor",
      overallRating: 76,
      potentialRating: 85,
      marketValue: "€1.2M",
      summary: "Promising young winger with excellent pace and dribbling ability. Needs development in final third decision-making.",
      
      technical: {
        passing: 68,
        ballControl: 83,
        dribbling: 89,
        crossing: 71,
        shooting: 65,
        finishing: 62,
        longShots: 58,
        freeKicks: 64
      },
      
      physical: {
        pace: 94,
        acceleration: 96,
        strength: 58,
        stamina: 78,
        agility: 91,
        jumping: 65,
        balance: 86,
        workRate: 82
      },
      
      mental: {
        vision: 72,
        decisionMaking: 65,
        composure: 68,
        concentration: 71,
        leadership: 45,
        teamwork: 79,
        workRate: 82,
        determination: 88
      },
      
      strengths: [
        "Exceptional pace and acceleration",
        "Outstanding dribbling in tight spaces",
        "Natural left foot with good crossing ability",
        "Strong determination and work ethic",
        "Excellent at beating defenders 1v1"
      ],
      
      weaknesses: [
        "Inconsistent decision-making in final third",
        "Needs to improve shooting accuracy",
        "Sometimes too individualistic",
        "Physical strength needs development"
      ],
      
      recommendation: "Continue monitoring for 12 months. Consider academy placement for development.",
      detailedAnalysis: "Amara shows flashes of brilliance typical of raw African talent. His pace and dribbling ability are exceptional, but tactical awareness and decision-making need significant improvement. With proper coaching and physical development, could become a valuable asset. Recommend academy development program."
    },
    {
      id: 3,
      playerName: "Chukwu Okafor",
      playerId: 103,
      position: "Centre-Back",
      age: 23,
      club: "Enyimba FC",
      country: "Nigeria",
      scoutName: "Roberto Silva",
      scoutId: 3,
      date: "2025-06-15",
      status: "Rejected",
      overallRating: 58,
      potentialRating: 62,
      marketValue: "€150K",
      summary: "Experienced defender with good physical attributes but significant technical limitations that make him unsuitable for European football.",
      
      technical: {
        passing: 52,
        ballControl: 48,
        dribbling: 35,
        crossing: 41,
        shooting: 29,
        finishing: 25,
        longShots: 32,
        freeKicks: 38
      },
      
      physical: {
        pace: 61,
        acceleration: 58,
        strength: 87,
        stamina: 74,
        agility: 45,
        jumping: 91,
        balance: 72,
        workRate: 78
      },
      
      mental: {
        vision: 56,
        decisionMaking: 51,
        composure: 49,
        concentration: 63,
        leadership: 72,
        teamwork: 68,
        workRate: 78,
        determination: 81
      },
      
      strengths: [
        "Excellent aerial ability and jumping reach",
        "Strong physical presence",
        "Good leadership qualities in defensive organization",
        "Committed and determined attitude"
      ],
      
      weaknesses: [
        "Very poor ball control and first touch",
        "Limited passing range and accuracy",
        "Struggles against pace and movement",
        "Poor decision-making under pressure",
        "Lacks tactical sophistication",
        "Cannot play out from the back effectively"
      ],
      
      recommendation: "Not recommended for European football. Technical level insufficient for professional standards.",
      detailedAnalysis: "While Chukwu possesses good physical attributes and aerial dominance, his technical limitations are too significant for European football. His passing accuracy of 68% and poor first touch make him unsuitable for modern defensive systems that require ball-playing center-backs. Decision-making under pressure is inconsistent, and he struggles against mobile attackers. Despite good leadership qualities, the technical gap is too large to bridge at his age."
    },
    {
      id: 4,
      playerName: "Mohamed Keita",
      playerId: 104,
      position: "Striker",
      age: 21,
      club: "Stade Malien",
      country: "Mali",
      scoutName: "Luis Hernandez",
      scoutId: 4,
      date: "2025-06-12",
      status: "Recommended",
      overallRating: 79,
      potentialRating: 86,
      marketValue: "€3.8M",
      summary: "Clinical finisher with excellent movement in the box and strong aerial ability. Ready for European football.",
      
      technical: {
        passing: 71,
        ballControl: 82,
        dribbling: 74,
        crossing: 45,
        shooting: 89,
        finishing: 91,
        longShots: 78,
        freeKicks: 73
      },
      
      physical: {
        pace: 82,
        acceleration: 85,
        strength: 86,
        stamina: 81,
        agility: 78,
        jumping: 89,
        balance: 79,
        workRate: 87
      },
      
      mental: {
        vision: 76,
        decisionMaking: 84,
        composure: 88,
        concentration: 82,
        leadership: 71,
        teamwork: 85,
        workRate: 87,
        determination: 89
      },
      
      strengths: [
        "Clinical finishing with both feet",
        "Excellent movement in penalty area",
        "Strong aerial presence",
        "Good hold-up play",
        "Composed under pressure"
      ],
      
      weaknesses: [
        "Limited creativity in build-up play",
        "Could improve crossing ability",
        "Sometimes isolated from team play"
      ],
      
      recommendation: "Immediate signing recommended. Natural goalscorer ready for European challenge.",
      detailedAnalysis: "Mohamed is a natural finisher with exceptional composure in front of goal. His goal conversion rate of 24% and ability to score with both feet makes him valuable. Strong aerial ability and intelligent movement create constant threats. Physical attributes suit European football intensity."
    }
  ];

  // Transform backend reports to match our interface
  const transformedReports = (reports || []).map((report: any) => {
    const player = players.find((p: any) => p.id === report.playerId);
    return {
      ...report,
      playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown Player',
      position: player?.position || 'Unknown',
      age: player?.age || 0,
      club: player?.currentClub || 'Unknown Club',
      country: player?.nationality || 'Unknown',
      scoutName: 'AI Scout', // Default scout name
      date: new Date(report.createdAt || Date.now()).toISOString().split('T')[0],
      status: report.recommendation === 'sign' ? 'Recommended' : 
              report.recommendation === 'monitor' ? 'Monitor' : 'Rejected',
      potentialRating: report.overallRating + Math.floor(Math.random() * 10) + 5,
      marketValue: `€${(parseInt(report.estimatedValue || '0') / 1000000).toFixed(1)}M`,
      summary: report.detailedReport || 'Professional assessment pending.',
      technical: {
        passing: report.technicalRating + Math.floor(Math.random() * 10) - 5,
        ballControl: report.technicalRating + Math.floor(Math.random() * 10) - 5,
        dribbling: report.technicalRating + Math.floor(Math.random() * 10) - 5,
        crossing: report.technicalRating + Math.floor(Math.random() * 10) - 10,
        shooting: report.technicalRating + Math.floor(Math.random() * 10) - 5,
        finishing: report.technicalRating + Math.floor(Math.random() * 10) - 5,
        longShots: report.technicalRating + Math.floor(Math.random() * 10) - 5,
        freeKicks: report.technicalRating + Math.floor(Math.random() * 10) - 5
      },
      physical: {
        pace: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        acceleration: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        strength: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        stamina: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        agility: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        jumping: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        balance: report.physicalRating + Math.floor(Math.random() * 10) - 5,
        workRate: report.physicalRating + Math.floor(Math.random() * 10) - 5
      },
      mental: {
        vision: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        decisionMaking: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        composure: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        concentration: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        leadership: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        teamwork: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        workRate: report.mentalRating + Math.floor(Math.random() * 10) - 5,
        determination: report.mentalRating + Math.floor(Math.random() * 10) - 5
      },
      strengths: report.strengths || ['Technical ability', 'Work rate'],
      weaknesses: report.weaknesses || ['Consistency', 'Physical development'],
      recommendation: report.detailedReport || 'Detailed assessment required.',
      detailedAnalysis: report.detailedReport || 'Comprehensive analysis pending.'
    };
  });

  // Add unique keys to avoid React key conflicts
  const uniqueTransformedReports = transformedReports.map(report => ({
    ...report,
    id: `api-${report.id}` // Prefix API reports with 'api-'
  }));

  const uniqueDummyReports = dummyReports.map(report => ({
    ...report,
    id: `dummy-${report.id}` // Prefix dummy reports with 'dummy-'
  }));

  const combinedReports = [...uniqueTransformedReports, ...uniqueDummyReports];

  // Filter reports
  const filteredReports = combinedReports.filter(report => {
    const matchesSearch = (report?.playerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report?.scoutName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "all" || report?.position === positionFilter;
    const matchesStatus = statusFilter === "all" || report?.status === statusFilter;
    const matchesScout = scoutFilter === "all" || report?.scoutName === scoutFilter;
    
    return matchesSearch && matchesPosition && matchesStatus && matchesScout;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Recommended":
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Recommended</Badge>;
      case "Monitor":
        return <Badge className="bg-yellow-500 text-white"><Eye className="h-3 w-3 mr-1" />Monitor</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return "text-green-600";
    if (rating >= 75) return "text-yellow-600";
    if (rating >= 65) return "text-orange-600";
    return "text-red-600";
  };

  const exportToPDF = async (report: ScoutingReport) => {
    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set up fonts and styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(`SCOUTING REPORT`, 20, 20);
      
      doc.setFontSize(16);
      doc.text(`${report.playerName}`, 20, 35);
      
      // Player details section
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      let yPosition = 50;
      
      doc.setFont('helvetica', 'bold');
      doc.text('PLAYER DETAILS', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Position: ${report.position}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Age: ${report.age} years`, 20, yPosition);
      yPosition += 7;
      doc.text(`Club: ${report.club}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Country: ${report.country}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Market Value: ${report.marketValue}`, 20, yPosition);
      yPosition += 15;
      
      // Ratings section
      doc.setFont('helvetica', 'bold');
      doc.text('OVERALL ASSESSMENT', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Overall Rating: ${report.overallRating}/100`, 20, yPosition);
      yPosition += 7;
      doc.text(`Potential Rating: ${report.potentialRating}/100`, 20, yPosition);
      yPosition += 7;
      doc.text(`Status: ${report.status}`, 20, yPosition);
      yPosition += 15;
      
      // Technical attributes
      doc.setFont('helvetica', 'bold');
      doc.text('TECHNICAL ATTRIBUTES', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      Object.entries(report.technical).forEach(([key, value]) => {
        const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${displayName}: ${value}/100`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
      
      // Physical attributes
      doc.setFont('helvetica', 'bold');
      doc.text('PHYSICAL ATTRIBUTES', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      Object.entries(report.physical).forEach(([key, value]) => {
        const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${displayName}: ${value}/100`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Mental attributes
      doc.setFont('helvetica', 'bold');
      doc.text('MENTAL ATTRIBUTES', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      Object.entries(report.mental).forEach(([key, value]) => {
        const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${displayName}: ${value}/100`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
      
      // Strengths section
      doc.setFont('helvetica', 'bold');
      doc.text('STRENGTHS', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      report.strengths.forEach(strength => {
        const lines = doc.splitTextToSize(`• ${strength}`, 170) as string[];
        lines.forEach((line: string) => {
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
      });
      yPosition += 8;
      
      // Weaknesses section
      doc.setFont('helvetica', 'bold');
      doc.text('AREAS FOR IMPROVEMENT', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      report.weaknesses.forEach(weakness => {
        const lines = doc.splitTextToSize(`• ${weakness}`, 170) as string[];
        lines.forEach((line: string) => {
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
      });
      yPosition += 8;
      
      // Check if we need a new page for recommendation
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Recommendation section
      doc.setFont('helvetica', 'bold');
      doc.text('SCOUT RECOMMENDATION', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      const recommendationLines = doc.splitTextToSize(report.recommendation, 170) as string[];
      recommendationLines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
      
      // Detailed analysis section
      doc.setFont('helvetica', 'bold');
      doc.text('DETAILED ANALYSIS', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      const analysisLines = doc.splitTextToSize(report.detailedAnalysis, 170) as string[];
      analysisLines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 15;
      
      // Footer
      doc.setFont('helvetica', 'bold');
      doc.text(`Scout: ${report.scoutName}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Date: ${report.date}`, 20, yPosition);
      
      // Add page numbers - simplified without page count
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated by ScoutPro`, 20, 290);
      
      // Save the PDF
      doc.save(`${report.playerName}_scout_report.pdf`);
      
      toast({
        title: "PDF Report Exported",
        description: `${report.playerName}'s comprehensive scouting report has been exported as PDF.`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Error",
        description: "There was an error exporting the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareReport = (report: ScoutingReport) => {
    const shareData = {
      title: `Scouting Report: ${report.playerName}`,
      text: `${report.summary} - Overall Rating: ${report.overallRating}/100`,
      url: window.location.origin + `/scouting-reports/${report.id}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      toast({
        title: "Link Copied",
        description: "Report link has been copied to clipboard.",
      });
    }
  };

  const viewAnalytics = (report: ScoutingReport) => {
    // Navigate to analytics view
    toast({
      title: "Analytics View",
      description: `Opening detailed analytics for ${report.playerName}`,
    });
    // Here you could implement navigation to analytics page
  };

  const generateNewReport = useMutation({
    mutationFn: async (playerId: number) => {
      const player = players.find((p: any) => p.id === playerId);
      if (!player) throw new Error('Player not found');
      
      // Generate realistic ratings based on position
      const baseRating = Math.floor(Math.random() * 25) + 60; // 60-85 base
      const positionMultipliers = {
        'Goalkeeper': { technical: 0.7, physical: 0.9, mental: 1.1, tactical: 1.0 },
        'Centre-Back': { technical: 0.8, physical: 1.1, mental: 1.0, tactical: 1.0 },
        'Full-Back': { technical: 0.9, physical: 1.1, mental: 0.9, tactical: 1.0 },
        'Defensive Midfielder': { technical: 0.9, physical: 1.0, mental: 1.1, tactical: 1.1 },
        'Central Midfielder': { technical: 1.1, physical: 0.9, mental: 1.0, tactical: 1.0 },
        'Attacking Midfielder': { technical: 1.2, physical: 0.8, mental: 1.0, tactical: 1.0 },
        'Winger': { technical: 1.1, physical: 1.1, mental: 0.9, tactical: 0.9 },
        'Striker': { technical: 1.0, physical: 1.0, mental: 0.9, tactical: 0.9 }
      };
      
      const multiplier = positionMultipliers[player.position as keyof typeof positionMultipliers] || 
                        { technical: 1.0, physical: 1.0, mental: 1.0, tactical: 1.0 };
      
      // Generate position-specific strengths and weaknesses
      const positionStrengths = {
        'Striker': ['Clinical finishing', 'Movement in the box', 'Strong aerial presence'],
        'Winger': ['Pace and acceleration', 'Dribbling ability', 'Crossing accuracy'],
        'Central Midfielder': ['Passing range', 'Work rate', 'Tactical awareness'],
        'Centre-Back': ['Aerial ability', 'Defensive positioning', 'Leadership'],
        'Full-Back': ['Pace', 'Crossing ability', 'Defensive recovery'],
        'Goalkeeper': ['Shot stopping', 'Distribution', 'Command of area']
      };
      
      const positionWeaknesses = {
        'Striker': ['Link-up play', 'Defensive contribution', 'Consistency'],
        'Winger': ['Defensive tracking', 'Final ball', 'Physical strength'],
        'Central Midfielder': ['Pace', 'Aerial ability', 'Long shots'],
        'Centre-Back': ['Pace', 'Ball-playing ability', 'Mobility'],
        'Full-Back': ['Crossing consistency', 'Defensive positioning', 'Stamina'],
        'Goalkeeper': ['Footwork', 'Decision making', 'Communication']
      };
      
      const strengths = positionStrengths[player.position as keyof typeof positionStrengths] || 
                       ['Technical ability', 'Work rate', 'Potential'];
      const weaknesses = positionWeaknesses[player.position as keyof typeof positionWeaknesses] || 
                        ['Consistency', 'Physical development', 'Tactical awareness'];
      
      // Generate a new scouting report based on player data
      const newReport = {
        playerId: player.id,
        scoutId: 1, // Current user
        title: `Scouting Report - ${player.firstName} ${player.lastName}`,
        overallRating: Math.max(55, Math.min(90, Math.floor(baseRating))),
        technicalRating: Math.max(50, Math.min(95, Math.floor(baseRating * multiplier.technical))),
        physicalRating: Math.max(50, Math.min(95, Math.floor(baseRating * multiplier.physical))),
        mentalRating: Math.max(50, Math.min(95, Math.floor(baseRating * multiplier.mental))),
        tacticalRating: Math.max(50, Math.min(95, Math.floor(baseRating * multiplier.tactical))),
        strengths: strengths,
        weaknesses: weaknesses,
        detailedReport: `Comprehensive analysis of ${player.firstName} ${player.lastName} (${player.position}) from ${player.currentClub || 'Unknown Club'} shows promising potential with specific areas for development. The player demonstrates solid fundamentals in their position with room for growth in several key areas.`,
        recommendation: baseRating > 75 ? "sign" : baseRating > 65 ? "monitor" : "pass",
        potentialLevel: baseRating > 75 ? "high" : baseRating > 65 ? "medium" : "low",
        estimatedValue: (Math.random() * 3000000 + 500000).toFixed(0),
        isPublic: false
      };

      return apiRequest('POST', `/api/players/${playerId}/reports`, newReport);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scouting-reports"] });
      setNewReportDialog(false);
      toast({
        title: "Report Generated",
        description: "New scouting report has been created successfully.",
      });
    },
  });

  // Delete scouting report mutation (admin only)
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const numericId = reportId.startsWith('api-') ? reportId.replace('api-', '') : reportId;
      return apiRequest('DELETE', `/api/scouting-reports/${numericId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scouting-reports"] });
      toast({
        title: "Report Deleted",
        description: "Scouting report has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete scouting report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteReport = (reportId: string) => {
    if (confirm("Are you sure you want to delete this scouting report? This action cannot be undone.")) {
      deleteReportMutation.mutate(reportId);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Scouting Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Professional player assessments and recommendations
          </p>
        </div>
        <Dialog open={newReportDialog} onOpenChange={setNewReportDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Scouting Report</DialogTitle>
              <DialogDescription>
                Select a player to generate a comprehensive scouting report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player-select">Select Player</Label>
                <Select onValueChange={(value) => generateNewReport.mutate(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a player..." />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName} - {player.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewReportDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search players or scouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="Striker">Striker</SelectItem>
                <SelectItem value="Right Winger">Right Winger</SelectItem>
                <SelectItem value="Central Midfielder">Central Midfielder</SelectItem>
                <SelectItem value="Centre-Back">Centre-Back</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Recommended">Recommended</SelectItem>
                <SelectItem value="Monitor">Monitor</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoutFilter} onValueChange={setScoutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Scout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scouts</SelectItem>
                <SelectItem value="Marco Verratti Jr.">Marco Verratti Jr.</SelectItem>
                <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                <SelectItem value="Roberto Silva">Roberto Silva</SelectItem>
                <SelectItem value="Luis Hernandez">Luis Hernandez</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{report.playerName}</CardTitle>
                </div>
                {getStatusBadge(report.status)}
              </div>
              <CardDescription>
                {report.position} • {report.age} years • {report.country}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Player Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Club:</span>
                <span className="font-medium">{report.club}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Market Value:</span>
                <span className="font-medium text-green-600">{report.marketValue}</span>
              </div>

              {/* Ratings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Rating</span>
                  <span className={`text-lg font-bold ${getRatingColor(report.overallRating)}`}>
                    {report.overallRating}/100
                  </span>
                </div>
                <Progress value={report.overallRating} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Potential</span>
                  <span className={`text-lg font-bold ${getRatingColor(report.potentialRating)}`}>
                    {report.potentialRating}/100
                  </span>
                </div>
                <Progress value={report.potentialRating} className="h-2" />
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {report.summary}
              </p>

              {/* Scout Info */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{report.scoutName} • {report.date}</span>
              </div>

              {/* Action Buttons */}
              <div className={`grid gap-2 ${isAdmin ? 'grid-cols-2' : 'grid-cols-2'}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewAnalytics(report)}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReport(report);
                    setViewFullReport(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Full Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF(report)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareReport(report)}
                  className="flex items-center gap-1"
                >
                  <Share className="h-3 w-3" />
                  Share
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id.toString())}
                    className="flex items-center gap-1 col-span-2"
                    disabled={deleteReportMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    {deleteReportMutation.isPending ? "Deleting..." : "Delete Report"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Report Dialog */}
      <Dialog open={viewFullReport} onOpenChange={setViewFullReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Full Scouting Report: {selectedReport.playerName}
                </DialogTitle>
                <DialogDescription>
                  Comprehensive analysis by {selectedReport.scoutName} on {selectedReport.date}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Player Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Player Overview
                      {getStatusBadge(selectedReport.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Position</Label>
                      <p className="font-medium">{selectedReport.position}</p>
                    </div>
                    <div>
                      <Label>Age</Label>
                      <p className="font-medium">{selectedReport.age} years</p>
                    </div>
                    <div>
                      <Label>Current Club</Label>
                      <p className="font-medium">{selectedReport.club}</p>
                    </div>
                    <div>
                      <Label>Nationality</Label>
                      <p className="font-medium">{selectedReport.country}</p>
                    </div>
                    <div>
                      <Label>Market Value</Label>
                      <p className="font-medium text-green-600">{selectedReport.marketValue}</p>
                    </div>
                    <div>
                      <Label>Overall Rating</Label>
                      <p className={`font-bold text-lg ${getRatingColor(selectedReport.overallRating)}`}>
                        {selectedReport.overallRating}/100
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Attributes */}
                <Tabs defaultValue="technical" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="physical">Physical</TabsTrigger>
                    <TabsTrigger value="mental">Mental</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="technical" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Technical Attributes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(selectedReport.technical).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={value} className="w-20 h-2" />
                              <span className={`font-medium ${getRatingColor(value)}`}>{value}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="physical" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Physical Attributes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(selectedReport.physical).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={value} className="w-20 h-2" />
                              <span className={`font-medium ${getRatingColor(value)}`}>{value}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="mental" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Mental Attributes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(selectedReport.mental).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={value} className="w-20 h-2" />
                              <span className={`font-medium ${getRatingColor(value)}`}>{value}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedReport.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <ThumbsDown className="h-5 w-5" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedReport.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{selectedReport.detailedAnalysis}</p>
                  </CardContent>
                </Card>

                {/* Recommendation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Scout Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed font-medium">{selectedReport.recommendation}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {filteredReports.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No reports found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or create a new scouting report.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}