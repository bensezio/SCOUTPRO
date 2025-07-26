import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Search, Filter, Plus, MapPin, Calendar, Building2, User, BarChart3, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { FeatureGate } from "@/components/feature-gate";

export default function Players() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filters, setFilters] = useState({});

  // Debounce search query to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: playersData, isLoading } = useQuery({
    queryKey: ["/api/players", { search: debouncedSearchQuery, ...filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await apiRequest('GET', `/api/players?${params}`);
      return response.json();
    },
    enabled: isAuthenticated && !!user,
    retry: 2,
  });

  const players = playersData?.players || [];

  // Filter players on frontend as fallback if backend search isn't working properly
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return players;
    }

    const searchLower = searchQuery.toLowerCase();
    return players.filter((player: any) => 
      player.firstName?.toLowerCase().includes(searchLower) ||
      player.lastName?.toLowerCase().includes(searchLower) ||
      player.primaryPosition?.toLowerCase().includes(searchLower) ||
      player.nationality?.toLowerCase().includes(searchLower)
    );
  }, [players, searchQuery]);

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Players
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and manage African football talent
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/player-database">
            <Button variant="outline" className="hover:scale-105 transition-all duration-300 hover:shadow-lg animate-scale-in" style={{ animationDelay: '150ms' }}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Database Import
            </Button>
          </Link>
          <FeatureGate
            feature="addPlayers"
            fallback={
              <Button variant="outline" className="opacity-50 cursor-not-allowed">
                <Plus className="mr-2 h-4 w-4" />
                Add Player (Upgrade Required)
              </Button>
            }
          >
            <Link href="/player-database">
              <Button className="hover:scale-105 transition-all duration-300 hover:shadow-lg animate-scale-in" style={{ animationDelay: '200ms' }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </Link>
          </FeatureGate>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="hover:shadow-lg transition-all duration-300 animate-slide-in-right" style={{ animationDelay: '300ms' }}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              <Input
                placeholder="Search players by name, position, or nationality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400"
              />
            </div>
            <Button variant="outline" className="hover:scale-105 transition-all duration-200 hover:shadow-md">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse" style={{ animationDelay: `${400 + i * 100}ms` }}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%]"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded w-24"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded w-full"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers?.map((player: any, index: number) => (
            <Card 
              key={player.id} 
              className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-700 animate-scale-in"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Player Header */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 group-hover:scale-110 transition-transform duration-300 group-hover:ring-4 group-hover:ring-blue-100 dark:group-hover:ring-blue-900">
                      <AvatarImage 
                        src={player.profileImageUrl || [
                          "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1531256456869-ce942a665e80?w=100&h=100&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face"
                        ][player.id % 8]}
                        alt={`${player.firstName} ${player.lastName}`}
                      />
                      <AvatarFallback>
                        {player.firstName[0]}{player.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {player.firstName} {player.lastName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-300">
                          {player.position}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                          {calculateAge(player.dateOfBirth)} years
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Player Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="mr-2 h-4 w-4" />
                      {player.nationality}
                    </div>
                    {player.currentClub && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="mr-2 h-4 w-4" />
                        {player.currentClub.name || 'Current Club'}
                      </div>
                    )}
                    {player.marketValue && (
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        Market Value: €{parseInt(player.marketValue).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Player Stats Preview */}
                  {player.stats && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {player.stats.goals || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {player.stats.assists || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Assists</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {player.stats.appearances || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Matches</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                    <Link href={`/players/${player.id}`}>
                      <Button size="sm" className="flex-1 hover:scale-105 transition-all duration-300 hover:shadow-md group-hover:bg-blue-600 dark:group-hover:bg-blue-500">
                        <User className="h-4 w-4 mr-1 group-hover:animate-bounce-subtle" />
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/comparison?players=${player.id}`}>
                      <Button variant="outline" size="sm" className="hover:scale-110 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 transition-all duration-300 hover:shadow-md">
                        <BarChart3 className="h-4 w-4 hover:text-green-600 transition-colors duration-200" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="hover:scale-110 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 transition-all duration-300 hover:shadow-md" onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(`${window.location.origin}/players/${player.id}`);
                      toast({
                        title: "Link copied!",
                        description: "Player profile link copied to clipboard",
                      });
                    }}>
                      <Share2 className="h-4 w-4 hover:text-purple-600 transition-colors duration-200" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredPlayers && filteredPlayers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <Search className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No players found</h3>
              <p>{searchQuery ? 'Try different search terms or clear your search.' : 'Try adjusting your search criteria or add a new player to get started.'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}