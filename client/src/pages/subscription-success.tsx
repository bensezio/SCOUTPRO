import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Trophy, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionSuccess() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Verify the session and update user subscription
      verifyCheckoutSession(sessionId);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyCheckoutSession = async (sessionId: string) => {
    try {
      const response = await apiRequest('POST', '/api/verify-checkout-session', {
        sessionId
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
        
        toast({
          title: "Subscription Activated! 🎉",
          description: `Welcome to ${data.planName}. Your account has been upgraded successfully.`,
        });
      } else {
        throw new Error('Failed to verify session');
      }
    } catch (error) {
      console.error('Session verification error:', error);
      toast({
        title: "Verification Issue",
        description: "Please contact support if your subscription is not active.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Verifying your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to PlatinumEdge!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your subscription is now active and ready to use
          </p>
        </div>

        {/* Subscription Details */}
        {sessionData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Plan Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <Badge variant="secondary">{sessionData.planName}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span className="font-medium">{sessionData.interval || 'Monthly'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next billing:</span>
                      <span className="font-medium">{sessionData.nextBilling || 'In 30 days'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits:</span>
                      <span className="font-medium">{sessionData.credits || 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span className="font-medium">{sessionData.maxUsers || 'Unlimited'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Get Started with Your New Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="font-semibold mb-2">Advanced Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access premium filters and AI-powered player recommendations
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate comprehensive player reports and market insights
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎥</span>
                </div>
                <h3 className="font-semibold mb-2">Video Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload and analyze player videos with computer vision
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => navigate('/players')}
            variant="outline"
            size="lg"
          >
            Browse Players
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center mt-12 text-sm text-gray-600 dark:text-gray-400">
          <p>Need help getting started? Contact our support team at support@platinumedge.com</p>
          <p className="mt-2">
            Your payment is secure and processed by Stripe. You will receive a receipt via email.
          </p>
        </div>
      </div>
    </div>
  );
}