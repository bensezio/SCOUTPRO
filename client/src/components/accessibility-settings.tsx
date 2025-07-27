import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  Type,
  Contrast,
  Volume2,
  Keyboard,
  MousePointer,
  Palette,
  Settings,
  Monitor,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
  textSpacing: number;
  buttonSize: 'small' | 'medium' | 'large';
  soundEffects: boolean;
  visualIndicators: boolean;
  skipLinks: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: true,
  focusIndicators: true,
  colorScheme: 'auto',
  textSpacing: 1,
  buttonSize: 'medium',
  soundEffects: false,
  visualIndicators: true,
  skipLinks: true,
};

export default function AccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--base-font-size', `${newSettings.fontSize}px`);
    
    // Text spacing
    root.style.setProperty('--text-spacing', `${newSettings.textSpacing}em`);
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Button size
    root.setAttribute('data-button-size', newSettings.buttonSize);
    
    // Color scheme
    if (newSettings.colorScheme === 'light') {
      root.classList.remove('dark');
    } else if (newSettings.colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      // Auto - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // Skip links
    if (newSettings.skipLinks) {
      addSkipLinks();
    } else {
      removeSkipLinks();
    }
    
    // Screen reader announcements
    if (newSettings.screenReader) {
      enableScreenReaderMode();
    }
  };

  const addSkipLinks = () => {
    // Remove existing skip links
    const existing = document.getElementById('skip-links');
    if (existing) existing.remove();
    
    // Create skip links container
    const skipLinks = document.createElement('div');
    skipLinks.id = 'skip-links';
    skipLinks.className = 'sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-50 focus-within:bg-black focus-within:text-white focus-within:p-2';
    
    const links = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#search', text: 'Skip to search' },
    ];
    
    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.className = 'block p-2 underline hover:no-underline';
      skipLinks.appendChild(a);
    });
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
  };

  const removeSkipLinks = () => {
    const existing = document.getElementById('skip-links');
    if (existing) existing.remove();
  };

  const enableScreenReaderMode = () => {
    // Add ARIA live region for announcements
    let liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    setHasChanges(false);
    toast({
      title: 'Settings saved',
      description: 'Your accessibility preferences have been saved.',
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: 'Settings reset',
      description: 'Accessibility settings have been restored to defaults.',
    });
  };

  return (
    <>
      {/* Accessibility Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-white dark:bg-gray-800 shadow-lg touch-target"
        aria-label="Open accessibility settings"
      >
        <Eye className="h-4 w-4 mr-2" />
        Accessibility
        {hasChanges && (
          <Badge className="ml-2 h-2 w-2 p-0 bg-red-500" aria-label="Unsaved changes" />
        )}
      </Button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Accessibility Settings
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close accessibility settings"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Vision Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vision
                </h3>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size: {settings.fontSize}px</Label>
                    <Slider
                      id="font-size"
                      min={12}
                      max={24}
                      step={2}
                      value={[settings.fontSize]}
                      onValueChange={([value]) => updateSetting('fontSize', value)}
                      className="touch-target"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="text-spacing">Text Spacing: {settings.textSpacing}em</Label>
                    <Slider
                      id="text-spacing"
                      min={1}
                      max={2}
                      step={0.1}
                      value={[settings.textSpacing]}
                      onValueChange={([value]) => updateSetting('textSpacing', value)}
                      className="touch-target"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-contrast">High Contrast Mode</Label>
                    <Switch
                      id="high-contrast"
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color-scheme">Color Scheme</Label>
                    <Select
                      value={settings.colorScheme}
                      onValueChange={(value: AccessibilitySettings['colorScheme']) => 
                        updateSetting('colorScheme', value)
                      }
                    >
                      <SelectTrigger id="color-scheme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Motion & Animation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Motion & Animation
                </h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion">Reduce Motion</Label>
                  <Switch
                    id="reduced-motion"
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Navigation
                </h3>
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
                    <Switch
                      id="keyboard-nav"
                      checked={settings.keyboardNavigation}
                      onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="focus-indicators">Enhanced Focus Indicators</Label>
                    <Switch
                      id="focus-indicators"
                      checked={settings.focusIndicators}
                      onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="skip-links">Skip Navigation Links</Label>
                    <Switch
                      id="skip-links"
                      checked={settings.skipLinks}
                      onCheckedChange={(checked) => updateSetting('skipLinks', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="button-size">Button Size</Label>
                    <Select
                      value={settings.buttonSize}
                      onValueChange={(value: AccessibilitySettings['buttonSize']) => 
                        updateSetting('buttonSize', value)
                      }
                    >
                      <SelectTrigger id="button-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium (Recommended)</SelectItem>
                        <SelectItem value="large">Large (Touch Friendly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Screen Reader */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Screen Reader
                </h3>
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="screen-reader">Screen Reader Optimizations</Label>
                    <Switch
                      id="screen-reader"
                      checked={settings.screenReader}
                      onCheckedChange={(checked) => updateSetting('screenReader', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="visual-indicators">Visual Indicators</Label>
                    <Switch
                      id="visual-indicators"
                      checked={settings.visualIndicators}
                      onCheckedChange={(checked) => updateSetting('visualIndicators', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t mobile-stack">
                <Button
                  onClick={saveSettings}
                  disabled={!hasChanges}
                  className="flex-1 touch-target"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetSettings}
                  className="flex-1 touch-target"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>

              {/* WCAG Compliance Info */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  WCAG 2.1 Compliance
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  PlatinumEdge Analytics meets WCAG 2.1 AA standards for accessibility. 
                  These settings help customize your experience based on your needs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}