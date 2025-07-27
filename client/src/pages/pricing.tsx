import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Building2, Users, Star, TrendingUp, Zap, Target, Shield, Unlock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS } from "@/../../shared/subscription-tiers";

export default function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const currentTier = user?.subscriptionTier || 'freemium';

  const tierData = [
    {
      ...SUBSCRIPTION_TIERS.freemium,
      icon: <Star className="h-6 w-6" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      targetAudience: 'Individual Scouts',
    },
    {
      ...SUBSCRIPTION_TIERS.pro,
      icon: <Zap className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      targetAudience: 'Professional Scouts & Agents',
      popular: true,
    },
    {
      ...SUBSCRIPTION_TIERS.enterprise,
      icon: <Building2 className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      targetAudience: 'Clubs & Organizations',
    }
  ];

  const handleUpgrade = async (tierId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to upgrade your subscription",
        variant: "destructive"
      });
      return;
    }

    if (tierId === currentTier) {
      toast({
        title: "Already Subscribed",
        description: "You're already on this plan",
      });
      return;
    }

    if (tierId === 'freemium') {
      toast({
        title: "Free Plan",
        description: "You can downgrade to the free plan from your account settings",
      });
      return;
    }

    try {
      // Show loading state
      toast({
        title: "Redirecting to Checkout",
        description: "Creating secure checkout session...",
      });

      // Create Stripe Checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: tierId,
          billingInterval: billingInterval
        })
      });

      const data = await response.json();

      if (data.success && data.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.sessionUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPrice = (tier: typeof tierData[0]) => {
    return billingInterval === 'yearly' ? tier.priceYearly : tier.price;
  };

  const getSavings = (tier: typeof tierData[0]) => {
    if (billingInterval === 'yearly' && tier.price > 0) {
      const yearlyTotal = tier.price * 12;
      const savings = yearlyTotal - tier.priceYearly;
      return Math.round((savings / yearlyTotal) * 100);
    }
    return 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Choose Your Analytics Edge</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Unlock the power of football analytics with our comprehensive subscription tiers.
          From individual scouts to professional clubs, we have the perfect plan for your needs.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tierData.map((tier) => {
          const price = getPrice(tier);
          const savings = getSavings(tier);
          const isCurrentTier = currentTier === tier.id;
          
          return (
            <Card key={tier.id} className={`relative ${tier.popular ? 'ring-2 ring-blue-500' : ''} ${tier.premium ? 'ring-2 ring-yellow-500' : ''}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              {tier.premium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-white">Premium</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${tier.bgColor} ${tier.color} mx-auto mb-4`}>
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {tier.targetAudience}
                </CardDescription>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    ${price}
                    {price > 0 && (
                      <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                        /{billingInterval === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <Badge variant="secondary" className="text-green-600">
                      Save {savings}% annually
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Usage Limits */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm">Monthly Limits</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>Credits: {tier.limits.monthlyCredits}</div>
                    <div>Videos: {tier.limits.videoUploads}</div>
                    <div>Reports: {tier.limits.reportDownloads}</div>
                    <div>Comparisons: {tier.limits.playerComparisons}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  onClick={() => handleUpgrade(tier.id)}
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  disabled={isCurrentTier}
                >
                  {isCurrentTier ? 'Current Plan' : 
                   tier.price === 0 ? 'Get Started Free' : 
                   `Upgrade to ${tier.name}`}
                </Button>

                {tier.price > 0 && (
                  <p className="text-xs text-center text-gray-500">
                    7-day free trial • Cancel anytime
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Feature Comparison</CardTitle>
            <CardDescription className="text-center">
              See what's included in each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4">Features</th>
                    {tierData.map((tier) => (
                      <th key={tier.id} className="text-center py-3 px-2 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="font-medium">{tier.name}</div>
                          <div className="text-xs text-gray-500">
                            ${getPrice(tier)}/{billingInterval === 'yearly' ? 'year' : 'month'}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Core Features Section */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="py-2 px-4 font-bold text-sm text-gray-700 dark:text-gray-300">
                      CORE FEATURES
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Player Search & Database</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Basic Analytics Dashboard</td>
                    <td className="text-center py-3 px-2">Limited</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Player Comparisons</td>
                    <td className="text-center py-3 px-2">2/month</td>
                    <td className="text-center py-3 px-2">10/month</td>
                    <td className="text-center py-3 px-2">20/month</td>
                  </tr>

                  {/* AI & Analytics Section */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="py-2 px-4 font-bold text-sm text-gray-700 dark:text-gray-300">
                      AI & ANALYTICS
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">AI Analytics Suite</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Heat Maps & Visualizations</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Advanced Search Filters</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>

                  {/* Video Features Section */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="py-2 px-4 font-bold text-sm text-gray-700 dark:text-gray-300">
                      VIDEO ANALYTICS
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Video Upload & Tagging</td>
                    <td className="text-center py-3 px-2">1/month</td>
                    <td className="text-center py-3 px-2">5/month</td>
                    <td className="text-center py-3 px-2">10/month</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Enhanced Video Analytics</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2">Basic</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>

                  {/* Reports & Export Section */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="py-2 px-4 font-bold text-sm text-gray-700 dark:text-gray-300">
                      REPORTS & EXPORT
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">PDF Report Export</td>
                    <td className="text-center py-3 px-2">1/month</td>
                    <td className="text-center py-3 px-2">5/month</td>
                    <td className="text-center py-3 px-2">10/month</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">CSV/Excel Export</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>

                  {/* Team Features Section */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="py-2 px-4 font-bold text-sm text-gray-700 dark:text-gray-300">
                      TEAM MANAGEMENT
                    </td>
                  </tr>

                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Bulk Upload</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2">5/month</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Team Sheet Management</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Multi-User Access</td>
                    <td className="text-center py-3 px-2">1 user</td>
                    <td className="text-center py-3 px-2">1 user</td>
                    <td className="text-center py-3 px-2">5 users</td>
                  </tr>



                  {/* Premium Features Section */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="py-2 px-4 font-bold text-sm text-gray-700 dark:text-gray-300">
                      PREMIUM FEATURES
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Custom Branding & White-Label</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium">Dedicated Account Manager</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium">Priority Support & SLA</td>
                    <td className="text-center py-3 px-2">Email</td>
                    <td className="text-center py-3 px-2">Priority Email</td>
                    <td className="text-center py-3 px-2">Phone & Chat</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get answers to common questions about our pricing and features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We accept all major credit cards and PayPal through our secure Stripe integration.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes, all paid plans include a 7-day free trial with full access to features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your data is retained for 30 days after cancellation, giving you time to export or reactivate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}