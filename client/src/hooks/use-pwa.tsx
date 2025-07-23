import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: PWAInstallPrompt | null;
  install: () => Promise<void>;
  update: () => Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & PWAInstallPrompt;
  }
}

export function usePWA(): PWAState {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Check if app is installed
    checkInstallation();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event & PWAInstallPrompt) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      toast({
        title: 'PlatinumEdge Installed!',
        description: 'The app has been installed on your device for quick access.',
      });
    };

    // Listen for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Your connection has been restored.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re offline',
        description: 'Some features may be limited until you reconnect.',
        variant: 'destructive',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
                toast({
                  title: 'Update available',
                  description: 'A new version of the app is ready to install.',
                });
              }
            });
          }
        });

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const checkInstallation = () => {
    // Check if app is installed (PWA display mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInAppBrowser = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInAppBrowser);
  };

  const install = async (): Promise<void> => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
        toast({
          title: 'Installing...',
          description: 'PlatinumEdge is being installed on your device.',
        });
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: 'Installation failed',
        description: 'Could not install the app. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const update = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    installPrompt,
    install,
    update,
  };
}

// Hook for PWA install banner
export function usePWAInstallBanner() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner after 30 seconds if installable and not installed
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled) {
        setShowBanner(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = async () => {
    await install();
    setShowBanner(false);
  };

  // Don't show if previously dismissed
  const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';

  return {
    showBanner: showBanner && !wasDismissed,
    dismissBanner,
    handleInstall,
    isInstallable,
  };
}