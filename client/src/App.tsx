import { Router, Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Page imports
import Dashboard from "@/pages/dashboard";
import Players from "@/pages/players";
import PlayerDetail from "@/pages/player-detail";
import PlayerDatabase from "@/pages/player-database";
import PlayerComparison from "@/pages/player-comparison";
import Organizations from "@/pages/organizations";
import ScoutingReports from "@/pages/scouting-reports";
import Analytics from "@/pages/analytics";
import AIReports from "@/pages/ai-reports";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUsers from "@/pages/admin-users";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import SubscriptionSuccess from "@/pages/subscription-success";
import SubscriptionDashboard from "@/pages/subscription-dashboard";
import PartnershipManagement from "@/pages/partnership-management";
import TranslationDemo from "@/pages/translation-demo";
import TranslationTest from "@/pages/translation-test";
import VideoAnalysis from "@/pages/video-analysis";
import AutomationDashboard from "@/pages/automation-dashboard";



import IndependentAnalysis from "@/pages/independent-analysis";
import Profile from "@/pages/profile";
import Favorites from "@/pages/favorites";
import OfflinePage from "@/pages/offline";
import DemoModePage from "@/pages/demo-mode-page";
import NotFound from "@/pages/not-found";
import Diagnostic from "@/pages/diagnostic";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookieSettings from "@/pages/cookie-settings";
import Contact from "@/pages/contact";
import Home from "@/pages/home";
import SharedReport from "@/pages/shared-report";

// Component imports
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute, PublicRoute } from "@/components/protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import AppLayout from "@/components/app-layout";
import { SessionWarning } from "@/components/session-warning";
import ErrorBoundary from "@/components/error-boundary";
import { CookieConsent } from "@/components/cookie-consent";

// Role-based dashboard component
function RoleDashboard() {
  const { user } = useAuth();
  
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  
  return <Dashboard />;
}

// Role-based home component for root route
function RoleBasedHome() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // If authenticated, show the role-based dashboard
  if (isAuthenticated) {
    return (
      <AppLayout>
        <RoleDashboard />
      </AppLayout>
    );
  }
  
  // If not authenticated, show the landing page
  return <Home />;
}

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light" storageKey="scout-theme">
            <Router>
              <Switch>
              {/* Public routes without sidebar */}
              <Route path="/">
                {/* Conditional rendering: Show landing page for unauthenticated users, dashboard for authenticated */}
                <RoleBasedHome />
              </Route>
              <Route path="/login">
                <PublicRoute>
                  <Login />
                </PublicRoute>
              </Route>
              <Route path="/register">
                <Register />
              </Route>
              <Route path="/forgot-password">
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              </Route>
              <Route path="/reset-password">
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              </Route>
              <Route path="/terms">
                <Terms />
              </Route>
              <Route path="/privacy">
                <Privacy />
              </Route>
              <Route path="/privacy-policy">
                <PrivacyPolicy />
              </Route>
              <Route path="/cookie-settings">
                <CookieSettings />
              </Route>
              <Route path="/pricing">
                <Pricing />
              </Route>
              <Route path="/subscription/success">
                <SubscriptionSuccess />
              </Route>
              <Route path="/diagnostic">
                <Diagnostic />
              </Route>
              <Route path="/contact">
                <Contact />
              </Route>
              <Route path="/ai-reports/:id">
                <SharedReport />
              </Route>
              
              {/* Protected routes with sidebar */}
              <Route path="/dashboard">
                <ProtectedRoute>
                  <AppLayout>
                    <RoleDashboard />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/players">
                <ProtectedRoute>
                  <AppLayout>
                    <Players />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/players/:id">
                <ProtectedRoute>
                  <AppLayout>
                    <PlayerDetail />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/player-database">
                <ProtectedRoute>
                  <AppLayout>
                    <PlayerDatabase />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/comparison">
                <ProtectedRoute>
                  <AppLayout>
                    <PlayerComparison />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/organizations">
                <ProtectedRoute>
                  <AppLayout>
                    <Organizations />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/reports">
                <ProtectedRoute>
                  <AppLayout>
                    <ScoutingReports />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/ai-reports">
                <ProtectedRoute>
                  <AppLayout>
                    <AIReports />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/video-analysis">
                <ProtectedRoute>
                  <AppLayout>
                    <VideoAnalysis />
                  </AppLayout>
                </ProtectedRoute>
              </Route>



              <Route path="/independent-analysis">
                <ProtectedRoute>
                  <AppLayout>
                    <IndependentAnalysis />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/automation">
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AppLayout>
                    <AutomationDashboard />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/analytics">
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/checkout">
                <ProtectedRoute>
                  <AppLayout>
                    <Checkout />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/subscription">
                <ProtectedRoute>
                  <AppLayout>
                    <SubscriptionDashboard />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/partnerships">
                <ProtectedRoute>
                  <AppLayout>
                    <PartnershipManagement />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/translation">
                <ProtectedRoute>
                  <AppLayout>
                    <TranslationDemo />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/translation-test">
                <ProtectedRoute>
                  <AppLayout>
                    <TranslationTest />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/*">
                <ProtectedRoute>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin-dashboard">
                <ProtectedRoute>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin-users">
                <ProtectedRoute>
                  <AppLayout>
                    <AdminUsers />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/super-admin-dashboard">
                <ProtectedRoute>
                  <AppLayout>
                    <SuperAdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/favorites">
                <ProtectedRoute>
                  <AppLayout>
                    <Favorites />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/offline">
                <OfflinePage />
              </Route>
              <Route path="/demo">
                <ProtectedRoute>
                  <AppLayout>
                    <DemoModePage />
                  </AppLayout>
                </ProtectedRoute>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </Router>
          <SessionWarning />
          <CookieConsent />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;