import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cookie, Settings, Shield, BarChart3, Cog } from 'lucide-react';

interface CookiePreferences {
  strictlyNecessary: boolean;
  analytics: boolean;
  functional: boolean;
}

const defaultPreferences: CookiePreferences = {
  strictlyNecessary: true, // Always required
  analytics: false,
  functional: false,
};

const COOKIE_CONSENT_KEY = 'platinumedge-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'platinumedge-cookie-preferences';

export function CookieConsent() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      setShowPrompt(true);
    } else {
      // Load existing preferences
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const savePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setShowPrompt(false);
    setShowSettings(false);

    // Initialize analytics if enabled
    if (newPreferences.analytics) {
      // Initialize Google Analytics or other analytics
      console.log('Analytics enabled');
    }

    // Initialize functional cookies if enabled
    if (newPreferences.functional) {
      // Initialize functional cookies
      console.log('Functional cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      strictlyNecessary: true,
      analytics: true,
      functional: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      strictlyNecessary: true,
      analytics: false,
      functional: false,
    };
    savePreferences(onlyNecessary);
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Main Cookie Consent Prompt */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-2">We use cookies to improve your experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  By clicking "Accept All," you agree to our use of cookies for site functionality, analytics, and personalisation. 
                  Essential cookies are required for the platform to function properly.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleAcceptAll} className="flex-1 sm:flex-none">
                    Accept All
                  </Button>
                  <Button onClick={handleRejectAll} variant="outline" className="flex-1 sm:flex-none">
                    Reject All
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Cookie Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Cookie Settings
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Strictly Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <Label className="text-base font-medium">Strictly Necessary</Label>
                    <p className="text-sm text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.strictlyNecessary}
                  disabled={true}
                  aria-label="Strictly necessary cookies (always enabled)"
                />
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                These cookies are essential for authentication, security, and basic site functionality. They cannot be disabled.
              </p>
            </div>

            <Separator />

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <Label className="text-base font-medium">Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how you use our platform
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  aria-label="Analytics cookies"
                />
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                These cookies collect information about how you interact with our platform to help us improve user experience and performance.
              </p>
            </div>

            <Separator />

            {/* Functional Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cog className="w-5 h-5 text-purple-600" />
                  <div>
                    <Label className="text-base font-medium">Functional</Label>
                    <p className="text-sm text-muted-foreground">
                      Enhanced features and personalisation
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                  aria-label="Functional cookies"
                />
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                These cookies enable enhanced functionality like remembering your preferences, language settings, and personalized content.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to access cookie preferences
export function useCookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const updatePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    setPreferences(newPreferences);
  };

  const resetPreferences = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setPreferences(defaultPreferences);
    window.location.reload();
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    hasConsented: !!localStorage.getItem(COOKIE_CONSENT_KEY),
  };
}