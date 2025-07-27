import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, FileText, Trophy, HelpCircle, Zap } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { OnboardingTour, useTour } from "@/components/onboarding-tour";
import { SubscriptionStatus } from "@/components/subscription-status";
import ContextualHelp, { HelpContent } from "@/components/contextual-help";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const { tourOpen, setTourOpen, shouldShowTour, startTour } = useTour();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    },
  });

  // Auto-start tour for new users
  useEffect(() => {
    if (user && shouldShowTour(user.role || 'scout')) {
      const timer = setTimeout(() => {
        startTour(user.role as any || 'scout');
      }, 2000); // Start tour after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [user, shouldShowTour, startTour]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-slide-in-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to ScoutPro - African Football Scouting Platform
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:200%_100%]"></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:200%_100%]"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer bg-[length:200%_100%]"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Players",
      value: stats?.totalPlayers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Football Clubs",
      value: stats?.totalClubs || 0,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Scouting Reports",
      value: stats?.totalReports || 0,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Top Talents",
      value: stats?.recentPlayers?.length || 0,
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Tour Control */}
      <div className="flex items-center justify-between animate-slide-in-left dashboard-header-mobile" id="dashboard-header">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl mobile-h1 font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome to PlatinumEdge Analytics - {user?.displayName || user?.username}
            </p>
          </div>
          <ContextualHelp
            id="dashboard-overview"
            title={HelpContent.dashboard.title}
            content={HelpContent.dashboard.content}
            animation={HelpContent.dashboard.animation}
            trigger="auto"
          />
        </div>
        <div className="flex items-center gap-3 mobile-stack mobile-full-width">
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTour(user?.role as any || 'scout')}
            className="flex items-center gap-2 touch-target mobile-full-width justify-center"
          >
            <HelpCircle className="w-4 h-4" />
            Take Tour
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 touch-target mobile-full-width justify-center"
          >
            <Zap className="w-4 h-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="lg:col-span-2">
          <SubscriptionStatus compact />
        </div>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get started with our interactive tour or browse our help center
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => startTour(user?.role as any || 'scout')}
              >
                Start Tour
              </Button>
              <Link href="/contact">
                <Button variant="ghost" size="sm" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`h-4 w-4 ${stat.color} group-hover:animate-bounce-subtle`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-200">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Players and Analytics */}
      <div className="grid gap-6 md:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Recent Players */}
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="group-hover:text-blue-600 transition-colors duration-200">Recent Players</CardTitle>
            <CardDescription>
              Latest players added to the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentPlayers?.map((player: any, index: number) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02] animate-slide-in-right"
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {player.firstName} {player.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Badge variant="secondary" className="hover:animate-pulse-soft">{player.position}</Badge>
                      <span>{player.nationality}</span>
                    </div>
                  </div>
                  <Link href={`/players/${player.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:scale-110 transition-transform duration-200">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Nationalities */}
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="group-hover:text-green-600 transition-colors duration-200">Top Nationalities</CardTitle>
            <CardDescription>
              Most represented countries in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topNationalities?.map((item: any, index: number) => (
                <div 
                  key={item.nationality} 
                  className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-all duration-200 animate-slide-in-left"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.nationality}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 animate-scale-in" 
                        style={{ 
                          width: `${(item.count / stats.totalPlayers) * 100}%`,
                          animationDelay: `${800 + index * 150}ms`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 font-medium">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to get you started
              </CardDescription>
            </div>
            <ContextualHelp
              id="quick-actions"
              title="Quick Actions Guide"
              content="These shortcuts help you access key features quickly. Browse players to find talent, manage clubs for networking, and create scouting reports for analysis."
              animation="point"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 quick-actions-mobile">
            <Link href="/players" className="group block p-4 touch-enhanced border rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-md animate-scale-in" style={{ animationDelay: '900ms' }}>
              <Users className="h-8 w-8 text-blue-600 mb-2 group-hover:animate-bounce-subtle transition-all duration-200" />
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-200">Browse Players</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                Explore the player database with advanced filters
              </p>
            </Link>
            
            <Link href="/organizations" className="group block p-4 touch-enhanced border rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-md animate-scale-in" style={{ animationDelay: '1000ms' }}>
              <Building2 className="h-8 w-8 text-green-600 mb-2 group-hover:animate-bounce-subtle transition-all duration-200" />
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors duration-200">Manage Clubs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                View and manage football clubs and academies
              </p>
            </Link>
            
            <Link href="/reports" className="group block p-4 touch-enhanced border rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-md animate-scale-in" style={{ animationDelay: '1100ms' }}>
              <FileText className="h-8 w-8 text-purple-600 mb-2 group-hover:animate-bounce-subtle transition-all duration-200" />
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors duration-200">Scouting Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                Create and review detailed player assessments
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        tourType={user?.role as any || 'scout'}
      />
    </div>
  );
}