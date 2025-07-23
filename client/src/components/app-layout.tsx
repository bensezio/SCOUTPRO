import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  ClipboardList,
  TrendingUp, 
  Search,
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
  Shield,
  Brain,
  Database,
  CreditCard,
  Handshake,
  Languages,
  Video,
  Trophy,
  Upload,
  Presentation,
  Bot
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AIAgentTrigger from "./ai-agent-trigger";
import OnboardingOverlay from "./onboarding-overlay";
import { useOnboarding } from "@/hooks/use-onboarding";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Players", href: "/players", icon: Users },
  { name: "Player Database", href: "/player-database", icon: Database },
  { name: "Comparison", href: "/comparison", icon: BarChart3 },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Reports", href: "/reports", icon: ClipboardList },
  { name: "AI Reports", href: "/ai-reports", icon: Brain },
  { name: "Video Analysis", href: "/video-analysis", icon: Video },

  { name: "Independent Analysis", href: "/independent-analysis", icon: Upload },
  { name: "Business Automation", href: "/automation", icon: Bot },
  { name: "Translation", href: "/translation", icon: Languages },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Subscription", href: "/subscription", icon: CreditCard },
  { name: "Partnerships", href: "/partnerships", icon: Handshake },
  { name: "Pricing", href: "/pricing", icon: TrendingUp },
  { name: "Demo Mode", href: "/demo", icon: Presentation },
  { name: "Admin", href: "/admin-dashboard", icon: Shield },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    // Show admin-only features only to admin/super_admin users
    if ((item.name === 'Subscription' || item.name === 'Partnerships') && 
        (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      return false;
    }
    // Show admin panel only to admin users
    if (item.name === 'Admin' && 
        (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      return false;
    }
    // Show Business Automation only to super_admin users
    if (item.name === 'Business Automation' && 
        (!user || user.role !== 'super_admin')) {
      return false;
    }
    return true;
  });

  // Redirect to login if not authenticated (except for login page)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== '/login') {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  // Show login page without layout
  if (location === '/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
          Platinum Scout
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          // Create tour target ID based on item name
          const tourId = `sidebar-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                id={tourId}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
        
        {/* Admin-only navigation */}
        {user?.role && ['admin', 'super_admin'].includes(user.role) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Administration
            </p>
            <Link href="/admin/users">
              <div
                id="admin-users"
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer mt-2
                  ${location === '/admin/users'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Users className="mr-3 h-5 w-5" />
                User Management
              </div>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" />
              <input
                className="block h-full w-full border-0 py-0 pl-11 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent dark:text-white"
                placeholder="Search players..."
                type="search"
                name="search"
              />
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.displayName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        
        {/* AI Agent Trigger */}
        <AIAgentTrigger 
          context={{
            page: location,
            sessionData: { userRole: user?.role }
          }}
          showWelcome={true}
        />
        
        {/* Onboarding Overlay */}
        <OnboardingOverlay />
      </div>
    </div>
  );
}