import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCookiePreferences } from '@/components/cookie-consent';
import { Cookie, Shield, BarChart3, Cog, RotateCcw } from 'lucide-react';

export function CookieSettingsPage() {
  const { preferences, updatePreferences, resetPreferences } = useCookiePreferences();
  const { toast } = useToast();

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    };
    updatePreferences(newPreferences);
  };

  const handleResetPreferences = () => {
    resetPreferences();
    toast({
      title: "Cookie Preferences Reset",
      description: "Your cookie preferences have been reset. The page will reload to apply changes.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Saved",
      description: "Your cookie preferences have been updated successfully.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cookie className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Cookie Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your cookie preferences for the Platinum Scout platform. 
            These settings control how we collect and use information to improve your experience.
          </p>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-6">
          {/* Strictly Necessary Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Strictly Necessary Cookies
              </CardTitle>
              <CardDescription>
                These cookies are essential for the website to function properly and cannot be disabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="strictly-necessary" className="text-base font-medium">
                  Enable Strictly Necessary Cookies
                </Label>
                <Switch
                  id="strictly-necessary"
                  checked={preferences.strictlyNecessary}
                  disabled={true}
                  aria-label="Strictly necessary cookies (always enabled)"
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>What these cookies do:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>User authentication and session management</li>
                  <li>Security features and fraud prevention</li>
                  <li>Cookie consent preferences</li>
                  <li>Basic site functionality</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Analytics Cookies
              </CardTitle>
              <CardDescription>
                Help us understand how you use our platform to improve performance and user experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="analytics" className="text-base font-medium">
                  Enable Analytics Cookies
                </Label>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  aria-label="Analytics cookies"
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>What these cookies do:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Track page views and user interactions</li>
                  <li>Measure website performance and loading times</li>
                  <li>Analyze user behavior patterns</li>
                  <li>Generate anonymous usage statistics</li>
                </ul>
                <p><strong>Third-party services:</strong> Google Analytics</p>
              </div>
            </CardContent>
          </Card>

          {/* Functional Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="w-5 h-5 text-purple-600" />
                Functional Cookies
              </CardTitle>
              <CardDescription>
                Enable enhanced features and personalization for a better user experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="functional" className="text-base font-medium">
                  Enable Functional Cookies
                </Label>
                <Switch
                  id="functional"
                  checked={preferences.functional}
                  onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                  aria-label="Functional cookies"
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>What these cookies do:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Remember your language and region preferences</li>
                  <li>Save your theme and display settings</li>
                  <li>Store your saved searches and filters</li>
                  <li>Provide personalized content recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            onClick={handleResetPreferences}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSavePreferences} className="flex items-center gap-2">
            <Cookie className="w-4 h-4" />
            Save Preferences
          </Button>
        </div>

        {/* Information */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Cookie Duration:</strong> Most cookies are stored for the duration of your session, 
                while some preference cookies may be stored for up to 1 year to remember your settings.
              </p>
              <p>
                <strong>Your Rights:</strong> You can change these preferences at any time. 
                Disabling certain cookies may affect the functionality of our platform.
              </p>
              <p>
                <strong>Data Protection:</strong> All cookie data is processed in accordance with our 
                Privacy Policy and GDPR requirements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}