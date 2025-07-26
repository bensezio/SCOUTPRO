import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeatureGate } from '@/components/feature-gate';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FEATURES } from '@/../../shared/subscription-tiers';
import { 
  Trophy, 
  Target, 
  Users, 
  Clock, 
  DollarSign, 
  Plus,
  Star,
  Medal,
  Play,
  Upload,
  Calendar,
  Gift,
  TrendingUp,
  ChevronRight,
  Zap
} from 'lucide-react';

interface SkillChallenge {
  id: number;
  name: string;
  description: string;
  challengeType: 'individual' | 'team' | 'technical' | 'fitness';
  category: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules: string;
  judging: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdBy: number;
  createdAt: string;
}

interface ChallengeParticipant {
  id: number;
  challengeId: number;
  participantId: number;
  participantType: 'individual' | 'team';
  teamName?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  submissionStatus: 'not_submitted' | 'submitted' | 'judged';
  score?: number;
  rank?: number;
  videoUrl?: string;
  notes?: string;
}

interface Leaderboard {
  id: number;
  challengeId: number;
  participantId: number;
  participantName: string;
  score: number;
  rank: number;
  prizeAwarded?: number;
  prizeStatus: 'pending' | 'paid' | 'claimed';
}

export default function SkillChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<SkillChallenge | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const { hasFeature } = usePermissions();
  const skillChallengeAccess = hasFeature('skillChallenges');

  // Fetch skill challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['/api/skill-challenges'],
    enabled: skillChallengeAccess,
  });

  // Fetch leaderboards for active challenges
  const { data: leaderboards = [] } = useQuery({
    queryKey: ['/api/skill-challenges/leaderboards'],
    enabled: skillChallengeAccess,
  });

  // Mock data for demonstration
  const mockChallenges: SkillChallenge[] = [
    {
      id: 1,
      name: "Precision Shooting Challenge",
      description: "Test your shooting accuracy with 10 attempts at different targets",
      challengeType: 'individual',
      category: 'shooting',
      entryFee: 25,
      prizePool: 500,
      maxParticipants: 50,
      currentParticipants: 23,
      startDate: '2025-01-15T10:00:00Z',
      endDate: '2025-01-22T23:59:59Z',
      registrationDeadline: '2025-01-14T23:59:59Z',
      rules: "10 shots from designated positions. Accuracy and consistency scored.",
      judging: "Automated scoring based on target proximity and consistency",
      status: 'active',
      createdBy: 1,
      createdAt: '2025-01-01T10:00:00Z'
    },
    {
      id: 2,
      name: "Dribbling Mastery",
      description: "Navigate through cones showcasing ball control and agility",
      challengeType: 'individual',
      category: 'dribbling',
      entryFee: 15,
      prizePool: 300,
      maxParticipants: 30,
      currentParticipants: 18,
      startDate: '2025-01-20T10:00:00Z',
      endDate: '2025-01-27T23:59:59Z',
      registrationDeadline: '2025-01-19T23:59:59Z',
      rules: "Complete dribbling course in fastest time with fewest mistakes",
      judging: "Time-based scoring with penalties for knocked cones",
      status: 'upcoming',
      createdBy: 1,
      createdAt: '2025-01-02T10:00:00Z'
    },
    {
      id: 3,
      name: "Team Passing Precision",
      description: "5v5 passing accuracy and creativity challenge",
      challengeType: 'team',
      category: 'passing',
      entryFee: 100,
      prizePool: 2000,
      maxParticipants: 12,
      currentParticipants: 8,
      startDate: '2025-01-25T10:00:00Z',
      endDate: '2025-02-01T23:59:59Z',
      registrationDeadline: '2025-01-24T23:59:59Z',
      rules: "Teams demonstrate passing accuracy and creative play patterns",
      judging: "Judge panel scores on accuracy, creativity, and teamwork",
      status: 'upcoming',
      createdBy: 1,
      createdAt: '2025-01-03T10:00:00Z'
    }
  ];

  const mockLeaderboards: Leaderboard[] = [
    {
      id: 1,
      challengeId: 1,
      participantId: 1,
      participantName: 'Marcus Johnson',
      score: 9.2,
      rank: 1,
      prizeAwarded: 250,
      prizeStatus: 'pending'
    },
    {
      id: 2,
      challengeId: 1,
      participantId: 2,
      participantName: 'Sarah Mitchell',
      score: 8.7,
      rank: 2,
      prizeAwarded: 150,
      prizeStatus: 'pending'
    },
    {
      id: 3,
      challengeId: 1,
      participantId: 3,
      participantName: 'Ahmed Hassan',
      score: 8.3,
      rank: 3,
      prizeAwarded: 100,
      prizeStatus: 'pending'
    }
  ];

  const filteredChallenges = mockChallenges.filter(challenge => {
    if (activeTab === 'active') return challenge.status === 'active';
    if (activeTab === 'upcoming') return challenge.status === 'upcoming';
    if (activeTab === 'completed') return challenge.status === 'completed';
    return true;
  });

  const getChallengeIcon = (category: string) => {
    switch (category) {
      case 'shooting': return <Target className="h-5 w-5" />;
      case 'dribbling': return <Zap className="h-5 w-5" />;
      case 'passing': return <Users className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleJoinChallenge = async (challenge: SkillChallenge) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to join challenges",
        variant: "destructive"
      });
      return;
    }

    if (!skillChallengeAccess.hasAccess) {
      toast({
        title: "Upgrade Required",
        description: "Skill challenges require a premium subscription",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Joining Challenge",
      description: `Processing entry for ${challenge.name}`,
    });

    // TODO: Implement actual payment and registration logic
    setTimeout(() => {
      toast({
        title: "Challenge Joined!",
        description: `You've successfully joined ${challenge.name}`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Skill Challenges</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compete in football challenges and win prizes
          </p>
        </div>
        <FeatureGate feature={FEATURES.SKILL_CHALLENGES}>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </FeatureGate>
      </div>

      <FeatureGate feature={FEATURES.SKILL_CHALLENGES}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <ChallengeGrid challenges={filteredChallenges} onJoin={handleJoinChallenge} />
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <ChallengeGrid challenges={filteredChallenges} onJoin={handleJoinChallenge} />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <ChallengeGrid challenges={filteredChallenges} onJoin={handleJoinChallenge} />
          </TabsContent>

          <TabsContent value="leaderboards" className="space-y-4">
            <LeaderboardSection leaderboards={mockLeaderboards} challenges={mockChallenges} />
          </TabsContent>
        </Tabs>
      </FeatureGate>
    </div>
  );
}

interface ChallengeGridProps {
  challenges: SkillChallenge[];
  onJoin: (challenge: SkillChallenge) => void;
}

function ChallengeGrid({ challenges, onJoin }: ChallengeGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} onJoin={onJoin} />
      ))}
    </div>
  );
}

interface ChallengeCardProps {
  challenge: SkillChallenge;
  onJoin: (challenge: SkillChallenge) => void;
}

function ChallengeCard({ challenge, onJoin }: ChallengeCardProps) {
  const getChallengeIcon = (category: string) => {
    switch (category) {
      case 'shooting': return <Target className="h-5 w-5" />;
      case 'dribbling': return <Zap className="h-5 w-5" />;
      case 'passing': return <Users className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const participationPercentage = (challenge.currentParticipants / challenge.maxParticipants) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getChallengeIcon(challenge.category)}
            <Badge className={getStatusColor(challenge.status)}>
              {challenge.status}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Prize Pool</div>
            <div className="text-lg font-bold text-green-600">${challenge.prizePool}</div>
          </div>
        </div>
        <CardTitle className="text-xl">{challenge.name}</CardTitle>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {challenge.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span>Entry: ${challenge.entryFee}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Ends: {formatDate(challenge.endDate)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Participants</span>
            <span>{challenge.currentParticipants}/{challenge.maxParticipants}</span>
          </div>
          <Progress value={participationPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Challenge Type</div>
          <Badge variant="outline">
            {challenge.challengeType} • {challenge.category}
          </Badge>
        </div>

        <Button 
          onClick={() => onJoin(challenge)}
          className="w-full"
          disabled={challenge.status === 'completed' || challenge.currentParticipants >= challenge.maxParticipants}
        >
          {challenge.status === 'completed' ? 'Completed' : 
           challenge.currentParticipants >= challenge.maxParticipants ? 'Full' : 
           'Join Challenge'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface LeaderboardSectionProps {
  leaderboards: Leaderboard[];
  challenges: SkillChallenge[];
}

function LeaderboardSection({ leaderboards, challenges }: LeaderboardSectionProps) {
  const activeChallenge = challenges.find(c => c.status === 'active');
  
  if (!activeChallenge) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No active challenges with leaderboards</p>
      </div>
    );
  }

  const challengeLeaderboard = leaderboards.filter(l => l.challengeId === activeChallenge.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {activeChallenge.name} Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challengeLeaderboard.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold">
                    {entry.rank}
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      {entry.participantName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{entry.participantName}</div>
                    <div className="text-sm text-gray-500">Score: {entry.score}</div>
                  </div>
                </div>
                <div className="text-right">
                  {entry.prizeAwarded && (
                    <div className="text-green-600 font-semibold">
                      ${entry.prizeAwarded}
                    </div>
                  )}
                  <Badge variant={entry.prizeStatus === 'paid' ? 'default' : 'secondary'}>
                    {entry.prizeStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}