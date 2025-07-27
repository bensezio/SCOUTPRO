import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Zap,
  Package,
  BarChart3,
  Settings,
  Crown,
  Target
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface CreditPack {
  credits: number;
  price: number;
  description: string;
  popular?: boolean;
}

const creditPacks: CreditPack[] = [
  { credits: 10, price: 1000, description: '10 AI analyses' },
  { credits: 50, price: 4500, description: '50 AI analyses (10% discount)', popular: true },
  { credits: 100, price: 8000, description: '100 AI analyses (20% discount)' },
  { credits: 250, price: 18750, description: '250 AI analyses (25% discount)' }
];

export default function SubscriptionDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // Admin access control
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can access the subscription dashboard.</p>
        </div>
      </div>
    );
  }

  // Fetch subscription details
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription'],
    retry: false
  });

  // Fetch usage analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/subscription/analytics'],
    retry: false
  });

  const handlePurchaseCredits = async (pack: CreditPack) => {
    setLoading(`credits-${pack.credits}`);
    
    try {
      const response = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: pack.price,
          credits: pack.credits
        })
      });

      if (response.ok) {
        const { clientSecret } = await response.json();
        window.location.href = `/checkout?client_secret=${clientSecret}&type=credits&credits=${pack.credits}`;
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      toast({
        title: "Purchase Error",
        description: "Failed to initiate credit purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription will end at the current billing period."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please contact support.",
        variant: "destructive"
      });
    }
  };

  if (subscriptionLoading || analyticsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const creditsRemaining = subscription?.creditsRemaining || 0;
  const subscriptionStatus = subscription?.status || 'inactive';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Dashboard</h1>
        <p className="text-muted-foreground">Manage your subscription and track usage</p>
      </div>

      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{currentPlan}</div>
            <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'} className="mt-2">
              {subscriptionStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsRemaining}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {currentPlan === 'free' ? 'Free tier limit' : 'Monthly allocation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.totalSpent || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Lifetime spending
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="credits">Purchase Credits</TabsTrigger>
          <TabsTrigger value="billing">Billing & Settings</TabsTrigger>
          <TabsTrigger value="partnerships">Brand Partnerships</TabsTrigger>
        </TabsList>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Usage</CardTitle>
                <CardDescription>AI analyses used this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Player Analysis</span>
                    <span>{analytics?.monthlyUsage?.playerAnalysis || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Player Comparison</span>
                    <span>{analytics?.monthlyUsage?.playerComparison || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Report Generation</span>
                    <span>{analytics?.monthlyUsage?.reportGeneration || 0}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Total Used</span>
                      <span>{analytics?.monthlyUsage?.total || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>Last 30 days activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2" />
                  <span className="ml-2">Usage chart would appear here</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Usage Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage</CardTitle>
              <CardDescription>Track your monthly credit consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used this month</span>
                  <span>{analytics?.creditsUsed || 0} / {analytics?.creditsTotal || 'Unlimited'}</span>
                </div>
                <Progress 
                  value={analytics?.creditsTotal ? (analytics.creditsUsed / analytics.creditsTotal) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buy Additional Credits</CardTitle>
              <CardDescription>
                Need more AI analyses? Purchase credit packs to extend your usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPacks.map((pack, index) => (
                  <Card key={index} className={pack.popular ? 'ring-2 ring-primary' : ''}>
                    {pack.popular && (
                      <div className="text-center">
                        <Badge className="rounded-b-none">Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">{pack.credits} Credits</CardTitle>
                      <CardDescription>{pack.description}</CardDescription>
                      <div className="text-2xl font-bold">${(pack.price / 100).toFixed(2)}</div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handlePurchaseCredits(pack)}
                        disabled={loading === `credits-${pack.credits}`}
                        className="w-full"
                        variant={pack.popular ? "default" : "outline"}
                      >
                        {loading === `credits-${pack.credits}` ? 'Processing...' : 'Purchase'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing & Settings Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>Manage your subscription and billing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.subscription && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Current Subscription</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.subscription.planId} plan
                      </p>
                    </div>
                    <Badge variant={subscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.subscription.status}
                    </Badge>
                  </div>
                  
                  {subscription.subscription.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span>Next billing date</span>
                      <span>{new Date(subscription.subscription.currentPeriodEnd * 1000).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              )}

              {!subscription?.subscription && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active subscription</p>
                  <Button onClick={() => window.location.href = '/pricing'}>
                    View Pricing Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Partnerships Tab */}
        <TabsContent value="partnerships" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partnership Opportunities</CardTitle>
              <CardDescription>
                Earn passive revenue through our brand partnership program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Equipment Partnerships</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Nike/Adidas equipment: 5% commission</li>
                        <li>• Training gear: 8% commission</li>
                        <li>• Sports technology: 10% commission</li>
                      </ul>
                      <Button size="sm" className="mt-4">Apply for Partnership</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Facility Partnerships</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Training facilities: 10% commission</li>
                        <li>• Sports camps: 15% commission</li>
                        <li>• Academy programs: 12% commission</li>
                      </ul>
                      <Button size="sm" className="mt-4">Join Program</Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Commissions</CardTitle>
                    <CardDescription>Earn from successful player transfers facilitated through ScoutPro</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">1-3%</div>
                          <div className="text-sm text-muted-foreground">Commission Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">$2-10M</div>
                          <div className="text-sm text-muted-foreground">Average Transfer</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">$20K-300K</div>
                          <div className="text-sm text-muted-foreground">Potential Earnings</div>
                        </div>
                      </div>
                      <Button className="w-full">
                        <Target className="h-4 w-4 mr-2" />
                        Join Transfer Program
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}