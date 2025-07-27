import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Heart,
  Star,
  Users,
  Building2,
  FileText,
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  TrendingUp,
  Camera,
  Share2,
  Download,
  Bell,
  Clock,
} from 'lucide-react';
import ContextualHelp, { HelpContent } from '@/components/contextual-help';

interface FavoriteItem {
  id: string;
  type: 'player' | 'organization' | 'report';
  itemId: number;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  addedAt: string;
  lastUpdated: string;
  isActive: boolean;
  metadata: {
    position?: string;
    nationality?: string;
    age?: number;
    marketValue?: string;
    club?: string;
    organizationType?: string;
    location?: string;
    reportType?: string;
    status?: string;
    contractExpiry?: string;
    reminder?: boolean;
  };
}

export default function FavoritesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      return apiRequest('DELETE', `/api/favorites/${favoriteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Removed from favorites',
        description: 'Item has been removed from your favorites list.',
      });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({ favoriteId, reminder }: { favoriteId: string; reminder: boolean }) => {
      return apiRequest('PATCH', `/api/favorites/${favoriteId}/reminder`, { reminder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Reminder updated',
        description: 'Notification settings have been updated.',
      });
    },
  });

  // Mock data for demonstration
  const mockFavorites: FavoriteItem[] = [
    {
      id: '1',
      type: 'player',
      itemId: 1,
      title: 'Mohammed Salah',
      subtitle: 'Right Winger • Liverpool FC',
      description: 'Exceptional pace and finishing ability with strong market value',
      tags: ['Premier League', 'Egypt', 'Right Winger'],
      addedAt: '2024-01-15T10:30:00Z',
      lastUpdated: '2024-01-20T14:45:00Z',
      isActive: true,
      metadata: {
        position: 'Right Winger',
        nationality: 'Egypt',
        age: 31,
        marketValue: '€55M',
        club: 'Liverpool FC',
        contractExpiry: '2025-06-30',
        reminder: true,
      },
    },
    {
      id: '2',
      type: 'organization',
      itemId: 2,
      title: 'Al Ahly SC',
      subtitle: 'Professional Club • Egypt',
      description: 'Most successful club in Africa with excellent youth development',
      tags: ['Egyptian Premier League', 'CAF Champions League'],
      addedAt: '2024-01-10T09:15:00Z',
      lastUpdated: '2024-01-18T11:20:00Z',
      isActive: true,
      metadata: {
        organizationType: 'Professional Club',
        location: 'Cairo, Egypt',
        reminder: false,
      },
    },
    {
      id: '3',
      type: 'player',
      itemId: 3,
      title: 'Riyad Mahrez',
      subtitle: 'Right Winger • Al-Hilal',
      description: 'Creative playmaker with excellent dribbling and crossing ability',
      tags: ['Saudi Pro League', 'Algeria', 'Right Winger'],
      addedAt: '2024-01-12T16:45:00Z',
      lastUpdated: '2024-01-19T08:30:00Z',
      isActive: true,
      metadata: {
        position: 'Right Winger',
        nationality: 'Algeria',
        age: 33,
        marketValue: '€20M',
        club: 'Al-Hilal',
        contractExpiry: '2025-12-31',
        reminder: false,
      },
    },
    {
      id: '4',
      type: 'report',
      itemId: 4,
      title: 'Victor Osimhen - Tactical Analysis',
      subtitle: 'Scouting Report • Generated Jan 2024',
      description: 'Comprehensive analysis of playing style and European league readiness',
      tags: ['Serie A', 'Nigeria', 'Striker'],
      addedAt: '2024-01-14T13:20:00Z',
      lastUpdated: '2024-01-21T10:15:00Z',
      isActive: true,
      metadata: {
        reportType: 'Tactical Analysis',
        status: 'Recommended',
        contractExpiry: '2026-06-30',
        reminder: true,
      },
    },
  ];

  const displayFavorites: FavoriteItem[] = favorites || mockFavorites;

  // Filter and sort favorites
  const filteredFavorites = displayFavorites.filter((favorite) => {
    const matchesSearch = favorite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         favorite.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || favorite.type === typeFilter;
    const matchesExpiring = !showExpiringSoon || (favorite.metadata.contractExpiry && 
      new Date(favorite.metadata.contractExpiry) < new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesType && matchesExpiring;
  });

  // Sort favorites
  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'name':
        return a.title.localeCompare(b.title);
      case 'updated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'expiry':
        if (!a.metadata.contractExpiry && !b.metadata.contractExpiry) return 0;
        if (!a.metadata.contractExpiry) return 1;
        if (!b.metadata.contractExpiry) return -1;
        return new Date(a.metadata.contractExpiry).getTime() - new Date(b.metadata.contractExpiry).getTime();
      default:
        return 0;
    }
  });

  const expiringContracts = displayFavorites.filter(
    (favorite) => favorite.metadata.contractExpiry && 
    new Date(favorite.metadata.contractExpiry) < new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <Users className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'player':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'organization':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'report':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (contractExpiry?: string) => {
    if (!contractExpiry) return false;
    const sixMonthsFromNow = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);
    return new Date(contractExpiry) < sixMonthsFromNow;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between dashboard-header-mobile">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl mobile-h1 font-bold tracking-tight text-gray-900 dark:text-white">
              Favorites
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your saved players, clubs, and reports
            </p>
          </div>
          <ContextualHelp
            id="favorites-overview"
            title="Agent Favorites System"
            content="Save players, clubs, and reports to your favorites for quick access. Set reminders for contract expiries and track your most important prospects."
            animation="point"
            trigger="auto"
          />
        </div>
        <div className="flex items-center gap-2 mobile-stack">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExpiringSoon(!showExpiringSoon)}
            className={`touch-target ${showExpiringSoon ? 'bg-amber-50 border-amber-200' : ''}`}
          >
            <Clock className="h-4 w-4 mr-2" />
            Expiring Soon ({expiringContracts.length})
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mobile-stack">
            <div className="flex-1">
              <Input
                placeholder="Search favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="touch-target"
              />
            </div>
            <div className="flex gap-2 mobile-stack">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 touch-target"
              >
                <option value="all">All Types</option>
                <option value="player">Players</option>
                <option value="organization">Organizations</option>
                <option value="report">Reports</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 touch-target"
              >
                <option value="recent">Recently Added</option>
                <option value="name">Name A-Z</option>
                <option value="updated">Last Updated</option>
                <option value="expiry">Contract Expiry</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorites List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading favorites...</p>
          </div>
        ) : sortedFavorites.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No favorites yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start adding players, organizations, and reports to your favorites list
              </p>
              <div className="flex justify-center gap-2 mobile-stack">
                <Link href="/players">
                  <Button variant="outline" className="touch-target">
                    <Users className="h-4 w-4 mr-2" />
                    Browse Players
                  </Button>
                </Link>
                <Link href="/organizations">
                  <Button variant="outline" className="touch-target">
                    <Building2 className="h-4 w-4 mr-2" />
                    Browse Organizations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedFavorites.map((favorite) => (
            <Card key={favorite.id} className="hover:shadow-md transition-shadow mobile-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(favorite.type)}`}>
                      {getTypeIcon(favorite.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {favorite.title}
                        </h3>
                        {favorite.metadata.reminder && (
                          <Bell className="h-4 w-4 text-amber-500" />
                        )}
                        {favorite.metadata.contractExpiry && isExpiringSoon(favorite.metadata.contractExpiry) && (
                          <Badge variant="destructive" className="text-xs">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {favorite.subtitle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {favorite.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateReminderMutation.mutate({
                        favoriteId: favorite.id,
                        reminder: !favorite.metadata.reminder
                      })}
                      className="touch-target"
                    >
                      <Bell className={`h-4 w-4 ${favorite.metadata.reminder ? 'text-amber-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavoriteMutation.mutate(favorite.id)}
                      className="touch-target hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  {favorite.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>Added {formatDate(favorite.addedAt)}</span>
                  <span>Updated {formatDate(favorite.lastUpdated)}</span>
                </div>

                {favorite.metadata.contractExpiry && (
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span className={isExpiringSoon(favorite.metadata.contractExpiry) ? 'text-red-600' : 'text-gray-600'}>
                      Contract expires: {formatDate(favorite.metadata.contractExpiry)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {favorite.metadata.marketValue && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {favorite.metadata.marketValue}
                      </span>
                    )}
                    {favorite.metadata.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {favorite.metadata.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="touch-target">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Link href={`/${favorite.type}s/${favorite.itemId}`}>
                      <Button variant="outline" size="sm" className="touch-target">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Favorites Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mobile-grid-1">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayFavorites.filter(f => f.type === 'player').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {displayFavorites.filter(f => f.type === 'organization').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {displayFavorites.filter(f => f.type === 'report').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reports</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}